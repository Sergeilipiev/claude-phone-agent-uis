const textToSpeech = require('@google-cloud/text-to-speech');
const logger = require('../../../utils/logger');

class GoogleTTS {
  constructor() {
    this.client = new textToSpeech.TextToSpeechClient();
  }

  async synthesize(text, options) {
    const request = {
      input: { text },
      voice: {
        languageCode: options.languageCode,
        name: options.voiceName || 'ru-RU-Wavenet-C', // Female voice
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'LINEAR16',
        speakingRate: options.speakingRate || 1.0,
        pitch: options.pitch || 0,
        volumeGainDb: options.volumeGainDb || 0,
        sampleRateHertz: 16000
      }
    };

    try {
      const [response] = await this.client.synthesizeSpeech(request);
      return Buffer.from(response.audioContent, 'base64');
    } catch (error) {
      logger.error('Google TTS error:', error);
      throw error;
    }
  }

  async synthesizeStream(text, options) {
    // Google TTS doesn't support true streaming
    // Return the full audio buffer
    const audioBuffer = await this.synthesize(text, options);
    
    // Create a readable stream from the buffer
    const { Readable } = require('stream');
    const stream = new Readable();
    stream.push(audioBuffer);
    stream.push(null);
    
    return stream;
  }
}

module.exports = GoogleTTS;
