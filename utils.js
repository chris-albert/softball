const rp      = require('request-promise');
const cheerio = require('cheerio');
const _       = require('lodash');
const moment  = require('moment');
const ical    = require('ical-generator');

const schedulesUrl = 'http://www.sfsoftball.com/schedules/';

function htmlRequest(method, url, data) {
  return rp({
    uri   : url,
    method: method,
    form  : data,
    qs    : data,
    transform(body) {
      return cheerio.load(body);
    }
  });
}

function convertToGoogle(game) {
  return {
    'Subject'   : (game.visitor + ' vs ' + game.home),
    'Start Date': game.date.format('DD/MM/YYYY'),
    'Start Time': game.date.format('hh:mm a'),
    'End Date'  : game.date.format('DD/MM/YYYY'),
    'End Time'  : game.date.add(50,'minutes').format('hh:mm a'),
    'Location'  : game.venue
  }
}

function convertToCSV(data) {
  const header = _.keys(_.head(data));
  const rows = _.map(data,d => _.values(d))
  return [
    header.join(','),
    _.map(rows,row => _.map(row, c => "\"" + c.replace("\"","\"\"") + "\"").join(',')).join('\n')
  ].join('\n');
}

function convertToICal(data) {
  const iCalSchedule = ical({
    name: data.team
  });
  _.forEach(data.table, game => {
    iCalSchedule.createEvent({
      start   : game.date.toDate(),
      end     : game.date.add(50,'minutes').toDate(),
      summary : (game.visitor + ' vs ' + game.home),
      location: game.venue
    })
  });
  return iCalSchedule.toString();
}

function parseDate(date) {
  return moment(date, 'ddd MMM Do, YYYY - h:mma');
}


function getSchedule(seasonId, teamId) {
  return htmlRequest('GET',schedulesUrl,{
    seasonid: seasonId,
    teamid: teamId
  })
  .then($ => {
    return {
      team: $('#schedule_head > h2').text(),
      table: _.filter($('#schedule').find('tr').map((i, e) => {
        const el  = $(e).find('td');
        const row = el.map((i, e) => {
          return $(e).text();
        });
        if (row.length > 0) {
          return {
            division: row.get(0),
            round   : row.get(1),
            visitor : row.get(2),
            home    : row.get(3),
            date    : parseDate(row.get(4).replace(/\t/g, '').replace(/\n/g, '')),
            venue   : row.get(5)
          }
        }
        return {};
      }).toArray(),o => !_.isEmpty(o))
    }
  })
}

module.exports = {
  htmlRequest: htmlRequest,
  convertToGoogle: convertToGoogle,
  convertToCSV: convertToCSV,
  getSchedule: getSchedule,
  convertToICal: convertToICal
};
