let express = require("express");
let bodyParser = require('body-parser');
let querystring = require('querystring');
let cookieParser = require('cookie-parser');
let tm_helper = require("../helpers/tm-helpers.js");
let muse_helper = require("../helpers/muse-helpers.js");
var spot_helper = require("../helpers/spotify-helpers.js");

async function resolveArtists(db) {
  try {
    let data = await db.query(`SELECT email, location FROM users`);
    let userInfo = await data.rows;
    userInfo.forEach(function(user) {
      spot_helper.updateArtists(user.email, user.location);
    });
  } catch(e) {
    console.log(e, "Error in recurring update of user artist info");
  }
}

async function resolveConcerts(db) {
  try {
    let data = await db.query(`SELECT artists, email, location FROM users`);
    let userInfo = await data.rows;
    userInfo.forEach(function(user) {

      user.artists.forEach((async function(artist, i) {
        setTimeout(async function() {
          let concert = await tm_helper.getConcerts(artist.name, user.location);
          if(concert) {
            // 1 - ADD ANOTHER TM API CALL HERE TO get the purchase link for tickets
            // 2 - EDIT OBJECT THAT WE ARE ADDING IN TO THE DB
            let add = await muse_helper.addConcerts(db, concert, user);
          }
        }, 1000 * i);
      }))
    })
  } catch(e) {
    console.log(e, "Error grabbing relevant concerts from Ticketmaster");
  }
}

// CREATE another

module.exports = { resolveArtists, resolveConcerts };
