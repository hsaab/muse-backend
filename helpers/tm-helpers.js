var bodyParser = require('body-parser');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var request = require('request-promise');
var moment = require('moment');

var tm_apiKey = process.env.TM_API_KEY;

var getConcerts = async function (artist, location) {
  try {
    let start = moment().format();
    let end = moment().add(3, 'weeks').format();
    var authOptions = {
      url: `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${tm_apiKey}&keyword=${artist}&city=${location}&startDateTime=${start}&endDateTime=${end}&sort=relevance,asc`,
      json: true
    };
    const data = await request.get(authOptions);
    if(data._embedded) {
      return data._embedded.events;
    } else {
      return false;
    }
  } catch(e) {
    console.log("Error getting events from Ticketmaster API", e);
  }
}

module.exports = { getConcerts };
