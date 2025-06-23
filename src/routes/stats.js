const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const statsController = require('../controllers/statsController');

// Get call statistics
router.get('/calls',
  [
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  statsController.getCallStats
);

// Get MCP usage statistics
router.get('/mcp',
  [
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  statsController.getMCPStats
);

module.exports = router;
