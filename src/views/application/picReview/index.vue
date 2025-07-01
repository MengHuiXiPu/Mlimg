<template>
  <div class="reCheck-manage">
    <el-tabs v-model="tabActiveKey">
      <el-tab-pane label="图片复判应用" name="app">
        <div class="toolbar space-between">
          <el-form :inline="true" :model="searchFormData" size="small" ref="refSearchForm" @keyup.enter.native="handSearch">
            <el-form-item label="应用名称" prop="taskName">
              <el-input v-model="searchFormData.taskName" placeholder="请输入" clearable></el-input>
            </el-form-item>
            <el-form-item label="应用状态" prop="taskStatus">
              <el-select v-model="searchFormData.taskStatus" placeholder="请选择" @change="handSearch">
                <el-option value="" label="全部"></el-option>
                <el-option :value="1" label="下线"></el-option>
                <el-option :value="2" label="上线"></el-option>
                <el-option :value="3" label="上线中"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="创建人" prop="createBy">
              <el-input v-model="searchFormData.createBy" placeholder="请输入姓名或工号" clearable></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handSearch">查询</el-button>
              <el-button type="primary" plain @click="handReload">重置</el-button>
            </el-form-item>
          </el-form>
          <div style="margin-bottom: 18px;">
            <el-button type="primary" @click="handleCreate">新建图片复判应用</el-button>
          </div>
        </div>
        <a-table :columns="columns" :data-source="appList" :pagination="pagination" @change="handleTableChange"
          :loading="tableLoading" rowKey="id" :transformCellText="transformCellText">
          <template slot="taskName" slot-scope="text, record">
            <el-tooltip effect="dark" :content="record.taskName" placement="top">
              <a type="link" @click="goViewer(record)" :disabled="record.pipelineType == 1">{{ record.taskName }}</a>
            </el-tooltip>
          </template>
          <template slot="taskStatusName" slot-scope="text,record">
            <span >
              <a-badge status="default" v-if="record.taskStatus == 1"/> 
              <a-badge status="processing" v-else-if="record.taskStatus == 2"/> 
              <a-badge status="error" v-else/> 
              {{text}}</span>
          </template>
          <template slot="action" slot-scope="text, record">
            <div style="display: flex; align-items: center">
              <!-- <a-button type="link">Link</a-button> -->
              <a type="link" class="aButton-style mr-8" :disabled="record.taskStatus !== 1" @click="online(record)">上线</a>
              <a type="link" class="aButton-style mr-8" :disabled="record.taskStatus !== 2" @click="offline(record)">下线</a>
              <!-- 仅上线+上线中状态可查看日志 -->
              <!-- <a type="link" class="aButton-style mr-8" @click="viewLogger(record)" :disabled="![2,3].includes(record.taskStatus)">查看日志</a> -->
              <a type="link" class="aButton-style mr-8" @click="viewLogger(record)" >查看日志</a>
              <a-dropdown>
                <a @click="e => e.preventDefault()">更多</a>
                <a-menu slot="overlay">
                  <!-- 上线的+上线中的不允许删除 -->
                  <a-menu-item @click="handDeleteApp(record)" :disabled="[2,3].includes(record.taskStatus)"> 删除</a-menu-item>
                </a-menu>
              </a-dropdown>
            </div>
          </template>
        </a-table>
      </el-tab-pane>
      <el-tab-pane label="图片复判业务规则" name="rule">
        <a-table :data-source="ruleList" :pagination="false" :rowKey="(record) => record.id" :columns="ruleColumns" >
          <span slot="ruleType" slot-scope="text">{{ RULETYPEDICT.get(text) }}</span>
        </a-table>
      </el-tab-pane>
    </el-tabs>
    <!-- 日志 -->
    <logger :visible.sync="showLoggerModal" v-if="showLoggerModal" :taskData="curRecord"></logger>
  </div>
</template>

<script>
import moment from 'moment';
import logger from "./logger.vue";
import { getApplicationcenterList, inferenceTaskStartOrStop } from "@/api/appCenter.js";
import { getRuleList, deleteApp } from "@/api/picReview.js";
import { RULETYPEDICT } from "./constant.js";
export default {
  name: "picReview",
  components: {
    logger
  },
  data() {
    return {
      RULETYPEDICT,
      tabActiveKey: "app",
      tableLoading: false,
      searchFormData: {
        taskName: "",
        taskStatus: "",
        createBy: "",
      },
      appList: [],
      ruleList: [],
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        // pageSizeOptions: [10, 20, 30, 40, 50],
      },
      rulePagination: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
      columns: [{
        title: "应用名称",
        dataIndex: "taskName",
        scopedSlots: { customRender: "taskName" },
        ellipsis: true,
      },
      // {
      //   title: "应用类型",
      //   dataIndex: "type",
      // }, 
      {
        title: "应用描述",
        dataIndex: "taskDesc",
        // scopedSlots: { customRender: "remark" },
        ellipsis: true,
      }, {
        title: "应用状态",
        dataIndex: "taskStatusName",
        scopedSlots: { customRender: "taskStatusName" },
      }, {
        title: "创建人",
        dataIndex: "createBy",
      }, {
        title: "创建时间",
        dataIndex: "createTime",
        ellipsis: true,
      }, {
        title: "修改时间",
        dataIndex: "updateTime",
        ellipsis: true,
      }, {
        title: "操作",
        dataIndex: "action",
        width: "230px",
        scopedSlots: { customRender: "action" },
      }],
      ruleColumns: [{
        title: "规则名称",
        dataIndex: "name",
        // ellipsis: true,
        width: "25%"
      }, {
        title: "规则类型",
        dataIndex: "type",
        scopedSlots: { customRender: "ruleType" },
      }, {
        title: "规则描述",
        dataIndex: "description",
        // ellipsis: true,
        width: "55%"
      }],
      showLoggerModal: false,
      curRecord: {}, // 当前任务详情
    }
  },
  methods: {
    online(record) {
      this.$confirm({
        title: '上线应用',
        width: 650,
        content: h => <div>上线后，该应用将消费产线数据，完成图像复判，实现与产线的联动，请确认是否上线？</div>,
        okText: "确定上线",
        onOk: () => {
          return new Promise((resolve, reject) => {
            const { id, configId } = record
            inferenceTaskStartOrStop("inferenceTaskStart", {
              configId,
              taskId: id,
            }).then(res => {
              if (res.code === 0) {
                this.$message.success("指令已提交!")
                this.getAppList()
                resolve()
              } else {
                reject()
              }
            }).catch(err => {
              reject()
              console.log(err)
            })
          })
        },
      });
    },
    offline(record) {
      this.$confirm({
        title: '下线应用',
        width: 500,
        content: h => <div>下线后应用将不再处理生产数据，请确认是否下线该应用？</div>,
        okText: "确定下线",
        onOk: () => {
          return new Promise((resolve, reject) => {
            const { id, configId } = record
            inferenceTaskStartOrStop("inferenceTaskStop", {
              configId,
              taskId: id,
            }).then(res => {
              if (res.code === 0) {
                resolve()
                this.$message.success("应用已下线!")
                this.getAppList()
              } else {
                reject()
              }
            }).catch(err => {
              reject()
              console.log(err)
            })
          })
        }
      })
    },
    handleTableChange(pagination, filters, sorter) {
      this.pagination.current = pagination.current;
      this.getAppList();
    },
    handleRuleTableChange(pagination, filters, sorter) {
      this.rulePagination.current = pagination.current;
      this.getRuleList();
    },
    getAppList(param) {
      // taskName
      const { current, pageSize } = this.pagination
      const { taskName, createBy, taskStatus } = this.searchFormData
      const params = {
        pageNo: current,
        limit: pageSize,
        taskName: taskName,
        createBy: createBy,
        taskStatus: taskStatus,
        taskType: 0, //
        nodeId: 0, //
        appType: 4, //复判列表也固定为4
        ...param
      }
      this.tableLoading = true
      getApplicationcenterList(params).then(res => {
        if (res.code == 0) {
          this.appList = res.data?.records || []
          this.pagination.total = res.data.total
        }
      }).finally(() => {
        this.tableLoading = false
      })
    },
    getRuleList() {
      getRuleList().then(res => {
        if (res.code == 0) {
          this.ruleList = res.data || []
          // this.rulePagination.total = res.data.total
        }
      })
    },
    goViewer(record) {
      this.$router.push({
        path: `/application/picReview/view/${record.sourceId}`,
        query: { name: record.name }
      })
    },
    handDeleteApp(record) {
      this.$confirm({
        title: '删除应用',
        content: '删除应用后，应用将无法恢复，请谨慎操作',
        okText: '确定删除',
        okType: 'danger',
        onOk: () => {
          deleteApp(record.sourceId).then(res => {
            if (res.code == 0) {
              this.$message.success("删除成功")
              this.pagination.current = 1;
              this.getAppList();
            }
          })
        },
      });
    },
    viewLogger(record) {
      this.curRecord = record
      this.showLoggerModal = true
    },
    handleCreate() {
      // const newId = new Date().getTime()
      this.$router.push({
        path: `/application/picReview/add`,
        query: { name: "新建复判应用" }
      })
    },
    handSearch() {
      this.pagination.current = 1;
      this.getAppList();
    },
    handReload() {
      this.$refs.refSearchForm.resetFields();
      this.handSearch();
    },
    transformCellText({ text, column, record, index }) {
      if (["createTime", "updateTime"].includes(column.dataIndex)) {
        return moment(text).format('YYYY-MM-DD HH:mm:ss')
      }
      return text
    }
  },
  created() {
    this.getAppList()
    this.getRuleList()
  },
}
</script>

<style lang="less" scoped>
.reCheck-manage {
  &::v-deep .el-tabs__nav-wrap {
    width: 240px;
  }
}
.mr-8 {
  margin-right: 8px;
}
</style>