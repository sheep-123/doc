// 创建Express应用实例
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
// 允许前端访问端口
// var corsOptions = {
//   origin: 'http://localhost:7777'
// };

var corsOptions = {
  origin: true,  // 改为true允许所有来源
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // 添加允许的HTTP方法
  allowedHeaders: ['Content-Type', 'Authorization']  // 添加允许的请求头
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
// 处理json格式请求体
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
// 处理表单数据
app.use(express.urlencoded({ extended: true }));
// 同步sequelize模型与数据库表结构
const db = require('./app/models');
db.sequelize
  .sync()
  .then(() => {
    console.log('Synced db.');
  })
  .catch((err) => {
    console.log('Failed to sync db: ' + err.message);
  });

// // drop the table if it already exists
// db.sequelize.sync({ force: true }).then(() => {
//   console.log("Drop and re-sync db.");
// });

// simple route
// 基础路由
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to bezkoder application.' }); //访问根路径返回欢迎信息
});

//require("./app/routes/turorial.routes")(app);
// 业务路由
require('./app/routes/file')(app);
require('./app/routes/user')(app);


// set port, listen for requests
// 环境变量优先，默认
const PORT = process.env.PORT || 7777;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});


