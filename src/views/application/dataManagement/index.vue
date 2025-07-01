<template>
  <div class="page-content">
    <a-header
      :auth="{ add: 'dataSoure-list-add' }"
      :placeholderText="'请输入文件名称'"
      :isShowBread="false"
      :isShowPageTitle="false"
      :tabList="tabList"
      :tabActiveKey="activeKey"
      @tab-change="onTabClick"
      @create="handCreate"
      @reload="handReload"
      @search="handSearch"
    ></a-header>
    <a-table :columns="columns" :data-source="tableList" :rowKey="(record) => record.id"
      :pagination="pagination" :loading="tableLoading" @change="handleTableChange">
      <span slot="fileType" slot-scope="value">
        {{ FILETYPE.get(value) || '' }}
      </span>
      <span slot="isPublic" slot-scope="isPublic">
        <a-tag color="green" v-if="isPublic">是</a-tag>
        <a-tag color="orange" v-else>否</a-tag>
      </span>
      <span slot="createTime" slot-scope="value">
        {{ value | moment }}
      </span>
      <span slot="updateTime" slot-scope="value">
        {{ value | moment }}
      </span>
      <span slot="operate" slot-scope="record,text,index">
        <a v-action:image-list-edit v-show="record.fileType==2" @click="() => handleAnnotateImg(record)">标注</a>
        <a v-action:image-list-edit @click="() => handleUpdateFile(record)" style="margin-left: 10px">更新</a>
        <a v-action:image-list-download @click="() => handleDownloadFile(record)" style="margin-left: 10px">下载</a>
        <a-popconfirm
          title="Are you sure delete this file?"
          @confirm="handleDeleteFile(record, index)"
        >
          <a v-action:image-list-delete danger style="margin-left: 10px">删除</a>
        </a-popconfirm>
      </span>
    </a-table>
    <!-- 导入/更新下发文件 -->
    <import-file-dialog :visible.sync = "showUploadDialog" @upload-success="handReload" ref="importFileDialog"></import-file-dialog>
    <!-- 图片标注 -->
    <annotator-model :is-show.sync="showAnnotatorModal" :record="currentRecord"></annotator-model>
  </div>
</template>

<script>
import { getFilesList, removeFileById, downloadFileById } from '@/api/cloud.js'
import ImportFileDialog from './importFileDialog.vue'
import { FILETYPE } from '../constant.js'
import { transferCols } from '../columns.js'
import AnnotatorModel from './annotatorModel.vue' 

export default {
  name: 'DataManagement',
  components: {
    ImportFileDialog,
    AnnotatorModel
  },
  props:{
    tabList: {
      type: Array,
      default: [],
    },
    activeKey: {
      type: String,
      default: '',
    }
  },
  data() {
    return {
      tableList: [],
      pagination: {
        pageSize: 10,
        current: 1,
        total: 0
      },
      columns: transferCols,
      tableLoading: false,
      showUploadDialog: false,
      searchWord: '',
      FILETYPE,
      showAnnotatorModal: false,
      currentRecord: {}
    }
  },
  methods: {
    handleTableChange(pagination, filters, sorter) {
      this.pagination.current = pagination.current
      this.pagination.pageSize = pagination.pageSize
      this.loadTableList()
    },
    loadTableList() {
      const { pageSize, current } = this.pagination
      this.tableLoading = true
      getFilesList({
        limit: pageSize,
        pageNo: current,
        name: this.searchWord.trim(),
        fileType: '',  //文件类别
        category: '', //细分类
        appId: this.$route?.query?.appId || '',
      }).then(res => {
        if (res.code == 0) {
          this.tableList = res?.data?.records || []
          this.pagination.total = res?.data?.total
        }
      }).finally(() => {
        this.tableLoading = false
      })
    },
    handleUpdateFile(record) {
      this.$refs.importFileDialog.setState(record)
      this.showUploadDialog = true

      // updateFileById()
    },
    // 下载下发文件
    handleDownloadFile(record) {
      const loading = this.$loading({
        lock: true,
        text: '下载中',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.5)'
      });
      downloadFileById(record.id).then(res => {
        if ("download" in document.createElement("a")) {
          // 不是IE浏览器
          let url = window.URL.createObjectURL(res);
          let link = document.createElement("a");
          link.style.display = "none";
          link.href = url;
          link.setAttribute("download", record.name);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link); // 下载完成移除元素
          window.URL.revokeObjectURL(url); // 释放掉blob对象
        } else {
          // IE 10+
          window.navigator.msSaveBlob(res, fileName);
        } 
      }).finally(() => {
        loading.close()
      })
    },
    // 删除下发文件
    handleDeleteFile(record) {
      removeFileById(record.id).then(res => {
        if(res.code == 0) this.handReload()
        this.$message.success(`文件${record.name}已删除`)
      })
    },
    // 标注图片
    handleAnnotateImg(record) {
      this.currentRecord = record
      this.showAnnotatorModal = true
    },
    handCreate() {
      this.showUploadDialog = true
    },
    handReload() {
      this.pagination.current = 1
      this.loadTableList()
    },
    handSearch(value) {
      this.pagination.current = 1
      this.searchWord = value
      this.loadTableList()
    },
    onTabClick(e) {
      this.$emit("tab-change", e);
    }
  },
  created() {
    this.loadTableList()
  }
}
</script>

<style lang="scss" scoped></style>