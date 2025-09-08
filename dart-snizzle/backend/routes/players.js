const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const { protect } = require('../middleware/auth');

// @route   GET /api/players
// @desc    Get all players for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const players = await Player.find({ owner: req.user.id })
      .sort('-lastPlayed');

    res.json({
      success: true,
      count: players.length,
      players
    });
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching players'
    });
  }
});

// @route   POST /api/players
// @desc    Create new player
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, color, avatar } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Player name is required'
      });
    }

    const player = await Player.create({
      name,
      color,
      avatar,
      owner: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Player created successfully',
      player
    });
  } catch (error) {
    console.error('Create player error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating player'
    });
  }
});

// @route   PUT /api/players/:id
// @desc    Update player
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const player = await Player.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    const { name, color, avatar, isActive } = req.body;

    if (name) player.name = name;
    if (color) player.color = color;
    if (avatar !== undefined) player.avatar = avatar;
    if (isActive !== undefined) player.isActive = isActive;

    await player.save();

    res.json({
      success: true,
      message: 'Player updated successfully',
      player
    });
  } catch (error) {
    console.error('Update player error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating player'
    });
  }
});

// @route   DELETE /api/players/:id
// @desc    Delete player
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const player = await Player.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.json({
      success: true,
      message: 'Player deleted successfully'
    });
  } catch (error) {
    console.error('Delete player error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting player'
    });
  }
});

// @route   GET /api/players/:id/stats
// @desc    Get player statistics
// @access  Private
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const player = await Player.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.json({
      success: true,
      stats: player.stats,
      achievements: player.achievements
    });
  } catch (error) {
    console.error('Get player stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching player statistics'
    });
  }
});

module.exports = router;