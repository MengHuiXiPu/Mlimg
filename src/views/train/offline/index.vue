<template>
  <div class="page-content">
    <el-tabs v-model="tabActiveKey" @tab-click="tabOnChange" style="width: 250px;">
      <el-tab-pane label="通用模型" name="1"></el-tab-pane>
      <el-tab-pane label="业务模型" name="2"></el-tab-pane>
      <el-tab-pane label="解决方案" name="3"></el-tab-pane>
    </el-tabs>
    <!-- 查询表单 -->
    <div class="toolbar space-between">
      <el-form :inline="true" :model="searchFormData" size="small" ref="refSearchForm" @submit.native.prevent @keyup.enter.native="handSearch">
        <el-form-item label="名称" prop="name">
          <el-input v-model="searchFormData.name" placeholder="请输入" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handSearch">查询</el-button>
          <el-button type="primary" plain @click="handReload">重置</el-button>
        </el-form-item>
      </el-form>
      <div style="margin-bottom: 18px;" v-if="['1', '2'].includes(tabActiveKey)">
        <el-button type="primary" @click="handCreate">新建任务</el-button>
      </div>
    </div>
    <step-layout class="mainContent">
      <template slot="leftOffline" v-if="false">
        <tree
            ref="tree"
            :tabActiveKey="tabActiveKey"
            :url-object="treeApi"
            @searchData="searchData"
            :total="total"
            :isHover="false"
        />
      </template>
      <template slot="rightOffline">
        <a-table
            v-resize
            :scroll="{y: 550}"
            :rowKey="(record)=>record.id"
            :columns="columns"
            :data-source="data"
            @change="handleChange"
            :loading="loading"
            :pagination="pagination.total > 10 ? pagination : false"
        >
          <span
              slot="modelName"
              slot-scope="text, record"
              :title="`${text}(${record.modelVersionLabel})`"
          >
            {{ `${text}(${record.modelVersionLabel})` }}
          </span>
          <span slot="modelSchedule" slot-scope="text, record">
            <a-progress v-if="(record.taskStatus === 1 || record.taskStatus === 2) && record.modelSchedule != 0" :percent="record.modelSchedule" />
             <a-popover overlayClassName="modelSchedule" placement="left">
              <template slot="content">
                <a-alert
                    message="info"
                    :description="record.remark || '资源调度中,请稍等'"
                    type="info"
                    show-icon
                />
              </template>
              <a-tag v-if="record.taskStatus === 1 && record.modelSchedule == 0" style="cursor: pointer;" :color="'blue'">{{record.remark || '资源调度中'}}</a-tag>
            </a-popover>

            <a-popover overlayClassName="modelSchedule" placement="left">
              <template slot="content">
                <a-alert
                    message="Error"
                    :description="record.remark || '未知原因，请联系管理员'"
                    type="error"
                    show-icon
                />
              </template>
              <a-tag v-if="record.taskStatus === 3" style="cursor: pointer;" :color="'red'">异常终止</a-tag>
            </a-popover>
            <a-tag v-if="record.taskStatus === 4" style="cursor: pointer;" :color="'red'">手动终止</a-tag>
          </span>
          <span slot="action" slot-scope="text, record">
            <a
                :disabled="record.modelSchedule < 100 || record.taskStatus === 3 ? true : false"
                @click="toReport(record)"
                style="margin-right: 5px"
            >
              查看报告
            </a>
            <a-dropdown>
              <a @click="e => e.preventDefault()">
                更多
              </a>
              <a-menu slot="overlay">
                <a-menu-item v-action:offline-list-delete @click="onDelModel(record)">
                  <span>删除</span>
                </a-menu-item>
                <a-menu-item v-action:offline-list-delete @click="onRename(record)">
                  <span>重命名</span>
                </a-menu-item>
                <a-menu-item v-action:offline-list-end @click="stop(record)" :disabled="record.taskStatus !== 1">
                  <span>终止任务</span>
                </a-menu-item>
                <a-menu-item
                    @click="toMiddleResult(record)"
                >
                  中间结果
                </a-menu-item>
                <a-menu-item @click="readLog(record)">
                  <span>查看日志</span>
                </a-menu-item>
                <!-- 仅通用模型支持导出,接口返回的 record中无modelType字段，这里根据tabActiveKey -->
                <a-menu-item @click="toExport(record)" v-if="tabActiveKey == 1">导出</a-menu-item>
              </a-menu>
            </a-dropdown>
          </span>
        </a-table>
      </template>
    </step-layout>
    <!-- <div class="page-middle">
      <div class="left">
      </div>
      <div class="right">
      </div>
    </div> -->
    <a-modal
      :visible="visible"
      :title="modalTitle === 0 ? '新建离线评估' : '重命名'"
      @ok="handleOk"
      :maskClosable="false"
      @cancel="handCancel"
    >
      <a-form-model
        :model="form"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        ref="ruleForm"
        :rules="rules"
        layout="horizontal"
      >
        <a-form-model-item label="离线任务名称" prop="taskName">
          <a-input :maxLength="50" v-model="form.taskName" />
        </a-form-model-item>
      </a-form-model>
    </a-modal>
    <a-modal
      v-model="logShow"
      title="查看日志"
      :width="'80%'"
      :maskClosable="false"
      @cancel="cancel"
      centered>
      <template slot="footer">
        <a-button key="download" @click="downLoadLog" :disabled="!(logList && logList.fileUrl)">
          下载日志
        </a-button>
        <a-button key="back" @click="getModelLogData">
          刷新
        </a-button>
        <a-button key="submit" type="primary" @click="warpType = !warpType">
          换行
        </a-button>
      </template>
      <a-spin :spinning="logLoading" />
      <pre
        class="modelLog"
        v-if="!logLoading"
        :style="{
          'white-space': warpType ? 'pre-line' : 'nowrap'
        }">
        <p>
          {{ logList && logList.content }}
        </p>
      </pre>
    </a-modal>
  </div>
</template>

<script>
import StepLayout from '@/components/StepLayout'
import tree from "@/components/tree"
import splitPane from "vue-splitpane"
import { getOfflineTableList,
  delOfflineById,
  fetchOfflineForecastPodRunLog,
  checkTaskNameAvl,
  fetchOfflineModelHistoryLog,
  offlineModelTrainTaskStop,
  OffLineTaskRename
} from "@/api/offlineForecast"
import { downloadFile, getParams, openDownloadURI } from '@/utils/util'
import bus from '@/utils/bus'
export default {
  name: "OffLine",
  components: {
    tree: () => ({ component: import('@/components/tree') }),
    "split-pane": splitPane,
    StepLayout
  },
  data () {
    const checkName = async (rule, value, callback) => {
      if (!value || !value.trim()) {
        callback(new Error('当前值不能为空'))
      } else {
        const checkData = await checkTaskNameAvl({
          taskName: value,
          modelType: this.tabActiveKey
        })
        if (checkData.data) {
          callback()
        } else {
          callback(new Error('当前名称已存在，请重新输入'))
        }
      }
    }
    return {
      visible: false,
      searchFormData: {
        name: '',
      },
      rules: {
        taskName: [
          { required: true, message: '请输入离线任务名称', trigger: 'blur' },
          { required: true, validator: checkName, trigger: "blur" }
        ],
      },
      form: {
        taskName: '',
      },
      loading: false,
      total: 0,
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
      // 离线预测树节点和模型管理树节点相同
      treeApi: {
        // search: "getModelTreeList",
        search: "getOfflineTreeList",
        add: "savaModelTreeList",
        edit: "editModelTreeList",
        delete: "deleteModelTreeList"
      },
      tabActiveKey: "1",
      treeData: [],
      data: [],
      nodeCode: null,
      timer: null,
      logShow: false,
      logLoading: false,
      currentModelLog: null,
      logList: null,
      warpType: true,
      logTime: null,
      currentTreeData: null,
      modalTitle: 0,
      columns: [
        {
          title: '离线任务名称',
          dataIndex: "taskName",
          ellipsis: true,
          scopedSlots: { customRender: "taskName" },
          width: '40%',
          // align: 'center',
        },
        {
          title: "模型名称",
          ellipsis: true,
          dataIndex: "modelName",
          scopedSlots: { customRender: "modelName" },
          width: '30%',
          // align: 'center',
        },
        {
          title: "任务类型",
          dataIndex: "tagType",
          width: 120,
          // align: 'center',
        },{
          title: "创建人",
          dataIndex: "createBy",
          width: "140px",
        },
        {
          title: "创建时间",
          dataIndex: "createTime",
          width: 176,
          // align: 'center',
        },
        {
          title: "结束时间",
          dataIndex: "finishTime",
          width: 176,
          // align: 'center',
        },
        {
          title: "进度",
          dataIndex: "modelSchedule",
          scopedSlots: { customRender: "modelSchedule" },
          width: 200,
          // align: 'center',
          ellipsis: true,
        },
        {
          title: "操作",
          width: 125,
          dataIndex: "action",
          scopedSlots: { customRender: "action" },
          align: 'right',
        }
      ]
    }
  },
  beforeDestroy () {
    bus.$off('reloadOffline')
  },
  mounted () {
    bus.$on('reloadOffline', () => {
      this.getDataList({ isFirst: true })
    })
    this.getDataList({ isFirst: true })
  },
  methods: {
    handReload () {
      this.$refs.refSearchForm.resetFields()
      this.pagination.current = 1
      this.getDataList({ isFirst: true })
    },
    handSearch () {
      this.pagination.current = 1
      this.getDataList({
        search: this.searchFormData.name
      })
    },
    handCreate () {
      this.modalTitle = 0
      this.form.taskName = ''
      this.visible = true
    },
    handCancel () {
      this.form = {
        taskName: ''
      }
      this.visible = false
      this.$refs.ruleForm.clearValidate()
    },
    handleOk () {
      this.$refs.ruleForm.validate((valid) => {
        if (!valid) {
          return false
        } else {
          if (this.modalTitle === 0) {
            // 去离线任务新建
            this.$router.push({
              path: "/train/offline/step-offline",
              query: { modelType: this.tabActiveKey, taskName: this.form.taskName }
            })
            this.visible = false
          } else {
            this.handleRenameOk()
          }
        }
      })
    },
    cancel () {
      // clearInterval(this.logTime)
    },
    searchData (data) {
      this.pagination.current = 1
      this.pagination.pageSize = 10
      this.getDataList({
        pageNo: 1,
        ...data
      })
    },
    getDataList (param) {
      if([undefined, null].includes(param.search)) param.search = ""
      if (Object.keys(param).includes('search') && Object.keys(param).length === 1) {
        param.search = param.search.trim()
      } else {
        if (Object.keys(param).includes('search')) {
          param.search = param.search.trim()
        }
      }
      if (param?.dataType === 'select') this.currentTreeData = { ...param }
      const params = getParams(param, this, "offline")
      if (param?.isFirst) {
        params.nodeId = 0
        params.nodeCode = ''
      }
      this.getList(params)
    },
    getList (params) {
      if (params?.noLoading) {
        this.loading = false
      }
      params.modelType = this.tabActiveKey
      getOfflineTableList(params)
      .then((res) => {
        const { data: { records = [] } = {}, code, msg } = res
        if (code === 0) {
          this.pagination.total = res.data.total
          this.total = res.data.total
          this.$refs.tree?.reloadData(this.currentTreeData)
          this.data = records.map(item => {
            return {
              ...item,
              // modelSchedule: item.modelSchedule ? Number(item.modelSchedule) : 0,
              modelSchedule: item.taskStatus === 2 ? 100 : (item.modelSchedule ? Number(item.modelSchedule) : 0),
            }
          })
          clearTimeout(this.timer)
          if (this.data.filter(item => item.taskStatus === 1).length > 0) {
            this.setTimeOut(this.getList, params, 2 * 60 * 1000)
          }
        }
      })
      .finally(() => {
        this.loading = false;
      })
    },
    tabOnChange (key) {
      // this.tabActiveKey = key
      this.getDataList({ isFirst: true })
    },
    toMiddleResult (record) {
      let bread = {
        ...this.$route.meta,
        path: this.$route.path
      }
      localStorage.setItem("bread", JSON.stringify(bread))
      this.$router.push({
        path: `/train/model/middleResult/`,
        query: { modelType: this.tabActiveKey, id: record.id, type: 'offline' }
      })
    },
    // 模型导出
    toExport(record) {
      openDownloadURI(`/api/v1/traincenter/modelManageInfo/downOfflineForecast?id=${record.id}`)
    },
    // 查看报告
    toReport (record) {
      this.$store.commit('setCurrentOffline', record.id)
      let bread = {
        ...this.$route.meta,
        path: this.$route.path
      }
      localStorage.setItem("bread", JSON.stringify(bread))
      this.$router.push({
        path: `/train/offline/detail/`,
        query: { id: record.id, modelType: this.tabActiveKey, modelId: record.modelId}
      })
    },
    stop (record) {
      this.$confirm({
        title: "警告",
        content: "确定要终止任务么",
        cancelText: '取消',
        okText: '确定',
        onOk: () => {
          offlineModelTrainTaskStop({ offlineModelId: record.id })
            .then((res) => {
              if (res.code === 0) {
                this.$message.success('操作成功!')
                this.getDataList({
                    pageSize: this.pagination.pageSize,
                    pageIndex: this.data.length === 1 ? 1 : this.pagination.current,
                })
              }
            })
        }
      })
    },
    // 删除模型
    onDelModel (record) {
      this.$confirm({
        title: `确定要删除 ${record.taskName} 吗?`,
        content: "此操作将永久删除，请确认是否删除?",
        cancelText: '取消',
        okText: '确定',
        onOk: () => {
          this.loading = true
          delOfflineById(record.id)
              .then((res) => {
                if (res.code === 0) {
                  this.$message.success('删除成功!')
                  if (this.data.length === 1 && this.pagination.total !== 1) this.pagination.current--
                  this.getDataList({
                      pageSize: this.pagination.pageSize,
                      pageIndex: this.pagination.current,
                  })
                }
              }).finally(() => { this.loading = false })
        },
        onCancel () {}
      })
    },
    onRename (record) {
      this.$set(this.form, 'id', record.id)
      this.modalTitle = 1
      this.form.taskName = record.taskName
      this.visible = true
    },
    async handleRenameOk () {
      const res = await OffLineTaskRename(this.form)
      if (res.code !== 0) return false
      this.$message.success('修改成功！')
      this.handCancel()
      this.getDataList({
        pageSize: this.pagination.pageSize,
        pageIndex: this.pagination.current,
      })
    },
    readLog (params) {
      this.logShow = true
      this.currentModelLog = { ...params }
      this.getModelLogData()
    },
    getModelLogData () {
      this.logLoading = true
      // const isHistory = this.currentModelLog.modelSchedule === 100 || this.currentModelLog.taskStatus === 3
      const isHistory = this.currentModelLog.modelSchedule > 0 || this.currentModelLog.taskStatus === 3
      const getData = isHistory ? fetchOfflineModelHistoryLog : fetchOfflineForecastPodRunLog
      getData(this.currentModelLog.id).then(res => {
        if (res.code === 0) {
          this.logList = res.data
        }
        this.logLoading = false
      })
    },
    downLoadLog () {
      // 下载当前模型日志
      downloadFile('/api/v1/traincenter/offlineForecastInfo/downloadOfflineTrainHistoryLog/' + this.currentModelLog.id)
    },
    // 点击分页等
    handleChange (pagination, filters, sorter) {
      this.getDataList({
        pageSize: pagination.pageSize,
        pageIndex: pagination.current,
        search: this.search
      })
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
    },
  }
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
/deep/ .step-content .rightOffline {
  background-color: transparent;
}
/deep/ .ant-modal {
  width: 54% !important;
}
a {
  color: #00f;
}
.mainContent {
  padding: 0;
  // background-color: #fff;
  // border-radius: @borderRadiusBig;
}
.modelLog{
  max-height: calc(100vh - 250px);
  // margin: -30px 0 -40px 0;
}
/deep/ .splitter-pane.vertical.splitter-paneR{
  min-height: 100%;
  height: auto;
  border-left: 1px solid rgba(0,0,0,0.2);
}
/deep/ .vue-splitter-container{
  min-height: calc(100vh - 168px);
}
</style>
