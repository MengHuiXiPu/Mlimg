<template>
  <div>
    <a-modal title="模型选择" :visible="showDialog" @ok="handleOk" @cancel="handleCancel" destroyOnClose v-bind="$attrs">
      <div class="container">
        <a-input-group compact size="large">
          <!-- <a-select default-value="Option1" v-model="keyType">
            <a-select-option value="Option1">  模型名称 </a-select-option>
            <a-select-option value="Option2">  算法模版 </a-select-option>
          </a-select> -->
          <a-input-search placeholder="input search text" v-model="searchWord" style="width: 440px" @search="onSearch"
            size="large" />
        </a-input-group>
        <!--  -->
        <a-table size="small" :columns="columns" :data-source="tableList" :row-selection="rowSelection"
          :rowKey="(record) => record.id" :pagination="pagination" :loading="loading" @change="handleTableChange" />
      </div>
      <template slot="footer">
        <p style="position: absolute;">已选模型：{{ selectedModel.modelName }}</p>
        <a-button key="back" @click="handleCancel"> 取消</a-button>
        <a-button key="submit" type="primary" :loading="loading" @click="handleOk">确定</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script>
import { getModelTableList, getModelInfoById } from "@/api/modelManage"
export default {
  name: 'OnnxModelSelector',
  data() {
    return {
      showDialog: false,
      keyWord: '',
      // keyType: 'Option1',
      columns: [{
        title: "模型名称",
        dataIndex: "modelName",
        key: "modelName",
        width: "40%",
      },
      {
        title: "算法模板",
        dataIndex: "imageName",
        key: "imageName",
      }],
      tableList: [],
      pagination: {
        pageSize: 10,
        current: 1,
        total: 0
      },
      selectedModel: {},  // 选中的模型
      loading: false,
      searchWord: '',
      state: {}, // 用于存储model开启关闭状态对应的promise的resolve和reject
      tagType: "",  // 模型分类过滤条件(分类 or 目标检测)
    }
  },
  computed: {
    rowSelection() {
      return {
        type: "radio",
        onChange: (selectedRowKeys, selectedRows) => {
          this.selectedModel = selectedRows.length && selectedRows[0];
        },
      };
    },
  },
  methods: {
    handleTableChange(pagination, filters, sorter) {
      this.pagination.current = pagination.current
      this.pagination.pageSize = pagination.pageSize
      this.loadList()
    },
    loadList() {
      const { pageSize, current } = this.pagination
      this.loading = true
      getModelTableList({
        limit: pageSize,
        pageNo: current,
        modelName: this.searchWord.trim(),
        tagType: this.tagType,
        modelType: 1,  //通用模型
        taskStatus: 2  //已完成训练的模型
      }).then(res => {
        if (res.code == 0) {
          this.tableList = res?.data?.records || []
          this.pagination.total = res?.data?.total
        }
      }).finally(() => {
        this.loading = false
      })
    },
    onSearch(value) {
      this.pagination.current = 1
      this.loadList()
    },
    /**
     * @public
     * @description: 显示model，返回promise
     */
    invokeModel(params) {
      const { modelId, tagType = "" } = params
      this.showDialog = true
      this.tagType = tagType
      if (modelId) { //需要反显已选择的模型
        getModelInfoById(modelId).then(res => {
          if (res.code == 0) {
            this.selectedModel = res.data
          }
        })
      }
      this.loadList()
      return new Promise((resolve, reject) => {
        this.state = {
          resolve,
          reject
        }
      })
    },
    handleOk() {
      this.showDialog = false
      // 关闭弹框  resolve state
      this.state.resolve(this.selectedModel)
    },
    handleCancel() {
      this.showDialog = false
      // 关闭弹框  reject state
      this.state.reject('cancel select onnx model')
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 500px;
}
</style>