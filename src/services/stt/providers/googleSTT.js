const speech = require('@google-cloud/speech');
const logger = require('../../../utils/logger');

class GoogleSTT {
  constructor() {
    this.client = new speech.SpeechClient();
  }

  async transcribe(audioBuffer, options) {
    const request = {
      audio: {
        content: audioBuffer.toString('base64')
      },
      config: {
        encoding: options.encoding,
        sampleRateHertz: options.sampleRateHertz,
        languageCode: options.languageCode,
        enableAutomaticPunctuation: true,
        model: 'phone_call'
      }
    };

    try {
      const [response] = await this.client.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join(' ');
      
      return transcription;
    } catch (error) {
      logger.error('Google STT error:', error);
      throw error;
    }
  }

  async transcribeStream(audioStream, options) {
    const request = {
      config: {
        encoding: options.encoding,
        sampleRateHertz: options.sampleRateHertz,
        languageCode: options.languageCode,
        enableAutomaticPunctuation: true,
        model: 'phone_call'
      },
      interimResults: options.interimResults || false
    };

    const recognizeStream = this.client
      .streamingRecognize(request)
      .on('error', error => {
        logger.error('Google STT stream error:', error);
        throw error;
      });

    audioStream.pipe(recognizeStream);
    
    return recognizeStream;
  }
}

module.exports = GoogleSTT;
