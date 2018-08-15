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

  router.get('/yo', function(req, res) {
    res.send("yoyo");
  });

  router.get('/test', function(req, res) {
    var email = req.query.email || null;
    var location = req.query.location || null;
    db.query(`SELECT email, location FROM users WHERE email = $1 AND location = $2`, [email, location])
      .then((result) => {
        if(result.rowCount === 1) {
          res.json({ success: true, existing: true });
        } else {
          res.json({ success: true, existing: false });
        }
      })
      .catch((e) => {
        res.status(500).json({ success: false, e });
      })
  });

  router.get('/login', function(req, res) {
    var state = generateRandomString(16);
    res.cookie(stateKey, state);
    db.query(`INSERT INTO users (email, location, state) VALUES ($1, $2, $3)`,
    [req.query.email, req.query.location, state])
      .then(() => {
        var scope = 'user-top-read';
        res.redirect('https://accounts.spotify.com/authorize?' +
          querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
          }));
      })
      .catch((e) => {
        console.log(e);
        res.status(500).json({ success: false });
      })
  });

  router.get('/callback', function(req, res) {
    // your application requests refresh and access tokens
    // after checking the state parameter
    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;
    console.log(req.cookies);
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

          var access_token = body.access_token;
          var refresh_token = body.refresh_token;

          var options = {
            url: 'https://api.spotify.com/v1/me/top/artists',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
          };
          // use the access token to access the Spotify Web API
          request.get(options, function(error, response, body) {
            db.query(`INSERT INTO users (access_token, refresh_token, artists) VALUES($1, $2, $3)
            WHERE state = $4`, [access_token, refresh_token, body.items, state])
              .then(() => {
                res.redirect('https://muse-hs.herokuapp.com/');
              })
              .catch((e) => {
                res.status(500).json({ success: false });
              })
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
        //@@@@@@@@@ HERE -- add access_token, refresh_token
        var access_token = body.access_token;
        res.send({
          'access_token': access_token
        });
      }
    });
  });

  return router;
}
