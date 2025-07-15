const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, email, is_approved, is_admin, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Approve/unapprove user (admin only)
router.patch('/users/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { is_approved } = req.body;

        if (typeof is_approved !== 'boolean') {
            return res.status(400).json({ error: 'is_approved must be a boolean' });
        }

        const [result] = await db.execute(
            'UPDATE users SET is_approved = ? WHERE id = ?',
            [is_approved, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: `User ${is_approved ? 'approved' : 'unapproved'} successfully` });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Don't allow deleting the current admin user
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;