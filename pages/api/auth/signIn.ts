import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { NextApiRequest, NextApiResponse } from "next";

const loginCredentials = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(password, user.hashedPassword || ''))) {
    return res.status(401).json({ error: 'Identifiants incorrects.' });
  }

  res.status(200).json(user);
};

export default loginCredentials;