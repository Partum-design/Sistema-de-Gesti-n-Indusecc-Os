const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const {
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT,
} = require('../config/environment');

const hasVapidConfig = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT);

if (hasVapidConfig) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const getPublicKey = async (req, res) => {
  if (!VAPID_PUBLIC_KEY) {
    return res.status(503).json({
      success: false,
      message: 'VAPID_PUBLIC_KEY no configurada',
    });
  }
  return res.json({ success: true, publicKey: VAPID_PUBLIC_KEY });
};

const subscribe = async (req, res) => {
  if (!hasVapidConfig) {
    return res.status(503).json({
      success: false,
      message: 'Configura VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y VAPID_SUBJECT',
    });
  }

  const { subscription } = req.body;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({ success: false, message: 'Suscripcion push invalida' });
  }

  const payload = {
    userId: req.user.id,
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    userAgent: req.headers['user-agent'] || 'unknown',
  };

  await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    payload,
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return res.json({ success: true, message: 'Suscripcion guardada' });
};

const unsubscribe = async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ success: false, message: 'Endpoint requerido' });
  }

  await PushSubscription.deleteOne({ endpoint, userId: req.user.id });
  return res.json({ success: true, message: 'Suscripcion eliminada' });
};

const sendTestNotification = async (req, res) => {
  if (!hasVapidConfig) {
    return res.status(503).json({
      success: false,
      message: 'Configura VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY y VAPID_SUBJECT',
    });
  }

  const subscriptions = await PushSubscription.find({ userId: req.user.id });
  if (!subscriptions.length) {
    return res.status(404).json({ success: false, message: 'No hay suscripciones para este usuario' });
  }

  const body = req.body?.body || 'Tu PWA ya puede recibir notificaciones push.';
  const title = req.body?.title || 'INDUSECC OS';
  const url = req.body?.url || '/';
  const notificationPayload = JSON.stringify({
    title,
    body,
    icon: '/Logotipo-07.png',
    badge: '/Logotipo-07.png',
    url,
  });

  const sendResults = await Promise.allSettled(
    subscriptions.map(async (item) => {
      const subscription = {
        endpoint: item.endpoint,
        keys: item.keys,
      };
      await webpush.sendNotification(subscription, notificationPayload);
      return item.endpoint;
    }),
  );

  const staleEndpoints = [];
  let sentCount = 0;
  for (const result of sendResults) {
    if (result.status === 'fulfilled') {
      sentCount += 1;
      continue;
    }
    const statusCode = result.reason?.statusCode;
    const endpoint = result.reason?.endpoint;
    if (statusCode === 404 || statusCode === 410) {
      staleEndpoints.push(endpoint);
    }
  }

  if (staleEndpoints.length) {
    await PushSubscription.deleteMany({ endpoint: { $in: staleEndpoints } });
  }

  return res.json({
    success: true,
    message: `Notificaciones enviadas: ${sentCount}`,
    totalSubscriptions: subscriptions.length,
  });
};

module.exports = {
  getPublicKey,
  subscribe,
  unsubscribe,
  sendTestNotification,
};
