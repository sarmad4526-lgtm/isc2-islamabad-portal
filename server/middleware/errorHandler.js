function errorHandler(err, req, res, next) {
    console.error('API Error:', err);

    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal server error occurred.',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}

module.exports = errorHandler;
