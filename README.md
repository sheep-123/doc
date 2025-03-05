# 前端项目的是由Vue3+ElementPlus+Vite构成

前端的项目默认端口是5173，也可根据自身需求在vite.config.js自行修改。

前端的uploads文件是存储pdf文件的。

配置路由在src下routers的index.js。

请求的封装在src下servers的request.js。

本地存储在src下store的index.js

页面文件在src下的views文件里面



# 后端项目是由nodejs+Express框架构成

后端的默认端口是7777，也可根据需求在server.js文件自行修改，

数据库使用的是postgresql，在app/config/db.config.js里面配置。

控制器是在controllers文件下，主要写接口的方法。

中间键是middleware文件，auth.js文件是验证token的。

数据库定义的文件是models，用来自动生成数据库。

路由配置文件是routes，写完控制器就要配置路由。



