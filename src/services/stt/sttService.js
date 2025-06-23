const logger = require('../../utils/logger');
const GoogleSTT = require('./providers/googleSTT');
const YandexSTT = require('./providers/yandexSTT');

class STTService {
  constructor() {
    this.provider = process.env.STT_PROVIDER || 'google';
    this.initializeProvider();
  }

  initializeProvider() {
    switch (this.provider) {
      case 'google':
        this.sttProvider = new GoogleSTT();
        break;
      case 'yandex':
        this.sttProvider = new YandexSTT();
        break;
      default:
        throw new Error(`Unknown STT provider: ${this.provider}`);
    }
    
    logger.info(`Initialized STT provider: ${this.provider}`);
  }

  async transcribe(audioBuffer, options = {}) {
    try {
      const startTime = Date.now();
      
      const result = await this.sttProvider.transcribe(audioBuffer, {
        languageCode: options.languageCode || 'ru-RU',
        sampleRateHertz: options.sampleRate || 16000,
        encoding: options.encoding || 'LINEAR16',
        ...options
      });
      
      const duration = Date.now() - startTime;
      logger.info(`STT transcription completed in ${duration}ms: "${result}"`); 
      
      return result;
    } catch (error) {
      logger.error('STT transcription error:', error);
      throw error;
    }
  }

  async transcribeStream(audioStream, options = {}) {
    try {
      return await this.sttProvider.transcribeStream(audioStream, {
        languageCode: options.languageCode || 'ru-RU',
        sampleRateHertz: options.sampleRate || 16000,
        encoding: options.encoding || 'LINEAR16',
        interimResults: true,
        ...options
      });
    } catch (error) {
      logger.error('STT stream transcription error:', error);
      throw error;
    }
  }
}

module.exports = new STTService();
