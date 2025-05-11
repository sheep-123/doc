<template>
  <!-- 导航栏 -->
  <div class="nav">
    <div class="nav-left">
      <div style="width: 30px; height: 30px; margin-top: 5px">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
        </svg>
      </div>

      <p class="title">智慧助手</p>
    </div>

    <div class="nav-right">
      <div class="left">
        <el-autocomplete
          v-model="searchQuery"
          :fetch-suggestions="querySearch"
          clearable
          class="inline-input w-50"
          placeholder="请输入文档名字"
          @select="handleSelect"
          :trigger-on-focus="false"
          style="width: 300px"
        />

        <el-button
          type="primary"
          icon="Search"
          @click="searchDocuments"
          style="margin-left: 10px"
          >搜索</el-button
        >
        <el-button
          type="info"
          icon="Refresh"
          @click="resetAll"
          plain
          style="color: black"
          >重置</el-button
        >
      </div>

      <el-dropdown>
        <div class="avatar">
          <el-avatar :size="25" :src="circleUrl" />
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>

  <!-- 一级标签 -->
  <div class="first-tag">
    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane name="law">
        <template #label>
          <div :class="{ highlight: showHighlight.law }">
            <div class="main-title">法律法规</div>
            <div class="sub-title">({{ totalFiles??0 }})</div>
          </div>
        </template>
        <!-- 二级标签 -->

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
          <!-- Add New 按钮 -->
          <el-col :span="100">
            <el-upload
              action="/api/file/upload"
              :data="uploadData"
              :before-upload="beforeUpload"
              :on-success="handleSuccess"
              :on-progress="handleProgress"
              :on-error="handleError"
              accept=".pdf"
              :show-file-list="false"
              :multiple="true"
              :disabled="isMemoryProcessing"
              drag
              class="upload-card"
            >
              <el-card
                class="add-el-card"
                :style="{ width: '240px', height: '240px' }"
                :class="{ uploading: loading, disabled: isMemoryProcessing }"
              >
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
            <el-card :style="{ width: '240px', height: '240px' }">
              <!-- 添加编辑图标和输入框 -->
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
                  <el-button
                    type="info"
                    plain
                    icon="Edit"
                    @click="editTag(doc)"
                    style="color: black"
                    >{{ doc.tags }}</el-button
                  >
                </template>
                <template v-if="doc.isEditing">
                  <el-input
                    v-model="doc.tags"
                    @blur="saveTag(doc)"
                    @keyup.enter="saveTag(doc)"
                    ref="tagText"
                    style="width: 100px"
                    :autofocus="true"
                  />
                  <div class="button">
                    <el-button
                      type="info"
                      @click="saveTag(doc)"
                      plain
                      style="color: black"
                      >√</el-button
                    >
                    <el-button
                      type="info"
                      @click="cancelEdit(doc)"
                      plain
                      style="color: black"
                      >x</el-button
                    >
                  </div>
                </template>
              </div>
              <!-- 标题 -->
              <div slot="header" class="title">
                <el-tooltip :content="doc.title" placement="top">
                  <span>{{ truncateFileName(doc.title, 9) }}</span>
                </el-tooltip>
              </div>
              <!-- 解析 -->
              <div class="content">
                <embed :src="doc.docURL" class="doc-preview" />
                <!-- <canvas id="pdf" :ref="el => initCanvas(el, doc)" style="width: 100%; height: 155px;"></canvas> -->
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
              <!-- 深度记忆中 -->
              <div v-if="doc.isProcessing" class="glass-overlay">
                <div class="progress-info">
                  <div class="progress-text">深度记忆中{{ doc.progress }}%</div>
                </div>
              </div>

              <!-- 添加全局蒙层 -->
              <div
                v-if="isMemoryProcessing && !doc.isProcessing"
                class="glass-overlay memory-processing"
              >
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

        <!-- 分页 -->
        <div class="page" v-show="maxPage>0">
          <el-pagination
            layout="prev, pager, next"
            :total="1000"
            :page-size="num"
            @current-change="pageChange"
            :page-count="maxPage"
          />
        </div>
      </el-tab-pane>
      <el-tab-pane name="policy">
        <template #label>
          <div :class="{ highlight: showHighlight.policy }">
            <div class="main-title">政策解读</div>
            <div class="sub-title">({{ totalPolicy??0 }})</div>
          </div>
        </template>
        <el-row :gutter="20">
          <!-- Add New 按钮 -->
          <el-col :span="100">
            <el-upload
              action="api/file/upload"
              :data="uploadData"
              :before-upload="beforeUpload"
              :on-success="handleSuccess"
              :on-progress="handleProgress"
              :on-error="handleError"
              accept=".pdf"
              :show-file-list="false"
              :multiple="true"
              :disabled="isMemoryProcessing"
              drag
              class="upload-card"
            >
              <el-card
                class="add-el-card"
                :style="{ width: '240px', height: '240px' }"
                :class="{ uploading: loading, disabled: isMemoryProcessing }"
              >
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
          <el-col :span="100" v-for="(doc, index) in policy" :key="index">
            <el-card :style="{ width: '240px', height: '240px' }">
              <!-- 添加编辑图标和输入框 -->
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
                  <el-button
                    type="info"
                    plain
                    icon="Edit"
                    @click="editTag(doc)"
                    style="color: black"
                    >{{ doc.tags }}</el-button
                  >
                </template>
                <template v-if="doc.isEditing">
                  <el-input
                    v-model="doc.tags"
                    @blur="saveTag(doc)"
                    @keyup.enter="saveTag(doc)"
                    ref="tagText"
                    style="width: 100px"
                    :autofocus="true"
                  />
                  <div class="button">
                    <el-button
                      type="info"
                      @click="saveTag(doc)"
                      plain
                      style="color: black"
                      >√</el-button
                    >
                    <el-button
                      type="info"
                      @click="cancelEdit(doc)"
                      plain
                      style="color: black"
                      >x</el-button
                    >
                  </div>
                </template>
              </div>
              <!-- 标题 -->
              <div slot="header" class="title">
                <el-tooltip :content="doc.title" placement="top">
                  <span>{{ truncateFileName(doc.title, 9) }}</span>
                </el-tooltip>
              </div>
              <!-- 解析 -->
              <div class="content">
                <embed :src="doc.docURL" class="doc-preview" />
                <!-- <canvas id="pdf" :ref="el => initCanvas(el, doc)" style="width: 100%; height: 180px;"></canvas> -->
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
              <!-- 深度记忆中 -->
              <div v-if="doc.isProcessing" class="glass-overlay">
                <div class="progress-info">
                  <div class="progress-text">深度记忆中{{ doc.progress }}%</div>
                </div>
              </div>

              <!-- 添加全局蒙层 -->
              <div
                v-if="isMemoryProcessing && !doc.isProcessing"
                class="glass-overlay memory-processing"
              >
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
        <!-- 分页 -->
        <div class="page" v-show="maxPolicyPage>0">
          <el-pagination
            layout="prev, pager, next"
            :total="1000"
            :page-size="num"
            @current-change="pageChange"
            :page-count="maxPolicyPage"
          />
        </div>
      </el-tab-pane>
      <el-tab-pane name="official">
        <template #label>
          <div :class="{ highlight: showHighlight.official }">
            <div class="main-title">金句</div>
            <div class="sub-title">({{ totalOfficial??0 }})</div>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="100">
            <el-upload
              action="/api/file/upload"
              :data="uploadData"
              :before-upload="beforeUpload"
              :on-success="handleSuccess"
              :on-progress="handleProgress"
              :on-error="handleError"
              accept=".pdf"
              :show-file-list="false"
              :multiple="true"
              :disabled="isMemoryProcessing"
              drag
              class="upload-card"
            >
              <el-card
                class="add-el-card"
                :style="{ width: '240px', height: '240px' }"
                :class="{ uploading: loading, disabled: isMemoryProcessing }"
              >
                <el-icon>
                  <Plus />
                </el-icon>
                <p>添加PDF文档</p>

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

          <el-col :span="100" v-for="(doc, index) in official" :key="index">
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
                  <el-button
                    type="info"
                    plain
                    icon="Edit"
                    @click="editTag(doc)"
                    style="color: black"
                    >{{ doc.tags }}</el-button
                  >
                </template>
                <template v-if="doc.isEditing">
                  <el-input
                    v-model="doc.tags"
                    @blur="saveTag(doc)"
                    @keyup.enter="saveTag(doc)"
                    ref="tagText"
                    style="width: 100px"
                    :autofocus="true"
                  />
                  <div class="button">
                    <el-button
                      type="info"
                      @click="saveTag(doc)"
                      plain
                      style="color: black"
                      >√</el-button
                    >
                    <el-button
                      type="info"
                      @click="cancelEdit(doc)"
                      plain
                      style="color: black"
                      >x</el-button
                    >
                  </div>
                </template>
              </div>

              <div slot="header" class="title">
                <el-tooltip :content="doc.title" placement="top">
                  <span>{{ truncateFileName(doc.title, 9) }}</span>
                </el-tooltip>
              </div>

              <div class="content">
                <embed :src="doc.docURL" class="doc-preview" />

                <div class="ms" v-if="doc.parse">
                  解析进度：{{ doc.parseProgress }}%
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

              <div v-if="doc.isProcessing" class="glass-overlay">
                <div class="progress-info">
                  <div class="progress-text">深度记忆中{{ doc.progress }}%</div>
                </div>
              </div>

              <div
                v-if="isMemoryProcessing && !doc.isProcessing"
                class="glass-overlay memory-processing"
              >
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

        <div class="page" v-show="maxOfficialPage>0">
          <el-pagination
            layout="prev, pager, next"
            :total="1000"
            :page-size="num"
            @current-change="pageChange"
            :page-count="maxOfficialPage"
          />
        </div>
      </el-tab-pane>
      <el-tab-pane name="report">
        <template #label>
          <div :class="{ highlight: showHighlight.report }">
            <div class="main-title">调研报告</div>
            <div class="sub-title">({{ totalReport??0 }})</div>
          </div>
        </template>
        <el-row :gutter="20">
          <!-- Add New 按钮 -->
          <el-col :span="100">
            <el-upload
              action="/api/file/upload"
              :data="uploadData"
              :before-upload="beforeUpload"
              :on-success="handleSuccess"
              :on-progress="handleProgress"
              :on-error="handleError"
              accept=".pdf"
              :show-file-list="false"
              :multiple="true"
              :disabled="isMemoryProcessing"
              drag
              class="upload-card"
            >
              <el-card
                class="add-el-card"
                :style="{ width: '240px', height: '240px' }"
                :class="{ uploading: loading, disabled: isMemoryProcessing }"
              >
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
          <el-col :span="100" v-for="(doc, index) in report" :key="index">
            <el-card :style="{ width: '240px', height: '240px' }">
              <!-- 添加编辑图标和输入框 -->
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
                  <el-button
                    type="info"
                    plain
                    icon="Edit"
                    @click="editTag(doc)"
                    style="color: black"
                    >{{ doc.tags }}</el-button
                  >
                </template>
                <template v-if="doc.isEditing">
                  <el-input
                    v-model="doc.tags"
                    @blur="saveTag(doc)"
                    @keyup.enter="saveTag(doc)"
                    ref="tagText"
                    style="width: 100px"
                    :autofocus="true"
                  />
                  <div class="button">
                    <el-button
                      type="info"
                      @click="saveTag(doc)"
                      plain
                      style="color: black"
                      >√</el-button
                    >
                    <el-button
                      type="info"
                      @click="cancelEdit(doc)"
                      plain
                      style="color: black"
                      >x</el-button
                    >
                  </div>
                </template>
              </div>
              <!-- 标题 -->
              <div slot="header" class="title">
                <el-tooltip :content="doc.title" placement="top">
                  <span>{{ truncateFileName(doc.title, 9) }}</span>
                </el-tooltip>
              </div>
              <!-- 解析 -->
              <div class="content">
                <embed :src="doc.docURL" class="doc-preview" />
                <!-- <canvas id="pdf" :ref="el => initCanvas(el, doc)" style="width: 100%; height: 180px;"></canvas> -->
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
              <!-- 深度记忆中 -->
              <div v-if="doc.isProcessing" class="glass-overlay">
                <div class="progress-info">
                  <div class="progress-text">深度记忆中{{ doc.progress }}%</div>
                </div>
              </div>

              <!-- 添加全局蒙层 -->
              <div
                v-if="isMemoryProcessing && !doc.isProcessing"
                class="glass-overlay memory-processing"
              >
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
        <!-- 分页 -->
        <div class="page" v-show="maxReportPage>0">
          <el-pagination
            layout="prev, pager, next"
            :total="1000"
            :page-size="num"
            @current-change="pageChange"
            :page-count="maxReportPage"
          />
        </div>
      </el-tab-pane>
      <el-tab-pane name="book">
        <template #label>
          <div :class="{ highlight: showHighlight.book }">
            <div class="main-title">指导书</div>
            <div class="sub-title">({{ totalBook??0 }})</div>
          </div>
        </template>

        <el-row :gutter="20">
          <!-- Add New 按钮 -->
          <el-col :span="100">
            <el-upload
              action="/api/file/upload"
              :data="uploadData"
              :before-upload="beforeUpload"
              :on-success="handleSuccess"
              :on-progress="handleProgress"
              :on-error="handleError"
              accept=".pdf"
              :show-file-list="false"
              :multiple="true"
              :disabled="isMemoryProcessing"
              drag
              class="upload-card"
            >
              <el-card
                class="add-el-card"
                :style="{ width: '240px', height: '240px' }"
                :class="{ uploading: loading, disabled: isMemoryProcessing }"
              >
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
          <el-col :span="100" v-for="(doc, index) in book" :key="index">
            <el-card :style="{ width: '240px', height: '240px' }">
              <!-- 添加编辑图标和输入框 -->
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
                  <el-button
                    type="info"
                    plain
                    icon="Edit"
                    @click="editTag(doc)"
                    style="color: black"
                    >{{ doc.tags }}</el-button
                  >
                </template>
                <template v-if="doc.isEditing">
                  <el-input
                    v-model="doc.tags"
                    @blur="saveTag(doc)"
                    @keyup.enter="saveTag(doc)"
                    ref="tagText"
                    style="width: 100px"
                    :autofocus="true"
                  />
                  <div class="button">
                    <el-button
                      type="info"
                      @click="saveTag(doc)"
                      plain
                      style="color: black"
                      >√</el-button
                    >
                    <el-button
                      type="info"
                      @click="cancelEdit(doc)"
                      plain
                      style="color: black"
                      >x</el-button
                    >
                  </div>
                </template>
              </div>
              <!-- 标题 -->
              <div slot="header" class="title">
                <el-tooltip :content="doc.title" placement="top">
                  <span>{{ truncateFileName(doc.title, 9) }}</span>
                </el-tooltip>
              </div>
              <!-- 解析 -->
              <div class="content">
                <embed :src="doc.docURL" class="doc-preview" />
                <!-- <canvas id="pdf" :ref="el => initCanvas(el, doc)" style="width: 100%; height: 180px;"></canvas> -->
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
              <!-- 深度记忆中 -->
              <div v-if="doc.isProcessing" class="glass-overlay">
                <div class="progress-info">
                  <div class="progress-text">深度记忆中{{ doc.progress }}%</div>
                </div>
              </div>

              <!-- 添加全局蒙层 -->
              <div
                v-if="isMemoryProcessing && !doc.isProcessing"
                class="glass-overlay memory-processing"
              >
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

        <!-- 分页 -->
        <div class="page" v-show="maxBookPage>0">
          <el-pagination
            layout="prev, pager, next"
            :total="1000"
            :page-size="num"
            @current-change="pageChange"
            :page-count="maxBookPage"
          />
        </div>
      </el-tab-pane>
      <el-tab-pane name="handlebook">
        <template #label>
          <div :class="{ highlight: showHighlight.handlebook }">
            <div class="main-title">用户及操作手册</div>
            <div class="sub-title">({{ totalHandleBook??0 }})</div>
          </div>
        </template>
        <el-row :gutter="20">
          <!-- Add New 按钮 -->
          <el-col :span="100">
            <el-upload
              action="/api/file/upload"
              :data="uploadData"
              :before-upload="beforeUpload"
              :on-success="handleSuccess"
              :on-progress="handleProgress"
              :on-error="handleError"
              accept=".pdf"
              :show-file-list="false"
              :multiple="true"
              :disabled="isMemoryProcessing"
              drag
              class="upload-card"
            >
              <el-card
                class="add-el-card"
                :style="{ width: '240px', height: '240px' }"
                :class="{ uploading: loading, disabled: isMemoryProcessing }"
              >
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
          <el-col :span="100" v-for="(doc, index) in handlebook" :key="index">
            <el-card :style="{ width: '240px', height: '240px' }">
              <!-- 添加编辑图标和输入框 -->
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
                  <el-button
                    type="info"
                    plain
                    icon="Edit"
                    @click="editTag(doc)"
                    style="color: black"
                    >{{ doc.tags }}</el-button
                  >
                </template>
                <template v-if="doc.isEditing">
                  <el-input
                    v-model="doc.tags"
                    @blur="saveTag(doc)"
                    @keyup.enter="saveTag(doc)"
                    ref="tagText"
                    style="width: 100px"
                    :autofocus="true"
                  />
                  <div class="button">
                    <el-button
                      type="info"
                      @click="saveTag(doc)"
                      plain
                      style="color: black"
                      >√</el-button
                    >
                    <el-button
                      type="info"
                      @click="cancelEdit(doc)"
                      plain
                      style="color: black"
                      >x</el-button
                    >
                  </div>
                </template>
              </div>
              <!-- 标题 -->
              <div slot="header" class="title">
                <el-tooltip :content="doc.title" placement="top">
                  <span>{{ truncateFileName(doc.title, 9) }}</span>
                </el-tooltip>
              </div>
              <!-- 解析 -->
              <div class="content">
                <embed :src="doc.docURL" class="doc-preview" />
                <!-- <canvas id="pdf" :ref="el => initCanvas(el, doc)" style="width: 100%; height: 180px;"></canvas> -->
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
              <!-- 深度记忆中 -->
              <div v-if="doc.isProcessing" class="glass-overlay">
                <div class="progress-info">
                  <div class="progress-text">深度记忆中{{ doc.progress }}%</div>
                </div>
              </div>

              <!-- 添加全局蒙层 -->
              <div
                v-if="isMemoryProcessing && !doc.isProcessing"
                class="glass-overlay memory-processing"
              >
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

        <!-- 分页 -->
        <div class="page" v-show="maxHandlePage>0">
          <el-pagination
            layout="prev, pager, next"
            :total="1000"
            :page-size="num"
            @current-change="pageChange"
            :page-count="maxHandlePage"
          />
        </div>
      </el-tab-pane>
      <el-tab-pane name="repository">
        <template #label>
          <div :class="{ highlight: showHighlight.repository }">
            <div class="main-title">运维知识库</div>
            <div class="sub-title">({{ totalRepository??0 }})</div>
          </div>
        </template>
        <el-row :gutter="20">
          <!-- Add New 按钮 -->
          <el-col :span="100">
            <el-upload
              action="/api/file/upload"
              :data="uploadData"
              :before-upload="beforeUpload"
              :on-success="handleSuccess"
              :on-progress="handleProgress"
              :on-error="handleError"
              accept=".pdf"
              :show-file-list="false"
              :multiple="true"
              :disabled="isMemoryProcessing"
              drag
              class="upload-card"
            >
              <el-card
                class="add-el-card"
                :style="{ width: '240px', height: '240px' }"
                :class="{ uploading: loading, disabled: isMemoryProcessing }"
              >
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
          <el-col :span="100" v-for="(doc, index) in repository" :key="index">
            <el-card :style="{ width: '240px', height: '240px' }">
              <!-- 添加编辑图标和输入框 -->
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
                  <el-button
                    type="info"
                    plain
                    icon="Edit"
                    @click="editTag(doc)"
                    style="color: black"
                    >{{ doc.tags }}</el-button
                  >
                </template>
                <template v-if="doc.isEditing">
                  <el-input
                    v-model="doc.tags"
                    @blur="saveTag(doc)"
                    @keyup.enter="saveTag(doc)"
                    ref="tagText"
                    style="width: 100px"
                    :autofocus="true"
                  />
                  <div class="button">
                    <el-button
                      type="info"
                      @click="saveTag(doc)"
                      plain
                      style="color: black"
                      >√</el-button
                    >
                    <el-button
                      type="info"
                      @click="cancelEdit(doc)"
                      plain
                      style="color: black"
                      >x</el-button
                    >
                  </div>
                </template>
              </div>
              <!-- 标题 -->
              <div slot="header" class="title">
                <el-tooltip :content="doc.title" placement="top">
                  <span>{{ truncateFileName(doc.title, 9) }}</span>
                </el-tooltip>
              </div>
              <!-- 解析 -->
              <div class="content">
                <embed :src="doc.docURL" class="doc-preview" />
                <!-- <canvas id="pdf" :ref="el => initCanvas(el, doc)" style="width: 100%; height: 180px;"></canvas> -->
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
              <!-- 深度记忆中 -->
              <div v-if="doc.isProcessing" class="glass-overlay">
                <div class="progress-info">
                  <div class="progress-text">深度记忆中{{ doc.progress }}%</div>
                </div>
              </div>

              <!-- 添加全局蒙层 -->
              <div
                v-if="isMemoryProcessing && !doc.isProcessing"
                class="glass-overlay memory-processing"
              >
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

        <!-- 分页 -->
        <div class="page" v-show="maxRepositoryPage>0">
          <el-pagination
            layout="prev, pager, next"
            :total="1000"
            :page-size="num"
            @current-change="pageChange"
            :page-count="maxRepositoryPage"
          />
        </div>
      </el-tab-pane>
      <el-tab-pane name="script">
        <template #label>
          <div :class="{ highlight: showHighlight.script }">
            <div class="main-title">数据库脚本</div>
            <div class="sub-title">({{ totalScript??0 }})</div>
          </div>
        </template>
        <el-row :gutter="20">
          <!-- Add New 按钮 -->
          <el-col :span="100">
            <el-upload
              action="/api/file/upload"
              :data="uploadData"
              :before-upload="beforeUpload"
              :on-success="handleSuccess"
              :on-progress="handleProgress"
              :on-error="handleError"
              accept=".pdf"
              :show-file-list="false"
              :multiple="true"
              :disabled="isMemoryProcessing"
              drag
              class="upload-card"
            >
              <el-card
                class="add-el-card"
                :style="{ width: '240px', height: '240px' }"
                :class="{ uploading: loading, disabled: isMemoryProcessing }"
              >
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
          <el-col :span="100" v-for="(doc, index) in script" :key="index">
            <el-card :style="{ width: '240px', height: '240px' }">
              <!-- 添加编辑图标和输入框 -->
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
                  <el-button
                    type="info"
                    plain
                    icon="Edit"
                    @click="editTag(doc)"
                    style="color: black"
                    >{{ doc.tags }}</el-button
                  >
                </template>
                <template v-if="doc.isEditing">
                  <el-input
                    v-model="doc.tags"
                    @blur="saveTag(doc)"
                    @keyup.enter="saveTag(doc)"
                    ref="tagText"
                    style="width: 100px"
                    :autofocus="true"
                  />
                  <div class="button">
                    <el-button
                      type="info"
                      @click="saveTag(doc)"
                      plain
                      style="color: black"
                      >√</el-button
                    >
                    <el-button
                      type="info"
                      @click="cancelEdit(doc)"
                      plain
                      style="color: black"
                      >x</el-button
                    >
                  </div>
                </template>
              </div>
              <!-- 标题 -->
              <div slot="header" class="title">
                <el-tooltip :content="doc.title" placement="top">
                  <span>{{ truncateFileName(doc.title, 9) }}</span>
                </el-tooltip>
              </div>
              <!-- 解析 -->
              <div class="content">
                <embed :src="doc.docURL" class="doc-preview" />
                <!-- <canvas id="pdf" :ref="el => initCanvas(el, doc)" style="width: 100%; height: 180px;"></canvas> -->
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
                  <el-progress
                    v-if="doc.isUploaded"
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
              <!-- 深度记忆中 -->
              <div v-if="doc.isProcessing" class="glass-overlay">
                <div class="progress-info">
                  <div class="progress-text">深度记忆中{{ doc.progress }}%</div>
                </div>
              </div>

              <!-- 添加全局蒙层 -->
              <div
                v-if="isMemoryProcessing && !doc.isProcessing"
                class="glass-overlay memory-processing"
              >
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

        <!-- 分页 -->
        <div class="page" v-show="maxScriptPage>0">
          <el-pagination
            layout="prev, pager, next"
            :total="1000"
            :page-size="num"
            @current-change="pageChange"
            :page-count="maxScriptPage"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>

  <!-- 添加PDF预览弹窗 -->
  <el-dialog
    v-model="previewVisible"
    title="PDF预览"
    width="80%"
    @closed="closePreview"
  >
    <div v-loading="previewLoading" class="pdf-preview-container">
      <canvas id="pdf-canvas" class="pdf-canvas"></canvas>
      <div v-if="!previewLoading" class="pdf-pagination">
        <el-button
          :disabled="currentPage <= 1"
          @click="
            currentPage--;
            renderPage(currentPage);
          "
        >
          上一页
        </el-button>
        <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
        <el-button
          :disabled="currentPage >= totalPages"
          @click="
            currentPage++;
            renderPage(currentPage);
          "
        >
          下一页
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import {
  ref,
  onMounted,
  getCurrentInstance,
  reactive,
  onUnmounted,
  computed
} from 'vue';
import { ElMessage } from 'element-plus';
// 修改PDF.js配置方式
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// 重新组织pdfjsLib对象
const pdfjsLib = {
  getDocument,
  GlobalWorkerOptions,
  version
};

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const { proxy } = getCurrentInstance();
const ws = ref(null);
const parseQueue = ref([]);
const isParsing = ref(false);
const localIP = ref('');
const previewVisible = ref(false);
const previewLoading = ref(false);

const currentPage = ref(1);
const totalPages = ref(0);
let pdfDoc = null;
onMounted(() => {
  getFileList();
  getTagList();
  getQuerySearch();
  // connectWebsocket();
  getPolicyList();
  getOfficialList();
  getReportList();
  getScriptList();
  getHandlebookList();
  getRepositoryList();
  getBookList();
   getLocalIP().then(ip => localIP.value = ip);
});

// 添加获取本机IP的方法
const getLocalIP = () => {
  return new Promise((resolve) => {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    
    pc.createOffer().then(sdp => {
      pc.setLocalDescription(sdp);
    }).catch(console.error);

    pc.onicecandidate = (ice) => {
      if (ice.candidate) {
        const ip = ice.candidate.address.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/)[0];
        pc.onicecandidate = null;
        pc.close();
        resolve(ip);
      }
    };
  });
};

// 分页
const page = ref(1);
const num = ref(23);

const maxPage = ref(1); //法律法规
const maxPolicyPage = ref(1); //政策解读
const maxHandlePage = ref(1); //用户手册
const maxScriptPage = ref(1); //数据库脚本
const maxOfficialPage = ref(1); //公文
const maxRepositoryPage = ref(1); //运维知识库
const maxReportPage = ref(1); //调研报告
const maxBookPage = ref(1); //图书

const totalFiles = ref(0);
const circleUrl = ref('/assets/images/avatar.png');
const activeName = ref('law');

const documents = ref([]); //法律法规
const handlebook = ref([]); //用户及操作手册
const repository = ref([]); //运维知识库
const script = ref([]); //数据库脚本
const policy = ref([]); //政策解读
const official = ref([]); //公文
const report = ref([]); //调研报告
const book = ref([]); //图书
const selectedTags = ref([]);
const isMemoryProcessing = ref(false); // 添加全局状态控制蒙层

const mapDocumentData = (item) => ({
  title: item.file_name,
  type: 'pdf',
  docURL: item.file_path,
  // docURL: `${localIP.value}:5173/uploads/pdf/${item.file_path}`,
  isProcessing: false, //深度记忆中
  isUploaded: false,
  uploadProgress: 0, //上传进度
  status: [1, 2].includes(item.status) ? '未记忆' : '已记忆', //记忆状态
  tags: item.tag, //二级标签
  parse: false,
  parseProgress: 0,
  finish: true,
  id: item.id, //数据库对应唯一id
  isMemory: item.status === 3,
  isEditing: false, //编辑状态
  progress: item.status === 3 ? 100 : 0,
  uid: 0
});

const getFileList = async () => {
  const result = await proxy.$GET({
    url: 'file/getfilelist',
    params: {
      page: page.value,
      num: num.value,
      type: 'law',
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

const totalPolicy = ref(0);
const getPolicyList = async () => {
  var result = await proxy.$GET({
    url: 'file/getpolicy',
    params: {
      page: page.value,
      num: num.value,
      type: 'policy',
      keywords: searchQuery.value ?? ''
    }
  });
  if (result.code === 0) {
    totalPolicy.value = 0;
    policy.value = [];
    return false;
  }
  maxPolicyPage.value = Math.ceil(result.data.count / num.value);
  totalPolicy.value = result.data.count;
  policy.value = result.data.data.map(mapDocumentData);
};

const totalOfficial = ref(0);
const getOfficialList = async () => {
  var result = await proxy.$GET({
    url: 'file/getofficial',
    params: {
      page: page.value,
      num: num.value,
      type: 'official',
      keywords: searchQuery.value ?? ''
    }
  });
  if (result.code === 0) {
    totalOfficial.value = 0;
    policy.value = [];
    return false;
  }
  maxOfficialPage.value = Math.ceil(result.data.count / num.value);
  totalOfficial.value = result.data.count;
  official.value = result.data.data.map(mapDocumentData);
};

const totalReport = ref(0);
const getReportList = async () => {
  var result = await proxy.$GET({
    url: 'file/getreport',
    params: {
      page: page.value,
      num: num.value,
      type: 'report',
      keywords: searchQuery.value ?? ''
    }
  });
  if (result.code === 0) {
    totalReport.value = 0;
    report.value = [];
    return false;
  }
  maxReportPage.value = Math.ceil(result.data.count / num.value);
  totalReport.value = result.data.count;
  report.value = result.data.data.map(mapDocumentData);
};

const totalBook = ref(0);
const getBookList = async () => {
  var result = await proxy.$GET({
    url: 'file/getbook',
    params: {
      page: page.value,
      num: num.value,
      type: 'book',
      keywords: searchQuery.value ?? ''
    }
  });
  if (result.code === 0) {
    totalBook.value = 0;
    book.value = [];
    return false;
  }
  maxBookPage.value = Math.ceil(result.data.count / num.value);
  totalBook.value = result.data.count;
  book.value = result.data.data.map(mapDocumentData);
};

const totalHandleBook = ref(0);
const getHandlebookList = async () => {
  var result = await proxy.$GET({
    url: 'file/gethandlebook',
    params: {
      page: page.value,
      num: num.value,
      type: 'handlebook',
      keywords: searchQuery.value ?? ''
    }
  });
  if (result.code === 0) {
    totalHandleBook.value = 0;
    handlebook.value = [];
    return false;
  }
  maxHandlePage.value = Math.ceil(result.data.count / num.value);
  totalHandleBook.value = result.data.count;
  handlebook.value = result.data.data.map(mapDocumentData);
};

const totalRepository = ref(0);
const getRepositoryList = async () => {
  var result = await proxy.$GET({
    url: 'file/getrepository',
    params: {
      page: page.value,
      num: num.value,
      type: 'repository',
      keywords: searchQuery.value ?? ''
    }
  });
  if (result.code === 0) {
    totalRepository.value = 0;
    repository.value = [];
    return false;
  }
  maxRepositoryPage.value = Math.ceil(result.data.count / num.value);
  totalRepository.value = result.data.count;
  repository.value = result.data.data.map(mapDocumentData);
};

const totalScript = ref(0);
const getScriptList = async () => {
  var result = await proxy.$GET({
    url: 'file/getscript',
    params: {
      page: page.value,
      num: num.value,
      type: 'script',
      keywords: searchQuery.value ?? ''
    }
  });
  if (result.code === 0) {
    totalScript.value = 0;
    script.value = [];
    return false;
  }
  maxScriptPage.value = Math.ceil(result.data.count / num.value);
  totalScript.value = result.data.count;
  script.value = result.data.data.map(mapDocumentData);
};

const connectWebsocket = async () => {
  try {
    if (ws.value) {
      ws.value.close();
    }

    ws.value = new WebSocket('ws://192.168.6.185:8000/ws');
    ws.value.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };

    ws.value.onopen = () => {
      console.log('WebSocket连接已建立');
      setupWebSocketHandler();
    };
  } catch (error) {
    console.error('WebSocket连接失败:', error);
  }
};

const searchQuery = ref('');
const tags = ref([]);
const selectedTagsMap = reactive({});

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

// 上传相关状态
const loading = ref(false);

// 添加上传类型参数
const uploadData = computed(() => ({
  type: activeName.value
}));

// 在beforeUpload中更新参数
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

  const newDocument = {
    title: file.name,
    type: 'pdf',
    docURL: '',
    isProcessing: false,
    isUploaded: true,
    uploadProgress: 0,
    status: '未记忆',
    tags: '',
    parse: false,
    parseProgress: 0,
    finish: false,
    id: 0,
    isMemory: false,
    isEditing: false,
    progress: 0,
    uid: file.uid 
  };

  const targetArray = {
    law: documents,
    policy: policy,
    repository: repository,
    script: script,
    official: official,
    report: report,
    book: book,
    handlebook: handlebook
  }[activeName.value]?.value;

  if (targetArray) {
    targetArray.unshift(newDocument);
  } else {
    console.error('未知的文档分类:', activeName.value);
    return false;
  }

  return true;
};

const handleProgress = (event, file) => {
  const findInArray = (arr) => arr.value.find((d) => d.uid === file.uid);
  const targetDoc =
    findInArray(documents) ||
    findInArray(policy) ||
    findInArray(repository) ||
    findInArray(script) ||
    findInArray(official) ||
    findInArray(report) ||
    findInArray(book);
  if (targetDoc) {
    targetDoc.uploadProgress = event.percent;
  }
};

const handleSuccess = async (response, uploadFile) => {
  loading.value = false;

  const counterMap = {
    law: totalFiles,
    policy: totalPolicy,
    official: totalOfficial,
    repository: totalRepository,
    script: totalScript,
    report: totalReport,
    book: totalBook,
    handlebook: totalHandleBook
  }[activeName.value];

  if (counterMap) {
    counterMap.value++;
  }

  const targetArrayMap = {
    law: documents,
    policy: policy,
    repository: repository,
    script: script,
    official: official,
    report: report,
    book: book
  }[activeName.value]?.value;

  if (targetArrayMap) {
    const targetDoc = targetArrayMap.find((d) => d.uid === uploadFile.uid);
    if (targetDoc) {
      targetDoc.docURL = response.data.url;
      //  targetDoc.docURL = `${localIP.value}:5173/uploads/pdf/${response.data.url}`;
      targetDoc.id = response.data.id;
      setTimeout(() => {
        targetDoc.isUploaded = false;
      }, 500);
    }
  }

  return;

  // 发送消息前检查连接状态
  if (ws.value?.readyState !== WebSocket.OPEN) {
    // ElMessage.warning('websocket连接未就绪');
    console.log('websocket连接未就绪');
    return;
  }

  // 获取上传文件对象
  const file = uploadFile.raw;

  // 转换为Base64后加入队列
  const base64Data = await fileToBase64(file);
  addToParseQueue({
    id: response.data.id,
    file: uploadFile.raw,
    base64Data,
    type: activeName.value
  });
};

const setupWebSocketHandler = () => {
  if (!ws.value) return;

  ws.value.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    if (data.status === 'error') {
      ElMessage.error(data.message);

      parseQueue.value = parseQueue.value.filter((item) => item.id != data.id);
      try {
        const result = await proxy.$GET({
          url: 'file/deletefile',
          params: { id: data.id }
        });

        if (result.code === 1) {
          documents.value = documents.value.filter((d) => d.id != data.id);
          isParsing.value = false;
          startNextParse();
        }
      } catch (error) {
        console.error('删除文件失败:', error);
        isParsing.value = false;
        startNextParse();
      }
    } else {
      const targetDoc = documents.value.find((d) => d.id === data.id);

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
    }
  };
};

const startNextParse = () => {
  if (parseQueue.value.length === 0 || isParsing.value) return;

  isParsing.value = true;
  const currentDoc = parseQueue.value[0];

  const targetDoc = documents.value.find((d) => d.id === currentDoc.id);

  if (targetDoc) {
    targetDoc.parse = true;
    sendViaWebSocket({
      type: 'parse',
      filename: currentDoc.file.name,
      id: currentDoc.id,
      data: currentDoc.base64Data ? currentDoc.base64Data : ''
    });
  } else {
    parseQueue.value.shift();
    isParsing.value = false;
    startNextParse();
  }
};

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
    reader.onload = () => resolve(reader.result.split(',')[1]); 
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const sendViaWebSocket = (data) => {
  if (ws.value?.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify(data));
  } else {
    console.error('WebSocket连接未就绪');
  }
};

const handleError = (err) => {
  loading.value = false;
  ElMessage.error(`上传失败: ${err.message}`);
};

const deepMemory = async (doc) => {
  if (doc.progress === 100) {
    ElMessage.success('已提取知识');
    return;
  }

  isMemoryProcessing.value = true; 
  simulateProgress(doc);
};

const simulateProgress = async (doc) => {
  if (!doc.isProcessing) {
    doc.isProcessing = true;
    sendViaWebSocket({
      type: 'deepMemory',
      filename: doc.title,
      id: doc.id
    });
  }
};

const pdfUrl = ref('');

const previewPdf = async (doc) => {
  previewVisible.value = true;
  previewLoading.value = true;
  pdfUrl.value = doc.docURL;

  try {
    const loadingTask = pdfjsLib.getDocument(pdfUrl.value);
    pdfDoc = await loadingTask.promise;
    totalPages.value = pdfDoc.numPages;
    await renderPage(currentPage.value);
  } catch (error) {
    ElMessage.error('PDF加载失败: ' + error.message);
    previewVisible.value = false;
  } finally {
    previewLoading.value = false;
  }
};

const renderPage = async (num) => {
  if (!pdfDoc || num < 1 || num > totalPages.value) return;

  const page = await pdfDoc.getPage(num);
  const canvas = document.getElementById('pdf-canvas');
  const context = canvas.getContext('2d');

  const viewport = page.getViewport({ scale: 1.5 });
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
};

const closePreview = () => {
  previewVisible.value = false;
  if (pdfDoc) {
    pdfDoc.destroy();
    pdfDoc = null;
  }
};

const tagText = ref(null);

const a = ref('');

const editTag = async (doc) => {
  doc.isEditing = true;
  a.value = doc.tags;
};

const saveTag = async (doc) => {
  if (doc.tags === '') {
    doc.isEditing = false;
    return;
  }

  var result = await proxy.$POST({
    url: 'file/edittag',
    params: { id: doc.id, tag: doc.tags }
  });
  if (result.code === 1) {
    if (!tags.value.includes(doc.tags)) {
      tags.value = tags.value.filter((item) => item !== a.value);
      tags.value.push(doc.tags);
    }

    doc.isEditing = false;
  } else {
    doc.isEditing = false;
  }
};

const cancelEdit = (doc) => {
  doc.isEditing = false;
};

const pageChange = async (data) => {
  page.value = data;
  const targetArrayMap = {
    law: getFileList,
    policy: getPolicyList,
    official: getOfficialList,
    repository: getRepositoryList,
    script: getScriptList,
    report: getReportList,
    book: getBookList,
    handlebook: getHandlebookList
  }[activeName.value];

  if (targetArrayMap) {
    targetArrayMap();
  }
};

const showHighlight = reactive({
  law: false,
  policy: false,
  official: false,
  report: false,
  book: false,
  handlebook: false,
  repository: false,
  script: false
});

const searchDocuments = async () => {
  if (searchQuery.value === '') {
    return false;
  }
  page.value = 1;
  await Promise.all([
    getFileList(),
    getPolicyList(),
    getOfficialList(),
    getReportList(),
    getBookList(),
    getHandlebookList(),
    getRepositoryList(),
    getScriptList()
  ]);

  showHighlight.law = totalFiles.value > 0;
  showHighlight.policy = totalPolicy.value > 0;
  showHighlight.official = totalOfficial.value > 0;
  showHighlight.report = totalReport.value > 0;
  showHighlight.book = totalBook.value > 0;
  showHighlight.handlebook = totalHandleBook.value > 0;
  showHighlight.repository = totalRepository.value > 0;
  showHighlight.script = totalScript.value > 0;
};

const restaurants = ref([]);
const querySearch = (queryString, cb) => {
  const results = queryString
    ? restaurants.value.filter(createFilter(queryString))
    : restaurants.value;
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
  selectedTags.value = [];
  page.value = 1;
  getFileList();
  getPolicyList();
  getBookList();
  getHandlebookList();
  getOfficialList();
  getReportList();
  getRepositoryList();
  getScriptList();
  Object.keys(showHighlight).forEach((key) => {
    showHighlight[key] = false;
  });
};

const handleSelect = (item) => {
  console.log(item);
};

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

const logout = () => {
  proxy.$router.push('/');
};

const handleClick = (tab, event) => {
  activeName.value = tab.props.name;
};

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
