<template>
  <Navbar @search="handleSearch" @reset="handleReset"></Navbar>

  <div class="first-tag">
    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane name="doc">
        <template #label>
          <div :class="{ highlight: showHighlight.doc }">
            <div class="main-title">文档中心</div>
            <div class="sub-title">({{ totalFiles || 0 }})</div>
          </div>
        </template>
        <el-row :gutter="20" style="margin-left: 5px; margin-bottom: 10px">
          <el-check-tag
            v-for="tag in tags"
            :key="tag"
            :checked="selectedTagsMap[tag]"
            class="multi-tag"
            :type="selectedTagsMap[tag] ? 'success' : 'info'"
            @change="handleTagChange(tag)"
          >
            {{ tag }}
            <el-icon v-if="selectedTagsMap[tag]">
              <Select />
            </el-icon>
          </el-check-tag>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="100">
            <el-upload
              ref="uploadRef"
              action="/api/file/upload"
              :data="uploadData"
              :before-upload="beforeUpload"
              :on-progress="handleProgress"
              :on-success="handleSuccess"
              :on-error="handleError"
              :show-file-list="false"
              :multiple="true"
              drag
              class="upload-card"
            >
              <el-card
                class="add-el-card"
                :style="{ width: '240px', height: '240px' }"
                :class="{ uploading: loading }"
              >
                <el-icon>
                  <Plus />
                </el-icon>
                <p>添加文档</p>
              </el-card>
            </el-upload>
          </el-col>
          <el-col :span="100" v-for="(doc, index) in documents" :key="index">
            <el-card :style="{ width: '240px', height: '240px' }">
              <div class="tab-edit">
                <template v-if="!doc.tags && !doc.isEditing">
                  <el-button
                    type="info"
                    plain
                    icon="Edit"
                    @click="editTag(doc)"
                    style="color: black"
                    >未定义标签</el-button
                  >
                </template>
                <template v-else-if="!doc.isEditing">
                  <div class="tag-container">
                    <el-button
                      type="info"
                      plain
                      icon="Edit"
                      @click="editTag(doc)"
                      style="color: black"
                      >{{ doc.tags }}</el-button
                    >
                    <el-button
                      type="danger"
                      plain
                      icon="Delete"
                      @click="deleteTag(doc)"
                      size="small"
                      class="delete-tag-btn"
                    ></el-button>
                  </div>
                </template>
                <template v-if="doc.isEditing">
                  <el-input
                    v-model="doc.tags"
                    @blur="saveTag(doc)"
                    @keyup.enter="saveTag(doc)"
                    :ref="
                      (el) => {
                        if (el) tagInputs[doc.id] = el;
                      }
                    "
                    style="width: 100px"
                    :autofocus="true"
                  />
                </template>
              </div>
              <div slot="header" class="title">
                <el-tooltip :content="doc.title" placement="top">
                  <span>{{ truncateFileName(doc.title, 9) }}</span>
                </el-tooltip>
              </div>
              <div class="content">
                <div class="file-icon-container">
                  <el-icon class="file-icon" :size="40">
                    <Document />
                  </el-icon>
                  <div class="file-type">{{ getFileTypeText(doc.type) }}</div>
                </div>
              </div>

              <div v-if="doc.isUploaded" class="glass-overlay">
                <div class="progress-info">
                  <el-progress
                    :percentage="doc.uploadProgress"
                    status="success"
                    class="upload-progress"
                    stroke-linecap="square"
                    type="dashboard"
                  >
                    <template #default="scoped">
                      <span class="percentage-value"
                        >上传进度:{{ doc.uploadProgress }}%</span
                      >
                    </template>
                  </el-progress>
                </div>
              </div>

              <div class="preview" @click="downloadFile(doc)">下载</div>
            </el-card>
          </el-col>
        </el-row>

        <div class="page" v-show="maxPage > 0">
          <el-pagination
            layout="prev, pager, next"
            :total="1000"
            :page-size="num"
            @current-change="pageChange"
            :page-count="maxPage"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import Navbar from '@/components/navbar.vue';

const { proxy } = getCurrentInstance();
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB 分片大小
const uploadRef = ref(null);
const uploadConfig = {
  chunkSize: CHUNK_SIZE,
  maxChunkRetries: 3,
  concurrentUploads: 3
};

onMounted(() => {
  getFileList();
  getTagList();
});

const page = ref(1);
const num = ref(23);

const maxPage = ref(1);
const totalFiles = ref(0);

const activeName = ref('doc');

const documents = ref([]);
const selectedTags = ref([]);
const loading = ref(false);

const mapDocumentData = (item) => ({
  title: item.file_name,
  type: item.file_type || 'doc',
  docURL: item.file_path,
  isUploaded: false,
  uploadProgress: 100,
  tags: item.tag,
  id: item.id,
  isEditing: false,
  uid: 0,
  chunks: 0,
  uploadedChunks: [],
  chunkList: []
});

const getFileList = async () => {
  const result = await proxy.$GET({
    url: 'file/getfilelist',
    params: {
      page: page.value,
      num: num.value,
      type: 'doc',
      keywords: searchQuery.value ?? '',
      tag: selectedTags.value.join(',')
    }
  });
  if (result.code == 0) {
    totalFiles.value = 0;
    documents.value = [];
    return false;
  }
  maxPage.value = Math.ceil(result.data.count / num.value);
  totalFiles.value = result.data.count;
  documents.value = result.data.data.map(mapDocumentData);
};

const getTagList = async () => {
  var result = await proxy.$POST({
    url: 'file/gettaglist'
  });
  result.data.map((item) => {
    tags.value.push(item);
  });
};

const uploadData = computed(() => ({
  type: activeName.value
}));
const beforeUpload = (file) => {
  const newDocument = {
    title: file.name,
    type: getFileType(file),
    docURL: '',
    isUploaded: true,
    uploadProgress: 0,
    tags: '',
    id: 0,
    isEditing: false,
    uid: file.uid,
    progress: 0,

    chunks: Math.ceil(file.size / uploadConfig.chunkSize),
    uploadedChunks: [],
    chunkList: []
  };

  // 创建分片列表
  for (let i = 0; i < newDocument.chunks; i++) {
    const start = i * uploadConfig.chunkSize;
    const end = Math.min(start + uploadConfig.chunkSize, file.size);
    newDocument.chunkList.push({
      index: i,
      start,
      end,
      progress: 0,
      status: 'waiting'
    });
  }

  documents.value.unshift(newDocument);

  checkUploadedChunks(newDocument, file);
  return false;
};

const checkUploadedChunks = async (doc, file) => {
  doc.status = 'checking';
  try {
    const result = await proxy.$POST({
      url: '/file/checkChunks',
      params: {
        filename: file.name,
        totalChunks: doc.chunks,
        type: activeName.value
      }
    });
    if (result.code === 1 && result.data && result.data.uploadedChunks) {
      doc.uploadedChunks = result.data.uploadedChunks;
    }
  } catch (error) {
    console.error('检查分片失败:', error);
  }

  startUploadChunks(doc, file);
};

const startUploadChunks = async (doc, file) => {
  for (let i = 0; i < doc.chunks; i++) {
    if (!doc.uploadedChunks.includes(i)) {
      await uploadChunk(doc, file, i);
      if (doc.status === 'pause' || doc.status === 'cancel') {
        break;
      }
    }
  }

  if (doc.uploadedChunks.length === doc.chunks) {
    await mergeChunks(doc, file);
  }
};

const uploadChunk = async (doc, file, chunkIndex) => {
  if (doc.status === 'pause' || doc.status === 'cancel') {
    return;
  }

  const chunk = doc.chunkList[chunkIndex];
  const blob = file.slice(chunk.start, chunk.end);

  console.log(
    `准备上传分片 ${chunkIndex + 1}/${doc.chunks}，大小: ${blob.size} 字节`
  );

  try {
    const result = await proxy.$CHUNK_UPLOAD({
      url: '/file/uploadChunk',
      file: blob,
      fileName: file.name,
      params: {
        filename: file.name,
        chunkIndex: chunkIndex.toString(),
        totalChunks: doc.chunks.toString(),
        type: activeName.value
      },
      onProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        chunk.progress = percentCompleted;

        updateRealTimeProgress(doc);
      },
      timeout: 120000
    });
    if (result.code === 1) {
      chunk.status = 'success';
      if (!doc.uploadedChunks.includes(chunkIndex)) {
        doc.uploadedChunks.push(chunkIndex);
      }
      updateUploadProgress(doc);
    } else {
      chunk.status = 'error';
      console.error(`分片 ${chunkIndex + 1} 上传失败:`, result.msg);
      throw new Error(result.msg || '上传分片失败');
    }
  } catch (error) {
    console.error(`分片 ${chunkIndex + 1} 上传出错:`, error);
    chunk.status = 'error';

    chunk.retries = (chunk.retries || 0) + 1;
    if (chunk.retries < uploadConfig.maxChunkRetries) {
      console.log(`正在重试分片 ${chunkIndex + 1}, 第 ${chunk.retries} 次重试`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await uploadChunk(doc, file, chunkIndex);
    } else {
      console.error(`分片 ${chunkIndex + 1} 重试次数已达上限`);
      ElMessage.error(`分片 ${chunkIndex + 1} 上传失败，已达到最大重试次数`);
    }
  }
};

const mergeChunks = async (doc, file) => {
  try {
    const result = await proxy.$POST({
      url: '/file/mergeChunks',
      params: {
        filename: file.name,
        totalChunks: doc.chunks,
        type: activeName.value
      }
    });

    if (result.code === 1 && result.data) {
      doc.docURL = result.data.url;
      doc.id = result.data.id;
      doc.status = 'success';
      doc.uploadProgress = 100;
      doc.isUploaded = false;
      // 强制更新视图
      documents.value = [...documents.value];
      ElMessage.success('文件上传成功');
    } else {
      throw new Error(result.message || '合并文件失败');
    }
  } catch (error) {
    console.error('合并分片失败:', error);
    doc.status = 'error';
    doc.isUploaded = false;
    documents.value = [...documents.value];
    ElMessage.error('文件合并失败');
  }
};

// 获取文件类型
const getFileType = (file) => {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
    return 'word';
  } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
    return 'excel';
  } else if (fileName.endsWith('.pdf')) {
    return 'pdf';
  } else if (fileName.endsWith('.txt')) {
    return 'text';
  } else if (fileName.match(/\.(jpg|jpeg|png|gif|bmp)$/)) {
    return 'image';
  } else {
    return 'other';
  }
};

const updateUploadProgress = (doc) => {
  doc.uploadProgress = Math.floor(
    (doc.uploadedChunks.length / doc.chunks) * 100
  );
};

const updateRealTimeProgress = (doc) => {
  if (!doc.chunkList || doc.chunkList.length === 0) return;
  let completedProgress = 0;
  for (let i = 0; i < doc.chunks; i++) {
    if (doc.uploadedChunks.includes(i)) {
      completedProgress += 100;
    } else {
      const chunk = doc.chunkList.find((c) => c.index === i);
      if (chunk && chunk.progress > 0) {
        completedProgress += chunk.progress;
      }
    }
  }

  let totalProgress = Math.floor(completedProgress / doc.chunks);

  if (doc.uploadedChunks.length === doc.chunks) {
    totalProgress = 100;
  }

  if (doc.uploadProgress !== totalProgress) {
    doc.uploadProgress = totalProgress;
    if (totalProgress === 100) {
      setTimeout(() => {
        doc.isUploaded = false;
        documents.value = [...documents.value];
      }, 500);
    }
    documents.value = [...documents.value];
  }
};

const handleProgress = (event, file) => {
  const doc = documents.value.find((d) => d.uid === file.uid);
  if (doc) {
    doc.uploadProgress = Math.min(99, Math.floor(event.percent));
  }
};

const handleSuccess = (response, uploadFile) => {
  const doc = documents.value.find((d) => d.uid === uploadFile.uid);
  if (doc) {
    doc.docURL = response.data.url;
    doc.id = response.data.id;
    doc.uploadProgress = 100;
    doc.isUploaded = false;
    totalFiles.value++;
  }
};

const handleError = (err) => {
  loading.value = false;
  ElMessage.error(`上传失败: ${err.message}`);
};

// 获取文件类型文本
const getFileTypeText = (type) => {
  switch (type) {
    case 'word':
      return 'Word文档';
    case 'excel':
      return 'Excel表格';
    case 'pdf':
      return 'PDF文档';
    case 'text':
      return '文本文件';
    case 'image':
      return '图片';
    default:
      return '文件';
  }
};

// 下载文件
const downloadFile = (doc) => {
  if (doc.docURL) {
    const link = document.createElement('a');
    link.href = doc.docURL;
    link.download = doc.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    ElMessage.warning('文件链接不可用');
  }
};

const tags = ref([]);
const selectedTagsMap = reactive([]);

const handleTagChange = (tag) => {
  selectedTagsMap[tag] = !selectedTagsMap[tag];
  updateSelectedTags();
  page.value = 1;
  getFileList();
};

const updateSelectedTags = () => {
  selectedTags.value = Object.keys(selectedTagsMap).filter(
    (tag) => selectedTagsMap[tag]
  );
};

const tagInputs = ref({});

const editTag = async (doc) => {
  doc.isEditing = true;
  doc.tempTag = doc.tags;
  // 等待DOM更新后聚焦输入框
  await proxy.$nextTick();
  if (tagInputs.value[doc.id]) {
    tagInputs.value[doc.id].focus();
  }
};

const saveTag = async (doc) => {
  if (!doc.isEditing) return;

  // 如果标签为空，恢复原标签
  if (!doc.tags || doc.tags.trim() === '') {
    doc.tags = doc.tempTag;
    doc.isEditing = false;
    return;
  }

  try {
    const result = await proxy.$POST({
      url: 'file/edittag',
      params: { id: doc.id, tag: doc.tags.trim() }
    });

    if (result.code === 1) {
      // 更新标签列表
      if (!tags.value.includes(doc.tags)) {
        tags.value = tags.value.filter((item) => item !== doc.tempTag);
        tags.value.push(doc.tags);
      }
      ElMessage.success('标签修改成功');
    } else {
      // 恢复原标签
      doc.tags = doc.tempTag;
      ElMessage.error(result.msg || '标签修改失败');
    }
  } catch (error) {
    console.error('修改标签失败:', error);
    doc.tags = doc.tempTag;
    ElMessage.error('标签修改失败');
  } finally {
    doc.isEditing = false;
  }
};

const pageChange = async (data) => {
  page.value = data;
  getFileList();
};

const showHighlight = reactive({
  doc: false
});

const searchQuery = ref('');
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

const handleClick = (tab, event) => {
  activeName.value = tab.props.name;
};

const handleSearch = async (query) => {
  if (query) {
    searchQuery.value = query;
    page.value = 1;
    await getFileList();
    showHighlight.doc = totalFiles.value > 0;
  }
};

const handleReset = async () => {
  searchQuery.value = '';
  selectedTags.value = [];
  page.value = 1;
  getFileList();
  Object.keys(showHighlight).forEach((key) => {
    showHighlight[key] = false;
  });
  for (let key in selectedTagsMap) {
    selectedTagsMap[key] = false;
  }
};

// 添加删除标签的方法
const deleteTag = async (doc) => {
  try {
    const result = await proxy.$POST({
      url: 'file/edittag',
      params: { id: doc.id, tag: '' }
    });

    if (result.code === 1) {
      doc.tags = '';
      tags.value = result.data.tags || [];
      ElMessage.success('标签已删除');
    } else {
      ElMessage.error(result.msg || '删除标签失败');
    }
  } catch (error) {
    console.error('删除标签失败:', error);
    ElMessage.error('删除标签失败');
  }
};
</script>

<style scoped>
@import url('/assets/css/file.css');

.tag-container {
  display: flex;
  align-items: center;
}

.delete-tag-btn {
  margin-left: 5px;
}
</style>
