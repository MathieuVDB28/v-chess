import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '../../../../../lib/prisma';
import { authOptions } from '../../../../../pages/api/auth/[...nextauth]';

// GET /api/goals/[id] - Récupérer un goal spécifique
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const goal = await prisma.goal.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal non trouvé' }, { status: 404 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Erreur lors de la récupération du goal:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du goal' },
      { status: 500 }
    );
  }
}

// PATCH /api/goals/[id] - Mettre à jour un goal
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Vérifier que le goal existe et appartient à l'utilisateur
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal non trouvé' }, { status: 404 });
    }

    const body = await req.json();
    const { gameMode, startRating, targetRating, targetDate, status } = body;

    // Validation
    if (gameMode && !['bullet', 'blitz', 'rapid', 'daily'].includes(gameMode)) {
      return NextResponse.json(
        { error: 'Mode de jeu invalide' },
        { status: 400 }
      );
    }

    if (status && !['active', 'completed', 'abandoned'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      );
    }

    if (targetRating && startRating && targetRating <= startRating) {
      return NextResponse.json(
        { error: "L'objectif doit être supérieur au rating de départ" },
        { status: 400 }
      );
    }

    // Mettre à jour le goal
    const updatedGoal = await prisma.goal.update({
      where: { id: params.id },
      data: {
        ...(gameMode && { gameMode }),
        ...(startRating && { startRating: parseInt(startRating) }),
        ...(targetRating && { targetRating: parseInt(targetRating) }),
        ...(targetDate && { targetDate: new Date(targetDate) }),
        ...(status && { status }),
      },
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du goal:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour du goal' },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/[id] - Supprimer un goal
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Vérifier que le goal existe et appartient à l'utilisateur
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal non trouvé' }, { status: 404 });
    }

    // Supprimer le goal
    await prisma.goal.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Goal supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du goal:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression du goal' },
      { status: 500 }
    );
  }
}
