const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Player name is required'],
    trim: true,
    minlength: [1, 'Player name must be at least 1 character'],
    maxlength: [30, 'Player name cannot exceed 30 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: '#688db1' // Default accent blue
  },
  stats: {
    gamesPlayed: {
      type: Number,
      default: 0
    },
    gamesWon: {
      type: Number,
      default: 0
    },
    totalScore: {
      type: Number,
      default: 0
    },
    totalDarts: {
      type: Number,
      default: 0
    },
    highestScore: {
      type: Number,
      default: 0
    },
    highestCheckout: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    averageDartsPerLeg: {
      type: Number,
      default: 0
    },
    doubleRate: {
      type: Number,
      default: 0
    },
    tripleRate: {
      type: Number,
      default: 0
    },
    bullseyeCount: {
      type: Number,
      default: 0
    },
    oneEightyCount: {
      type: Number,
      default: 0
    },
    checkouts: {
      attempts: {
        type: Number,
        default: 0
      },
      successful: {
        type: Number,
        default: 0
      },
      rate: {
        type: Number,
        default: 0
      }
    },
    gameModeStats: {
      '301': {
        played: { type: Number, default: 0 },
        won: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 }
      },
      '501': {
        played: { type: Number, default: 0 },
        won: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 }
      },
      '701': {
        played: { type: Number, default: 0 },
        won: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 }
      },
      cricket: {
        played: { type: Number, default: 0 },
        won: { type: Number, default: 0 },
        averageMarks: { type: Number, default: 0 }
      },
      aroundTheClock: {
        played: { type: Number, default: 0 },
        won: { type: Number, default: 0 },
        bestTime: { type: Number, default: null }
      }
    }
  },
  achievements: [{
    name: String,
    description: String,
    unlockedAt: Date,
    icon: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastPlayed: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update statistics
playerSchema.methods.updateStats = function(gameData) {
  this.stats.gamesPlayed++;
  if (gameData.won) this.stats.gamesWon++;
  this.stats.totalScore += gameData.totalScore;
  this.stats.totalDarts += gameData.dartsThrown;
  
  // Update averages
  this.stats.averageScore = Math.round(this.stats.totalScore / this.stats.gamesPlayed);
  this.stats.averageDartsPerLeg = Math.round(this.stats.totalDarts / this.stats.gamesPlayed);
  
  // Update game mode specific stats
  if (gameData.gameMode && this.stats.gameModeStats[gameData.gameMode]) {
    this.stats.gameModeStats[gameData.gameMode].played++;
    if (gameData.won) {
      this.stats.gameModeStats[gameData.gameMode].won++;
    }
  }
  
  this.lastPlayed = Date.now();
  return this.save();
};

// Check for achievements
playerSchema.methods.checkAchievements = function() {
  const achievements = [];
  
  // First game achievement
  if (this.stats.gamesPlayed === 1 && !this.achievements.find(a => a.name === 'First Game')) {
    achievements.push({
      name: 'First Game',
      description: 'Played your first game',
      unlockedAt: new Date(),
      icon: '🎯'
    });
  }
  
  // 180 achievement
  if (this.stats.oneEightyCount >= 1 && !this.achievements.find(a => a.name === 'Perfect Score')) {
    achievements.push({
      name: 'Perfect Score',
      description: 'Scored 180 in a single turn',
      unlockedAt: new Date(),
      icon: '💯'
    });
  }
  
  // Win streak achievements
  if (this.stats.gamesWon >= 10 && !this.achievements.find(a => a.name === 'Winner')) {
    achievements.push({
      name: 'Winner',
      description: 'Won 10 games',
      unlockedAt: new Date(),
      icon: '🏆'
    });
  }
  
  if (achievements.length > 0) {
    this.achievements.push(...achievements);
    return this.save();
  }
  
  return null;
};

module.exports = mongoose.model('Player', playerSchema);