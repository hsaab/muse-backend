const express = require("express");
const bodyParser = require('body-parser');
const express = require('express'); // Express web server framework
const request = require('request'); // "Request" library
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const helpers = require("./spotify-helpers.js");

const client_id = process.env.SPOTIFY_CLIENTID; // Your client id
const client_secret = process.env.SPOTIFY_SECRET; // Your secret
const redirect_uri = process.env.SPOTIFY_REDIRECTURI; // Your redirect uri

const stateKey = 'spotify_auth_state';

const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(cookieParser());

module.exports = function(db) {

  router.get('/test', function(req, res) {
    let email = req.query.email || null;
    let location = req.query.location || null;
    db.query(`SELECT email, location FROM users WHERE email = $1 AND location = $2`, [email, location])
      .then((result) => {
        if(result.rowCount === 1) {
          res.json({ success: true, existing: true });
        } else {
          res.json({ success: true, existing: false });
        }
      })
      .catch((e) => {
        console.log("Error at test for Spotify", e);
        res.status(500).json({ success: false, e });
      })
  });

  router.get('/login', function(req, res) {
    let state = helpers.generateRandomString(16);
    res.cookie(stateKey, state);

    db.query(`INSERT INTO users (email, location, state) VALUES ($1, $2, $3)`,
    [req.query.email, req.query.location, state])
      .then(() => {
        let scope = 'user-top-read';
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
        console.log("Error at login for Spotify", e);
        res.status(500).json({ success: false });
      })
  });

  router.get('/callback', async function(req, res) {
    let code = req.query.code || null;
    let state = req.query.state || null;
    let storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
      res.redirect('/#' +
        querystring.stringify({
          error: 'state_mismatch'
        }));
    } else {
      res.clearCookie(stateKey);

      let tokens = await helpers.getToken(code);
      let artistData = await helpers.getArtists(tokens.access_token);

      db.query(`UPDATE users SET access_token = $1, refresh_token = $2, artists = $3 WHERE state = $4`,
        [tokens.access_token, tokens.refresh_token, artistData, state])
        .then(() => {
          res.redirect(`localhost:3000`); //need to change this to heroku app
        })
        .catch((e) => {
          console.log("Error at callback for Spotify login", e);
          res.status(500).json({ success: false });
        })
    }
  });

  router.get('/refresh', async function(req, res) {
    let email = req.query.email;
    let location = req.query.location;
    db.query(`SELECT refresh_token FROM users WHERE email = $1 AND location = $2`, [email, location])
      .then((result) => {
        let refresh_token = result.rows[0].refresh_token;
        let new_access_token = await helpers.getRefresh(refresh_token);
        let new_artist_data = await helpers.getArtists(new_access_token);
        
        db.query(`UPDATE users SET access_token = $1, artists = $2 WHERE email = $3 AND location = $4`,
          [new_access_token, new_artist_data, email, location])
      })
      .catch((e) => {
        console.log("Error grabbing refresh token and artist data", e);
        res.status(500).json({ success: false });
      })
  });

  return router;
}
