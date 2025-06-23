const logger = require('../utils/logger');
const callService = require('../services/callService');
const uisService = require('../services/uis/uisService');

class WebhookController {
  async handleUISWebhook(req, res) {
    try {
      const { event_type, call_session_id, phone_number, direction } = req.body;
      
      logger.info(`Received UIS webhook: ${event_type} for call ${call_session_id}`);

      // Handle different event types
      switch (event_type) {
        case 'call_start':
          await callService.handleIncomingCall({
            callId: call_session_id,
            phoneNumber: phone_number,
            direction
          });
          break;
          
        case 'call_answered':
          await callService.handleCallAnswered(call_session_id);
          break;
          
        case 'call_end':
          await callService.handleCallEnd(call_session_id);
          break;
          
        case 'audio_received':
          await callService.processAudioChunk({
            callId: call_session_id,
            audio: req.body.audio_data
          });
          break;
          
        default:
          logger.warn(`Unknown webhook event type: ${event_type}`);
      }

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      logger.error('Error handling UIS webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new WebhookController();
