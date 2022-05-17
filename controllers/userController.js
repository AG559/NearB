const { User } = require("../models/user");
const getAlluser = async (req, res) => {
    var users = await User.find();
    users.forEach((user) => {
        user.password = undefined;
        return user;
    })
    res.status(200).json({ users });
}

// User DB watching
User.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', (change) => {
    // io.emit('userChange', change.fullDocument);
})

module.exports = {
    getAlluser
}
