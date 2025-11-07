const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// CRUD Rôles (ex. : lister, créer, updater, supprimer)
router.get('/roles', authenticateToken, requireAdmin, async (req, res) => {
  const roles = await prisma.role.findMany({
    include: { privileges: true, users: { select: { id: true, email: true } } },
  });
  res.json(roles);
});

router.post('/roles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const role = await prisma.role.create({
      data: { name },
      include: { privileges: true },
    });
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ error: 'Nom de rôle unique requis' });
  }
});

router.put('/roles/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, privilegeIds } = req.body;  // privilegeIds: [1,2] pour connect
    const role = await prisma.role.update({
      where: { id: parseInt(id) },
      data: {
        name,
        privileges: privilegeIds ? { set: privilegeIds.map(pid => ({ id: pid })) } : undefined,
      },
      include: { privileges: true },
    });
    res.json(role);
  } catch (error) {
    res.status(400).json({ error: 'Erreur update' });
  }
});

router.delete('/roles/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await prisma.role.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Rôle supprimé' });
  } catch (error) {
    res.status(400).json({ error: 'Impossible de supprimer (utilisé)' });
  }
});

// CRUD Privilèges (similaire)
router.get('/privileges', authenticateToken, requireAdmin, async (req, res) => {
  const privileges = await prisma.privilege.findMany({
    include: { roles: { select: { id: true, name: true } } },
  });
  res.json(privileges);
});

router.post('/privileges', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const privilege = await prisma.privilege.create({
      data: { name },
      include: { roles: true },
    });
    res.status(201).json(privilege);
  } catch (error) {
    res.status(400).json({ error: 'Nom unique requis' });
  }
});

router.put('/privileges/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, roleIds } = req.body;
    const privilege = await prisma.privilege.update({
      where: { id: parseInt(id) },
      data: {
        name,
        roles: roleIds ? { set: roleIds.map(rid => ({ id: rid })) } : undefined,
      },
      include: { roles: true },
    });
    res.json(privilege);
  } catch (error) {
    res.status(400).json({ error: 'Erreur update' });
  }
});

router.delete('/privileges/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await prisma.privilege.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Privilège supprimé' });
  } catch (error) {
    res.status(400).json({ error: 'Impossible de supprimer (utilisé)' });
  }
});

module.exports = router;