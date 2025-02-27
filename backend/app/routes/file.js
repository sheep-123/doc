module.exports = (app) => {
  const file = require('../controllers/file');
  const auth = require('../middleware/auth');

  var router = require('express').Router();

  router.get('/getfilelist', auth.verifyToken, file.getFileList);

  router.post('/upload', file.upload);

  router.post('/gettaglist', auth.verifyToken, file.getTagList);

  router.post('/getquerysearch', auth.verifyToken, file.getQuerySearch);

  router.get('/memory', auth.verifyToken, file.updateMemoryStatus);

  router.post('/edittag', auth.verifyToken, file.updateFileTag);

  router.get('/deletefile', auth.verifyToken, file.deleteFile);

  router.get('/getpolicy', auth.verifyToken, file.getPolicy);

  router.get('/getofficial', auth.verifyToken, file.getOfficial);

  router.get('/getbook', auth.verifyToken, file.getBook);

  router.get('/gethandlebook', auth.verifyToken, file.getHandleBook);

  router.get('/getreport', auth.verifyToken, file.getReport);

  router.get('/getrepository', auth.verifyToken, file.getRepository);

  router.get('/getscript', auth.verifyToken, file.getScript);

  app.use('/file', router);
};
