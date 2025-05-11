const db = require('../models');
const File = db.file;
const Op = db.Sequelize.Op;
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const os = require('os');

// 获取内网ip
function getIPAddress() {
  let IPAddress = '';
  var interfaces = os.networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (
        alias.family === 'IPv4' &&
        alias.address !== '127.0.0.1' &&
        !alias.internal
      ) {
        IPAddress = alias.address;
      }
    }
  }
  return IPAddress;
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../../frontend/uploads/pdf');

    // 自动创建目录
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
// 文件上传校验
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('仅支持PDF文件'));
    }
    cb(null, true);
  },
  preservePath: true,
  fileEncoding: 'utf8'
});

exports.getFileList = async (req, res) => {
  try {
    // 获取请求参数
    const {
      page = 1,
      num = 23,
      tag = '',
      keywords = '',
      status = 0,
      type = ''
    } = req.query;

    // 构建查询条件
    const where = {};
    if (tag) where.tag = tag;
    if (keywords) where.file_name = { [Op.like]: `%${keywords}%` };
    if (status) where.status = status;
    if (type) where.type = type;

    // 分页查询
    const result = await File.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * num,
      limit: Number(num)
    });

    // 响应格式处理
    const responseData = {
      count: result.count,
      data: result.rows
    };

    if (result.rows.length > 0) {
      res.status(200).json({
        code: 1,
        msg: '获取文件成功',
        data: responseData
      });
    } else {
      res.status(200).json({
        code: 0,
        msg: '暂无文件',
        data: null
      });
    }
  } catch (err) {
    res.status(500).json({
      code: 500,
      msg: `服务器错误: ${err.message}`,
      data: null
    });
  }
};

exports.upload = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          code: 0,
          msg: '未选择文件或文件大小超过限制',
          data: null
        });
      }

      const { type } = req.body; // 获取前端传递的type参数
      if (!type) {
        // 如果type是必填项，删除已上传文件
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          code: 0,
          msg: '缺少type参数',
          data: null
        });
      }

      // 新增文件名解码处理
      const decodedName = Buffer.from(req.file.originalname, 'latin1').toString(
        'utf8'
      );
      const cleanFileName = path
        .basename(decodedName)
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_.]/g, '');

      // 生成完整URL路径
      // const domain = `${req.protocol}://${getIPAddress()}:5173`;
      // 在生成URL的部分需要同步修改：
      const filePath = `/uploads/pdf/${req.file.filename}`;

      const fileInfo = {
        file_name: cleanFileName,
        file_path: `${domain}${filePath}`, // 直接存储完整URL
        status: 1,
        type: type
      };

      // 保存到数据库
      const savedFile = await File.create(fileInfo);

      res.status(200).json({
        code: 1,
        msg: '上传成功',
        data: {
          url: fileInfo.file_path, // 直接返回完整URL
          fileName: fileInfo.file_name,
          id: savedFile.id
        }
      });
    } catch (err) {
      // 新增：如果已上传文件，则删除
      if (req.file) {
        const filePath = path.join(
          __dirname,
          '../uploads/pdf',
          req.file.filename
        );
        try {
          fs.unlinkSync(filePath); // 同步删除文件
          console.log(`已回滚上传文件: ${req.file.filename}`);
        } catch (unlinkErr) {
          console.error('文件删除失败:', unlinkErr);
        }
      }

      console.error('上传错误:', err);
      res.status(500).json({
        code: 500,
        msg: `服务器错误: ${err.message}`,
        data: null
      });
    }
  }
];

exports.getTagList = async (req, res) => {
  try {
    // 查询数据库
    const result = await File.findAll({
      attributes: ['tag'],
      where: {
        tag: {
          [Op.ne]: null
        }
      },
      distinct: true
    });

    // 处理结果
    const tags = [
      ...new Set(result.map((item) => item.tag).filter((tag) => tag !== null))
    ];

    if (tags.length > 0) {
      res.status(200).json({
        code: 1,
        msg: '获取标签列表成功',
        data: tags
      });
    } else {
      res.status(200).json({
        code: 0,
        msg: '暂无标签数据',
        data: []
      });
    }
  } catch (err) {
    console.error('获取标签列表失败:', err);
    res.status(500).json({
      code: 500,
      msg: `服务器错误: ${err.message}`,
      data: null
    });
  }
};

exports.getQuerySearch = async (req, res) => {
  try {
    // 查询数据库获取所有文件名
    const files = await File.findAll({
      attributes: ['file_name'],
      raw: true // 直接返回纯JSON对象
    });

    // 处理文件名并去重
    const suggestions = [
      ...new Set(
        files
          .map(
            (file) =>
              file.file_name
                .replace(/\.pdf$/i, '') // 移除.pdf后缀（不区分大小写）
                .trim() // 去除前后空格
          )
          .filter((name) => name.length > 0) // 过滤空名称
      )
    ];

    res.status(200).json({
      code: 1,
      msg: '获取自动补全列表成功',
      data: suggestions
    });
  } catch (err) {
    console.error('自动补全查询失败:', err);
    res.status(500).json({
      code: 500,
      msg: `服务器错误: ${err.message}`,
      data: null
    });
  }
};

exports.updateMemoryStatus = async (req, res) => {
  try {
    // 获取并验证ID参数
    const id = parseInt(req.body.id) || 0;

    if (!id || id <= 0) {
      return res.status(400).json({
        code: 0,
        msg: '无效的文件ID',
        data: null
      });
    }

    // 执行数据库更新
    const [affectedRows] = await File.update(
      { status: 3 },
      {
        where: { id },
        individualHooks: true // 启用钩子函数
      }
    );

    if (affectedRows > 0) {
      res.status(200).json({
        code: 1,
        msg: '记忆状态更新成功',
        data: {
          updatedId: id,
          newStatus: 3
        }
      });
    } else {
      res.status(404).json({
        code: 0,
        msg: '文件不存在或状态未改变',
        data: null
      });
    }
  } catch (err) {
    console.error('记忆状态更新失败:', err);
    res.status(500).json({
      code: 500,
      msg: `服务器错误: ${err.message}`,
      data: null
    });
  }
};

exports.updateFileTag = async (req, res) => {
  try {
    // 获取并验证参数
    const id = parseInt(req.body.id) || 0;
    const tag = (req.body.tag || '').trim();

    if (!id || id <= 0) {
      return res.status(400).json({
        code: 0,
        msg: '无效的文件ID',
        data: null
      });
    }

    // 检查文件是否存在
    const file = await File.findByPk(id);
    if (!file) {
      return res.status(404).json({
        code: 0,
        msg: '文件不存在',
        data: null
      });
    }

    // 如果标签为空，则删除标签
    if (!tag) {
      await file.update({ tag: null });
      return res.status(200).json({
        code: 1,
        msg: '标签已删除',
        data: {
          tag: null,
          tags: await getUpdatedTags()
        }
      });
    }

    // 如果标签没有变化，直接返回成功
    if (file.tag === tag) {
      return res.status(200).json({
        code: 1,
        msg: '标签未修改',
        data: {
          tag: file.tag,
          tags: await getUpdatedTags()
        }
      });
    }

    // 执行标签更新
    await file.update({ tag });

    res.status(200).json({
      code: 1,
      msg: '标签更新成功',
      data: {
        tag: file.tag,
        tags: await getUpdatedTags()
      }
    });
  } catch (err) {
    console.error('标签更新失败:', err);
    res.status(500).json({
      code: 500,
      msg: `服务器错误: ${err.message}`,
      data: null
    });
  }
};

// 获取更新后的标签列表
const getUpdatedTags = async () => {
  const updatedTags = await File.findAll({
    attributes: ['tag'],
    where: {
      tag: {
        [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }]
      }
    },
    distinct: true
  });

  return [...new Set(updatedTags.map((item) => item.tag).filter(Boolean))];
};

exports.deleteFile = async (req, res) => {
  try {
    // const id = parseInt(req.body.id);
    const { id } = req.query;
    // return
    if (!id || id <= 0) {
      return res.status(400).json({
        code: 0,
        msg: '无效的文件ID',
        data: null
      });
    }
    const file = await File.findByPk(id);
    if (!file) {
      return res.status(404).json({
        code: 0,
        msg: '文件不存在',
        data: null
      });
    }
    const status = await file.destroy();
    if (status) {
      res.status(200).json({
        code: 1,
        msg: '文件删除成功',
        data: null
      });
    } else {
      res.status(500).json({
        code: 0,
        msg: '文件删除失败',
        data: null
      });
    }
  } catch (err) {
    console.error('文件删除失败:', err);
  }
};

exports.getPolicy = async (req, res) => {
  try {
    // 获取请求参数
    const {
      page = 1,
      num = 23,
      keywords = '',
      status = 0,
      type = ''
    } = req.query;

    // 构建查询条件
    const where = {};
    if (keywords) where.file_name = { [Op.like]: `%${keywords}%` };
    if (status) where.status = status;
    if (type) where.type = type;

    // 分页查询
    const result = await File.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * num,
      limit: Number(num)
    });

    // 响应格式处理
    const responseData = {
      count: result.count,
      data: result.rows
    };

    if (result.rows.length > 0) {
      res.status(200).json({
        code: 1,
        msg: '获取文件成功',
        data: responseData
      });
    } else {
      res.status(200).json({
        code: 0,
        msg: '暂无文件',
        data: null
      });
    }
  } catch (err) {
    res.status(500).json({
      code: 500,
      msg: `服务器错误: ${err.message}`,
      data: null
    });
  }
};

exports.getOfficial = async (req, res) => {
  try {
    // 获取请求参数
    const {
      page = 1,
      num = 23,
      keywords = '',
      status = 0,
      type = ''
    } = req.query;

    // 构建查询条件
    const where = {};
    if (keywords) where.file_name = { [Op.like]: `%${keywords}%` };
    if (status) where.status = status;
    if (type) where.type = type;

    // 分页查询
    const result = await File.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * num,
      limit: Number(num)
    });

    // 响应格式处理
    const responseData = {
      count: result.count,
      data: result.rows
    };

    if (result.rows.length > 0) {
      res.status(200).json({
        code: 1,
        msg: '获取文件成功',
        data: responseData
      });
    } else {
      res.status(200).json({
        code: 0,
        msg: '暂无文件',
        data: null
      });
    }
  } catch (err) {
    res.status(500).json({
      code: 500,
      msg: `服务器错误: ${err.message}`,
      data: null
    });
  }
};

exports.getReport = async (req, res) => {
  try {
    // 获取请求参数
    const {
      page = 1,
      num = 23,
      keywords = '',
      status = 0,
      type = ''
    } = req.query;

    // 构建查询条件
    const where = {};
    if (keywords) where.file_name = { [Op.like]: `%${keywords}%` };
    if (status) where.status = status;
    if (type) where.type = type;

    // 分页查询
    const result = await File.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * num,
      limit: Number(num)
    });

    // 响应格式处理
    const responseData = {
      count: result.count,
      data: result.rows
    };

    if (result.rows.length > 0) {
      res.status(200).json({
        code: 1,
        msg: '获取文件成功',
        data: responseData
      });
    } else {
      res.status(200).json({
        code: 0,
        msg: '暂无文件',
        data: null
      });
    }
  } catch (err) {
    res.status(500).json({
      code: 500,
      msg: `服务器错误: ${err.message}`,
      data: null
    });
  }
};

exports.getBook = async (req, res) => {
  try {
    // 获取请求参数
    const {
      page = 1,
      num = 23,
      keywords = '',
      status = 0,
      type = ''
    } = req.query;

    // 构建查询条件
    const where = {};
    if (keywords) where.file_name = { [Op.like]: `%${keywords}%` };
    if (status) where.status = status;
    if (type) where.type = type;

    // 分页查询
    const result = await File.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * num,
      limit: Number(num)
    });

    // 响应格式处理
    const responseData = {
      count: result.count,
      data: result.rows
    };

    if (result.rows.length > 0) {
      res.status(200).json({
        code: 1,
        msg: '获取文件成功',
        data: responseData
      });
    } else {
      res.status(200).json({
        code: 0,
        msg: '暂无文件',
        data: null
      });
    }
  } catch (err) {
    res.status(500).json({
      code: 500,
      msg: `服务器错误: ${err.message}`,
      data: null
    });
  }
};

exports.getHandleBook = async (req, res) => {
  try {
    // 获取请求参数
    const {
      page = 1,
      num = 23,
      keywords = '',
      status = 0,
      type = ''
    } = req.query;

    // 构建查询条件
    const where = {};
    if (keywords) where.file_name = { [Op.like]: `%${keywords}%` };
    if (status) where.status = status;
    if (type) where.type = type;

    // 分页查询
    const result = await File.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * num,
      limit: Number(num)
    });

    // 响应格式处理
    const responseData = {
      count: result.count,
      data: result.rows
    };

    if (result.rows.length > 0) {
      res.status(200).json({
        code: 1,
        msg: '获取文件成功',
        data: responseData
      });
    } else {
      res.status(200).json({
        code: 0,
        msg: '暂无文件',
        data: null
      });
    }
  } catch (err) {
    res.status(500).json({
      code: 500,
      msg: `服务器错误: ${err.message}`,
      data: null
    });
  }
};

exports.getRepository = async (req, res) => {
  try {
    // 获取请求参数
    const {
      page = 1,
      num = 23,
      keywords = '',
      status = 0,
      type = ''
    } = req.query;

    // 构建查询条件
    const where = {};
    if (keywords) where.file_name = { [Op.like]: `%${keywords}%` };
    if (status) where.status = status;
    if (type) where.type = type;

    // 分页查询
    const result = await File.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * num,
      limit: Number(num)
    });

    // 响应格式处理
    const responseData = {
      count: result.count,
      data: result.rows
    };

    if (result.rows.length > 0) {
      res.status(200).json({
        code: 1,
        msg: '获取文件成功',
        data: responseData
      });
    } else {
      res.status(200).json({
        code: 0,
        msg: '暂无文件',
        data: null
      });
    }
  } catch (err) {
    res.status(500).json({
      code: 500,
      msg: `服务器错误: ${err.message}`,
      data: null
    });
  }
};

exports.getScript = async (req, res) => {
  try {
    // 获取请求参数
    const {
      page = 1,
      num = 23,
      keywords = '',
      status = 0,
      type = ''
    } = req.query;

    // 构建查询条件
    const where = {};
    if (keywords) where.file_name = { [Op.like]: `%${keywords}%` };
    if (status) where.status = status;
    if (type) where.type = type;

    // 分页查询
    const result = await File.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * num,
      limit: Number(num)
    });

    // 响应格式处理
    const responseData = {
      count: result.count,
      data: result.rows
    };

    if (result.rows.length > 0) {
      res.status(200).json({
        code: 1,
        msg: '获取文件成功',
        data: responseData
      });
    } else {
      res.status(200).json({
        code: 0,
        msg: '暂无文件',
        data: null
      });
    }
  } catch (err) {
    res.status(500).json({
      code: 500,
      msg: `服务器错误: ${err.message}`,
      data: null
    });
  }
};

// 大文件分片上传相关API

// 检查已上传的分片
exports.checkChunks = async (req, res) => {
  try {
    const { filename, totalChunks, type } = req.body;

    if (!filename || !totalChunks) {
      return res.status(400).json({
        code: 0,
        msg: '缺少必要参数',
        data: null
      });
    }

    // 生成唯一的文件夹名，基于文件名和总分片数
    const fileId = require('crypto')
      .createHash('md5')
      .update(`${filename}-${totalChunks}`)
      .digest('hex');

    // 临时存储分片的目录
    const chunksDir = path.join(
      __dirname,
      '../../../frontend/uploads/chunks',
      fileId
    );

    // 检查目录是否存在
    if (!fs.existsSync(chunksDir)) {
      return res.status(200).json({
        code: 1,
        msg: '没有已上传的分片',
        data: {
          uploadedChunks: []
        }
      });
    }

    // 获取已上传的分片列表
    const files = fs.readdirSync(chunksDir);
    const uploadedChunks = files
      .filter((file) => file.match(/^chunk-\d+$/))
      .map((file) => parseInt(file.replace('chunk-', ''), 10))
      .sort((a, b) => a - b);

    res.status(200).json({
      code: 1,
      msg: '获取已上传分片成功',
      data: {
        uploadedChunks,
        fileId
      }
    });
  } catch (err) {
    console.error('检查分片失败:', err);
    res.status(500).json({
      code: 500,
      msg: `服务器错误: ${err.message}`,
      data: null
    });
  }
};

// 上传分片 - 使用更简单的实现
exports.uploadChunk = (req, res) => {
  console.log('接收到分片上传请求');

  // 使用最简单的方式处理文件上传，先保存到临时目录
  const tempDir = path.join(__dirname, '../../../frontend/uploads/chunks/temp');
  fs.mkdirSync(tempDir, { recursive: true });

  // 简单的单文件上传中间件
  const tempUpload = multer({ dest: tempDir }).single('file');

  // 处理上传请求，先保存文件
  tempUpload(req, res, function (err) {
    if (err) {
      console.error('分片上传失败:', err);
      return res.status(400).json({
        code: 0,
        msg: `分片上传失败: ${err.message}`,
        data: null
      });
    }

    console.log('解析后的表单字段:', req.body);
    console.log('上传的文件信息:', req.file);

    // 检查必要参数
    if (!req.file) {
      return res.status(400).json({
        code: 0,
        msg: '没有接收到文件分片',
        data: null
      });
    }

    const { filename, chunkIndex, totalChunks, type } = req.body;

    // 验证参数
    if (!filename || chunkIndex === undefined || !totalChunks) {
      console.error('缺少必要参数:', req.body);
      // 删除临时文件
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('删除临时文件失败:', err);
      }

      return res.status(400).json({
        code: 0,
        msg: '缺少必要参数',
        data: null
      });
    }

    try {
      // 创建唯一的文件夹标识
      const fileId = require('crypto')
        .createHash('md5')
        .update(`${filename}-${totalChunks}`)
        .digest('hex');

      // 分片存储目录
      const chunksDir = path.join(
        __dirname,
        '../../../frontend/uploads/chunks',
        fileId
      );

      // 确保目录存在
      fs.mkdirSync(chunksDir, { recursive: true });

      // 目标文件路径
      const targetPath = path.join(chunksDir, `chunk-${chunkIndex}`);

      console.log(`移动分片从 ${req.file.path} 到 ${targetPath}`);

      // 移动文件到最终位置
      fs.renameSync(req.file.path, targetPath);

      // 返回成功响应
      res.status(200).json({
        code: 1,
        msg: '分片上传成功',
        data: {
          chunkIndex,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('处理分片失败:', error);

      // 清理临时文件
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('删除临时文件失败:', err);
      }

      res.status(500).json({
        code: 0,
        msg: `处理分片失败: ${error.message}`,
        data: null
      });
    }
  });
};

// 合并分片
exports.mergeChunks = async (req, res) => {
  try {
    const { filename, totalChunks, type } = req.body;

    if (!filename || !totalChunks || !type) {
      return res.status(400).json({
        code: 0,
        msg: '缺少必要参数',
        data: null
      });
    }

    // 生成唯一的文件标识
    const fileId = require('crypto')
      .createHash('md5')
      .update(`${filename}-${totalChunks}`)
      .digest('hex');

    // 获取分片目录
    const chunksDir = path.join(
      __dirname,
      '../../../frontend/uploads/chunks',
      fileId
    );

    // 检查目录是否存在
    if (!fs.existsSync(chunksDir)) {
      return res.status(400).json({
        code: 0,
        msg: '没有找到文件分片',
        data: null
      });
    }

    // 获取所有分片
    const chunks = fs
      .readdirSync(chunksDir)
      .filter((file) => file.match(/^chunk-\d+$/))
      .map((file) => ({
        index: parseInt(file.replace('chunk-', ''), 10),
        path: path.join(chunksDir, file)
      }))
      .sort((a, b) => a.index - b.index);

    // 验证所有分片都存在
    if (chunks.length !== parseInt(totalChunks, 10)) {
      return res.status(400).json({
        code: 0,
        msg: `分片不完整，预期 ${totalChunks} 个分片，实际找到 ${chunks.length} 个`,
        data: null
      });
    }

    // 确保上传目录存在
    const uploadDir = path.join(__dirname, '../../../frontend/uploads', type);
    fs.mkdirSync(uploadDir, { recursive: true });

    // 生成最终文件名
    const ext = path.extname(filename);
    const finalFileName = `${uuidv4()}${ext}`;
    const finalFilePath = path.join(uploadDir, finalFileName);

    // 合并文件
    const writeStream = fs.createWriteStream(finalFilePath);

    // 依次将每个分片的内容写入最终文件
    for (const chunk of chunks) {
      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(chunk.path);
        readStream.pipe(writeStream, { end: false });
        readStream.on('end', resolve);
        readStream.on('error', reject);
      });
    }

    // 关闭写入流
    await new Promise((resolve) => {
      writeStream.end();
      writeStream.on('finish', resolve);
    });

    // 清理临时分片
    fs.rmSync(chunksDir, { recursive: true, force: true });

    // 获取文件原名（去除路径和特殊字符）
    const cleanFileName = path
      .basename(filename)
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_.]/g, '');

    // 生成访问URL
    const filePath = `/uploads/${type}/${finalFileName}`;

    // 保存到数据库
    const fileInfo = {
      file_name: cleanFileName,
      file_path: filePath,
      file_type: ext.replace('.', ''),
      status: 1,
      type: type
    };

    const savedFile = await File.create(fileInfo);

    res.status(200).json({
      code: 1,
      msg: '文件合并成功',
      data: {
        url: filePath,
        fileName: fileInfo.file_name,
        id: savedFile.id
      }
    });
  } catch (err) {
    console.error('文件合并失败:', err);
    res.status(500).json({
      code: 500,
      msg: `服务器错误: ${err.message}`,
      data: null
    });
  }
};

// 取消上传
exports.cancelUpload = async (req, res) => {
  try {
    const { filename, totalChunks } = req.body;

    if (!filename) {
      return res.status(400).json({
        code: 0,
        msg: '缺少文件名参数',
        data: null
      });
    }

    // 如果有totalChunks参数，说明是分片上传取消
    if (totalChunks) {
      const fileId = require('crypto')
        .createHash('md5')
        .update(`${filename}-${totalChunks}`)
        .digest('hex');

      const chunksDir = path.join(
        __dirname,
        '../../../frontend/uploads/chunks',
        fileId
      );

      // 如果目录存在，删除它
      if (fs.existsSync(chunksDir)) {
        fs.rmSync(chunksDir, { recursive: true, force: true });
      }
    }

    res.status(200).json({
      code: 1,
      msg: '上传已取消',
      data: null
    });
  } catch (err) {
    console.error('取消上传失败:', err);
    res.status(500).json({
      code: 500,
      msg: `服务器错误: ${err.message}`,
      data: null
    });
  }
};
