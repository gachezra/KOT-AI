const mongoose = require('mongoose');

const PatternSchema = new mongoose.Schema({
  shengWord: {
    type: String,
    required: true,
    unique: true
  },
  swahiliEquivalent: String,
  context: String,
  frequency: {
    type: Number,
    default: 1
  },
  examples: [{
    text: String,
    engagement: Number,
    timestamp: Date
  }],
  creativityScores: [{
    score: Number,
    timestamp: Date
  }],
  lastUsed: Date,
  categories: [String],
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

PatternSchema.methods.updateFrequency = function() {
  this.frequency += 1;
  return this.save();
};

PatternSchema.methods.addExample = function(text, engagement) {
  this.examples.push({
    text,
    engagement,
    timestamp: new Date()
  });
  return this.save();
};

module.exports = mongoose.model('Pattern', PatternSchema);
