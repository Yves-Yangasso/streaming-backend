const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth'); // Déstructuration ici !

const prisma = new PrismaClient();

// Route pour liker une vidéo
router.post('/like/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.userId; // Utilisez userId au lieu de id

    const like = await prisma.like.create({
      data: {
        userId,
        videoId: parseInt(videoId)
      }
    });

    res.json({ message: 'Vidéo likée', like });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour unliker une vidéo
router.delete('/like/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.userId;

    await prisma.like.deleteMany({
      where: {
        userId,
        videoId: parseInt(videoId)
      }
    });

    res.json({ message: 'Like retiré' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour ajouter un commentaire
router.post('/comment/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        videoId: parseInt(videoId)
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true
          }
        }
      }
    });

    res.json({ message: 'Commentaire ajouté', comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour récupérer les commentaires d'une vidéo
router.get('/comments/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { videoId: parseInt(videoId) },
      include: {
        user: {
          select: {
            username: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;