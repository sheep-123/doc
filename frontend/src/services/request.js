//引入axios异步请求插件
import axios from 'axios';

let cancel,
  promiseArr = {};

const CancelToken = axios.CancelToken;

//请求拦截器
axios.interceptors.request.use(
  (config) => {
    const storeData = localStorage.getItem('file');
    if (storeData) {
      const token = JSON.parse(storeData).token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    //发起请求时，取消掉当前正在进行的相同请求
    if (promiseArr[config.url]) {
      promiseArr[config.url]('操作取消');
      promiseArr[config.url] = cancel;
    } else {
      promiseArr[config.url] = cancel;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

//响应拦截器即异常处理
axios.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (err) => {
    console.log(err);
    if (err && err.response) {
      return err.response.data;
    }
    return Promise.resolve(err.response);
  }
);

//请求的默认前缀 只要是发出去请求就会 默认带上这个前缀
axios.defaults.baseURL = '/api';

//设置默认请求头 异步的
axios.defaults.headers = {
  'X-Requested-With': 'XMLHttpRequest',
  Authorization: 'Bearer ${token}'
};

//设置超时请求时间
axios.defaults.timeout = 10000;

//get请求
let GET = (data = {}) => {
  return new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url: data.url,
      params: data.params,
      cancelToken: new CancelToken((c) => {
        cancel = c;
      })
    }).then((res) => {
      resolve(res);
    });
  });
};

//post请求
let POST = (data = {}) => {
  return new Promise((resolve, reject) => {
    axios({
      method: 'post',
      url: data.url,
      data: data.params,
      cancelToken: new CancelToken((c) => {
        cancel = c;
      })
    }).then((res) => {
      resolve(res);
    });
  });
};

// 文件上传请求
let UPLOAD = (data = {}) => {
  //封装表单数据对象
  var RequestData = new FormData();

  if (JSON.stringify(data.params) != '{}') {
    for (var key in data.params) {
      if (Array.isArray(data.params[key])) {
        for (var item of data.params[key]) {
          RequestData.append(`${key}[]`, item);
        }
      } else {
        RequestData.append(key, data.params[key]);
      }
    }
  }

  return new Promise((resolve, reject) => {
    axios({
      method: 'post',
      url: data.url,
      data: RequestData,
      headers: { 'Content-Type': 'multipart/form-data' },
      cancelToken: new CancelToken((c) => {
        cancel = c;
      })
    }).then((res) => {
      resolve(res);
    });
  });
};

// 分片上传专用方法
let CHUNK_UPLOAD = (data = {}) => {
  // 创建FormData对象
  const formData = new FormData();

  // 添加文件和其他参数
  if (data.file) {
    formData.append('file', data.file, data.fileName || data.file.name);
  }

  // 添加其他参数
  if (data.params) {
    for (const key in data.params) {
      formData.append(key, data.params[key]);
    }
  }

  return new Promise((resolve, reject) => {
    axios({
      method: 'post',
      url: data.url,
      data: formData,
      headers: {
        // 不要手动设置Content-Type，让浏览器自动处理
      },
      onUploadProgress: data.onProgress, // 进度回调
      timeout: data.timeout || 120000, // 默认2分钟超时
      cancelToken: new CancelToken((c) => {
        cancel = c;
      })
    })
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export default {
  install(app, options) {
    //定义全局访问
    app.config.globalProperties.$GET = GET;
    app.config.globalProperties.$POST = POST;
    app.config.globalProperties.$UPLOAD = UPLOAD;
    app.config.globalProperties.$CHUNK_UPLOAD = CHUNK_UPLOAD;
  }
};
