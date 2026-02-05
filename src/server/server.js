const Hapi = require('@hapi/hapi');
const routes = require('./routes');
const authHandler = require('../middleware/authHandling');
const errorHandler = require('../middleware/errorHandling');
require("dotenv").config();

const init = async () => {
    const server = Hapi.Server({
        port: process.env.NODE_ENV !== "production" ? 5000 : process.env.PORT,
        host: process.env.NODE_ENV !== "production" ? "localhost" : "0.0.0.0",
        routes: {
            cors: {
                origin: ["*"]
            }
        }
    });

    await server.register(authHandler);
    server.route(routes);
    await server.register(errorHandler);

    await server.start();
    console.log(`listening server on ${server.info.uri}`);
};

init();