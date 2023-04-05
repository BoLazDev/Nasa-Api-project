const { 
    getPuctureOfTheDay,
    createTablePicuteOfTheDay, 
    listPhotosMarsRovers, 
    filterMarsPhotos, 
    getNearEarthObjects, 
    getAllPicutesOfTheDay 
} = require('../controllers/nasaController');
const filterMPSchema = require('../schemas/filterMarsPhotosSchema');

function nasaRoutes(fastify, options, done) {
    // Options for Nasa Picture of the day
    const nasaPictureOpts = {
        handler: getPuctureOfTheDay,
    };

    const filterMarsPhotosSchema = {
        schema: {
            body: filterMPSchema,
        },
        handler: filterMarsPhotos,
    };

    // Post Create table Picture of the day
    fastify.post('/createtable-picture', createTablePicuteOfTheDay);

    // Get all pictures from the day from db;
    fastify.get('/pictures-all', getAllPicutesOfTheDay);

    // Get Nasa Picture of the day
    fastify.get('/nasa', nasaPictureOpts);

    // Get Nasa Rovers Photos for random day
    fastify.get('/nasa-rovers/:date', listPhotosMarsRovers);

    // Post Nasa filtering with start date , end date, startid, endid
    fastify.post('/nasa-rovers-filter', filterMarsPhotosSchema);

    // Get Nasa Near Earth Objects
    fastify.post('/nasa-near-earth', getNearEarthObjects);

    done();
}

module.exports = nasaRoutes;