// 创建Express应用实例
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
// 允许前端访问8080端口
var corsOptions = {
  origin: 'http://localhost:8080'
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

// 创建上传目录
const uploadDir = path.join(__dirname, 'app/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // 递归创建目录
}

// 配置静态资源访问
app.use('/uploads', express.static(uploadDir));

// set port, listen for requests
// 环境变量优先，默认8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
