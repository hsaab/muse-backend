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

async function resetConcerts(db, user) {
  try {
    db.query(`UPDATE users SET concerts = '[]' WHERE email = $1`, [user.email]);
  } catch(e) {
    console.log("Error reseting concerts in DB", e);
  }
}

module.exports = { addConcerts, resetConcerts };
