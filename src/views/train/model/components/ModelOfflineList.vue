<template>
  <div class="verification">
    <a-card :bordered="false">
      <div class="footer" v-if="false">
        <div class="search">
          <a-input-search
            placeholder="请输入任务名称"
            v-model="searchValue"
            @search="onSearch"
            @change="onSearchChange" />
        </div>
        <div class="extra">
          <a-button type="primary" class="creat" @click="onCreate">
            新建
          </a-button>
          <a-button icon="reload" class="reload" @click="handReload" />
        </div>
      </div>
      <a-table
        :rowKey="(record)=>record.id"
        :columns="columns"
        :data-source="data"
        @change="handleChange"
        :loading="loading"
        :pagination="pagination"
      >
        <!-- <a
          class="action-text"
          href="javascript:;"
          slot="taskName"
          slot-scope="text,record"
          :disabled="record.modelSchedule < 100 ? true : false"
          @click="linkToDetail(record)"
        >
          {{ text }}
        </a> -->
        <span
            slot="modelName"
            slot-scope="text, record"
            :title="`${text}(${record.modelVersionLabel})`"
          >
            {{ `${text}(${record.modelVersionLabel})` }}
          </span>
        <span slot="modelSchedule" slot-scope="text, record">
          <a-progress v-if="record.taskStatus === 1 || record.taskStatus === 2" :percent="record.modelSchedule" />
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
            <a class="ant-dropdown-link" @click="e => e.preventDefault()">
              更多
            </a>
            <a-menu slot="overlay">
              <a-menu-item>
                <span @click="onDelModel(record)">删除</span>
              </a-menu-item>
              <a-menu-item @click="stop(record)" :disabled="record.taskStatus !== 1">
                <span>终止任务</span>
              </a-menu-item>
              <a-menu-item>
                <span @click="readLog(record)">查看日志</span>
              </a-menu-item>
            </a-menu>
          </a-dropdown>
        </span>
      </a-table>
      <a-modal
        :visible="visible"
        title="新建验证"
        @ok="handleOk"
        :maskClosable="false"
        @cancel="handleCancel"
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
    </a-card>
    <a-modal
      v-model="logShow"
      :maskClosable="false"
      title="查看日志"
      :width="'80%'"
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
import debounce from 'lodash.debounce'
import { getOfflineTableList,
  checkTaskNameAvl,
  delOfflineById,
  fetchOfflineForecastPodRunLog,
  fetchOfflineModelHistoryLog,
  offlineModelTrainTaskStop
} from "@/api/offlineForecast"
import { mixinHeader } from "@/utils/mixin"
import { downloadFile, getParams } from '@/utils/util'
const columns = [
    {
        title: "离线任务名称",
        width: "17%",
        dataIndex: "taskName",
        ellipsis: true,
        scopedSlots: { customRender: "taskName" }
    },
    {
        title: "模型名称",
        width: "17%",
        ellipsis: true,
        dataIndex: "modelName",
        scopedSlots: { customRender: "modelName" }
    },
    {
        title: "数据集名称",
        width: "17%",
        ellipsis: true,
        dataIndex: "dlNames"
    },
    {
        title: "任务类型",
        width: "10%",
        dataIndex: "tagType"
    },
    {
        title: "创建时间",
        width: "17%",
        dataIndex: "createTime",
    },
    {
        title: "训练进度",
        width: "12%",
        dataIndex: "modelSchedule",
        scopedSlots: { customRender: "modelSchedule" }
    },
    {
        title: "操作",
        width: "10%",
        dataIndex: "action",
        scopedSlots: { customRender: "action" }
    }
]
export default {
  name: "ModelOfflineList",
  components: {},
  props: {
    modelDetail: {
      type: Object,
      default: () => {}
    },
  },
  mixins: [mixinHeader],
  data () {
    const checkName = async (rule, value, callback) => {
      if (!value || !value.trim()) {
        callback(new Error('当前值不能为空'))
      } else {
        const checkData = await checkTaskNameAvl({
          taskName: value,
          modelType: this.modelDetail.modelType
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
          searchValue: '',
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
          columns,
          data: [],
          timer: null,
          currentModalLog: null,
          logShow: false,
          logLoading: false,
          logList: null,
          warpType: true,
          logTime: null,
      }
  },
  mounted () {
    this.getDataList()
  },
  watch: {
      $route (to) {
        if (to.name === 'ModelDetail') {
          this.getDataList()
        }
      }
  },
  methods: {
    getDataList (param) {
      const { id } = this.$route.query
      const { modelType } = this.$route.query
      const params = getParams({ ...param, modelId: id, modelType }, this, "offline")
      this.setTimer(this.getList, params, 2 * 60 * 1000)
    },
    getList (params) {
      getOfflineTableList(params).then((res) => {
        const { data: { records = [] } = {}, code, msg } = res
        if (code === 0) {
          this.loading = false
          this.pagination.total = res.data.total
          this.total = res.data.total
          this.data = records.map(item => {
            return {
              ...item,
              modelSchedule: item.modelSchedule ? Number(item.modelSchedule) : 0,
            }
          })
        } else {
          this.loading = false
          clearInterval(this.timer)
        }
      })
      .catch((err) => {
        this.loading = false
        clearInterval(this.timer)
      })
    },
    handleCancel () {
      this.visible = false
    },
    onCreate () {
      this.form.taskName = ''
      this.visible = true
    },
    handReload () {
      this.searchValue = ''
        this.getDataList()
    },
    handleOk () {
      const that = this
      this.$refs.ruleForm.validate((valid) => {
        if (!valid) {
          return false
        } else {
          this.$store.commit('setisShowDetail', false)
          this.$store.commit('setTaskName', this.form.taskName)
          this.visible = false
        }
      })
    },
      toReport(record) {
          //modeltype=1，通用模型，modeltype=2，业务模型
          console.log(this.modelDetail)
          this.$store.commit('setCurrentOffline', record.id)
          /*
          let imageId = null;
          if (this.modelDetail.modelType == "1")
              imageId = this.modelDetail.imageId;
          else
              imageId = this.modelDetail.imagesId;
          */
          this.$router.push({
              path: `/train/model/offline/detail/`,
              query: {
                  modelId: this.modelDetail.id, key: '4', modelType: this.modelDetail.modelType, id: record.id, datalist: this.modelDetail.dataList
              }
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
    onDelModel (record) {
      this.$confirm({
        title: `确定要删除 ${record.taskName} 吗?`,
        content: "此操作将永久删除，请确认是否删除?",
        cancelText: '取消',
        okText: '确定',
        onOk: () => {
          delOfflineById(record.id)
              .then((res) => {
                if (res.code === 0) {
                  this.$message.success('删除成功!')
                  if (this.data.length === 1 && this.pagination.total !== 1) this.pagination.current--
                  this.getDataList({
                      pageSize: this.pagination.pageSize,
                      pageIndex: this.data.length === 1 ? 1 : this.pagination.current,
                  })
                }
              })
        },
        onCancel () {}
      })
    },
    // 点击分页等
    handleChange (pagination, filters, sorter) {
      this.getDataList({
        pageSize: pagination.pageSize,
        pageIndex: pagination.current,
      })
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
    },
        // 点击搜索 || enter键
    onSearch (value) {
      // if (!value.trim()) return
      this.getDataList({ search: value.trim() })
    },
    readLog (params) {
      this.logShow = true
      this.currentModelLog = { ...params }
      this.getModelLogData()
    },
    getModelLogData () {
      this.logLoading = true
      const isHistory = this.currentModelLog.modelSchedule === 100 || this.currentModelLog.taskStatus === 3
      const getData = isHistory ? fetchOfflineModelHistoryLog : fetchOfflineForecastPodRunLog
      getData(this.currentModelLog.id).then(res => {
        if (res.code === 0) {
          this.logList = res.data
        }
        if (!isHistory) {
          // this.logTime = setInterval(() => {
          //   this.getModelLogData()
          //   clearInterval(this.logTime)
          // }, 5000)
        }
        this.logLoading = false
      })
    },
    downLoadLog () {
      // 下载当前模型日志
      downloadFile('/api/v1/traincenter/offlineForecastInfo/downloadOfflineTrainHistoryLog/' + this.currentModelLog.id)
    },
    // 输入触发，防抖
    onSearchChange:
      debounce(function (value) {
        console.log(value);
        // if (!value.trim()) return
        this.getDataList({ search: value.trim() })
      }, 300),

  },

}
</script>
<style lang="less" scoped>
  .modelLog{
    max-height: calc(100vh - 250px);
    // margin: -30px 0 -40px 0;
  }
    .verification{
       /deep/ .ant-card-body{
            padding: 0 !important;
            .ant-table-wrapper{
                margin: 0!important;
            }
        }
    }
  .footer {
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    .search {
      width: 180px;
    }
    .extra {
      margin-right: 20px;
      .creat {
        margin-right: 10px;
      }
      .reload {
        vertical-align: -1px;
      }
    }
  }
</style>