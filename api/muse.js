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
    userInfo.forEach(async function(user) {
      let reset = await muse_helper.resetConcerts(db, user);
      user.artists.forEach((async function(artist, i) {
        setTimeout(async function() {
          // For each artist in a user's profile, find if there are any upcoming concerts through TM
          let concert = await tm_helper.getConcerts(artist.name, user.location);

          // If there are concerts for a certain artists, get the details on those concert and add to the database
          if(concert) {
            concert.forEach((async function(id, x) {
              setTimeout(async function() {
                let details = await tm_helper.getDetails(id);
                let add = await muse_helper.addConcerts(db, details, user);
              }, 10000 * x);
            }))
          }
        }, 10000 * i);
      }))
    })
  } catch(e) {
    console.log(e, "Error grabbing relevant concerts from Ticketmaster");
  }
}

async function resolveEmail(db) {
  let data = await db.query(`SELECT concerts, email, location FROM users`);
  let userInfo = await data.rows;

  userInfo.forEach(function(user) {
    try {
      
    } catch(e) {
      db.query(`UPDATE users SET emailSent = false WHERE email = $1`, [user.email]);
      console.log("Trouble sending email", e);
    }
  });
}

module.exports = { resolveArtists, resolveConcerts, resolveEmail };
