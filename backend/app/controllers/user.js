const db = require('../models');
const User = db.user;
const jwt = require('jsonwebtoken'); // 新增jwt依赖

exports.login = async (req, res) => {
  let { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({
      msg: '用户名或密码不能为空',
      code: 0,
      data: null
    });
  }

  // 如果没有这个用户名，就注册
  let man = await User.findOne({
    where: { username: username }
  });

  if (!man) {
    man = await User.create({ username: username, password: '123456' });
    const token = jwt.sign({ id: man.id }, 'secret', { expiresIn: '12h' });
    return res.status(200).json({
      msg: '登录成功',
      code: 1,
      data: {
        user: man,
        status: 'repassword',
        token: token
      }
    });
  }
  let user = await User.findOne({
    where: { username: username, password: password }
  });
  if (!user) {
    return res.status(200).json({
      msg: '用户名或密码错误',
      code: 0,
      data: null
    });
  } else {
    const token = jwt.sign({ id: user.id }, 'secret', { expiresIn: '12h' });
    return res.status(200).json({
      msg: '登录成功',
      code: 1,
      data: {
        token: token,
        user: user,
        status: 'success'
      }
    });
  }
};

exports.repassword = async (req, res) => {
  let { username, oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword) {
    return res.status(400).json({
      msg: '旧密码不能为空',
      code: 0,
      data: null
    });
  }
  if (!newPassword) {
    return res.status(400).json({
      msg: '新密码不能为空',
      code: 0,
      data: null
    });
  }
  if (!confirmPassword) {
    return res.status(400).json({
      msg: '确认密码不能为空',
      code: 0,
      data: null
    });
  }
  if (newPassword != confirmPassword) {
    return res.status(400).json({
      msg: '新密码和确认密码不一致',
      code: 0,
      data: null
    });
  }
  const user = await User.findOne({
    where: { username: username, password: oldPassword }
  });
  if (!user) {
    return res.status(400).json({
      msg: '旧密码错误',
      code: 0,
      data: null
    });
  }
  const newUser = await User.update(
    { password: newPassword },
    {
      where: { username: username }
    }
  );
  if (newUser) {
    return res.status(200).json({
      msg: '密码修改成功',
      code: 1,
      data: null
    });
  } else {
    return res.status(400).json({
      msg: '密码修改失败',
      code: 0,
      data: null
    });
  }
};
