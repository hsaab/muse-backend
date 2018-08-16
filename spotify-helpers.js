var bodyParser = require('body-parser');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var request = require('request-promise');

var client_id = process.env.SPOTIFY_CLIENTID; // Your client id
var client_secret = process.env.SPOTIFY_SECRET; // Your secret
var redirect_uri = process.env.SPOTIFY_REDIRECTURI; // Your redirect uri

var stateKey = 'spotify_auth_state';

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var getToken = async function(code) {
  try {
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };
    const data = await request.post(authOptions);
    return data;
  } catch (e) {
    console.log('Error getting token', e);
  }
}

var getRefresh = async function(refresh_token) {
  try {
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };

    const data = await request.post(authOptions);
    return data;
  } catch (error) {
    console.log("Error getting refresh_token", error);
  }
}

var getArtists = async function(access_token) {
  try {
    var options = {
      url: 'https://api.spotify.com/v1/me/top/artists',
      headers: { 'Authorization': 'Bearer ' + access_token },
      json: true
    };
    const data = await request.get(options);
    return JSON.stringify(data.items);
  } catch (e) {
    console.log("Error getting artists", e);
  }
}

var grabToken = async function(db) {
  try {
    let result = await db.query(`SELECT refresh_token FROM users WHERE email = $1 AND location = $2`, [email, location]);
    console.log(result);
    return result.rows[0].refresh_token;
  } catch(error) {
    console.log("Error grabbing token", error);
  }
}

module.exports = { generateRandomString, getToken, getArtists, getRefresh, grabToken };
