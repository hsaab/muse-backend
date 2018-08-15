var express = require("express");
var bodyParser = require('body-parser');
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var helpers = require("./spotify-helpers.js");

var client_id = process.env.SPOTIFY_CLIENTID; // Your client id
var client_secret = process.env.SPOTIFY_SECRET; // Your secret
var redirect_uri = process.env.SPOTIFY_REDIRECTURI; // Your redirect uri

var stateKey = 'spotify_auth_state';

var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(cookieParser());

module.exports = function(db) {

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
    var state = helpers.generateRandomString(16);
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

  router.get('/callback', async function(req, res) {
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
      let tokens = await helpers.getToken(code);
      let artistData = await helpers.getArtists(tokens, state);
      db.query(`UPDATE users SET access_token = $1, refresh_token = $2, artists = $3 WHERE state = $4`,
        [tokens.access_token, tokens.refresh_token, artistData, state])
        .then(() => {
          res.redirect('localhost:3000/success');
        })
        .catch((e) => {
          console.log(e);
          res.status(500).json({ success: false });
        })
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
