const EventEmitter = require('events');
const logger = require('../utils/logger');
const uisService = require('./uis/uisService');
const claudeService = require('./claude/claudeService');
const sttService = require('./stt/sttService');
const ttsService = require('./tts/ttsService');
const CallSession = require('../models/CallSession');

class CallService extends EventEmitter {
  constructor() {
    super();
    this.activeCalls = new Map();
  }

  async handleIncomingCall({ callId, phoneNumber, direction }) {
    try {
      logger.info(`Handling incoming call ${callId} from ${phoneNumber}`);
      
      // Create call session
      const session = new CallSession({
        callId,
        phoneNumber,
        direction,
        startTime: new Date()
      });
      
      this.activeCalls.set(callId, session);
      
      // Initialize audio processing
      await this.initializeAudioProcessing(callId);
      
      // Send initial greeting
      const greeting = await this.generateGreeting(phoneNumber);
      await this.sendAudioResponse(callId, greeting);
      
      return { callId, status: 'initialized' };
    } catch (error) {
      logger.error('Error handling incoming call:', error);
      throw error;
    }
  }

  async handleCallAnswered(callId) {
    const session = this.activeCalls.get(callId);
    if (!session) {
      throw new Error('Call session not found');
    }
    
    session.status = 'answered';
    session.answeredTime = new Date();
    
    logger.info(`Call ${callId} answered`);
  }

  async handleCallEnd(callId) {
    const session = this.activeCalls.get(callId);
    if (!session) {
      logger.warn(`Call session ${callId} not found for end event`);
      return;
    }
    
    session.status = 'ended';
    session.endTime = new Date();
    
    // Save call history
    await this.saveCallHistory(session);
    
    // Cleanup
    this.activeCalls.delete(callId);
    
    logger.info(`Call ${callId} ended`);
  }

  async processAudioChunk({ callId, audio }) {
    const session = this.activeCalls.get(callId);
    if (!session) {
      logger.warn(`No active session for call ${callId}`);
      return;
    }
    
    try {
      // Add audio to buffer
      session.audioBuffer.push(audio);
      
      // Process audio when we have enough data
      if (session.shouldProcessAudio()) {
        const audioData = session.getAudioChunk();
        
        // Convert speech to text
        const text = await sttService.transcribe(audioData);
        
        if (text) {
          logger.info(`Transcribed text for call ${callId}: ${text}`);
          
          // Add to conversation history
          session.addMessage('user', text);
          
          // Get Claude's response
          const response = await this.generateResponse(session, text);
          
          // Convert response to speech and send
          await this.sendAudioResponse(callId, response);
        }
      }
    } catch (error) {
      logger.error(`Error processing audio for call ${callId}:`, error);
    }
  }

  async generateResponse(session, userMessage) {
    try {
      // Get conversation context
      const context = session.getConversationContext();
      
      // Generate response using Claude
      const response = await claudeService.generateResponse({
        message: userMessage,
        context,
        callMetadata: {
          phoneNumber: session.phoneNumber,
          duration: session.getDuration(),
          messageCount: session.messages.length
        }
      });
      
      // Add to conversation history
      session.addMessage('assistant', response);
      
      return response;
    } catch (error) {
      logger.error('Error generating response:', error);
      return 'Извините, у меня возникли технические сложности. Повторите, пожалуйста.';
    }
  }

  async sendAudioResponse(callId, text) {
    try {
      // Convert text to speech
      const audioData = await ttsService.synthesize(text);
      
      // Send audio to UIS
      await uisService.sendAudio(callId, audioData);
      
      logger.info(`Sent audio response for call ${callId}`);
    } catch (error) {
      logger.error(`Error sending audio response for call ${callId}:`, error);
      throw error;
    }
  }

  async answerCall(callId, greeting) {
    const session = this.activeCalls.get(callId);
    if (!session) {
      throw new Error('Call session not found');
    }
    
    await uisService.answerCall(callId);
    
    if (greeting) {
      await this.sendAudioResponse(callId, greeting);
    }
    
    return { callId, status: 'answered' };
  }

  async hangupCall(callId) {
    await uisService.hangupCall(callId);
    await this.handleCallEnd(callId);
    
    return { callId, status: 'ended' };
  }

  async initializeAudioProcessing(callId) {
    // Set up audio streaming with UIS
    await uisService.startAudioStream(callId);
  }

  async generateGreeting(phoneNumber) {
    // Check if we know this caller
    const callerInfo = await this.getCallerInfo(phoneNumber);
    
    if (callerInfo) {
      return `Здравствуйте, ${callerInfo.name}! Это Claude. Чем могу вам помочь?`;
    }
    
    return 'Здравствуйте! Это Claude, ваш AI ассистент. Чем могу вам помочь?';
  }

  async getCallerInfo(phoneNumber) {
    // TODO: Implement caller lookup
    return null;
  }

  async saveCallHistory(session) {
    // TODO: Save to database
    logger.info(`Saving call history for ${session.callId}`);
  }
}

module.exports = new CallService();
