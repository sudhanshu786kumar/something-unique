import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { getUserByEmail, createUser, updateUser, findOrCreateUser } from '@/app/models/User';
import bcrypt from 'bcryptjs';
import { initDatabase } from '@/app/lib/init-db';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

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
        await updateUser(user._id, { online: true });

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
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google' || account.provider === 'github') {
        const userId = await findOrCreateUser({
          email: profile.email,
          name: profile.name || profile.login,
          image: profile.picture || profile.avatar_url,
        });
        
        await updateUser(userId, { 
          online: true,
          lastLogin: new Date(),
        });

        user.id = userId.toString();
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
      if (session?.user) {
        session.user.id = token.id;
        const dbUser = await getUserByEmail(session.user.email);
        session.user.online = dbUser.online;
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      await updateUser(new ObjectId(token.id), { online: false });
    },
  },
  pages: {
    signIn: '/login',
  },
};

initDatabase().catch(console.error);
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
