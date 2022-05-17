
const jsonwebtoken = require('jsonwebtoken');

async function isValidJwt(token) {
    jsonwebtoken.verify(token, process.env.JWT_SECRET, function (err, decoded) {
        if (err) {
            return false;
        } else {
            return true;
        }
    })
}

function getLocalTime() {
    return new Date().toLocaleString('en-US', { hour12: false, hour: '2-digit', minute: 'numeric', second: '2-digit', year: 'numeric', month: '2-digit', 'day': 'numeric' });
}

module.exports = {
    isValidJwt,
    getLocalTime
}