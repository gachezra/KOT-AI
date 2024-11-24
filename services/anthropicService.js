const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config/config.js');
const logger = require('../utils/logger.js');

class AnthropicService {
  constructor() {
    this.client = new Anthropic({
      apiKey: config.anthropic.apiKey
    });
  }

  async analyzeTweet(tweetText) {
    try {
      const response = await this.client.messages.create({
        model: config.anthropic.model,
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `Analyze this tweet for Sheng patterns: "${tweetText}"
          Tasks:
          1. Identify Sheng words/phrases
          2. Note standard Swahili equivalents
          3. Explain context/usage
          4. Rate how creative/random the usage is (1-10)
          
          Format response as JSON with keys:
          {
            "shengWords": [{"word": "", "swahili": "", "context": ""}],
            "creativityScore": 0,
            "analysis": ""
          }`
        }]
      });
      
      return JSON.parse(response.content);
    } catch (error) {
      logger.error('Tweet analysis error:', error);
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  async generateTweet(patterns) {
    try {
      // First, analyze our pattern database
      const memoryAnalysis = await this.analyzePatterns(patterns);
      
      // Then generate a tweet based on the analysis
      const response = await this.client.messages.create({
        model: config.anthropic.model,
        max_tokens: 280,
        messages: [{
          role: "user",
          content: `Based on this analysis of Sheng patterns:
          ${JSON.stringify(memoryAnalysis)}
          
          Generate a completely random but meaningful tweet in Sheng that:
          1. Uses 2-3 popular Sheng words/phrases creatively
          2. Is unexpected but makes sense
          3. Could be about any topic (technology, food, daily life, etc.)
          4. Is PG-rated and culturally appropriate
          5. Has a surprise element or twist
          6. Maximum 280 characters
          
          Make it feel like it could go viral for being clever/random.
          
          Format response as JSON:
          {
            "tweet": "",
            "translation": "",
            "usedPatterns": [{"word": "", "meaning": ""}]
          }`
        }]
      });

      return JSON.parse(response.content);
    } catch (error) {
      logger.error('Tweet generation error:', error);
      throw new Error(`Tweet generation failed: ${error.message}`);
    }
  }

  async analyzePatterns(patterns) {
    try {
      const response = await this.client.messages.create({
        model: config.anthropic.model,
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `Analyze these Sheng language patterns:
          ${JSON.stringify(patterns)}
          
          Create a creative brief that includes:
          1. Most frequent word combinations
          2. Common themes/topics
          3. Unique or trending expressions
          4. Cultural references
          5. Pattern of creativity in usage
          
          Format response as JSON:
          {
            "popularCombos": [],
            "themes": [],
            "uniqueExpressions": [],
            "culturalElements": [],
            "creativityInsights": ""
          }`
        }]
      });

      return JSON.parse(response.content);
    } catch (error) {
      logger.error('Pattern analysis error:', error);
      throw new Error(`Pattern analysis failed: ${error.message}`);
    }
  }
}

module.exports = new AnthropicService();
