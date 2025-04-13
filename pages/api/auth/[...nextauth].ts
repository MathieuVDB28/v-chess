import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "email@example.com" },
                password: { label: "Mot de passe", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email et mot de passe requis");
                }

                // Recherche de l'utilisateur par email
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                // Vérifier si l'utilisateur existe
                if (!user || !user.password) {
                    throw new Error("Aucun utilisateur trouvé avec cet email");
                }

                // Vérifier si le mot de passe est correct
                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Mot de passe incorrect");
                }

                // Si tout est correct, retourner l'utilisateur (sans le mot de passe)
                // Utiliser undefined au lieu de null pour la propriété image
                return {
                    id: user.id,
                    email: user.email,
                    image: user.image || undefined,
                };
            },
        }),
    ],
    pages: {
        signIn: "/auth/signin",
        signOut: "/auth/signout",
        error: "/auth/error",
        // newUser: "/auth/new-user"
    },
    session: {
        strategy: "jwt", // Utiliser JWT pour la session
        maxAge: 30 * 24 * 60 * 60, // 30 jours
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    debug: process.env.NODE_ENV === "development",
    secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);