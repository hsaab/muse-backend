if (process.env.NODE_ENV !== "production") {
  const result = require("dotenv").config();
  if (result.error) {
    console.log(result.error);
  }
}

let express = require("express");
let cors = require("cors");
let bodyParser = require("body-parser");
let db = require("./pool.js");
let spotify = require("./api/spotify.js");
let muse = require("./api/muse.js");
let tm = require("./api/ticketmaster.js");
let path = require("path");
let helmet = require("helmet");
let RateLimit = require("express-rate-limit");

var app = express();

app.enable("trust proxy"); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)

var limiter = new RateLimit({
  windowMs: 1000 * 60, // 1 minute
  max: 100, // limit each IP to 1 requests per windowMs
  delayMs: 0, // disable delaying - full speed until the max limit is reached
  message: `We're sorry! You have exceeded the number of requests allocated to your account. Please try again later!`
});

app.use(limiter);

app.use(helmet());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.options("*", cors());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, PUT, POST, DELETE, HEAD, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use("/spotify", spotify(db));
app.get("/sendemail", async function(req, res) {
  await muse.resolveEmail(db);
  res.json("ok");
});

var port = process.env.PORT || 3001;
app.listen(port);

console.log("Listening on port " + port);
