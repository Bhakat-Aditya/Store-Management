export const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Log the error for your own debugging

    // Default error status and message
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Format the response
    res.status(statusCode).json({
        success: false,
        error: message,
        // Only show full stack traces in development mode, not in production
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};