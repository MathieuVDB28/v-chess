import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const {email, password, chesscom_username, lichess_username } = req.body;

        // Validation des entrées
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Tous les champs sont obligatoires" });
        }

        // Vérifier si le mot de passe est suffisamment fort
        if (password.length < 8) {
            return res
                .status(400)
                .json({ message: "Le mot de passe doit contenir au moins 8 caractères" });
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({ message: "Cet email est déjà utilisé" });
        }

        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Création de l'utilisateur avec Prisma incluant les noms d'utilisateur Chess.com et Lichess
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                chesscom_username: chesscom_username || "",
                lichess_username: lichess_username || ""
            },
        });

        // Réponse de succès
        return res.status(201).json({
            message: "Utilisateur créé avec succès",
            user: {
                id: user.id,
                email: user.email,
                chesscom_username: user.chesscom_username,
                lichess_username: user.lichess_username
            },
        });
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}