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

    // Create game
    const game = new Game({
      gameMode,
      customSettings,
      isOnline,
      createdBy: req.user.id,
      players: players.map(player => ({
        player: player._id,
        user: req.user.id,
        startingScore: 0,
        currentScore: 0,
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

    // Calculate total
    const total = dart1.value + dart2.value + dart3.value;

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

module.exports = router;