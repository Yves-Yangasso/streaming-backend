require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use('/webhook', express.raw({ type: 'application/json' }));

// Routes
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const subscriptionRoutes = require('./routes/subscriptions');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const interactionRoutes = require('./routes/interactions');

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/interactions', interactionRoutes);

app.get('/health', (req, res) => res.json({ message: 'Backend streaming OK !' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur sur port ${PORT}`));