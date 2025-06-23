const logger = require('../utils/logger');
const callService = require('../services/callService');
const uisService = require('../services/uis/uisService');

class CallController {
  async answerCall(req, res) {
    try {
      const { call_id, greeting } = req.body;
      
      const result = await callService.answerCall(call_id, greeting);
      
      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Error answering call:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async transferCall(req, res) {
    try {
      const { call_id, destination } = req.body;
      
      const result = await uisService.transferCall(call_id, destination);
      
      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Error transferring call:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async hangupCall(req, res) {
    try {
      const { call_id } = req.body;
      
      const result = await callService.hangupCall(call_id);
      
      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Error hanging up call:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getRecording(req, res) {
    try {
      const { id } = req.params;
      
      const recording = await uisService.getCallRecording(id);
      
      if (!recording) {
        return res.status(404).json({ error: 'Recording not found' });
      }
      
      res.json({
        status: 'success',
        data: recording
      });
    } catch (error) {
      logger.error('Error getting recording:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new CallController();
