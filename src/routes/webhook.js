const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const webhookController = require('../controllers/webhookController');
const webhookAuth = require('../middleware/webhookAuth');

// UIS webhook endpoint
router.post('/uis', 
  webhookAuth,
  [
    body('event_type').isString().notEmpty(),
    body('call_session_id').isNumeric(),
    body('phone_number').isString().notEmpty()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  webhookController.handleUISWebhook
);

module.exports = router;
