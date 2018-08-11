var express = require("express");
var bodyParser = require('body-parser');
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = 'CLIENT_ID'; // Your client id
var client_secret = 'CLIENT_SECRET'; // Your secret
var redirect_uri = 'REDIRECT_URI'; // Your redirect uri

var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(cors());
router.use(cookieParser());

module.exports = function(db){
// A Enter user info into db and logs in spotify
// 1 - Validate email and location entries
// 2 - GET /authorize & add the following as queries,
//      1. need clientid,
//      2. secret
//      3. redirecturi
//      4. state
//      5. scope [user-top-read]

// B  Get Spotify Code
// 1 - GET /callback
// 2 - If user authorized then code will be there as a query param, if not then error will exist

// C If user authorized, Get Spotify token
// 1 - POST /api/token & add the following in the body
//      1. grant type ("authorization_code")
//      2. code
//      3. same redirect uri as above
//      4. Header param Authorization: Basic *<base64 encoded client_id:client_secret>*
// 2 - Rout will return access_token, expires_in, and refresh_token

// D Use the access_token to access the data
// 1 - Check if access_token has expired if SO then refresh
//      1. POST /api/token and will contain --
//      1a. grant type (refresh token)
//      1b. refresh token (from earlier)
//      1c. header Authorization: Basic <base64 encoded client_id:client_secret>
// 1 - Route for personalization endpoint

// 2-PART Function that takes token and checks for top 5 artist

  router.get('hello', function(req, res) {
    res.send("hello");
  })

  router.get('/login', function(req, res) {

    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scope = 'user-top-read';
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      }));
  });

  router.get('/callback', function(req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
      res.redirect('/#' +
        querystring.stringify({
          error: 'state_mismatch'
        }));
    } else {
      res.clearCookie(stateKey);
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

      request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {

          var access_token = body.access_token,
              refresh_token = body.refresh_token;

          var options = {
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
          };

          // use the access token to access the Spotify Web API
          request.get(options, function(error, response, body) {
            console.log(body);
          });

          // we can also pass the token to the browser to make requests from there
          res.redirect('/#' +
            querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token
            }));
        } else {
          res.redirect('/#' +
            querystring.stringify({
              error: 'invalid_token'
            }));
        }
      });
    }
  });

  router.get('/refresh_token', function(req, res) {

    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        res.send({
          'access_token': access_token
        });
      }
    });
  });

  return router;
}
