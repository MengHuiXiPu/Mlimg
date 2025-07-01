<template>
  <div style="padding-top: 20px;">
    <!-- 查询表单 -->
    <div class="toolbar space-between">
      <el-form :inline="true" :model="searchFormData" size="mini" ref="refSearchForm" @keyup.enter.native="handleSearch" v-if="!readOnly">
        <el-form-item label="名称" prop="name">
          <el-input v-model="searchFormData.name" placeholder="请输入" clearable></el-input>
        </el-form-item>
        <el-form-item label="创建人" prop="createBy">
          <el-input v-model="searchFormData.createBy" placeholder="请输入创建人/工号" clearable></el-input>
        </el-form-item>
        <el-form-item label="服务状态" prop="taskStatus">
          <el-select v-model="searchFormData.taskStatus" placeholder="请选择" @change="handleSearch">
            <el-option label="全部" value=""></el-option>
            <el-option label="运行中" :value="2"></el-option>
            <el-option label="未启动" :value="1"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="$event=>handleSearch($event)">查询</el-button>
          <el-button type="primary" plain @click="handleSearch($event, true)">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <!-- table -->
    <a-table v-resize :columns="columns" :data-source="tableData"
      @change="tableDataChange" :loading="tableLoading" :transformCellText="transformCellText"
      :pagination="pagination.total > 10 ? pagination : false"
      :row-selection="rowSelection" :rowKey="(record) => record.id"
    >
      <span slot="taskStatusName" slot-scope="record">
        <!-- {{  record.taskStatusName }} -->
        <template v-if="record.taskStatus === 2">
          <a-tag color="#87d068"> 已启动 </a-tag>
        </template>
        <template v-else-if="record.taskStatus === 1">
          <a-tag color="#f50"> 未启动 </a-tag>
        </template>
        <template v-else-if="record.taskStatus === 3">
          <a-tag> {{ record.taskStatusName }}<a-icon type="loading" /> </a-tag>
        </template>
        <template v-else-if="record.taskStatus === 4">
          <a-popover  title="异常信息"  trigger="hover"  class="red-color"  v-if="record.taskStatus === 4">
            <template slot="content">
              <p>{{ record.remark }}</p>
            </template>
            <span>
              <a-tag color="#f50"> {{ record.taskStatusName }} </a-tag>
            </span>
          </a-popover>
        </template>
        <template v-else>
          <a-tag> {{ record.taskStatusName }}</a-tag>
        </template>
      </span>
    </a-table>
    <span class="algo-task-name">已选服务：
      <a-tag color="blue" v-show="selectedAlgoTaskName">
        {{ selectedAlgoTaskName }}
      </a-tag></span>
  </div>
</template>

<script>
import { getApplicationcenterList } from "@/api/appCenter";
import moment from "moment";
export default {
  name: "step1",
  props: {
    state: {
      type: Object,
      default: () => ({})
    },
    setState: {
      type: Function,
      default: () => { }
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      searchFormData: {
        name: "",
        createBy: "",
        taskStatus: "",
      },
      tableLoading: false,
      columns: [{
        title: "服务名称",
        dataIndex: "taskName",
        ellipsis: true,
      }, {
        title: "服务描述",
        dataIndex: "remark",
        ellipsis: true,
      }, {
        title: "当前版本",
        dataIndex: "modelVersionLabel",
      }, {
        title: "服务状态",
        scopedSlots: { customRender: "taskStatusName" },
        // width: 100,
      }, {
        title: "创建人",
        dataIndex: "createBy",
      }, {
        title: "创建时间",
        dataIndex: "createTime",
      }],
      pagination: {
        // size: "small",
        total: 0,
        pageSize: 10,
        current: 1,
        // showSizeChanger: true,
        // pageSizeOptions: ["10", "20", "30", "50"],
        // showTotal: function (total) {
        //   return `共 ${total} 条`;
        // },
      },
      tableData: [],
      // algoTaskId
      rowSelection: {
        type: "radio",
        selectedRowKeys: [],
        selectedRows: [],
        onChange: (selectedRowKeys, selectedRows) => {
          // console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
          this.rowSelection.selectedRowKeys = selectedRowKeys;
          this.rowSelection.selectedRows = selectedRows;
          this.setState('algoTaskId', selectedRows[0].id)
        },
        getCheckboxProps: record => ({
          props: {
            disabled: this.readOnly,
            // name: record.name,
          }
        }),
      }
    }
  },
  computed: {
    selectedAlgoTaskName() {
      return this.rowSelection.selectedRows[0]?.taskName || ""
    },
    // selectedRows() {
    // return this.rowSelection.selectedRowKeys
    // }
  },
  watch: {
    readOnly: {
      handler(val) {
        if (val) { //只读模式，只需要已选中的算法推理服务
          this.getTableData({ id: this.state.algoTaskId })
        } else {
          this.getTableData()
        }
      },
      // immediate: true
    }
  },
  methods: {
    /**
     * @public
     * 采集本步数据
     */
    next({ resolve, reject }) {
      // if (this.rowSelection.selectedRowKeys.length !== 1) {
      if (!this.state.algoTaskId) {
        this.$message.warning('请选择一个算法推理服务');
        return reject()
      }
      resolve()
    },
    tableDataChange(pagination, filters) {
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
      this.getTableData()
    },
    handleSearch(eve, reset = false) {
      if (reset) {
        this.$refs.refSearchForm.resetFields()
      }
      this.pagination.current = 1;
      this.getTableData();
    },
    // 推理算法服务列表查询
    getTableData(param = {}) {
      this.tableLoading = true
      const { pageSize, current } = this.pagination
      const { name, createBy, taskStatus } = this.searchFormData
      getApplicationcenterList({
        pageNo: current,
        limit: pageSize,
        taskName: name,
        createBy,
        taskStatus,
        appType: 0, //在复盘应用中，选择可用算法时，固定传0
        taskType: 0, //
        nodeId: 0, //
        ...param
      }).then(res => {
        if (res.code == 0) {
          this.tableData = res.data?.records || []
          this.pagination.total = res.data.total
          if (param.id) { //定点查询
            this.rowSelection.selectedRowKeys = [param.id]
            this.rowSelection.selectedRows = [res.data.records[0]]
          }
        }
      }).finally(() => { this.tableLoading = false })
    },
    transformCellText({ text, column, record, index }) {
      if (column.dataIndex === 'createTime') {
        return moment(text).format('YYYY-MM-DD HH:mm:ss')
      }
      return text
    }
  },
  created() {
    if (this.readOnly) { //查看状态
      this.getTableData({ id: this.state.algoTaskId })
      // 设置选中
      this.rowSelection.selectedRowKeys = [this.state.algoTaskId]
    } else {
      this.getTableData()
    }
  },
}
</script>

<style lang="less" scoped>
// /deep/ .el-form-item--mini.el-form-item {
//   // margin-bottom: 10px;
// }
/deep/ .ant-table-tbody > tr > td {
  padding: 12px 16px;
}
/deep/ .ant-table-thead > tr > th {
  padding: 13px 16px;
}
.algo-task-name {
  position: absolute;
  bottom: 20px;
  left: 20px;
}
</style>