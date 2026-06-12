function check(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'autos-api'
  });
}

module.exports = {
  check
};
