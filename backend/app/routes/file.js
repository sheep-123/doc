module.exports = (app) => {
  const file = require('../controllers/file');

  var router = require('express').Router();

  router.get('/getfilelist', file.getFileList);

  router.post('/upload', file.upload);

  router.post('/gettaglist', file.getTagList);

  router.post('/getquerysearch', file.getQuerySearch);

  router.get('/memory', file.updateMemoryStatus);

  router.post('/edittag', file.updateFileTag);

  router.get('/deletefile', file.deleteFile);

  router.get('/getpolicy', file.getPolicy);

  router.get('/getofficial', file.getOfficial);

  router.get('/getbook', file.getBook);

  router.get('/gethandlebook', file.getHandleBook);

  router.get('/getreport', file.getReport);

  router.get('/getrepository', file.getRepository);

  router.get('/getscript', file.getScript);

  app.use('/file', router);
};
