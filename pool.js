if (!process.env.DATABASE_URI) {
  console.error("DATABASE_URL environment variable missing. Did you run 'source env.sh'?");
  process.exit(1);
}

// Establish a connection to Postgres here using pg.Pool
var pg = require('pg');

var pool = new pg.Pool({
  connectionString: process.env.DATABASE_URI,
  ssl: true
})

if (!pool) {
  console.error('pg.Pool is not set up, edit app.js and setup the pool');
  process.exit(1);
}

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.log('Error running query', err);
  } else {
    console.log('Success, you are connected to Postgres');
  }
});

// Export 'pool' so other files can use Postgres
module.exports = pool;
