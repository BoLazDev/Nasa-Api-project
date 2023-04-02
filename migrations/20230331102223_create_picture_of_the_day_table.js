/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('picture_of_the_day', (table) => {
        table.increments();
        table.jsonb('data');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex, Promise) {
   return knex.schema.dropTable('picture_of_the_day');
};
