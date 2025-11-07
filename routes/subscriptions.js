const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Checkout Stripe
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;
    const priceId = plan === 'premium' ? process.env.STRIPE_PRICE_ID_PREMIUM : null;
    if (!priceId) return res.status(400).json({ error: 'Plan invalide' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
      metadata: { userId: req.user.userId.toString() },
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: 'Erreur session' });
  }
});

// Confirmer après paiement
router.post('/confirm', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') return res.status(400).json({ error: 'Paiement non confirmé' });

    const userId = parseInt(session.metadata.userId);
    const subscription = await prisma.subscription.create({
      data: {
        plan: 'premium',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'active',
        userId,
      },
    });

    res.json({ subscription, message: 'Abonnement activé !' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur confirmation' });
  }
});

// Webhook Stripe
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'invoice.payment_succeeded') {
    // Mise à jour endDate, etc. (simplifié)
    console.log('Paiement réussi');
  } else if (event.type === 'invoice.payment_failed') {
    await prisma.subscription.updateMany({ where: { status: 'active' }, data: { status: 'expired' } });
  }

  res.json({ received: true });
});

// Lister mes abos
router.get('/my', authenticateToken, async (req, res) => {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: req.user.userId },
    orderBy: { startDate: 'desc' },
  });
  res.json(subscriptions);
});

module.exports = router;