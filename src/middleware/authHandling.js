const { verifyToken } = require("../helper/auth");
const Boom = require('@hapi/boom');

const authHandler = {
    name: 'auth-handler',
    register: async (server) => {
        server.ext('onRequest', (req, h) => {
            const tokenHeader = req.headers.authorization;
            if(!tokenHeader) return h.continue;

            const token = tokenHeader.split(' ')[1];
            if(!token) return h.continue;

            try {
                const decode = verifyToken(token);
                req.auth = decode;
                return h.continue;
            } catch (error) {
                throw Boom.unauthorized("token not found");
            }
        })
    }
}

module.exports = authHandler;