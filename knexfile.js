module.exports = {
    development: {
        client: 'pg',
        connection: 'postgres://localhost/nasa_test',
        migrations: {
            directory: __dirname + '/migrations',
        },
    },
}