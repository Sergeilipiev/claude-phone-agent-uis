const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../../utils/logger');
const mcpService = require('../mcp/mcpService');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY
    });
    this.model = process.env.CLAUDE_MODEL || 'claude-3-opus-20240229';
    this.maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS || '4096', 10);
  }

  async generateResponse({ message, context, callMetadata }) {
    try {
      // Build system prompt with MCP context
      const systemPrompt = await this.buildSystemPrompt(callMetadata);
      
      // Build messages array
      const messages = this.buildMessages(context, message);
      
      logger.info('Generating Claude response', { 
        messageCount: messages.length,
        model: this.model 
      });

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: 0.7,
        system: systemPrompt,
        messages
      });

      const responseText = response.content[0].text;
      
      // Process any MCP tool calls if needed
      const processedResponse = await this.processMCPToolCalls(responseText, context);
      
      return processedResponse;
    } catch (error) {
      logger.error('Error generating Claude response:', error);
      throw error;
    }
  }

  buildSystemPrompt(callMetadata) {
    return `Вы - Claude, AI ассистент, общающийся по телефону.

Важные правила:
1. Отвечайте кратко и по существу - это телефонный разговор
2. Говорите естественно, как человек
3. Используйте разговорные фразы и интонации
4. Не используйте сложные термины без необходимости
5. Будьте дружелюбны и вежливы

У вас есть доступ к следующим MCP инструментам:
${mcpService.getAvailableTools().map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

Информация о звонке:
- Номер телефона: ${callMetadata.phoneNumber}
- Продолжительность: ${callMetadata.duration} секунд
- Количество сообщений: ${callMetadata.messageCount}`;
  }

  buildMessages(context, currentMessage) {
    const messages = [];
    
    // Add conversation history
    if (context && context.messages) {
      context.messages.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }
    
    // Add current message
    messages.push({
      role: 'user',
      content: currentMessage
    });
    
    return messages;
  }

  async processMCPToolCalls(response, context) {
    // Check if response contains tool calls
    const toolCallPattern = /<tool_call>(.+?)<\/tool_call>/gs;
    const matches = response.matchAll(toolCallPattern);
    
    let processedResponse = response;
    
    for (const match of matches) {
      try {
        const toolCall = JSON.parse(match[1]);
        const result = await mcpService.executeTool(toolCall.name, toolCall.parameters);
        
        // Replace tool call with result
        processedResponse = processedResponse.replace(
          match[0],
          `Результат: ${JSON.stringify(result)}`
        );
      } catch (error) {
        logger.error('Error processing tool call:', error);
      }
    }
    
    return processedResponse;
  }

  async streamResponse({ message, context, callMetadata, onChunk }) {
    try {
      const systemPrompt = await this.buildSystemPrompt(callMetadata);
      const messages = this.buildMessages(context, message);
      
      const stream = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: 0.7,
        system: systemPrompt,
        messages,
        stream: true
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          const text = chunk.delta.text;
          fullResponse += text;
          if (onChunk) {
            await onChunk(text);
          }
        }
      }
      
      return fullResponse;
    } catch (error) {
      logger.error('Error streaming Claude response:', error);
      throw error;
    }
  }
}

module.exports = new ClaudeService();
