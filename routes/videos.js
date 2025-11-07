const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requirePrivilege, requireSubscriptionForPaid } = require('../middleware/auth');
const { incrementView } = require('../middleware/analytics');
const { generateHLS } = require('../utils/hlsGenerator');

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Upload vidéo (avec image_affiche optionnel)
router.post('/upload', authenticateToken, requirePrivilege('upload_video'), upload.fields([{ name: 'video', maxCount: 1 }, { name: 'image_affiche', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, description, typeId, genreIds } = req.body;
    const videoFile = req.files['video']?.[0];
    const imageFile = req.files['image_affiche']?.[0];
    if (!videoFile) return res.status(400).json({ error: 'Vidéo requise' });

    const { url: hlsUrl, duration } = await generateHLS(videoFile.path, 'uploads', Date.now().toString(), title);

    let image_affiche = null;
    if (imageFile) {
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `images/${Date.now()}-${imageFile.originalname}`,
        Body: fs.createReadStream(imageFile.path),
        ContentType: imageFile.mimetype,
        ACL: 'public-read',
      };
      const { Location } = await s3.upload(params).promise();
      image_affiche = Location;
      fs.unlinkSync(imageFile.path);
    }

    const video = await prisma.video.create({
      data: {
        title,
        description,
        url: hlsUrl,
        thumbnail: image_affiche || null,  // Optionnel : utilise image_affiche comme thumbnail
        image_affiche,
        duration,
        typeId: parseInt(typeId),
        userId: req.user.userId,
        genres: { connect: genreIds ? genreIds.split(',').map(id => ({ id: parseInt(id) })) : [] },
      },
      include: { user: { select: { name: true } }, type: true, genres: true, _count: { select: { parts: true, comments: true, likes: true } } },
    });

    fs.unlinkSync(videoFile.path);
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Erreur upload' });
  }
});

// Ajouter partie (identique)
router.post('/:videoId/parts', authenticateToken, requirePrivilege('upload_video'), upload.single('part'), async (req, res) => {
  // ... identique à avant
});

// Lister vidéos (inclut image_affiche)
router.get('/', async (req, res) => {
  const { typeId, genreId } = req.query;
  const where = {};
  if (typeId) where.typeId = parseInt(typeId);
  if (genreId) where.genres = { some: { id: parseInt(genreId) } };

  const videos = await prisma.video.findMany({
    where,
    include: { 
      user: { select: { name: true } }, 
      type: true, 
      genres: true,
      _count: { select: { parts: true, comments: true, likes: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(videos);
});

// Stream partie/vidéo (avec incrementView)
router.get('/parts/:partId/stream.m3u8', authenticateToken, requireSubscriptionForPaid, incrementView, async (req, res) => {
  const { partId } = req.params;
  const part = await prisma.part.findUnique({ where: { id: parseInt(partId) } });
  if (!part) return res.status(404).json({ error: 'Partie non trouvée' });
  res.redirect(301, part.url);
});

router.get('/:videoId/stream.m3u8', authenticateToken, incrementView, async (req, res) => {
  const { videoId } = req.params;
  const video = await prisma.video.findUnique({ where: { id: parseInt(videoId) } });
  if (!video) return res.status(404).json({ error: 'Vidéo non trouvée' });
  res.redirect(301, video.url);
});

// Stats (identique)
router.get('/stats', authenticateToken, async (req, res) => {
  // ... identique
});

module.exports = router;