const mongoose = require('mongoose');

const throwSchema = new mongoose.Schema({
  dart1: {
    value: { type: Number, required: true },
    multiplier: { type: Number, default: 1 }, // 1 = single, 2 = double, 3 = triple
    segment: { type: String } // e.g., "20", "Bull", "Outer Bull"
  },
  dart2: {
    value: { type: Number, required: true },
    multiplier: { type: Number, default: 1 },
    segment: { type: String }
  },
  dart3: {
    value: { type: Number, required: true },
    multiplier: { type: Number, default: 1 },
    segment: { type: String }
  },
  total: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const playerGameDataSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  throws: [throwSchema],
  currentScore: {
    type: Number,
    required: true
  },
  startingScore: {
    type: Number,
    required: true
  },
  dartsThrown: {
    type: Number,
    default: 0
  },
  legs: {
    type: Number,
    default: 0
  },
  sets: {
    type: Number,
    default: 0
  },
  finishType: {
    type: String,
    enum: ['single', 'double', 'triple', 'bullseye', null],
    default: null
  },
  checkoutAttempts: {
    type: Number,
    default: 0
  },
  average: {
    type: Number,
    default: 0
  },
  highestScore: {
    type: Number,
    default: 0
  },
  scores: {
    oneEighty: { type: Number, default: 0 },
    oneFourty: { type: Number, default: 0 },
    hundred: { type: Number, default: 0 },
    bullseye: { type: Number, default: 0 }
  },
  cricketData: {
    marks: {
      '20': { type: Number, default: 0 },
      '19': { type: Number, default: 0 },
      '18': { type: Number, default: 0 },
      '17': { type: Number, default: 0 },
      '16': { type: Number, default: 0 },
      '15': { type: Number, default: 0 },
      'Bull': { type: Number, default: 0 }
    },
    points: { type: Number, default: 0 }
  }
});

const gameSchema = new mongoose.Schema({
  gameMode: {
    type: String,
    enum: ['301', '501', '701', 'cricket', 'aroundTheClock', 'custom'],
    required: true
  },
  customSettings: {
    startingScore: Number,
    doubleIn: { type: Boolean, default: false },
    doubleOut: { type: Boolean, default: true },
    legs: { type: Number, default: 1 },
    sets: { type: Number, default: 1 }
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'finished', 'abandoned'],
    default: 'waiting'
  },
  players: [playerGameDataSchema],
  currentPlayerIndex: {
    type: Number,
    default: 0
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  roomCode: {
    type: String,
    sparse: true,
    index: true
  },
  spectators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  startedAt: {
    type: Date
  },
  finishedAt: {
    type: Date
  },
  duration: {
    type: Number // in seconds
  },
  gameData: {
    totalThrows: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    highestCheckout: { type: Number, default: 0 },
    lowestDartsUsed: { type: Number, default: null }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate unique room code for online games
gameSchema.methods.generateRoomCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  this.roomCode = code;
  return code;
};

// Add throw to current player
gameSchema.methods.addThrow = function(throwData) {
  const currentPlayer = this.players[this.currentPlayerIndex];
  currentPlayer.throws.push(throwData);
  currentPlayer.dartsThrown += 3;
  
  // Update current score for standard games
  if (['301', '501', '701'].includes(this.gameMode)) {
    currentPlayer.currentScore -= throwData.total;
    
    // Check for bust
    if (currentPlayer.currentScore < 0 || 
        (currentPlayer.currentScore === 1 && this.customSettings.doubleOut)) {
      currentPlayer.currentScore += throwData.total; // Reset score
    }
    
    // Check for win
    if (currentPlayer.currentScore === 0) {
      this.winner = currentPlayer.player;
      this.status = 'finished';
      this.finishedAt = new Date();
      this.duration = Math.floor((this.finishedAt - this.startedAt) / 1000);
    }
  }
  
  // Update statistics
  if (throwData.total === 180) currentPlayer.scores.oneEighty++;
  if (throwData.total >= 140) currentPlayer.scores.oneFourty++;
  if (throwData.total >= 100) currentPlayer.scores.hundred++;
  if (currentPlayer.highestScore < throwData.total) {
    currentPlayer.highestScore = throwData.total;
  }
  
  // Calculate average
  const totalScore = currentPlayer.throws.reduce((sum, t) => sum + t.total, 0);
  currentPlayer.average = Math.round((totalScore / currentPlayer.throws.length) * 100) / 100;
  
  return this.save();
};

// Switch to next player
gameSchema.methods.nextPlayer = function() {
  this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  return this.save();
};

// Start game
gameSchema.methods.start = function() {
  this.status = 'active';
  this.startedAt = new Date();
  
  // Initialize player scores based on game mode
  const startingScore = this.gameMode === '301' ? 301 : 
                       this.gameMode === '501' ? 501 : 
                       this.gameMode === '701' ? 701 : 
                       this.customSettings?.startingScore || 501;
  
  this.players.forEach(player => {
    player.startingScore = startingScore;
    player.currentScore = startingScore;
  });
  
  return this.save();
};

// Pause game
gameSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

// Resume game
gameSchema.methods.resume = function() {
  this.status = 'active';
  return this.save();
};

// Abandon game
gameSchema.methods.abandon = function() {
  this.status = 'abandoned';
  this.finishedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Game', gameSchema);