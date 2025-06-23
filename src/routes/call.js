const express = require('express');
const router = express.Router();
const { param, body, validationResult } = require('express-validator');
const callController = require('../controllers/callController');

// Answer call
router.post('/answer',
  [
    body('call_id').isString().notEmpty(),
    body('greeting').optional().isString()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  callController.answerCall
);

// Transfer call
router.post('/transfer',
  [
    body('call_id').isString().notEmpty(),
    body('destination').isString().notEmpty()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  callController.transferCall
);

// Hangup call
router.post('/hangup',
  [
    body('call_id').isString().notEmpty()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  callController.hangupCall
);

// Get call recording
router.get('/:id/recording',
  [
    param('id').isString().notEmpty()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  callController.getRecording
);

module.exports = router;
