const _       = require('lodash');
const utils   = require('./utils');

const seasonId = 274;
const teamId = 6263;

utils.getSchedule(seasonId,teamId)
  .then(d => _.map(d.table,utils.convertToGoogle))
  .then(utils.convertToCSV)
  .then(console.log)
  .catch(console.error);


