const axios = require('axios');
const logger = require('../../utils/logger');
const uisAuth = require('./uisAuth');

class UISService {
  constructor() {
    this.apiUrl = process.env.UIS_API_URL;
    this.userId = process.env.UIS_USER_ID;
    this.siteId = process.env.UIS_SITE_ID;
  }

  async makeRequest(method, params = {}) {
    try {
      const token = await uisAuth.getToken();
      
      const response = await axios.post(this.apiUrl, {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params: {
          access_token: token,
          user_id: this.userId,
          ...params
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return response.data.result;
    } catch (error) {
      logger.error(`UIS API error for method ${method}:`, error);
      throw error;
    }
  }

  async answerCall(callId) {
    logger.info(`Answering call ${callId}`);
    return this.makeRequest('call.answer', {
      call_session_id: callId
    });
  }

  async hangupCall(callId) {
    logger.info(`Hanging up call ${callId}`);
    return this.makeRequest('call.hangup', {
      call_session_id: callId
    });
  }

  async transferCall(callId, destination) {
    logger.info(`Transferring call ${callId} to ${destination}`);
    return this.makeRequest('call.transfer', {
      call_session_id: callId,
      destination
    });
  }

  async sendAudio(callId, audioData) {
    logger.debug(`Sending audio for call ${callId}, size: ${audioData.length}`);
    return this.makeRequest('call.send_audio', {
      call_session_id: callId,
      audio_data: audioData.toString('base64')
    });
  }

  async startAudioStream(callId) {
    logger.info(`Starting audio stream for call ${callId}`);
    return this.makeRequest('call.start_stream', {
      call_session_id: callId,
      stream_type: 'bidirectional'
    });
  }

  async getCallRecording(callId) {
    logger.info(`Getting recording for call ${callId}`);
    
    const result = await this.makeRequest('get.call_record', {
      call_session_id: callId
    });

    if (result && result.record_url) {
      return {
        url: result.record_url,
        duration: result.duration,
        size: result.size
      };
    }

    return null;
  }

  async getCallReport(params = {}) {
    return this.makeRequest('get.calls_report', {
      date_from: params.dateFrom,
      date_till: params.dateTill,
      limit: params.limit || 100,
      offset: params.offset || 0,
      filter: params.filter || {},
      sort: params.sort || [{ field: 'start_time', order: 'desc' }]
    });
  }

  async createWebhook(params) {
    logger.info('Creating UIS webhook');
    return this.makeRequest('create.webhook', {
      event_type: params.eventType,
      url: params.url,
      conditions: params.conditions || []
    });
  }

  async updateWebhook(webhookId, params) {
    logger.info(`Updating webhook ${webhookId}`);
    return this.makeRequest('update.webhook', {
      webhook_id: webhookId,
      ...params
    });
  }

  async deleteWebhook(webhookId) {
    logger.info(`Deleting webhook ${webhookId}`);
    return this.makeRequest('delete.webhook', {
      webhook_id: webhookId
    });
  }

  async getWebhooks() {
    return this.makeRequest('get.webhooks');
  }
}

module.exports = new UISService();
