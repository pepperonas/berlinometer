const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const Player = require('../models/Player');
const { protect } = require('../middleware/auth');

// @route   GET /api/games
// @desc    Get user's games
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, gameMode, limit = 20, offset = 0 } = req.query;
    
    const query = { createdBy: req.user.id };
    if (status) query.status = status;
    if (gameMode) query.gameMode = gameMode;

    const games = await Game.find(query)
      .populate('players.player', 'name color')
      .populate('winner', 'name')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Game.countDocuments(query);

    res.json({
      success: true,
      games,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching games'
    });
  }
});

// @route   GET /api/games/:id
// @desc    Get single game
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const game = await Game.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user.id },
        { 'players.user': req.user.id }
      ]
    })
    .populate('players.player', 'name color')
    .populate('winner', 'name')
    .populate('createdBy', 'username');

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Auto-fix incorrect starting scores for existing games
    let needsFix = false;
    const correctStartingScore = game.gameMode === '301' ? 301 : 
                               game.gameMode === '501' ? 501 : 
                               game.gameMode === '701' ? 701 : 
                               game.customSettings?.startingScore || 501;

    game.players.forEach(playerGame => {
      if (playerGame.startingScore !== correctStartingScore) {
        const scoreDifference = correctStartingScore - playerGame.startingScore;
        playerGame.startingScore = correctStartingScore;
        playerGame.currentScore += scoreDifference;
        needsFix = true;
      }
    });

    if (needsFix) {
      await game.save();
      console.log(`Auto-fixed game ${game._id} scores to ${correctStartingScore}`);
    }

    res.json({
      success: true,
      game
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching game'
    });
  }
});

// @route   POST /api/games
// @desc    Create new game
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { gameMode, playerIds, customSettings, isOnline } = req.body;

    if (!gameMode || !playerIds || playerIds.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Game mode and at least one player are required'
      });
    }

    // Verify players belong to user
    const players = await Player.find({
      _id: { $in: playerIds },
      owner: req.user.id
    });

    if (players.length !== playerIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid player selection'
      });
    }

    // Determine correct starting score based on game mode
    let startingScore;
    switch (gameMode) {
      case '301':
        startingScore = 301;
        break;
      case '501':
        startingScore = 501;
        break;
      case '701':
        startingScore = 701;
        break;
      default:
        startingScore = customSettings?.startingScore || 501;
        break;
    }

    // Create game
    const game = new Game({
      gameMode,
      customSettings,
      isOnline,
      createdBy: req.user.id,
      players: players.map(player => ({
        player: player._id,
        user: req.user.id,
        startingScore: startingScore,
        currentScore: startingScore,
        throws: []
      }))
    });

    // Generate room code for online games
    if (isOnline) {
      game.generateRoomCode();
    }

    await game.save();
    await game.populate('players.player', 'name color');

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      game
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating game'
    });
  }
});

// @route   PUT /api/games/:id/start
// @desc    Start game
// @access  Private
router.put('/:id/start', protect, async (req, res) => {
  try {
    const game = await Game.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: 'Game already started'
      });
    }

    await game.start();
    await game.populate('players.player', 'name color');

    res.json({
      success: true,
      message: 'Game started',
      game
    });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting game'
    });
  }
});

// @route   POST /api/games/:id/throw
// @desc    Add throw to game
// @access  Private
router.post('/:id/throw', protect, async (req, res) => {
  try {
    const { dart1, dart2, dart3 } = req.body;

    const game = await Game.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      status: 'active'
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Active game not found'
      });
    }

    // Calculate total including multipliers
    const total = (dart1.value * dart1.multiplier) + (dart2.value * dart2.multiplier) + (dart3.value * dart3.multiplier);

    // Add throw
    await game.addThrow({
      dart1,
      dart2,
      dart3,
      total
    });

    // Move to next player if game not finished
    if (game.status === 'active') {
      await game.nextPlayer();
    }

    await game.populate('players.player', 'name color');

    // Update player stats if game finished
    if (game.status === 'finished') {
      const winner = game.players.find(p => p.player._id.toString() === game.winner.toString());
      if (winner) {
        const playerModel = await Player.findById(winner.player._id);
        await playerModel.updateStats({
          won: true,
          totalScore: winner.throws.reduce((sum, t) => sum + t.total, 0),
          dartsThrown: winner.dartsThrown,
          gameMode: game.gameMode
        });
        await playerModel.checkAchievements();
      }
    }

    res.json({
      success: true,
      message: game.status === 'finished' ? 'Game finished!' : 'Throw recorded',
      game
    });
  } catch (error) {
    console.error('Add throw error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording throw'
    });
  }
});

// @route   PUT /api/games/:id/pause
// @desc    Pause game
// @access  Private
router.put('/:id/pause', protect, async (req, res) => {
  try {
    const game = await Game.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      status: 'active'
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Active game not found'
      });
    }

    await game.pause();
    await game.populate('players.player', 'name color');

    res.json({
      success: true,
      message: 'Game paused',
      game
    });
  } catch (error) {
    console.error('Pause game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error pausing game'
    });
  }
});

// @route   PUT /api/games/:id/resume
// @desc    Resume game
// @access  Private
router.put('/:id/resume', protect, async (req, res) => {
  try {
    const game = await Game.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      status: 'paused'
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Paused game not found'
      });
    }

    await game.resume();
    await game.populate('players.player', 'name color');

    res.json({
      success: true,
      message: 'Game resumed',
      game
    });
  } catch (error) {
    console.error('Resume game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resuming game'
    });
  }
});

// @route   PUT /api/games/:id/abandon
// @desc    Abandon game
// @access  Private
router.put('/:id/abandon', protect, async (req, res) => {
  try {
    const game = await Game.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      status: { $in: ['active', 'paused'] }
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    await game.abandon();

    res.json({
      success: true,
      message: 'Game abandoned'
    });
  } catch (error) {
    console.error('Abandon game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error abandoning game'
    });
  }
});

// @route   PUT /api/games/:id/undo-throw
// @desc    Undo last throw
// @access  Private
router.put('/:id/undo-throw', protect, async (req, res) => {
  try {
    const game = await Game.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      status: { $in: ['active', 'paused'] }
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Find the last active throw
    let lastThrowFound = false;
    let lastThrowPlayerIndex = -1;
    let lastThrowIndex = -1;

    for (let i = game.players.length - 1; i >= 0 && !lastThrowFound; i--) {
      const player = game.players[i];
      for (let j = player.throws.length - 1; j >= 0; j--) {
        if (player.throws[j].status === 'active') {
          lastThrowPlayerIndex = i;
          lastThrowIndex = j;
          lastThrowFound = true;
          break;
        }
      }
    }

    if (!lastThrowFound) {
      return res.status(400).json({
        success: false,
        message: 'No throws to undo'
      });
    }

    // Mark throw as undone
    const lastThrow = game.players[lastThrowPlayerIndex].throws[lastThrowIndex];
    lastThrow.status = 'undone';
    lastThrow.undoTimestamp = new Date();
    lastThrow.undoneBy = req.user.id;

    // Recalculate scores
    game.players[lastThrowPlayerIndex].currentScore += lastThrow.total;
    game.players[lastThrowPlayerIndex].dartsThrown -= 3;

    // Adjust current player index (go back to previous player)
    if (game.currentPlayerIndex > 0) {
      game.currentPlayerIndex--;
    } else {
      game.currentPlayerIndex = game.players.length - 1;
    }

    await game.save();
    await game.populate('players.player', 'name color');

    res.json({
      success: true,
      message: 'Throw undone successfully',
      game
    });
  } catch (error) {
    console.error('Undo throw error:', error);
    res.status(500).json({
      success: false,
      message: 'Error undoing throw'
    });
  }
});

// @route   GET /api/games/:id/stats
// @desc    Get live game statistics
// @access  Private
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const game = await Game.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user.id },
        { 'players.user': req.user.id }
      ]
    }).populate('players.player', 'name color');

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Calculate live statistics
    const stats = {
      gameId: game._id,
      gameMode: game.gameMode,
      status: game.status,
      totalThrows: 0,
      players: []
    };

    game.players.forEach(player => {
      const activeThrows = player.throws.filter(t => t.status === 'active');
      const totalScore = activeThrows.reduce((sum, t) => sum + t.total, 0);
      const averageScore = activeThrows.length > 0 ? (totalScore / activeThrows.length).toFixed(1) : '0.0';
      const dartsThrown = activeThrows.length * 3;
      
      stats.totalThrows += activeThrows.length;
      
      stats.players.push({
        name: player.player.name,
        color: player.player.color,
        currentScore: player.currentScore,
        startingScore: player.startingScore,
        dartsThrown: dartsThrown,
        averageScore: parseFloat(averageScore),
        throwsCount: activeThrows.length,
        highestThrow: activeThrows.length > 0 ? Math.max(...activeThrows.map(t => t.total)) : 0,
        recentThrows: activeThrows.slice(-5).map(t => ({
          total: t.total,
          timestamp: t.timestamp
        }))
      });
    });

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get game stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching game statistics'
    });
  }
});

// @route   GET /api/games/room/:code
// @desc    Join game by room code
// @access  Private
router.get('/room/:code', protect, async (req, res) => {
  try {
    const game = await Game.findOne({
      roomCode: req.params.code.toUpperCase(),
      status: { $in: ['waiting', 'active'] }
    })
    .populate('players.player', 'name color')
    .populate('createdBy', 'username');

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game room not found'
      });
    }

    res.json({
      success: true,
      game
    });
  } catch (error) {
    console.error('Join game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining game'
    });
  }
});

// @route   DELETE /api/games/:id
// @desc    Delete game
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const game = await Game.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    await Game.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting game'
    });
  }
});

module.exports = router;