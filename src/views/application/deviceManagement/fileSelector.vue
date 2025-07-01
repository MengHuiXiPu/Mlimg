<template>
  <div class="component-container">
    <a-input-search placeholder="请输入文件名称检索" class="input-search" v-model="searchWord" @search="onSearch" />
    <a-table :columns="columns" :data-source="tableList" :rowKey="(record) => record.id" :pagination="pagination"
      :loading="tableLoading" @change="handleTableChange" :scroll="{y: 380 }"
      :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }">
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
    </a-table>
    <!-- 已选择文件展示 -->
    <h4 class="el-tabs__item" style="margin-bottom: 0;">已选择文件：</h4>
    <el-card shadow="hover">
      <el-tag v-for="tag in selectedFiles" class="selected-file-tag" :key="tag.name" closable @close="removeFile(tag)">
        {{ tag.name }}</el-tag>
    </el-card>
    <div class="footer">
      <a-button type="primary" @click="nextStep" class="btnStep">下一步</a-button>
      <a-button style="margin-left: 10px;" @click="cancel" class="btnStep">取消</a-button>
    </div>
  </div>
</template>

<script>
import { transferCols } from '../columns.js'
import { FILETYPE } from '../constant.js'
import { getFilesList } from '@/api/cloud.js'
import debounce from 'lodash.debounce'
export default {
  data() {
    return {
      tableList: [],
      pagination: {
        pageSize: 10,
        current: 1,
        total: 0
      },
      columns: [],
      tableLoading: false,
      FILETYPE,
      searchWord: '',
      selectedFiles: [],  //已选择的文件列表
      selectedRowKeys: []
    }
  },
  props: {
    transferData: {
      type: Object,
      default: () => ({})
    },
  },
  watch: {
    // 合并接口保存选择的文件信息到selectedRowKeys和selectedFiles
    transferData:  {
      deep: true,
      handler(val) {
        if(val.fileIds && val.fileIds.length > 0) {
          val.fileIds.forEach((id, index ) => {
            this.selectedRowKeys.push(id)
            this.selectedFiles.push({
              id,
              name: val.fileNames[index]
            })
          })
        }
      },
      immediate: true
    }
  },
  methods: {
    onSearch: debounce(function () {
      this.pagination.current = 1
      this.loadTableList()
    }, 500),
    // onSearch() {
    //   this.pagination.current = 1
    //   this.loadTableList()
    // },
    onSelectChange(selectedRowKeys, selectedRows,) {
      this.selectedRowKeys = selectedRowKeys;
      this.selectedFiles = selectedRows
    },
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
        category: '' //细分类
      }).then(res => {
        if (res.code == 0) {
          this.tableList = res?.data?.records || []
          this.pagination.total = res?.data?.total
        }
      }).finally(() => {
        this.tableLoading = false
      })
    },
    // 点击已选择文件的×  移除已选择
    removeFile(file) {
      const fileIndex = this.selectedFiles.findIndex(f => f.id === file.id)
      const keyIndex = this.selectedRowKeys.findIndex(f => f === file.id)
      this.selectedFiles.splice(fileIndex, 1)
      this.selectedRowKeys.splice(keyIndex, 1)
    },
    nextStep() {
      if (!this.selectedFiles.length) {
        this.$message.warning('请选择文件')
        return
      }
      // 更新选择的文件到父组件
      this.$emit('collect-data', 'file', this.selectedFiles)
    },
    cancel() {
      this.$router.back()
    }
  },
  created() {
    // 移除表格《操作》列
    this.columns = [...transferCols].slice(0 ,transferCols.length -1)
    this.loadTableList()
  },
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
.component-container {
  height: calc(100vh - 230px);
  position: relative;
  .footer {
    position: absolute;
    bottom: 0px;
    right: 10px;
    .btnStep {
      width: @nextStepWidth;
      height: @nextStepHeight;
      color: @nextStepColor;
      background-color: @nextStepBgc;
      border-radius: @borderRadiusSmall;
    }
  }
}
.selected-file-tag {
  height: 32px;
  line-height: 30px;
  margin: 0 10px;
}
.input-search {
  width: 300px;
  margin: 20px 0;
}
</style>