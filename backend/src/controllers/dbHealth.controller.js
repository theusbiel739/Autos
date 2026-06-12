const pool = require('../config/database');

async function check(req, res) {
  try {
    await pool.query('SELECT 1 AS ok');

    return res.status(200).json({
      status: 'ok',
      database: 'connected'
    });
  } catch (error) {
    console.error('Database health check failed:', error.code || error.message);

    return res.status(503).json({
      status: 'error',
      database: 'unavailable'
    });
  }
}

module.exports = {
  check
};
