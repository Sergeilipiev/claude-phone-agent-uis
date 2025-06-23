class CallSession {
  constructor({ callId, phoneNumber, direction, startTime }) {
    this.callId = callId;
    this.phoneNumber = phoneNumber;
    this.direction = direction;
    this.startTime = startTime;
    this.status = 'initialized';
    this.messages = [];
    this.audioBuffer = [];
    this.lastProcessedTime = Date.now();
    this.metadata = {};
  }

  addMessage(role, content) {
    this.messages.push({
      role,
      content,
      timestamp: new Date()
    });
  }

  getConversationContext() {
    return {
      messages: this.messages.slice(-10), // Last 10 messages
      metadata: this.metadata
    };
  }

  shouldProcessAudio() {
    // Process audio every 2 seconds or when buffer is large
    const timeSinceLastProcess = Date.now() - this.lastProcessedTime;
    return timeSinceLastProcess > 2000 || this.audioBuffer.length > 10;
  }

  getAudioChunk() {
    this.lastProcessedTime = Date.now();
    const chunk = Buffer.concat(this.audioBuffer);
    this.audioBuffer = [];
    return chunk;
  }

  getDuration() {
    if (!this.startTime) return 0;
    const endTime = this.endTime || new Date();
    return Math.floor((endTime - this.startTime) / 1000); // Duration in seconds
  }

  toJSON() {
    return {
      callId: this.callId,
      phoneNumber: this.phoneNumber,
      direction: this.direction,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.getDuration(),
      messageCount: this.messages.length,
      messages: this.messages
    };
  }
}

module.exports = CallSession;
