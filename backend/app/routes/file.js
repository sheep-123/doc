module.exports = (app) => {
  const file = require('../controllers/file');
  const auth = require('../middleware/auth');

  var router = require('express').Router();

  // 文件管理路由
  router.get('/getfilelist', auth.verifyToken, file.getFileList);
  router.post('/upload', file.upload);
  router.post('/gettaglist', auth.verifyToken, file.getTagList);
  router.post('/getquerysearch', auth.verifyToken, file.getQuerySearch);
  router.get('/memory', auth.verifyToken, file.updateMemoryStatus);
  router.post('/edittag', auth.verifyToken, file.updateFileTag);
  router.get('/deletefile', auth.verifyToken, file.deleteFile);

  // 文件类型查询路由
  router.get('/getpolicy', auth.verifyToken, file.getPolicy);
  router.get('/getofficial', auth.verifyToken, file.getOfficial);
  router.get('/getbook', auth.verifyToken, file.getBook);
  router.get('/gethandlebook', auth.verifyToken, file.getHandleBook);
  router.get('/getreport', auth.verifyToken, file.getReport);
  router.get('/getrepository', auth.verifyToken, file.getRepository);
  router.get('/getscript', auth.verifyToken, file.getScript);

  // 分片上传相关路由 - 移除身份验证以简化流程
  router.post('/checkChunks', file.checkChunks);
  router.post('/uploadChunk', file.uploadChunk);
  router.post('/mergeChunks', file.mergeChunks);
  router.post('/cancelUpload', file.cancelUpload);

  // 注册路由
  app.use('/file', router);
};
