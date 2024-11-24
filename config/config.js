const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: "claude-3-sonnet-20240229"
  },
  twitter: {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET
  },
  mongodb: {
    uri: `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@data.qltk6.mongodb.net/?retryWrites=true&w=majority&appName=data`
  },
  tweetCollection: {
    maxTweetsPerFetch: 10,
    minEngagement: 50,
    fetchInterval: 3600000,
    locationId: '1528335'
  }
};
