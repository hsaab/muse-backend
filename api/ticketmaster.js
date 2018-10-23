let express = require("express");
let bodyParser = require('body-parser');
let querystring = require('querystring');
let cookieParser = require('cookie-parser');
let tm_helpers = require("../helpers/tm-helpers.js");

let router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(cookieParser());

module.exports = function() {

  app.get('/ticketmaster', async function(req, res) {
    let concerts = await tm_helpers.getConcerts();
  });

}
