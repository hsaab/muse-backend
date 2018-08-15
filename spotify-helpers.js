var bodyParser = require('body-parser');
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

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
    let result = await request.post(authOptions);
    let data = await result.body;
    return data;
  } catch (e) {
    console.log('getting token error', e);
  }
}

var getArtists = async function(tokens, state) {
  var options = {
    url: 'https://api.spotify.com/v1/me/top/artists',
    headers: { 'Authorization': 'Bearer ' + tokens.access_token },
    json: true
  };
  let result = await request.get(options);
  let data = await JSON.stringify(result.body.items);
  return data;
}

module.exports = { generateRandomString, getToken, getArtists };
