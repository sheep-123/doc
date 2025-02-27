module.exports = (app) => {
  const user = require('../controllers/user');

  const router = require('express').Router();

  router.post('/login', user.login);
  router.post('/repassword', user.repassword);

  app.use('/user', router);
};
