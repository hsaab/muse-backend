let express = require("express");
let cors = require("cors");
let bodyParser = require('body-parser');
let db = require('./pool.js');
let spotify = require('./spotify.js');
let path = require('path');
let helmet = require('helmet');
let RateLimit = require('express-rate-limit');
var cron = require("node-cron");
var updateArtists = require("./spotify-helpers.js").updateArtists;

var app = express();

app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)

var limiter = new RateLimit({
  windowMs: 1000 * 60, // 1 minute
  max: 100, // limit each IP to 1 requests per windowMs
  delayMs: 0, // disable delaying - full speed until the max limit is reached
  message: `We're sorry! You have exceeded the number of requests allocated to your account. Please try again later!`
});

app.use(limiter);

app.use(helmet());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());
app.options('*', cors());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, HEAD, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/spotify', spotify(db));

cron.schedule("0 0 0 * * *", async function() {
  // PUT THE BELOW IN A HELPER
  try {
    let data = await db.query(`SELECT email, location FROM users`);
    let userInfo = await data.rows;
    userInfo.forEach(function(user) {
      updateArtists(user.email, user.location);
    });
  } catch(e) {
    console.log(e, "Error in recurring update of user artist info");
  }
//    IN A NEW FUNCTION
//      let userData = await db.query(`SELECT email, location, artists from users`);
//      userData.forEach(async function(data) {
//        let relevantConcerts = [];
//        data.artist.forEach(async function(artist) {
//           let concertInfo = await getSongkick(data.email, data.location, artist);
//           if(concertInfo.dates === within range) relevantConcerts.push(concertInfo);
//        })
//        if(relevantConcerts.length > 1) sendEmail(relevantConcerts);
//     })
//
//  For each artist once updated send request to Songkick looking for specific artists within 3 week time frame
//  If find any matches, store matches in an array
//  Once search is done, use array of concert objects to populate email
//  Send email
});

var port = process.env.PORT || 3001;
app.listen(port);

console.log("Listening on port " + port);
