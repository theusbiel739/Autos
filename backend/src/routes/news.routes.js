const { Router } = require('express');

const newsController = require('../controllers/newsController');

const publicNewsRoutes = Router();
const adminNewsRoutes = Router();

publicNewsRoutes.get('/', newsController.list);
publicNewsRoutes.get('/:newsId', newsController.show);

adminNewsRoutes.post('/sync', newsController.sync);

module.exports = {
  adminNewsRoutes,
  publicNewsRoutes
};
