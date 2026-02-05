const ClientError = require("../exceptions/ClientError");

const errorHandler = {
    name: 'error-handler',
    register: async (server) => {
        server.ext("onPreResponse", (request, h) => {
        const response = request.response;
        if (response instanceof ClientError) {
            const newResponse = h.response({
                status: "fail",
                message: response.message,
            })
            newResponse.code(response.statusCode);
            return newResponse;
        }
        if (response.isBoom) {
            const newResponse = h.response({
                status: "fail",
                message: response.output.payload.message,
            })
            newResponse.code(response.output.statusCode);
            return newResponse;
        }
        return h.continue;
        });
    }
}

module.exports = errorHandler;