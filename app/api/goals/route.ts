import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '../../../lib/prisma';
import { authOptions } from '../../../pages/api/auth/[...nextauth]';

// GET /api/goals - Récupérer tous les goals de l'utilisateur connecté
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Trouver l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer tous les goals de l'utilisateur
    const goals = await prisma.goal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Erreur lors de la récupération des goals:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des goals' },
      { status: 500 }
    );
  }
}

// POST /api/goals - Créer un nouveau goal
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Trouver l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const body = await req.json();
    const { gameMode, startRating, targetRating, targetDate } = body;

    // Validation
    if (!gameMode || !startRating || !targetRating || !targetDate) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    if (!['bullet', 'blitz', 'rapid', 'daily'].includes(gameMode)) {
      return NextResponse.json(
        { error: 'Mode de jeu invalide' },
        { status: 400 }
      );
    }

    if (targetRating <= startRating) {
      return NextResponse.json(
        { error: "L'objectif doit être supérieur au rating de départ" },
        { status: 400 }
      );
    }

    const targetDateObj = new Date(targetDate);
    if (targetDateObj <= new Date()) {
      return NextResponse.json(
        { error: 'La date cible doit être dans le futur' },
        { status: 400 }
      );
    }

    // Créer le goal
    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        gameMode,
        startRating: parseInt(startRating),
        targetRating: parseInt(targetRating),
        targetDate: targetDateObj,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du goal:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du goal' },
      { status: 500 }
    );
  }
}
