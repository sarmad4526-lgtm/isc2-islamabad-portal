const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Sign in via Email or numeric ISC2 Member ID
 */
router.post('/login', (req, res, next) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email or ISC2 Membership Number, and password.' });
        }

        const cleanIdentifier = identifier.trim();
        const isNumeric = /^\d+$/.test(cleanIdentifier);

        // Find user by email or by ISC2 Member ID
        let user;
        if (isNumeric) {
            user = db.prepare('SELECT * FROM users WHERE isc2_number = ? OR email = ?').get(cleanIdentifier, cleanIdentifier);
        } else {
            user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanIdentifier.toLowerCase());
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
        }

        const isMatch = bcrypt.compareSync(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid password. Please try again.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Also fetch member profile if available
        const member = db.prepare('SELECT * FROM members WHERE email = ? OR member_id = ?').get(user.email, user.isc2_number);

        return res.json({
            success: true,
            message: 'Signed in successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                isc2Number: user.isc2_number,
                role: user.role,
                name: member ? member.name : (user.role === 'ADMIN' ? 'Chapter President' : 'Member')
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({ success: true, message: 'Signed out successfully' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, (req, res) => {
    const member = db.prepare('SELECT * FROM members WHERE email = ? OR member_id = ?').get(req.user.email, req.user.isc2_number);

    return res.json({
        success: true,
        user: {
            id: req.user.id,
            email: req.user.email,
            isc2Number: req.user.isc2_number,
            role: req.user.role,
            name: member ? member.name : (req.user.role === 'ADMIN' ? 'Chapter President' : 'Member')
        }
    });
});

module.exports = router;
