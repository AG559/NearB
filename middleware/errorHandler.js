const errorHandler = (err, req, res, next) => {
    if (err) {
        console.log("Error is Happening " + err)
        return res.status(400).json({ "error": err.message });
    }
}

module.exports = {
    errorHandler
};