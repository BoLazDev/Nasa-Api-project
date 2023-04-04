const postgres = require('postgres');

const sql = postgres(process.env.DB_ROUTE, {
    host: process.env.DB_HOST, // Postgres ip address[s] or domain name[s]
    port: process.env.DB_PORT, // Postgres server port[s]
    database: process.env.DB_NAME, // Name of database to connect to
    user: process.env.DB_USER, // Username of database user
    password: process.env.DB_PASSWORD, // Password of database user
});

module.exports = sql;