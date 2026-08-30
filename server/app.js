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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve Static Frontend Assets (HTML, CSS, JS, Images)
const publicDir = path.resolve(__dirname, '../');
app.use(express.static(publicDir));

// Fallback to index.html for root or unknown HTML navigation
app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
