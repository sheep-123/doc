const dbConfig = require('../config/db.config.js');
// sequelize映射
const Sequelize = require('sequelize');
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  },
  sync: { alter: true } // 智能比对差异，自动更新表结构
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.file = require('./file.js')(sequelize, Sequelize);
db.user = require('./user.js')(sequelize, Sequelize);

module.exports = db;
