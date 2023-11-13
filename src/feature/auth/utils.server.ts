"use server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
export const createToken = async (email: string) => {
  // On recherche un utilisateur avec cet email
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (user) {
    // On vérifie si un token existe déjà pour cet utilisateur
    const userToken = await prisma.userToken.findFirst({
      where: {
        userId: user.id,
      },
    });
    if (userToken) {
      // Si un token existe on le retourne par mail
      const subject = "Réinitialisation de votre mot de passe";
      const message = `Bonjour,<br />vous avez demandé la réinitialisation de votre mot de passe. Veuillez cliquer sur ce lien afin de réinitialiser votre mot de passe : ${process.env.NEXT_RELATIVE_URI}/connexion/recuperation/${user.id}/${userToken.token}`;
      const recipientEmail = user.email;
      const response = await fetch(
        `${process.env.NEXT_RELATIVE_URI}/api/mailer/mailer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recipientEmail, subject, message }),
        }
      );
      return null;
    }
    // On génère un token
    const token = Math.random().toString(36).substr(2);
    // On sauvegarde le token dans la base de données
    const newToken = await prisma.userToken.create({
      data: {
        token: token,
        userId: user.id,
      },
    });
    // On envoie un email avec le token
    const subject = "Réinitialisation de votre mot de passe";
    const message = `Bonjour,<br />vous avez demandé la réinitialisation de votre mot de passe. Veuillez cliquer sur ce lien afin de réinitialiser votre mot de passe : ${process.env.NEXT_RELATIVE_URI}/connexion/recuperation/${user.id}/${newToken.token}`;
    const recipientEmail = user.email;
    const response = await fetch(
      `${process.env.NEXT_RELATIVE_URI}/api/mailer/mailer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipientEmail, subject, message  }),
      }
    );
    return true;
  }
  return false;
};

export const checkTokenAndUser = async (token: string, userId: string) => {
  // On recherche un token pour cet utilisateur
  const userToken = await prisma.userToken.findFirst({
    where: {
      userId: userId,
      token: token,
    },
  });
  if (userToken) {
    return true;
  }
  return false;
};

export const updatePassword = async (
  token: string,
  userId: string,
  password: string
) => {
  // On recherche un token pour cet utilisateur
  const userToken = await prisma.userToken.findFirst({
    where: {
      userId: userId,
      token: token,
    },
  });
  if (userToken) {
    // On met à jour le mot de passe de l'utilisateur
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedPassword: await bcrypt.hash(password, 10),
      },
    });
    if (user) {
      // On supprime le token
      await prisma.userToken.delete({
        where: {
          id: userToken.id,
        },
      });
      return true;
    } else {
      return false;
    }
  }
  return false;
};
