const logger = require('../../utils/logger');
const GoogleTTS = require('./providers/googleTTS');
const YandexTTS = require('./providers/yandexTTS');

class TTSService {
  constructor() {
    this.provider = process.env.TTS_PROVIDER || 'google';
    this.initializeProvider();
  }

  initializeProvider() {
    switch (this.provider) {
      case 'google':
        this.ttsProvider = new GoogleTTS();
        break;
      case 'yandex':
        this.ttsProvider = new YandexTTS();
        break;
      default:
        throw new Error(`Unknown TTS provider: ${this.provider}`);
    }
    
    logger.info(`Initialized TTS provider: ${this.provider}`);
  }

  async synthesize(text, options = {}) {
    try {
      const startTime = Date.now();
      
      // Split long text into chunks if needed
      const chunks = this.splitText(text);
      const audioBuffers = [];
      
      for (const chunk of chunks) {
        const audioBuffer = await this.ttsProvider.synthesize(chunk, {
          languageCode: options.languageCode || 'ru-RU',
          voiceName: options.voiceName,
          speakingRate: options.speakingRate || 1.0,
          pitch: options.pitch || 0,
          volumeGainDb: options.volumeGainDb || 0,
          ...options
        });
        audioBuffers.push(audioBuffer);
      }
      
      const combinedBuffer = Buffer.concat(audioBuffers);
      
      const duration = Date.now() - startTime;
      logger.info(`TTS synthesis completed in ${duration}ms for ${text.length} characters`);
      
      return combinedBuffer;
    } catch (error) {
      logger.error('TTS synthesis error:', error);
      throw error;
    }
  }

  splitText(text, maxLength = 1000) {
    if (text.length <= maxLength) {
      return [text];
    }
    
    const chunks = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
      }
      currentChunk += sentence;
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  async synthesizeStream(text, options = {}) {
    try {
      return await this.ttsProvider.synthesizeStream(text, {
        languageCode: options.languageCode || 'ru-RU',
        voiceName: options.voiceName,
        speakingRate: options.speakingRate || 1.0,
        ...options
      });
    } catch (error) {
      logger.error('TTS stream synthesis error:', error);
      throw error;
    }
  }
}

module.exports = new TTSService();
