const { IncorrectEmailError, IncorrectPasswordError, DuplicateEmailError } = require("../utils/errors");

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
    console.error("Global error is Working " + err);

    if (err instanceof IncorrectEmailError || err instanceof IncorrectPasswordError || err instanceof DuplicateEmailError) {
        res.status(400).json({ error: err.message });
    } else if (err.statusCode && err.statusCode === 400) {
        res.status(400).json({ error: err });
    } else {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = globalErrorHandler;