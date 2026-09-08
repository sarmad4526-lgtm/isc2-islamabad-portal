const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const statsRoutes = require('./routes/stats.routes');
const membersRoutes = require('./routes/members.routes');
const applicationsRoutes = require('./routes/applications.routes');
const emailRoutes = require('./routes/email.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security Headers (Configured to permit Google Fonts & FontAwesome CDN)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/stats', statsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin/members', membersRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/membership', applicationsRoutes);
app.use('/api/admin/applications', applicationsRoutes);
app.use('/api/admin/email', emailRoutes);

// Health check endpoint with live DB diagnostic test
const { queryOne, isTurso, isPostgres } = require('./config/db');
app.get('/api/health', async (req, res) => {
    try {
        const test = await queryOne('SELECT 1 as val');
        res.json({
            status: 'healthy',
            dbConnected: Boolean(test && (test.val === 1 || test.val === '1' || Number(test.val) === 1)),
            dbMode: isTurso ? 'Turso' : isPostgres ? 'PostgreSQL' : 'Local SQLite',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            dbConnected: false,
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Serve Static Frontend Assets (HTML, CSS, JS, Images)
const publicDir = path.resolve(__dirname, '../public');
app.use(express.static(publicDir));

// Clean page routes
app.get('/admin', (req, res) => res.sendFile(path.join(publicDir, 'admin.html')));
app.get('/login', (req, res) => res.sendFile(path.join(publicDir, 'login.html')));
app.get('/membership', (req, res) => res.sendFile(path.join(publicDir, 'membership.html')));
app.get('/events', (req, res) => res.sendFile(path.join(publicDir, 'events.html')));
app.get('/leadership', (req, res) => res.sendFile(path.join(publicDir, 'leadership.html')));

// Fallback to index.html for root or SPA navigation
app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
