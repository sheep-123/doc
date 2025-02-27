const jwt = require('jsonwebtoken'); // 新增jwt依赖
const db = require('../models'); // 新增模型引用
const User = db.user; // 获取用户模型

// 新增JWT验证中间件
exports.verifyToken = async (req, res, next) => {
  // 修正header获取方式（部分浏览器自动小写）
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader) {
    return res.status(401).json({ code: 0, msg: '缺少访问令牌', data: null });
  }

  // 增加格式校验
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 0, msg: '令牌格式错误', data: null });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, 'secret');

    console.log('Decoded token:', decoded); // 调试日志

    // 确保User模型正确导入
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ code: 0, msg: '用户不存在', data: null });
    }

    req.user = user; // 注入完整用户对象
    next();
  } catch (err) {
    console.error('Token验证失败:', err.message);
    res.status(401).json({ code: 0, msg: '令牌无效或已过期', data: null });
  }
};
