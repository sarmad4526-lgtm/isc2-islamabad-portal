function errorHandler(err, req, res, next) {
    console.error('API Error:', err);

    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal server error occurred.',
        error: err.message,
        stack: err.stack
    });
}

module.exports = errorHandler;
