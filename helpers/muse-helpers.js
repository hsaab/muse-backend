async function addConcerts(db, concert, user) {
  let concertJSON = JSON.stringify(concert);
  try {
    db.query(`UPDATE users
              SET concerts = concerts::jsonb || $1::jsonb
              WHERE email = $2`, [concertJSON, user.email]) //Adds each set of concerts as an array within one big array
  } catch(e) {
    console.log("Error adding concert in to DB", e);
  }
}

module.exports = { addConcerts };
