import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { getUserByEmail, createUser, updateUser } from '@/app/models/User';
import bcrypt from 'bcryptjs';
import { initDatabase } from '@/app/lib/init-db';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await getUserByEmail(credentials.email);
        if (!user) {
          return null;
        }
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          return null;
        }
        
        // Set user online status
        await updateUser(user._id, { online: true }); // Update online status on login

        return { id: user._id.toString(), email: user.email, name: user.name };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google" || account.provider === "github") {
        const existingUser = await getUserByEmail(user.email);
        if (!existingUser) {
          // Create a new user in your database
          const userId = await createUser({
            name: user.name,
            email: user.email,
            password: null, // Social login users don't have a password
          });
          user.id = userId.toString();
        } else {
          user.id = existingUser._id.toString();
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      return session;
    },
    async signOut({ token }) {
      // Set user offline status on logout
      await updateUser(token.id, { online: false }); // Update online status on logout
      return true;
    },
  },
  events: {
    async signIn(message) {
    },
  },
  pages: {
    signIn: '/login',
  },
};

initDatabase().catch(console.error);
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };