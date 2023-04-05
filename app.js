// Required modules/files
const fastify = require('fastify')({ logger: true });
const pg = require('pg');
const { migrate } = require('ley');
const dotenv = require('dotenv').config();
const PORT = process.env.PORT || 9000;
const client = require('./connection.js');
const qs = require('qs');

// Cors 
fastify.register(require('@fastify/cors'), {
  hook: 'preHandler',
  delegator: (req, callback) => {
    const corsOptions = {
      // This is NOT recommended for production as it enables reflection exploits
      origin: true
    };

    // do not include CORS headers for requests from localhost
    if (/^localhost$/m.test(req.headers.origin)) {
      corsOptions.origin = false
    }

    // callback expects two parameters: error and options
    callback(null, corsOptions)
  },
});

// Register Routes
fastify.register(require("./routes/nasaRoutes"));

fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

// Run the server!
const start = async () => {
    try {
      await fastify.listen({ port: PORT })
    } catch (err) {
      fastify.log.error(err)
      process.exit(1)
    }
  }
start();

//client.connect();