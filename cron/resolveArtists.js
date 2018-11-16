if (process.env.NODE_ENV !== 'production') {
  const result = require("dotenv").config();
  if (result.error) {
    console.log(result.error);
  }
}

let muse = require('../api/muse.js');
let db = require('../pool.js');

muse.resolveArtists(db);
