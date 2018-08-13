var express = require("express");
var bodyParser = require('body-parser');
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = process.env.SPOTIFY_CLIENTID; // Your client id
var client_secret = process.env.SPOTIFY_SECRET; // Your secret
var redirect_uri = process.env.SPOTIFY_REDIRECTURI; // Your redirect uri

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

module.exports = function(db) {

  router.get('/hello', function(req, res) {
    res.send("hello");
  });

  router.get('/yo', function(req, res) {
    res.send("yoyo");
  });

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
    console.log('beginning of callback HERE');
    if (state === null || state !== storedState) {
      res.redirect('/#' +
        querystring.stringify({
          error: 'state_mismatch'
        }));
        console.log('state mismatch');
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
      console.log('before sending post to get data');
      request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {

          var access_token = body.access_token;
          var refresh_token = body.refresh_token;

          var options = {
            url: 'https://api.spotify.com/v1/me/top/artists',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
          };
          console.log('inside post to get auth to grab data');
          // use the access token to access the Spotify Web API
          request.get(options, function(error, response, body) {
            res.json(response, body, error);
            console.log('getting spotify data', body, response);
            //@@@@@@@@@ HERE -- add access_token, refresh_token, email, location, top 20 artist data to DB
          });
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
