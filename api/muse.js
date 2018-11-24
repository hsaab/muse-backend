let express = require("express");
let bodyParser = require('body-parser');
let querystring = require('querystring');
let cookieParser = require('cookie-parser');
let tm_helper = require("../helpers/tm-helpers.js");
let muse_helper = require("../helpers/muse-helpers.js");
let spot_helper = require("../helpers/spotify-helpers.js");
let email_helper = require("../helpers/email-helpers.js");
let moment = require("moment");

async function resolveArtists(db) {
  try {
    let data = await db.query(`SELECT email, location FROM users`);
    let userInfo = await data.rows;
    userInfo.forEach(function(user) {
      spot_helper.updateArtists(user.email, user.location);
    });
    console.log("Done resolving artists");
  } catch(e) {
    console.log(e, "Error in recurring update of user artist info");
  }
}

async function resolveConcerts(db) {
  try {
    let data = await db.query(`SELECT artists, email, location FROM users`);
    let userInfo = await data.rows;
    userInfo.forEach(async function(user) {
      await muse_helper.resetConcerts(db, user);
      user.artists.forEach((async function(artist, i) {
        setTimeout(async function() {
          // For each artist in a user's profile, find if there are any upcoming concerts through TM
          let concert = await tm_helper.getConcerts(artist.name, user.location);
          // If there are concerts for a certain artists, get the details on those concert and add to the database
          if(concert) {
            console.log(concert);
            concert.forEach((async function(each, x) {
              let details = await tm_helper.getDetails(each);
              console.log(details);
              await muse_helper.addConcerts(db, details, user);
            }))
          }
        }, 10000 * i);
      }))
    });
  } catch(e) {
    console.log(e, "Error grabbing relevant concerts from Ticketmaster");
  }
}

async function resolveEmail(db) {
  let data = await db.query(`SELECT concerts, name, email, location FROM users`);
  let userInfo = await data.rows;
  userInfo.forEach(async function(user) {
    if(user.concerts && user.concerts.length > 0) {
      try {
        user.concerts.forEach(function(concert) {
          concert.dateTime = moment(concert.dateTime).format("dddd, MMM Do, h:mm a");
          return concert;
        });
        await email_helper.send('concerts', user);
        db.query(`UPDATE users SET emailSent = true WHERE email = $1`, [user.email]);
        console.log("Done resolving email to ", user.email);
      } catch(e) {
        db.query(`UPDATE users SET emailSent = false WHERE email = $1`, [user.email]);
        console.log("Trouble sending email", e);
      }
    }
  });
}

module.exports = { resolveArtists, resolveConcerts, resolveEmail };
