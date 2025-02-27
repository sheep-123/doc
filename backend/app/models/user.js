module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define(
    'user',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true,
        comment: '主键'
      },
      username: {
        type: Sequelize.STRING(255),
        comment: '用户名'
      },
      password: {
        type: Sequelize.STRING(255),
        comment: '密码'
      },
      role: {
        type: Sequelize.INTEGER,
        comment: '角色 1:管理员 2:普通用户'
      },
      // 备注
      remark: {
        type: Sequelize.STRING(255),
        comment: '备注'
      }
    },
    {
      timestamps: true,
      createdAt: 'createtime',
      updatedAt: false,
      // 防止查询在表名后加s
      freezeTableName: true
    }
  );

  return User;
};
