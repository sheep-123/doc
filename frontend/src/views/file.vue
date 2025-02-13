<template>
  <el-row :gutter="20" style="height: 60px; display: flex; align-items: center">
    <!-- 自动补全搜索框 -->
    <el-autocomplete v-model="searchQuery" :fetch-suggestions="querySearch" clearable class="inline-input w-50"
      placeholder="请输入文档名字" @select="handleSelect" :trigger-on-focus="false" style="width: 400px;margin-left: 20px;" />

    <el-button type="primary" icon="Search" @click="searchDocuments" style="margin-left: 20px;">搜索</el-button>
    <el-button type="info" icon="Refresh" @click="resetAll" plain style="color: black">重置</el-button>
    <!-- <el-button type="success" @click="memorized" plain>已记忆</el-button> -->
    <!-- <el-button type="danger" @click="noMemory" plain>未记忆</el-button> -->
    <!-- 标签栏 -->

    <!-- 统计信息 -->
    <span style="margin-left: 10px">总文件数：{{ totalFiles }}</span>
    <span style="margin-left: 20px">总页数：{{ maxPage }}</span>
  </el-row>
  <el-row :gutter="20" style="height: 40px;margin: 10px 10px;">
    <el-check-tag v-for="tag in tags" :key="tag" :checked="selectedTagsMap[tag]" class="multi-tag"
      :type="selectedTagsMap[tag] ? 'success' : 'info'" @change="handleTagChange(tag)">
      {{ tag }}
      <!-- <el-icon v-if="selectedTagsMap[tag]" class="selected-icon">
        <Check />
      </el-icon> -->
    </el-check-tag>
  </el-row>

  <el-row :gutter="20">
    <!-- Add New 按钮 -->
    <el-col :span="100">
      <el-upload action="/file/upload" :before-upload="beforeUpload" :on-success="handleSuccess"
        :on-progress="handleProgress" :on-error="handleError" accept=".pdf" :show-file-list="false" :multiple="true"
        :disabled="isMemoryProcessing" drag class="upload-card">
        <el-card class="add-el-card" :style="{ width: '280px', height: '256px' }"
          :class="{ uploading: loading, disabled: isMemoryProcessing }">
          <el-icon>
            <Plus />
          </el-icon>
          <p>添加PDF文档</p>

          <!-- 添加上传按钮的蒙层 -->
          <div v-if="isMemoryProcessing" class="glass-overlay new-ms">
            <div class="progress-info">
              <div class="progress-text">
                <el-icon>
                  <Lock />
                </el-icon>
              </div>
            </div>
          </div>
        </el-card>
      </el-upload>
    </el-col>

    <!-- 文档卡片 -->
    <el-col :span="100" v-for="(doc, index) in documents" :key="index">
      <el-card :style="{ width: '280px', height: '256px' }">
        <!-- 添加编辑图标和输入框 -->
        <div class="tab-edit">
          <template v-if="!doc.tags && !doc.isEditing">
            <el-button type="info" plain icon="Edit" @click="editTag(doc)" style="color: black">标签</el-button>
          </template>
          <template v-else-if="!doc.isEditing">
            <el-button type="info" plain icon="Edit" @click="editTag(doc)" style="color: black">{{ doc.tags
              }}</el-button>
          </template>
          <template v-if="doc.isEditing">
            <el-input v-model="doc.tags" @blur="saveTag(doc)" @keyup.enter="saveTag(doc)" ref="tagText"
              style="width: 100px" :autofocus="true" />
            <div class="button">
              <el-button type="info" @click="saveTag(doc)" plain style="color: black">√</el-button>
              <el-button type="info" @click="cancelEdit(doc)" plain style="color: black">x</el-button>
            </div>
          </template>
        </div>

        <div slot="header" class="title">
          <el-tooltip :content="doc.title" placement="top">
            <span>{{ truncateFileName(doc.title, 13) }}</span>
          </el-tooltip>
        </div>
        <div class="content">
          <img v-if="doc.type === 'image'" :src="doc.docURL" alt="Document Preview" class="doc-preview" />
          <embed v-else-if="doc.type === 'pdf'" :src="doc.docURL" class="doc-preview" />
          <div class="ms" v-if="doc.parse">
            解析进度：{{ doc.parseProgress }}%
          </div>
        </div>

        <!-- 倒立梯形标签 -->
        <!-- <div
          class="status-label-container"
          @click="deepMemory(doc)"
          :data-memory="doc.isMemory"
          :class="{ disabled: isMemoryProcessing && !doc.isProcessing }"
        >
          <svg
            class="status-label-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
          >
            <path
              d="M0 0 L100 0 L100 40 L20 40 Z"
              class="status-label-path"
            ></path>
          </svg>
          <span class="status-label-text">{{ doc.status }}</span>
        </div> -->

        <!-- 毛玻璃上传中-->
        <div v-if="doc.isUploaded" class="glass-overlay">
          <div class="progress-info">
            <el-progress v-if="doc.isUploaded" :percentage="doc.uploadProgress" :status="doc.uploadStatus"
              class="upload-progress" stroke-linecap="square" type="dashboard">
              <template #default="{ percentage }">
                <span class="percentage-value">上传进度:{{ doc.uploadProgress }}%</span>
              </template>
            </el-progress>
          </div>
        </div>

        <div v-if="doc.isProcessing" class="glass-overlay">
          <div class="progress-info">
            <div class="progress-text">深度记忆中{{ doc.progress }}%</div>
          </div>
        </div>

        <!-- 添加全局蒙层 -->
        <div v-if="isMemoryProcessing && !doc.isProcessing" class="glass-overlay memory-processing">
          <div class="progress-info">
            <div class="progress-text">
              <el-icon>
                <Lock />
              </el-icon>
            </div>
          </div>
        </div>

        <div class="preview" v-if="!doc.parse" @click="previewPdf(doc)">
          预览
        </div>
      </el-card>
    </el-col>
  </el-row>
  <el-dialog v-model="showPdf" title="Pdf预览" width="800">
    <embed :src="pdfUrl" type="application/pdf" width="100%" height="600px" />
  </el-dialog>
  <!-- 分页 -->
  <div class="page">
    <el-pagination layout="prev, pager, next" :total="1000" :page-size="num" @current-change="pageChange"
      :page-count="maxPage" />
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance, nextTick, reactive, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
// import Header from '@/components/header.vue';

const { proxy } = getCurrentInstance();
const ws = ref(null);
const parseQueue = ref([]);
const isParsing = ref(false);

onMounted(() => {
  getFileList();
  getTagList();
  getQuerySearch();
  connectWebsocket();
});

const documents = ref([]);
const isMemoryProcessing = ref(false); // 添加全局状态控制蒙层

// 分页
const page = ref(1);
const num = ref(24);
const maxPage = ref(0);
const totalFiles = ref(0);

// 在 setup 顶部添加公共方法
const mapDocumentData = (item) => ({
  title: item.file_name,
  type: 'pdf',
  docURL: item.file_path,
  isProcessing: false,
  isUploaded: false,
  uploadProgress: 0,
  status: [1, 2].includes(item.status) ? '未记忆' : '已记忆',
  tags: item.tag,
  parse: false,
  parseProgress: 0,
  finish: true,
  id: item.id,
  isMemory: item.status === 3,
  isEditing: false,
  progress: item.status === 3 ? 100 : 0
});

// 获取文件列表
const getFileList = async () => {
  const result = await proxy.$GET({
    url: 'file/getfilelist',
    params: { page: page.value, num: num.value }
  });

  documents.value = result.data.data.map(mapDocumentData);
  maxPage.value = Math.ceil(result.data.count / num.value);
  totalFiles.value = result.data.count;
};

// 获取标签列表
const getTagList = async () => {
  var result = await proxy.$POST({
    url: 'file/gettaglist'
  });
  result.data.map((item) => {
    tags.value.push(item);
  });
};

// 获取自动补全搜索框
const getQuerySearch = async () => {
  var result = await proxy.$POST({
    url: 'file/getquerysearch'
  });
  if (result.code == 1) {
    result.data.map((item) => {
      // 设置key为value
      restaurants.value.push({
        value: item
      });
    });
  }
};

const MAX_RETRIES = 3;
let retryCount = 0;

const connectWebsocket = async () => {
  try {
    if (ws.value) {
      ws.value.close();
    }

    ws.value = new WebSocket('ws://192.168.6.137:8000/ws');
    setupWebSocketHandler();

    // 添加重连监听
    ws.value.onclose = () => {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(connectWebsocket, 2000 * retryCount);
      }
    };

    ws.value.onopen = () => {
      // console.log('WebSocket连接已建立');
    };

    ws.value.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };
  } catch (error) {
    console.error('WebSocket连接失败:', error);
  }
};

const searchQuery = ref('');
const tags = ref([]);

const selectedTagsMap = reactive({});
const selectedTags = ref([]);

// 标签状态变化处理
const handleTagChange = (tag) => {
  selectedTagsMap[tag] = !selectedTagsMap[tag];
  updateSelectedTags();
  filterDocuments();
};

// 更新选中标签数组
const updateSelectedTags = () => {
  // object.keys()获取对象所有的key
  // filter()过滤值为true的key
  selectedTags.value = Object.keys(selectedTagsMap).filter(
    (tag) => selectedTagsMap[tag]
  );
};

// 文档筛选方法示例
const filterDocuments = async () => {
  const result = await proxy.$GET({
    url: 'file/getfilelist',
    params: {
      tag: selectedTags.value.join(','),
      page: page.value,
      num: num.value,
      keywords: searchQuery.value ?? ''
    }
  });
  documents.value = [];
  documents.value = result.data.data.map(mapDocumentData);

  maxPage.value = Math.ceil(result.data.count / num.value);
  totalFiles.value = result.data.count;
};

// 上传相关状态
const loading = ref(false);

// 文件上传前校验
const beforeUpload = (file) => {
  const isPDF = file.type === 'application/pdf';
  const isLt10M = file.size / 1024 / 1024 < 50;

  if (!isPDF) {
    ElMessage.error('只能上传PDF文件!');
    return false;
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过50MB!');
    return false;
  }

  documents.value.unshift({
    title: file.name,
    type: 'pdf',
    docURL: '',
    isProcessing: false,
    isUploaded: true,
    uploadProgress: 0,
    uploadStatus: 'success',
    status: '上传中',
    tags: '',
    parse: false,
    parseProgress: 0,
    finish: false,
    id: Date.now(), // 临时ID
    isMemory: false,
    isEditing: false,
    progress: 0
  });

  return true;
};

// 上传进度条
const handleProgress = (event, file, fileList) => {
  // 通过文件名匹配文档对象
  const targetDoc = documents.value.find(
    (d) => d.title === file.name && d.isUploaded
  );

  if (targetDoc) {
    // floor 向下取整
    targetDoc.uploadProgress = Math.floor(event.percent);
    // 保持数组响应性
    documents.value = [...documents.value];
  }
};

// 统一的消息处理器
const setupWebSocketHandler = () => {
  if (!ws.value) return;

  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const targetDoc = documents.value.find(d => d.id === data.id);

    if (targetDoc) {
      targetDoc.parseProgress = Math.floor(data.progress);
      if (data.progress === 100) {
        targetDoc.parse = false;
        targetDoc.finish = true;
        parseQueue.value.shift();
        isParsing.value = false;
        startNextParse();
      }
    }
  };
};

// 启动解析流程
const startNextParse = () => {
  if (parseQueue.value.length === 0 || isParsing.value) return;

  isParsing.value = true;
  const currentDoc = parseQueue.value[0];

  const targetDoc = documents.value.find(d => d.id === currentDoc.id);
  if (targetDoc && !targetDoc.finish) {
    targetDoc.parse = true;
    sendViaWebSocket({
      type: 'parse',
      filename: currentDoc.file.name,
      id: currentDoc.id,
      data: currentDoc.base64Data
    });
  } else {
    isParsing.value = false;
    startNextParse();
  }
};

const handleSuccess = async (response, uploadFile) => {
  loading.value = false;
  const targetIndex = documents.value.findIndex(
    (d) => d.title === uploadFile.name && d.isUploaded
  );

  if (targetIndex !== -1) {
    const updatedDoc = {
      ...documents.value[targetIndex],
      docURL: response.data.url,
      isUploaded: false,
      id: response.data.id,
      status: '未记忆',
      parse: true
    };
    // splice 方法用于替换数组中的元素
    documents.value.splice(targetIndex, 1, updatedDoc);
  }

  // 获取上传文件对象
  const file = uploadFile.raw;

  // 转换为Base64后加入队列
  const base64Data = await fileToBase64(file);
  addToParseQueue({
    id: response.data.id,
    file: uploadFile.raw,
    base64Data
  });
};

// 添加文件到解析队列
const addToParseQueue = (fileData) => {
  parseQueue.value.push(fileData);
  if (!isParsing.value) {
    startNextParse();
  }
};

// 文件转Base64工具函数
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]); // 去除data:前缀
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// WebSocket发送方法
const sendViaWebSocket = (data) => {
  if (ws.value?.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify(data));
  } else {
    console.error('WebSocket连接未就绪');
    // 可以在这里添加重连逻辑
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 上传错误处理
const handleError = (err) => {
  loading.value = false;
  ElMessage.error(`上传失败: ${err.message}`);
};

//点击未记忆
const deepMemory = async (doc) => {
  if (doc.progress === 100) {
    ElMessage.success('已提取知识');
    return;
  }

  isMemoryProcessing.value = true; // 开启蒙层
  simulateProgress(doc);
};

// 未记忆进度条
const simulateProgress = async (doc) => {
  if (!doc.isProcessing) {
    doc.isProcessing = true;
    sendViaWebSocket({
      type: 'deepMemory',
      filename: doc.title,
      id: doc.id,
    });


  }
};

const showPdf = ref(false);
const pdfUrl = ref('');

// 预览pdf
const previewPdf = async (doc) => {
  showPdf.value = true;
  pdfUrl.value = doc.docURL;
};
const tagText = ref(null);

const a = ref('');
// 编辑标签
const editTag = async (doc) => {
  doc.isEditing = true;
  a.value = doc.tags;
};

// 保存标签
const saveTag = async (doc) => {
  if (doc.tags === '') {
    // ElMessage.error("标签不能为空");
    doc.isEditing = false;
    return;
  }

  var result = await proxy.$POST({
    url: 'file/edittag',
    params: { id: doc.id, tag: doc.tags }
  });
  if (result.code === 1) {
    if (!tags.value.includes(doc.tags)) {
      // 数组去掉a.value
      tags.value = tags.value.filter((item) => item !== a.value);
      tags.value.push(doc.tags);
    }

    doc.isEditing = false;
  } else {
    // ElMessage.error(result.msg);
    doc.isEditing = false;
  }
};

// 取消编辑
const cancelEdit = (doc) => {
  doc.isEditing = false;
};

// 点击页数
const pageChange = async (num) => {
  page.value = num;
  var result = await proxy.$GET({
    url: 'file/getfilelist',
    params: { page: page.value, num: num.value }
  });

  documents.value = [];
  documents.value = result.data.data.map(mapDocumentData);
};

// 搜索
const searchDocuments = async () => {
  var result = await proxy.$GET({
    url: 'file/getfilelist',
    params: {
      keywords: searchQuery.value ?? "",
      tag: selectedTags.value.join(','),
      page: 1,
      num: num.value
    }
  });
  documents.value = [];
  documents.value = result.data.data.map(mapDocumentData);

  maxPage.value = Math.ceil(result.data.count / num.value);
  totalFiles.value = result.data.count;
};

const restaurants = ref([]);
const querySearch = (queryString, cb) => {
  const results = queryString
    ? restaurants.value.filter(createFilter(queryString))
    : restaurants.value;
  // call callback function to return suggestions
  cb(results);
};
const createFilter = (queryString) => {
  return (restaurant) => {
    return (
      restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
    );
  };
};

// 重置
const resetAll = async () => {
  searchQuery.value = '';
  selectedTags.value = []
  page.value = 1;
  var result = await proxy.$GET({
    url: 'file/getfilelist',
    params: { page: page.value, num: num.value }
  });

  documents.value = [];

  documents.value = result.data.data.map(mapDocumentData);

  maxPage.value = Math.ceil(result.data.count / num.value);
};

const handleSelect = (item) => {
  console.log(item);
};

// 已记忆
const memorized = async () => {
  var result = await proxy.$GET({
    url: 'file/getfilelist',
    params: {
      page: 1,
      num: num.value,
      status: 3,
      tag: selectedTags.value.join(','),
      keywords: searchQuery.value
    }
  });
  if (result.code == 1) {
    documents.value = [];
    result.data.data.map((item) => {
      documents.value.push({
        title: item.file_name,
        type: 'pdf',
        docURL: item.file_path,
        isProcessing: false,
        isUploaded: false,
        uploadProgress: 0,
        uploadStatus: 'success',
        status: item.status == 2 || item.status == 1 ? '未记忆' : '已记忆',
        tags: item.tag,
        parse: false,
        finish: true,
        id: item.id,
        isMemory: item.status == 3 ? true : false,
        isEditing: false, // 新增状态控制编辑模式
        progress: 100
      });
    });
  } else {
    ElMessage.error('暂无已记忆的文档');
  }
};

// 未记忆
const noMemory = async () => {
  var result = await proxy.$GET({
    url: 'file/getfilelist',
    params: {
      page: 1,
      num: num.value,
      status: 1 || 2,
      tag: selectedTags.value.join(','),
      keywords: searchQuery.value
    }
  });
  if (result.code == 1) {
    documents.value = [];
    documents.value = result.data.data.map(mapDocumentData);
  } else {
    ElMessage.error('暂无未记忆的文档');
  }
};

// 新增文件名截断方法
const truncateFileName = (name, maxLength) => {
  if (!name) return '';
  const extensionIndex = name.lastIndexOf('.');
  if (extensionIndex === -1) return name;

  const baseName = name.substring(0, extensionIndex);
  const extension = name.substring(extensionIndex);

  if (baseName.length <= maxLength) return name;

  const keepLength = Math.floor(maxLength / 2);
  return `${baseName.substring(0, keepLength)}...${baseName.substring(
    baseName.length - keepLength
  )}${extension}`;
};

// 添加清理逻辑
onUnmounted(() => {
  if (ws.value) {
    ws.value.close();
    ws.value = null;
  }
  parseQueue.value = [];
});
</script>

<style scoped>
@import url('/assets/css/file.css');
</style>
