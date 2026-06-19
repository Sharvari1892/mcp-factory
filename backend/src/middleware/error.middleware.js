const errorMiddleware = (err, req, res, next) => {
    console.error(err);

    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        error: err.message || "Internal server error"
    });
};

module.exports = errorMiddleware;