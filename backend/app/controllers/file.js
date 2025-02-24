const db = require('../models');
const File = db.file;
const Op = db.Sequelize.Op;

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 修改为固定PDF存储路径
    const uploadPath = path.join(__dirname, '../uploads/pdf');

    // 自动创建目录
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

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
      type=''
    } = req.query;

    // 构建查询条件
    const where = {};
    if (tag) where.tag = tag;
    if (keywords) where.file_name = { [Op.like]: `%${keywords}%` };
    if (status) where.status = status;
    if(type) where.type = type;

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

      // const { type } = req.query; // 获取前端传递的type参数

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
      const domain = `${req.protocol}://${req.get('host')}`;
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
    // 验证请求方法
    if (req.method !== 'POST') {
      return res.status(405).json({
        code: 0,
        msg: '仅支持POST请求方法',
        data: null
      });
    }

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
    if (!tag) {
      return res.status(400).json({
        code: 0,
        msg: '标签不能为空',
        data: null
      });
    }

    // 执行标签更新
    const [affectedRows] = await File.update(
      { tag },
      {
        where: { id },
        individualHooks: true
      }
    );

    if (affectedRows === 0) {
      return res.status(404).json({
        code: 0,
        msg: '文件不存在或标签未修改',
        data: null
      });
    }

    // 获取更新后的标签列表
    const updatedTags = await File.findAll({
      attributes: ['tag'],
      where: {
        tag: {
          [Op.ne]: null
        }
      },
      distinct: true
    });

    // 处理标签结果
    const tags = [
      ...new Set(updatedTags.map((item) => item.tag).filter((t) => t !== null))
    ];

    res.status(200).json({
      code: 1,
      msg: '标签更新成功',
      data: tags
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
      type=''
    } = req.query;

    // 构建查询条件
    const where = {};
    if (keywords) where.file_name = { [Op.like]: `%${keywords}%` };
    if (status) where.status = status;
    if(type) where.type = type;

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
      type=''
    } = req.query;

    // 构建查询条件
    const where = {};
    if (keywords) where.file_name = { [Op.like]: `%${keywords}%` };
    if (status) where.status = status;
    if(type) where.type = type;

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
      type=''
    } = req.query;

    // 构建查询条件
    const where = {};
    if (keywords) where.file_name = { [Op.like]: `%${keywords}%` };
    if (status) where.status = status;
    if(type) where.type = type;

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
      type=''
    } = req.query;

    // 构建查询条件
    const where = {};
    if (keywords) where.file_name = { [Op.like]: `%${keywords}%` };
    if (status) where.status = status;
    if(type) where.type = type;

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
      type=''
    } = req.query;

    // 构建查询条件
    const where = {};
    if (keywords) where.file_name = { [Op.like]: `%${keywords}%` };
    if (status) where.status = status;
    if(type) where.type = type;

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
      type=''
    } = req.query;

    // 构建查询条件
    const where = {};
    if (keywords) where.file_name = { [Op.like]: `%${keywords}%` };
    if (status) where.status = status;
    if(type) where.type = type;

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
      type=''
    } = req.query;

    // 构建查询条件
    const where = {};
    if (keywords) where.file_name = { [Op.like]: `%${keywords}%` };
    if (status) where.status = status;
    if(type) where.type = type;

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
