module.exports = (sequelize, Sequelize) => {
  const File = sequelize.define('file', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      unique: true,
      comment: '主键'
    },
    file_path: {
      type: Sequelize.STRING(255),
      allowNull: false,
      comment: '文件路径'
    },
    file_name: {
      type: Sequelize.STRING(255),
      allowNull: false,
      comment: '文件名称'
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '状态码 1：已完成上传 ； 2：已完成解析；3：已完成深度记忆'
    },
    tag:{
      type: Sequelize.STRING,
      comment: '标签'
    }
  },{
    timestamps:true,
    createdAt: 'createtime',
    updatedAt: false,
    // 防止查询在表名后加s
    freezeTableName: true,
  });

  return File;
};
