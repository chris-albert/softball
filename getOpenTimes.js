var rp      = require('request-promise');
var cheerio = require('cheerio');
var _       = require('lodash');
var moment  = require('moment');

var gameTime   = moment.duration(1, 'hour');
var gamesStart = moment().hours(18).minutes(30).seconds(0).milliseconds(0);
var gamesEnd   = moment().hours(22).minutes(0).seconds(0).milliseconds(0);

function htmlRequest(method, url, data) {
  return rp({
    uri   : url,
    method: method,
    form  : data,
    transform(body) {
      return cheerio.load(body);
    }
  });
}

function getVenues() {
  return htmlRequest('GET', 'http://www.sfsoftball.com/venues/')
    .then(function ($) {
      return $('form[name=pickVenue] select option').map((i, e) => {
        return {
          'venueName': $(e).text(),
          'venueId'  : $(e).attr('value')
        };
      }).filter((i, el) => el.venueId != "");
    });
}

function getVenueGames(venueInfo) {
  return htmlRequest('POST', 'http://www.sfsoftball.com/venues/', {venueid: venueInfo.venueId})
    .then($ => {
      return $('#schedule').find('tr').map((i, e) => {
        var el  = $(e).find('td');
        var row = el.map((i, e) => {
          return $(e).text();
        });
        if (row.length > 0) {
          return {
            venue   : venueInfo,
            league  : row.get(0),
            division: row.get(1),
            game    : row.get(2),
            date    : row.get(3).replace(/\t/g, '').replace(/\n/g, '')
          }
        }
      }).toArray();
    });
}

function parseGames(games) {
  _.each(games, (game) => {
    game.parsedDate = parseDate(game.date);
  });
  return games;
}

function parseDate(date) {
  return moment(date, 'ddd MMM Do, YYYY at h:mma');
}

function findOpenVenues(games) {
  var days = _.groupBy(games, game => {
    return extractDate(game.parsedDate);
  });
  return _.filter(_.map(days, (day, date) => {
    var gaps = hasGaps(day, date);
    if (gaps) {
      return day;
    }
  }), d => !_.isUndefined(d));
}

function hasGaps(games, date) {
  //console.log(moment(date).format());
  //var startDate = addTimeToDate(date,gamesStart);
  //var endDate = addTimeToDate(date,gamesEnd);
  //console.log(startDate.format());
  //console.log(endDate.format());
  //console.log();
  //_.map(games,game => {
  //  var gameStart = game.parsedDate;
  //  var gameEnd = moment(game.parsedDate).add(gameTime);
  //console.log("Game:");
  //console.log(gameStart.format());
  //console.log(gameEnd.format());
  //});
  //console.log();
  return games.length < 3;
}

function extractDate(date) {
  return moment()
    .year(date.year())
    .month(date.month())
    .dayOfYear(date.dayOfYear())
    .hour(0)
    .minute(0)
    .second(0)
    .millisecond(0)
    .format();
}

function getOpenGames(venueInfo) {
  return getVenueGames(venueInfo)
    .then(parseGames)
    .then(findOpenVenues)
    .then(openGames => {
      if (!_.isEmpty(openGames)) {
        return _.map(openGames, games => {
          var game = _.head(games);
          return {
            venue    : game.venue,
            date     : extractDate(moment(game.parsedDate)),
            gameTimes: _.map(games, game => game.parsedDate.format()),
            games    : games
          };
        });
      }
    })
    .then(games => {
      return _.filter(games,g => !_.isUndefined(g));
    });
}

function prettyPrint(openVenues) {
  var a = _.groupBy(openVenues,v => v.date);
  var dates = _.keys(a).sort();
  _.each(dates,date => {
    var v = a[date];
    console.log(date);
    _.each(v,venue => {
      console.log('Field: ' + venue.venue.venueName);
      console.log('Games: ' + venue.gameTimes);
    });
    console.log();
    //console.log("Field: " + v.venue.venueName);
  })
}

getVenues()
  .then(venues => {
    return Promise.all(_.map(venues, getOpenGames));
  })
  .then(_.flatten)
  .then(prettyPrint);

//getOpenGames({venueId: 9});