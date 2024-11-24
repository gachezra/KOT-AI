const { TwitterApi } = require('twitter-api-v2');
const config = require('../config/config.js');
const logger = require('../utils/logger.js');

class TwitterService {
  constructor() {
    this.client = new TwitterApi({
      appKey: config.twitter.apiKey,
      appSecret: config.twitter.apiSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessSecret,
    });
  }

  async fetchTweetsFromAccounts(usernames) {
    try {
      const tweets = [];
      for (const username of usernames) {
        const user = await this.client.v2.userByUsername(username);
        console.log('User found: ', user)
        const timeline = await this.client.v2.userTimeline(user.data.id, {
          'tweet.fields': ['public_metrics', 'created_at', 'lang'],
          max_results: config.tweetCollection.maxTweetsPerFetch,
        });

        // Filter tweets based on engagement and language (Swahili)
        const relevantTweets = timeline.data?.data?.filter(tweet => {
          const metrics = tweet.public_metrics;
          return (
            tweet.lang === 'sw' && // Swahili tweets
            (metrics.like_count + metrics.retweet_count) >= config.tweetCollection.minEngagement
          );
        });

        // Add relevant tweets to the final list
        if (relevantTweets) {
          tweets.push(
            ...relevantTweets.map(tweet => ({
              id: tweet.id,
              text: tweet.text,
              metrics: tweet.public_metrics,
              created_at: tweet.created_at,
            }))
          );
        }
      }

      logger.info(`Fetched ${tweets.length} relevant tweets`);
      return tweets;
    } catch (error) {
      logger.error('Tweet fetching error:', error);
      throw new Error(`Twitter API error: ${error.message}`);
    }
  }

  async fetchTweets() {
    try {
      const { maxTweetsPerFetch, minEngagement } = config.tweetCollection;

      const tweets = await this.client.v2.search({
        query: `lang:sw -is:retweet`,
        'tweet.fields': ['public_metrics', 'created_at', 'lang'],
        max_results: maxTweetsPerFetch,
      });

      if (!tweets?.data || tweets.data.length === 0) {
        logger.warn('No tweets found.');
        return [];
      }

      const relevantTweets = tweets.data.filter(tweet => {
        const metrics = tweet.public_metrics;
        return (metrics.like_count + metrics.retweet_count) >= minEngagement;
      });

      return relevantTweets.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        metrics: tweet.public_metrics,
        created_at: tweet.created_at,
      }));
    } catch (error) {
      logger.error('Tweet fetching error:', {
        message: error.message,
        status: error?.code,
        details: error?.data,
      });
      throw new Error(`Twitter API error: ${error.message}`);
    }
  }

  async postTweet(tweetContent) {
    try {
      if (tweetContent.length > 280) {
        throw new Error('Tweet content exceeds 280 characters.');
      }

      const tweet = await this.client.v2.tweet(tweetContent);
      logger.info(`Tweet posted successfully: ${tweet.data.id}`);
      return tweet.data;
    } catch (error) {
      logger.error('Tweet posting error:', {
        message: error.message,
        status: error?.code,
        details: error?.data,
      });
      throw new Error(`Failed to post tweet: ${error.message}`);
    }
  }
}

module.exports = new TwitterService();
