const errorHandler = (err, req, res, next) => {
    if (err) {
        return res.status(400).json({ "error": err.message });
    }
}

module.exports = {
    errorHandler
};