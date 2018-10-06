var bodyParser = require('body-parser');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var request = require('request-promise');
var moment = require('moment');

var tm_apiKey = process.env.TM_API_KEY;

var getConcerts = async function(artist, location) {
  try {
    let start = moment().format();
    let end = moment().add(3, 'weeks').format();
    var authOptions = {
      url: `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${tm_apiKey}&keyword=${artist}&startDateTime=${start}&endDateTime=${end}&sort=relevance,asc`,
      json: true
    };
    //&city=${location}
    const data = await request.get(authOptions);
    if(data._embedded) {
      let eventInfo = data._embedded.events.map(function(each) {
        let obj = Object.assign({}, { id: each.id, artist });
        return obj;
      })
      return eventInfo;
    } else {
      return false;
    }
  } catch(e) {
    console.log("Error getting events from Ticketmaster API", e);
  }
}

var getDetails = async function(concert) {
  var authOptions = {
    url: `https://app.ticketmaster.com/discovery/v2/events/${concert.id}.json?apikey=${tm_apiKey}`,
    json: true
  };
  const data = await request.get(authOptions);
  let detailObj = {
    artist: concert.artist,
    id: data.id,
    name: data.name,
    url: data.url,
    image: data.images ? data.images[0].url : null,
    dateTime: data.dates ? data.dates.start.dateTime : null,
    priceRange: {
      min: data.priceRanges ? data.priceRanges[0].min : null,
      max: data.priceRanges ? data.priceRanges[0].max : null,
    }
  };
  return detailObj;
}

module.exports = { getConcerts, getDetails };
