import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByEmail } from '@/app/models/User';
import bcrypt from 'bcryptjs';
import { initDatabase } from '@/app/lib/init-db';
import { createGeospatialIndex } from '@/app/models/User';

const authOptions = {
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
        return { id: user._id.toString(), email: user.email, name: user.name };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
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
    async signOut({ token, session }) {
      // Perform any additional sign-out actions here
      return true;
    },
  },
  events: {
    async signIn(message) {
      await createGeospatialIndex();
    },
  },
  pages: {
    signIn: '/login',
  },
};

initDatabase().catch(console.error);

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
