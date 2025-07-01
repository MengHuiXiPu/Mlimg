<template>
  <div style="">
    <el-tabs v-model="tabActiveKey">
      <el-tab-pane label="文件存储源" name="1">
        <div class="toolbar space-between">
          <el-form :inline="true" :model="searchFormData" size="small" ref="refSearchForm" @submit.native.prevent @keyup.enter.native="handleSearch">
            <el-form-item label="名称" prop="name">
              <el-input v-model="searchFormData.name" placeholder="请输入" clearable></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="$event=>handleSearch($event)">查询</el-button>
              <el-button type="primary" plain @click="handleSearch($event, true)">重置</el-button>
            </el-form-item>
          </el-form>
          <div style="margin-bottom: 18px;">
            <el-button type="primary" @click="handCreate">新建数据源</el-button>
          </div>
        </div>
        <a-table
          :scroll="{
            y: 560
          }"
          v-resize
          :columns="columns"
          :data-source="tableData"
          :pagination="pagination.total > 10 ? pagination : false"
          :loading="loading"
          @change="tableDataChange"
          :rowKey="record => record.id"
        >
          <!-- <template slot="status" slot-scope="text">
            <a-tag v-if="Number(text) === 1" :color="'green'">成功</a-tag>
            <a-tag v-else-if="Number(text) === 2" :color="'red'">失败</a-tag>
            <a-tag v-else>未测试</a-tag>
          </template> -->
          <span slot="operate" slot-scope="record,text,index">
            <a v-action:dataSoure-list-edit @click="() => handleEdit(record)">编辑</a>
            <a-divider v-action:dataSoure-list-edit type="vertical" />
            <a v-action:dataSoure-list-delete @click="() => handleDelete(record,index)">删除</a>
          </span>
        </a-table>
      </el-tab-pane>
      <el-tab-pane label="消息队列源" name="2">
        <rv-source-panel></rv-source-panel>
      </el-tab-pane>
    </el-tabs>
  

    <addEditDialog
      :visible.sync="dataSetVisible"
      :parentData.sync="parentData"
      :dataName="dataName"
      :pageData="pagination.length > 10 ? pagination : false"
      :dataSetTitle="dataSetTitle"
      @getDataList="getDataList"
      @cancel="dataSetVisible = false"
    ></addEditDialog>
  </div>
</template>

<script>
import moment from 'moment'
import { deleteDataSoure, getDataSoureList, saveDataSoure, getTaskList } from '@/api/dataCenter'
import RVSourcePanel from './RVSourcePanel.vue'

const columns = [
  { title: "ID", dataIndex: "id", key: "id", align: "left" },
  // { title: "连接状态", dataIndex: "status", key: "status", scopedSlots: { customRender: "status" } },
  { title: "数据源名称", dataIndex: "dsName", key: "dsName", ellipsis: true, align: "left" },
  {
    title: "连接类型",
    dataIndex: "dsType",
    key: "dsType",
    align: "left",
    filters: [
      {
        text: "NAS",
        value: "NAS"
      },
      {
        text: "NFS",
        value: "NFS"
      },
      {
        text: "RV",
        value: "RV"
      },
      {
        text: "KAFKA",
        value: "KAFKA"
      }
    ],
    filterMultiple: false
  },
  { title: "描述", dataIndex: "dsDescribe", key: "dsDescribe", ellipsis: true, align: "left"},
  {
    title: "操作",
    dataIndex: "",
    key: "x",
    scopedSlots: { customRender: "operate" },
    align: "right"
  }
]

export default {
  name: "DataSoure",
  components: {
    addEditDialog: () => ({ component: import('./addEditDataSoure') }),
    "rv-source-panel": RVSourcePanel,
  },
  data () {
    return {
      tabActiveKey: "1",
      tableData: [],
      columns,
      dataSetVisible: false,
      dataSetTitle: "",
      parentData: {},
      pagination: {
        total: 0,
        pageSize: 10,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "30", "50"],
        showTotal: function (total) {
          return `共 ${total} 条`
        }
      },
      loading: false,
      dataName: '',
      searchFormData: {
        name: '',
      }
    }
  },
  mounted () {
    this.getDataList()
  },
  methods: {
    handCreate () {
      this.parentData = {
        dsName: "",
        dsType: "NAS",
        protocolType: 0,
        dsDescribe: "",
        dsPort: '',
        dsSubject: '',
        dsIp: '',
        dsDataFormat: '',
        status: 3,
        reservedFields2: '/'
      }
      this.dataName = ''
      this.dataSetTitle = "新建数据源"
      this.$nextTick(() => {
        this.dataSetVisible = true
      })
    },
    async getDataList (data) {
      this.loading = true
      try{
      const params = {
        limit: data?.pageSize || 10,
        pageNo: data?.pageIndex || 1,
        dsType: data?.type || "",
        dsName: data?.search || ""
      }
      const responseData = await getDataSoureList(params)
      if (responseData.code === 0) {
        this.loading = false
        this.tableData = responseData.data.records
        this.pagination.total = responseData.data.total
      } else {
        this.loading = false
      }
      }catch(e){
        this.loading = false
      }
    },
    tableDataChange (pagination, filters) {
      this.getDataList({
        pageSize: pagination.pageSize,
        pageIndex: pagination.current,
        dsName: this.search,
        type: filters?.dsType ? filters.dsType[0] : ""
      })

      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
    },
    handleEdit (rowData) {
      this.parentData = JSON.parse(JSON.stringify(rowData))
      this.dataName = JSON.parse(JSON.stringify(rowData)).dsName
      this.dataSetTitle = "编辑数据源"
      this.$nextTick(() => {
        this.dataSetVisible = true
      })
    },
    renderTaskList (taskList) {
      const task1 = taskList.relyedDatalistInfoList ? taskList.relyedDatalistInfoList.map(item => {
        return <p>
          <span class="taskName">{ item.dataListName }</span>
          <span class="taskType">数据集</span>
          <span class="taskTime">{ moment(item.createTime).format('YYYY-MM-DD HH:mm:ss') }</span>
        </p>
      }) : ''
      const task2 = taskList.relyedFileSourceInfoList ? taskList.relyedFileSourceInfoList.map(item => {
        return <p>
          <span class="taskName">{ item.fileSourceName }</span>
          <span class="taskType">文件源</span>
          <span class="taskTime">{ moment(item.createTime).format('YYYY-MM-DD HH:mm:ss') }</span>
        </p>
      }) : ''
      const task3 = taskList.relyedMessageSourceInfoList ? taskList.relyedMessageSourceInfoList.map(item => {
        return <p>
          <span class="taskName">{ item.name }</span>
          <span class="taskType">消息源</span>
          <span class="taskTime">{ moment(item.createTime).format('YYYY-MM-DD HH:mm:ss') }</span>
        </p>
      }) : ''
      return <div class="task">
        <h4>当前数据源被以下资源依赖，请先删除下列资源再删除该数据源：</h4>
        <div class="taskList">
          <p>
            <span class="taskName">名称</span>
            <span class="taskName">类型</span>
            <span class="taskTime">发布时间</span>
          </p>
          { task1 }
          { task2 }
          { task3 }
        </div>
      </div>
    },
    async handleDelete (rowData, index) {
      let taskList = []
      const res = await getTaskList({
        id: rowData.id
      })
      console.log("handleDelete res: ", res)
      if (res.code !== 0) return false
      taskList = Object.keys(res.data).filter(item => res.data[item]).length === 0 ? [] : res.data
      const that = this
      const content = taskList.length === 0 ? '此操作将永久删除，请确认是否删除?' : this.renderTaskList(taskList)
      this.$confirm({
        title: taskList.length === 0 ? `确定要删除 ${rowData.dsName} 吗?` : '提示',
        content,
        cancelText: '取消',
        okText: '确定',
        width: 600,
        okButtonProps: {
          props: { disabled: taskList.length !== 0 },
        },
        onOk () {
          deleteDataSoure(rowData.id)
              .then((res) => {
                if (res.code === 0) {
                  that.$message.success('删除成功!')
                  if (that.tableData.length === 1 && that.pagination.total !== 1) that.pagination.current--
                  that.getDataList({
                    pageIndex: that.pagination.current,
                    pageSize: that.pagination.pageSize
                  })
                }
              })
        },
        onCancel () {},
      })
    },
    /**
     * 
     * @param {*} reset 是否重置表单
     */
    handleSearch(event, reset = false) {
      if(reset) {
        this.$refs.refSearchForm.resetFields()
      }
      this.pagination.current = 1;
      this.getDataList({
        search: this.searchFormData.name
      });
    }
  }
}
</script>

<style lang="less" scoped>
/deep/ .taskList{
  overflow-y: auto;
  max-height: 250px;
  &>p>*{
    display: inline-block;
    width: 33%
  }
  .taskName,.taskTime{
  }
}
/deep/ .el-tabs__nav-wrap {
  width: 185px;
}
</style>
