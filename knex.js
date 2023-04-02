// Ley was not working for me so i used this documentation for the migrations https://knexjs.org/guide/schema-builder.html
let config = require('./knexfile');
module.expots = require('knex')(config);