const axios = require('axios');
const logger = require('../../../utils/logger');

class YandexTTS {
  constructor() {
    this.apiKey = process.env.YANDEX_API_KEY;
    this.folderId = process.env.YANDEX_FOLDER_ID;
    this.apiUrl = 'https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize';
  }

  async synthesize(text, options) {
    try {
      const response = await axios.post(this.apiUrl, null, {
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`
        },
        params: {
          folderId: this.folderId,
          text: text,
          lang: options.languageCode || 'ru-RU',
          voice: options.voiceName || 'alena', // Female voice
          emotion: 'neutral',
          speed: options.speakingRate || 1.0,
          format: 'lpcm',
          sampleRateHertz: 16000
        },
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data);
    } catch (error) {
      logger.error('Yandex TTS error:', error);
      throw error;
    }
  }

  async synthesizeStream(text, options) {
    // Yandex TTS doesn't support true streaming
    // Return the full audio buffer as a stream
    const audioBuffer = await this.synthesize(text, options);
    
    const { Readable } = require('stream');
    const stream = new Readable();
    stream.push(audioBuffer);
    stream.push(null);
    
    return stream;
  }
}

module.exports = YandexTTS;
