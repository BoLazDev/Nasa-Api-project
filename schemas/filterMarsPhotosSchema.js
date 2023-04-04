const filterMPSchema = {
    type: 'object',
    properties: {
        startId: { type: 'integer' },
        endId: { type: 'integer' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' }
    },
    required: ['startId', 'endId', 'startDate', 'endDate']
};

module.exports = filterMPSchema;