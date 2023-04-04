const jwt = require('jsonwebtoken');
const checkUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        throw Error('No Token Provided')
    }
    const token = authHeader.split(' ')[1]
    try {
        jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
            if (err) {
                console.log(err);
                throw Error("Un Authenticated");
            }
            next();
        })
    } catch (error) {
        console.log("Check User error is " + authHeader)
        throw error;
    }
}

module.exports = { checkUser }