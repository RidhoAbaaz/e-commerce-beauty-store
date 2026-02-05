const jwt = require('jsonwebtoken');

const signToken = (payload) => {
    return jwt.sign({user_id: payload}, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { signToken, verifyToken };