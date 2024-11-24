const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/config.js');
const anthropicService = require('./services/anthropicService.js');
const twitterService = require('./services/twitterService.js');
const Pattern = require('./models/Pattern.js');
const logger = require('./utils/logger.js');

const app = express();
const port = process.env.PORT || 3000;

async function processTweets() {
  try {
    const usernames = [
      'elonmusk',
    ]
    const tweets = await twitterService.fetchTweetsFromAccounts(usernames);
    console.log(`Fetched ${tweets.length} tweets`);

    for (const tweet of tweets) {
      const analysis = await anthropicService.analyzeTweet(tweet.text);
      
      // Store patterns
      for (const pattern of analysis.shengWords) {
        await Pattern.findOneAndUpdate(
          { shengWord: pattern.word },
          {
            $setOnInsert: {
              swahiliEquivalent: pattern.swahili,
              context: pattern.context
            },
            $inc: { frequency: 1 },
            $push: {
              examples: {
                text: tweet.text,
                engagement: tweet.metrics.like_count + tweet.metrics.retweet_count,
                timestamp: new Date()
              },
              creativityScores: {
                score: analysis.creativityScore,
                timestamp: new Date()
              }
            }
          },
          { upsert: true }
        );
      }
    }
  } catch (error) {
    console.error('Tweet processing error:', error);
  }
}

async function generateAndPostTweet() {
  try {
    // Get all patterns for analysis
    const patterns = await Pattern.find()
      .sort('-frequency')
      .limit(100)
      .lean();

    // Generate creative tweet
    const generatedTweet = await anthropicService.generateTweet(patterns);
    
    // Post tweet
    await twitterService.postTweet(generatedTweet.tweet);
    
    console.log('Posted new tweet:', {
      tweet: generatedTweet.tweet,
      translation: generatedTweet.translation,
      patterns: generatedTweet.usedPatterns
    });
  } catch (error) {
    console.error('Tweet generation/posting error:', error);
  }
}

async function initialize() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB');

    // Schedule tweet collection and analysis
    setInterval(processTweets, config.tweetCollection.fetchInterval);
    
    // Generate and post a tweet every 4 hours
    setInterval(generateAndPostTweet, 14400000);
    
    // Initial run
    // await processTweets();
    await generateAndPostTweet();

  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  }
}

initialize();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});