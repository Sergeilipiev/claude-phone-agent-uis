const axios = require('axios');
const logger = require('../../../utils/logger');

class YandexSTT {
  constructor() {
    this.apiKey = process.env.YANDEX_API_KEY;
    this.folderId = process.env.YANDEX_FOLDER_ID;
    this.apiUrl = 'https://stt.api.cloud.yandex.net/speech/v1/stt:recognize';
  }

  async transcribe(audioBuffer, options) {
    try {
      const response = await axios.post(this.apiUrl, audioBuffer, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'audio/x-pcm;bit=16;rate=16000'
        },
        params: {
          folderId: this.folderId,
          lang: options.languageCode || 'ru-RU',
          topic: 'general',
          profanityFilter: false,
          format: 'lpcm',
          sampleRateHertz: options.sampleRateHertz || 16000
        }
      });

      return response.data.result;
    } catch (error) {
      logger.error('Yandex STT error:', error);
      throw error;
    }
  }

  async transcribeStream(audioStream, options) {
    // Yandex doesn't support streaming recognition in the same way
    // Collect chunks and process them
    const chunks = [];
    
    return new Promise((resolve, reject) => {
      audioStream.on('data', chunk => chunks.push(chunk));
      audioStream.on('end', async () => {
        try {
          const audioBuffer = Buffer.concat(chunks);
          const result = await this.transcribe(audioBuffer, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      audioStream.on('error', reject);
    });
  }
}

module.exports = YandexSTT;
