import GithubProvider from "next-auth/providers/github";
import { env } from "./env";
import { AuthOptions, Session, getServerSession } from "next-auth";
import { JWT } from "next-auth/jwt"; // Importez le type JWT
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: env.GITHUB_ID,
      clientSecret: env.GITHUB_SECRET,
    }),
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",
      // `credentials` is used to generate a form on the sign in page.
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: {
          label: "Adresse email",
          type: "text",
          placeholder: "hubrgiorgi@gmail.com",
        },
        password: { label: "Password", type: "password" },
      },

      authorize: async (
        credentials: Record<"email" | "password", string> | undefined
      ) => {

        if (!credentials) {
          return null;
        }

        const user = (await prisma.user.findUnique({
          where: { email: credentials.email },
          select: { // Si vous utilisez "select", assurez-vous d'inclure tous les champs nécessaires
            id: true,
            email: true,
            name: true,
            hashedPassword: true,
            role: true,
          },
        })) as any;

        if (
          user &&
          (await bcrypt.compare(credentials.password, user.hashedPassword))
        ) {
          return user;
        } else {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET, // Ajoutez cette ligne
  callbacks: {

    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id; // Assumant que user.id existe
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.userId) {
        const user = { ...session.user, id: token.userId, role:token.role };
        const newSession = { ...session, user };
        return newSession;
      }
      return session;
    },
    // async signIn({ user, account, profile, email, credentials }) {
    //     console.log(user, account, profile, email, credentials);
    //     return true;
    // }
  },
  pages: {
    signIn: "/connexion",
    error: "/connexion/error",
  },
};

export const getAuthSession = async () => {
  const session = await getServerSession(authOptions);
  return session;
};

