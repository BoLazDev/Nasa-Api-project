/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('mars_camera', (table) => {
        table.increments('id').primary();
        table.string('name', 255).notNullable();
        table.string('full_name', 255).notNullable();
        table.integer('rover_id').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('mars_rovers', (table) => {
        table.increments('id').primary();
        table.string('name', 255).notNullable();
        table.timestamp('landing_date').defaultTo(knex.fn.now());
        table.timestamp('launch_date').defaultTo(knex.fn.now());
        table.string('status', 255).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('mars_photos', (table) => {
        table.increments('id').primary();
        table.integer('camera_id').notNullable();
        table.integer('rover_id').notNullable();
        table.string('img_src', 255).notNullable();
        table.datetime('earth_date').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.foreign('camera_id').references('id').inTable('mars_camera');
        table.foreign('rover_id').references('id').inTable('mars_rovers');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('mars_camera').dropTable('mars_rovers').dropTable('mars_photos');
};
