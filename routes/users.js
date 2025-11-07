const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const AWS = require('aws-sdk');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });  // Pour avatar
const SALT_ROUNDS = 10;

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Dashboard (déjà là)
router.get('/dashboard', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const [videos, subscriptions, stats] = await Promise.all([
    prisma.video.findMany({ where: { userId }, include: { type: true, genres: true } }),
    prisma.subscription.findMany({ where: { userId } }),
    prisma.video.aggregate({ where: { userId }, _sum: { views: true } }),
  ]);

  res.json({
    videos,
    subscriptions,
    totalViews: stats._sum.views || 0,
  });
});

// Mettre à jour profil
router.put('/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email, password } = req.body;
    const updates = {};

    // Update name si fourni
    if (name !== undefined) updates.name = name;

    // Update email si fourni (check unique)
    if (email !== undefined) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== userId) {
        return res.status(400).json({ error: 'Email déjà utilisé' });
      }
      updates.email = email;
    }

    // Update password si fourni
    if (password) {
      updates.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    // Upload avatar si fichier
    if (req.file) {
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `avatars/${Date.now()}-${req.file.originalname}`,
        Body: require('fs').createReadStream(req.file.path),
        ContentType: req.file.mimetype,
        ACL: 'public-read',
      };
      const { Location: avatarUrl } = await s3.upload(params).promise();
      updates.avatar = avatarUrl;
      require('fs').unlinkSync(req.file.path);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: { id: true, email: true, name: true, avatar: true, createdAt: true },  // Pas de password
    });

    res.json({ user: updatedUser, message: 'Profil mis à jour !' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur mise à jour' });
  }
});

module.exports = router;