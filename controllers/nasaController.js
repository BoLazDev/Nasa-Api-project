const axios = require('axios');
const pool = require('../connection.js');

// route creating the table only for testing
const createTablePicuteOfTheDay = async(request, reply) => {
    const query = `
        CREATE TABLE picture_of_the_day (id SERIAL PRIMARY KEY, data JSONB)
    `;
    //console.log("QUERY :", query);

    pool.query(query, (err, result) => {
        if(err) {
            throw new Error(err);
        }else {
            console.log("Successfully created table");
            reply.send("Done!");
        }
    });
   
};

const getPuctureOfTheDay = async (request, reply) => {
    const nasaUrl = `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`;
          
    try {
        // Send request to NASA API
        const response = await axios.get(nasaUrl);
        const data = response.data;
        //console.log("DATA :", data);

        // Save redacted data in the database
        let { date, title, explanation, hdurl, url } = data;
        date = '2023-06-32'; //test for different dates
        const dataToInsert = {
            [date]: {
              "title": title,
              "explanation": explanation,
              "hdurl": hdurl,
              "url": url
            }
        };
        //console.log("DATA TO INSERT :", dataToInsert);

        // Retrieve the existing data from the table
        const query = {
            text: 'SELECT data FROM picture_of_the_day WHERE id = $1',
            values: [1],
        };

        const result = await pool.query(query);

        let existingData = {};

        if (result.rows.length > 0) {
            existingData = result.rows[0].data;
            //console.log("existingData :", existingData);
        }
        // Using the spread operatior to create new object with the existing and the new data
        const mergedData = {
            ...existingData,
            ...dataToInsert
        };
        const insertQuery = {
            text: 'INSERT INTO picture_of_the_day (id, data) VALUES($1, $2) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data',
            values: [1, mergedData],
        };

        await pool.query(insertQuery);

        // Return received data from NASA API as response
        reply.send(data);
    } catch (err) {
        console.error(err);
        reply.status(500).send({ message: 'Internal Server Error' });
    }
};

const insertCamera = async (camera, roverId) => {
    const query = {
        text: 'INSERT INTO mars_camera(name, full_name, rover_id) VALUES($1, $2, $3) RETURNING id',
        values: [camera.name, camera.full_name, roverId]
    };
    const result = await pool.query(query);
    return result.rows[0].id;
};

const insertRover = async (rover) => {
    const query = {
        text: 'INSERT INTO mars_rovers(name, landing_date, launch_date, status) VALUES($1, $2, $3, $4) RETURNING id',
        values: [rover.name, rover.landing_date, rover.launch_date, rover.status]
    };
    const result = await pool.query(query);
    return result.rows[0].id;
};

const insertPhoto = async (photo, cameraId, roverId) => {
    const query = {
        text: 'INSERT INTO mars_photos(camera_id, rover_id, img_src, earth_date) VALUES($1, $2, $3, $4) RETURNING id',
        values: [cameraId, roverId, photo.img_src, photo.earth_date]
    };
    const result = await pool.query(query);
    return result.rows[0].id;
};

const getPhotos = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM mars_photos');
        return result.rows;
    }catch(err) {
        throw new Error('Error, while fetching data from the db!');
    } finally {
        client.release();
    }
};

const listPhotosMarsRovers = async(request, reply) => {
    const {year, month, day } = request.params;
    let randomDate = `${year}-${month}-${day}`; 
    // console.log("REQ PARAMS :", request.params);
    // console.log("randomDate :", randomDate);
    const nasaUrl = `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?earth_date=${randomDate}&api_key=${process.env.NASA_API_KEY}`;

    try {
        // Send request to NASA API
        const response = await axios.get(nasaUrl);
        const data = response.data;
        console.log("DATA :", data.photos.length);
        const promises = [];
        for (const photo of data?.photos) {
            // console.log('Element Camera :', photo.camera);
            // console.log('Element Rover :', photo.rover);
            const cameraPromise = insertCamera(photo.camera, photo.rover.id);
            const roverPromise = insertRover(photo.rover);
            promises.push(cameraPromise, roverPromise);
        }
        const results = await Promise.all(promises);
        // Filter out Camera id and Rover Id;
        const { cameraIds, roverIds } = results.reduce((acc, cur, i) => {
            if (i % 2 === 0) {
              acc.cameraIds.push(cur);
            } else {
              acc.roverIds.push(cur);
            }
            return acc;
        }, { cameraIds: [], roverIds: [] });
        //console.log("Cam id:", cameraIds);
        //console.log("Rov id:", roverIds);
        for (let i = 0; i < data?.photos.length; i++) {
            const photo = data.photos[i];
            const cameraId = cameraIds[i];
            const roverId = roverIds[i];
            const photoId = await insertPhoto(photo, cameraId, roverId);
            //console.log('Saved photo with id:', photoId);
        }

        // Fetch all photos from the database from the defined function above
        const savedPhotos = await getPhotos();
        // Send the saved photos as a response
        reply.send(savedPhotos);
    }catch(err) {
        console.error(err);
        reply.status(500).send({ message: 'Internal Server Error' });
    }
};

const getFilteredPhotos = async (startId, endId, startDate, endDate) => {
    try {
        // Build the SQL query string based on the parameters
        let query = `
            SELECT MP.img_src, 
            MP.earth_date, 
            MC.name, MC.full_name , 
            MR.landing_date, MR.launch_date, MR.status
            FROM mars_photos MP
            JOIN mars_camera MC ON MC.id = MP.camera_id
            JOIN mars_rovers MR ON MR.id = MP.rover_id
            WHERE 1 = 1
        `;
        if (startId !== undefined) {
            query += `AND MP.id >= ${startId}`;
        }
        if (endId !== undefined) {
            query += ` AND MP.id <= ${endId}`;
        }
        if (startDate !== undefined) {
            query += ` AND MP.earth_date >= '${startDate}'`;
        }
        if (endDate !== undefined) {
            query += ` AND MP.earth_date <= '${endDate}'`;
        }
        //console.log("QUERY :", query);
        // Return the results
        const result = await pool.query(query);
        console.log("result :", result);
        if(!result || result.rows.length === 0) {
            throw new Error('Could not find any results');
        }
        return result.rows;
    } catch (err) {
        console.log('Error:', err);
        throw new Error(err.message);
    }
};
  
  

// Filter the date by Date Range and Id:
const filterMarsPhotos = async (request, reply) => {
    //console.log("REQUEST :", request);
    //console.log('Request Body:', request.body);
    const { startId, endId, startDate, endDate } = request.body;
    try {
        // Fetch saved photos from the database based on filters
        const savedPhotos = await getFilteredPhotos(startId, endId, startDate, endDate);
        //console.log("Saved Photos :", savedPhotos);
        // Send the saved photos as a response
        reply.send(savedPhotos);
    } catch(err) {
        console.error(err);
        reply.status(500).send({ message: 'Internal Server Error' });
    }
};

const getNearEarthObjects = async (request, reply) => {
    // startDate and endDate are comming from the body, we can also do this by sending them as an query string and get the values from the request.params
    let { startDate, endDate } = request.body;
    startDate = startDate.substring(0, 10);
    endDate = endDate.substring(0, 10);
    // console.log('Start Date :', startDate);
    // console.log('End Date :', endDate);

    // Implement logic for checking the date range between startDate and endDate
    const checkStartDate = new Date(startDate);
    const checkEndDate = new Date(endDate);

    const diffInMs = Math.abs(checkStartDate.getTime() - checkEndDate.getTime());
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    //console.log("Diff in days :", diffInDays);
    if (diffInDays !== 7) {
        let result = {
            error: 'Sorry the date range between startDate and endDate is incorrect. Please provide one week range!',
        }
        return reply.send(result);
    }
    const nasaUrl = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${process.env.NASA_API_KEY}`;
    try {
        // Send request to NASA API
        const response = await axios.get(nasaUrl);
        const data = response.data.near_earth_objects;
        console.log("Keys :", Object.keys(data));
        // Loop trough the data to create new object with only the data we need to insert in the db.
        const dataToInsert = Object.keys(data).reduce((acc, date) => {
            acc[date] = data[date].map(object => ({
                id: object.id,
                is_potentially_hazardous_asteroid: object.is_potentially_hazardous_asteroid,
                name: object.name,
                nasa_jpl_url: object.nasa_jpl_url,
                neo_reference_id: object.neo_reference_id,
            }));
            return acc;
        }, {});
        //console.log("Redacted data :", dataToInsert);
        const query = {
            text: 'SELECT data FROM near_earth_objects WHERE id = $1',
            values: [1],
        };
        const result = await pool.query(query);
        let existingData = {};
        if (result.rows.length > 0) {
            existingData = result.rows[0].data;
        }
        const mergedData = Object.assign({}, existingData, dataToInsert);
        let insertQuery = '';
        let values = [];
        // If there is no data insert else update
        if (result.rows.length === 0) {
            insertQuery = 'INSERT INTO near_earth_objects (id, data) VALUES($1, $2)';
            values = [1, mergedData];
        } else {
            insertQuery = 'UPDATE near_earth_objects SET data = $2 WHERE id = $1';
            values = [1, mergedData];
        }
        await pool.query(insertQuery, values);
        // Send the request data from the Api
        reply.send(response.data);
    } catch (err) {
        console.error(err);
        reply.status(500).send({ message: 'Internal Server Error' });
    }
};

module.exports = {
    createTablePicuteOfTheDay,
    getPuctureOfTheDay,
    listPhotosMarsRovers,
    filterMarsPhotos,
    getNearEarthObjects,
}