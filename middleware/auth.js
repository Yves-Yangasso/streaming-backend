const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requis' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    req.user = user;
    next();
  });
};

const requirePrivilege = (privilege) => (req, res, next) => {
  if (!req.user.privileges.includes(privilege)) return res.status(403).json({ error: `Privilège '${privilege}' requis` });
  next();
};

const requireSubscriptionForPaid = async (req, res, next) => {
  const partId = req.params.partId || req.body.partId;
  if (!partId) return next();
  const part = await prisma.part.findUnique({ where: { id: parseInt(partId) } });
  if (!part || !part.isPaid) return next();
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user.userId, status: 'active', endDate: { gte: new Date() } },
  });
  if (!subscription) return res.status(403).json({ error: 'Abonnement requis' });
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès admin requis' });
  next();
};

module.exports = { authenticateToken, requirePrivilege, requireSubscriptionForPaid, requireAdmin };