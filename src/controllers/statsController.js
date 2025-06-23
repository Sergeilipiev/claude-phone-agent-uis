const logger = require('../utils/logger');
const statsService = require('../services/statsService');

class StatsController {
  async getCallStats(req, res) {
    try {
      const { from, to, limit = 50 } = req.query;
      
      const stats = await statsService.getCallStatistics({
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        limit: parseInt(limit, 10)
      });
      
      res.json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      logger.error('Error getting call stats:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getMCPStats(req, res) {
    try {
      const { from, to } = req.query;
      
      const stats = await statsService.getMCPUsageStatistics({
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined
      });
      
      res.json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      logger.error('Error getting MCP stats:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new StatsController();
