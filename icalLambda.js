const _       = require('lodash');
const utils   = require('./utils');
const lambda  = require('./lambda');

module.exports = lambda(event => {
    return utils.getSchedule(_.get(event,'seasonId'), _.get(event,'teamId'))
      .then(utils.convertToICal)
  });

