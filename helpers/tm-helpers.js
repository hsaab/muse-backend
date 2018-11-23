var bodyParser = require('body-parser');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var request = require('request-promise');
var moment = require('moment');

var getConcerts = async function(artist, location) {
  try {
    let start = moment().format();
    let end = moment().add(3, 'weeks').format();
    console.log(process.env.TM_API_KEY);
    var authOptions = {
      url: `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${process.env.TM_API_KEY}&city=${location}&keyword=${artist}&startDateTime=${start}&endDateTime=${end}&sort=relevance,asc`,
      json: true
    };
    console.log("1");
    const data = await request.get(authOptions);
    console.log("2");
    if(data._embedded) {
      console.log("3");
      let eventInfo = data._embedded.events.map(function(each) {
        let obj = Object.assign({}, { id: each.id, artist });
        return obj;
      })
      console.log("4");
      return eventInfo;
    } else {
      return false;
    }
  } catch(e) {
    console.log("Error getting events from Ticketmaster API", e);
  }
}

var getDetails = async function(concert) {
  try {
    var authOptions = {
      url: `https://app.ticketmaster.com/discovery/v2/events/${concert.id}.json?apikey=${process.env.TM_API_KEY}`,
      json: true
    };
    const data = await request.get(authOptions);
    let detailObj = {
      artist: concert.artist,
      id: data.id,
      name: data.name,
      url: data.url,
      image: data.images ? data.images[0].url : null,
      dateTime: data.dates ? moment(data.dates.start.dateTime).utcOffset(-8) : null,
      priceRange: {
        min: data.priceRanges ? data.priceRanges[0].min : null,
        max: data.priceRanges ? data.priceRanges[0].max : null,
      }
    };
    return detailObj;
  } catch(e) {
    console.log("Error getting concert details from Ticketmaster", e);
  }
}

module.exports = { getConcerts, getDetails };
