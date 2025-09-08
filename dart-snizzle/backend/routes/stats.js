const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const Player = require('../models/Player');
const { protect } = require('../middleware/auth');

// @route   GET /api/stats/overview
// @desc    Get user statistics overview
// @access  Private
router.get('/overview', protect, async (req, res) => {
  try {
    const games = await Game.find({ createdBy: req.user.id });
    const players = await Player.find({ owner: req.user.id });

    const stats = {
      totalGames: games.length,
      gamesWon: games.filter(g => g.status === 'finished').length,
      gamesAbandoned: games.filter(g => g.status === 'abandoned').length,
      totalPlayers: players.length,
      gameModes: {},
      recentGames: []
    };

    // Calculate game mode statistics
    ['301', '501', '701', 'cricket', 'aroundTheClock'].forEach(mode => {
      const modeGames = games.filter(g => g.gameMode === mode);
      stats.gameModes[mode] = {
        played: modeGames.length,
        finished: modeGames.filter(g => g.status === 'finished').length
      };
    });

    // Get recent games
    stats.recentGames = await Game.find({ createdBy: req.user.id })
      .populate('players.player', 'name')
      .populate('winner', 'name')
      .sort('-createdAt')
      .limit(5)
      .select('gameMode status winner createdAt duration');

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

// @route   GET /api/stats/charts
// @desc    Get chart data for statistics
// @access  Private
router.get('/charts', protect, async (req, res) => {
  try {
    const { period = '30d', playerId } = req.query;

    let dateFilter = new Date();
    if (period === '7d') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === '30d') {
      dateFilter.setDate(dateFilter.getDate() - 30);
    } else if (period === '90d') {
      dateFilter.setDate(dateFilter.getDate() - 90);
    } else if (period === '1y') {
      dateFilter.setFullYear(dateFilter.getFullYear() - 1);
    }

    const query = {
      createdBy: req.user.id,
      createdAt: { $gte: dateFilter }
    };

    if (playerId) {
      query['players.player'] = playerId;
    }

    const games = await Game.find(query)
      .populate('players.player', 'name')
      .sort('createdAt');

    // Prepare chart data
    const chartData = {
      dates: [],
      scores: [],
      averages: [],
      gamesPerDay: {},
      throwDistribution: {
        single: 0,
        double: 0,
        triple: 0,
        bullseye: 0,
        miss: 0
      }
    };

    games.forEach(game => {
      const date = game.createdAt.toISOString().split('T')[0];
      
      if (!chartData.gamesPerDay[date]) {
        chartData.gamesPerDay[date] = 0;
      }
      chartData.gamesPerDay[date]++;

      // Calculate averages from throws
      game.players.forEach(player => {
        player.throws.forEach(throwData => {
          chartData.scores.push(throwData.total);
          
          // Count throw types
          [throwData.dart1, throwData.dart2, throwData.dart3].forEach(dart => {
            if (dart.value === 0) {
              chartData.throwDistribution.miss++;
            } else if (dart.segment === 'Bull') {
              chartData.throwDistribution.bullseye++;
            } else if (dart.multiplier === 2) {
              chartData.throwDistribution.double++;
            } else if (dart.multiplier === 3) {
              chartData.throwDistribution.triple++;
            } else {
              chartData.throwDistribution.single++;
            }
          });
        });
      });
    });

    res.json({
      success: true,
      chartData
    });
  } catch (error) {
    console.error('Get chart data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chart data'
    });
  }
});

// @route   GET /api/stats/leaderboard
// @desc    Get leaderboard
// @access  Private
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const { gameMode = '501', limit = 10 } = req.query;

    const players = await Player.find({ owner: req.user.id })
      .sort(`-stats.gameModeStats.${gameMode}.won`)
      .limit(parseInt(limit));

    const leaderboard = players.map((player, index) => ({
      rank: index + 1,
      player: {
        id: player._id,
        name: player.name,
        avatar: player.avatar,
        color: player.color
      },
      stats: {
        gamesPlayed: player.stats.gameModeStats[gameMode]?.played || 0,
        gamesWon: player.stats.gameModeStats[gameMode]?.won || 0,
        winRate: player.stats.gameModeStats[gameMode]?.played > 0
          ? ((player.stats.gameModeStats[gameMode].won / player.stats.gameModeStats[gameMode].played) * 100).toFixed(1)
          : 0,
        averageScore: player.stats.gameModeStats[gameMode]?.averageScore || 0
      }
    }));

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard'
    });
  }
});

module.exports = router;