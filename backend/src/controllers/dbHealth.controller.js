const pool = require('../config/database');

async function check(req, res) {
  try {
    await pool.query('SELECT 1 AS ok');

    return res.status(200).json({
      status: 'ok',
      database: 'connected'
    });
  } catch (error) {
    console.error('Database health check failed:', {
      code: error.code,
      message: error.message,
      hostname: error.hostname,
      address: error.address,
      errno: error.errno,
      stack: error.stack
    });

    return res.status(503).json({
      status: 'error',
      database: 'unavailable'
    });
  }
}

module.exports = {
  check
};
