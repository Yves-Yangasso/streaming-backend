const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const recentViews = new Set();

const incrementView = async (req, res, next) => {
  const videoId = req.params.videoId || req.params.partId;
  if (!videoId) return next();
  const sessionKey = `${req.user?.userId || 'anon'}-${videoId}`;
  const now = Date.now();
  const cutoff = now - 3600000;
  for (let key of recentViews) {
    if (key.endsWith(`-${videoId}`)) {
      const timestamp = parseInt(key.split('-')[0]);
      if (timestamp < cutoff) recentViews.delete(key);
    }
  }
  if (!recentViews.has(sessionKey)) {
    recentViews.add(`${now}-${sessionKey.split('-')[1]}`);  // Fix key
    await prisma.video.update({ where: { id: parseInt(videoId) }, data: { views: { increment: 1 } } });
  }
  next();
};

module.exports = { incrementView };