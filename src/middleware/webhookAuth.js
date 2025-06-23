const crypto = require('crypto');
const logger = require('../utils/logger');

const webhookAuth = (req, res, next) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!signature || !timestamp) {
    logger.warn('Webhook request without signature or timestamp');
    return res.status(401).json({ error: 'Missing authentication headers' });
  }

  // Check timestamp to prevent replay attacks (5 minute window)
  const currentTime = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp, 10);
  if (Math.abs(currentTime - requestTime) > 300) {
    logger.warn('Webhook request with invalid timestamp');
    return res.status(401).json({ error: 'Invalid timestamp' });
  }

  // Verify signature
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  if (signature !== expectedSignature) {
    logger.warn('Webhook request with invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
};

module.exports = webhookAuth;
