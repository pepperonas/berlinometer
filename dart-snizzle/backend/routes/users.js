const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Game = require('../models/Game');
const Player = require('../models/Player');
const { protect } = require('../middleware/auth');

// @route   GET /api/users/search
// @desc    Search users for friend requests
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user.id } },
        { status: 'active' },
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { firstName: { $regex: q, $options: 'i' } },
            { lastName: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username firstName lastName avatar')
    .limit(20);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users'
    });
  }
});

// @route   POST /api/users/friend-request
// @desc    Send friend request
// @access  Private
router.post('/friend-request', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already friends
    if (req.user.friends.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already friends with this user'
      });
    }

    // Check if request already sent
    const existingRequest = req.user.friendRequests.sent.find(
      r => r.to.toString() === userId
    );
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent'
      });
    }

    // Add to sender's sent requests
    req.user.friendRequests.sent.push({ to: userId });
    await req.user.save();

    // Add to receiver's received requests
    targetUser.friendRequests.received.push({ from: req.user.id });
    await targetUser.save();

    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending friend request'
    });
  }
});

// @route   POST /api/users/accept-friend
// @desc    Accept friend request
// @access  Private
router.post('/accept-friend', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    const requestIndex = req.user.friendRequests.received.findIndex(
      r => r.from.toString() === userId
    );

    if (requestIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'No friend request from this user'
      });
    }

    // Remove from received requests
    req.user.friendRequests.received.splice(requestIndex, 1);
    
    // Add to friends list
    req.user.friends.push(userId);
    await req.user.save();

    // Update sender
    const sender = await User.findById(userId);
    const sentIndex = sender.friendRequests.sent.findIndex(
      r => r.to.toString() === req.user.id
    );
    if (sentIndex !== -1) {
      sender.friendRequests.sent.splice(sentIndex, 1);
    }
    sender.friends.push(req.user.id);
    await sender.save();

    res.json({
      success: true,
      message: 'Friend request accepted'
    });
  } catch (error) {
    console.error('Accept friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting friend request'
    });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  try {
    const { preferences } = req.body;

    req.user.preferences = { ...req.user.preferences, ...preferences };
    await req.user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: req.user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences'
    });
  }
});

// @route   DELETE /api/users/reset/games
// @desc    Delete all user's games
// @access  Private
router.delete('/reset/games', protect, async (req, res) => {
  try {
    const result = await Game.deleteMany({ createdBy: req.user.id });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} games successfully`
    });
  } catch (error) {
    console.error('Reset games error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting games'
    });
  }
});

// @route   DELETE /api/users/reset/players
// @desc    Delete all user's players and associated games
// @access  Private
router.delete('/reset/players', protect, async (req, res) => {
  try {
    // First delete all games created by this user
    const gameResult = await Game.deleteMany({ createdBy: req.user.id });
    
    // Then delete all players created by this user
    const playerResult = await Player.deleteMany({ createdBy: req.user.id });

    res.json({
      success: true,
      message: `Deleted ${playerResult.deletedCount} players and ${gameResult.deletedCount} games successfully`
    });
  } catch (error) {
    console.error('Reset players error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting players and games'
    });
  }
});

// @route   DELETE /api/users/reset/all
// @desc    Delete all user's data (games and players)
// @access  Private
router.delete('/reset/all', protect, async (req, res) => {
  try {
    // Delete all games created by this user
    const gameResult = await Game.deleteMany({ createdBy: req.user.id });
    
    // Delete all players created by this user
    const playerResult = await Player.deleteMany({ createdBy: req.user.id });

    res.json({
      success: true,
      message: `Complete reset successful: Deleted ${playerResult.deletedCount} players and ${gameResult.deletedCount} games`
    });
  } catch (error) {
    console.error('Reset all data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing complete reset'
    });
  }
});

module.exports = router;