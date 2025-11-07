const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const DEFAULT_ROLE_ID = 2;  // 'user' après seed

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, roleId: DEFAULT_ROLE_ID },
      include: { role: { include: { privileges: true } } },
    });
    delete user.password;
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: 'Email déjà utilisé' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: { include: { privileges: true } } },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role.name, privileges: user.role.privileges.map(p => p.name) },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    delete user.password;
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;