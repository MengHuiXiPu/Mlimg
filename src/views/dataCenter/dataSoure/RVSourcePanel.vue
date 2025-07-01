<template>
  <div>
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
    <a-table :scroll="{ y: 560 }"
      v-resize
      :columns="columns"
      :data-source="tableData"
      :pagination="pagination.total > 10 ? pagination : false"
      :loading="tableLoading"
      @change="tableDataChange"
      rowKey="id"
      :transformCellText="transformCellText"
    >
      <template slot="status" slot-scope="text">
        <a-badge status="success" v-if="text == 1" text="连接正常"></a-badge>
        <a-badge v-else-if="text == 0" status="error" text="连接断开"></a-badge>
        <a-badge v-else status="default" text="未测试"></a-badge>
      </template>
      <span slot="operate" slot-scope="record,text,index">
        <a v-action:dataSoure-list-edit @click="() => handleEdit(record)">编辑</a>
        <a-divider v-action:dataSoure-list-edit type="vertical" />
        <a v-action:dataSoure-list-delete @click="() => handleDelete(record,index)">删除</a>
      </span>
    </a-table>
    <!-- 新建数据源弹窗 -->
    <create-modal :visible.sync="showConfigModal" v-if="showConfigModal" ref="refConfigModal" @success="handleSearch" ></create-modal>
  </div>
</template>

<script>
// 消息队列数据源tab,  以前的数据源不区分文件存储源和消息队列源，且两者在数据库对应不同的表，所以不能共用之前的table
import createModal from './createModal.vue';
import moment from 'moment';
import { getRVSoureList, deleteRVSource } from "@/api/dataCenter.js";
export default {
  components: {
    createModal,
  },
  data() {
    return {
      searchFormData: {
        name: ''
      },
      tableData: [],
      tableLoading: false,
      showConfigModal: false,
      pagination: {
        total: 0,
        pageSize: 10,
        current: 1,
        // showSizeChanger: true,
        // pageSizeOptions: ["10", "20", "30", "50"],
        // showTotal: function (total) {
        //   return `共 ${total} 条`
        // }
      },
      columns: [{
        title: '数据源名称',
        dataIndex: 'name',
      }, {
        title: '数据源类型',
        dataIndex: 'type',
      }, {
        title: '数据源描述',
        dataIndex: 'remark',
        ellipsis: true,
        align: "left",
      }, {
        title: "数据源连接状态",
        dataIndex: "status",
        scopedSlots: { customRender: "status" },
      }, {
        title: "创建人",
        dataIndex: "createBy",
      }, {
        title: "创建时间",
        dataIndex: "createTime",
      }, {
        title: "操作",
        dataIndex: "",
        key: "x",
        scopedSlots: { customRender: "operate" },
        align: "right"
      }]
    }
  },
  methods: {
    tableDataChange(pagination, filters) {
      this.getTableData({
        pageSize: pagination.pageSize,
        pageIndex: pagination.current,
        dsName: this.searchFormData.name,
      })

      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
    },
    handCreate() {
      this.showConfigModal = true
    },
    handleEdit(record) {
      this.showConfigModal = true
      this.$nextTick(() => {
        this.$refs.refConfigModal.setFormData(record)
      })
    },
    handleDelete(record, index) {
      this.$confirm({
        title: "删除数据源",
        content: "删除RV配置将无法恢复，删除可能会对使用了该RV源的应用造成影响，请谨慎操作！",
        okType: 'danger',
        width: 500,
        onOk: async () => {
          const res = await deleteRVSource(record.id)
          if (res.code !== 0) {
            return
          }
          this.handleSearch()
          this.$message.success("删除成功")
        }
      })
    },
    /**
     * 
     * @param {*} reset 是否重置表单
     */
    handleSearch(event, reset = false) {
      if (reset) {
        this.$refs.refSearchForm.resetFields()
      }
      this.pagination.current = 1;
      this.getTableData();
    },
    async getTableData() {
      this.tableLoading = true
      const { pageSize, current } = this.pagination
      const res = await getRVSoureList({
        pageNo: current,
        limit: pageSize,
        name: this.searchFormData.name,
      }).finally(() => { this.tableLoading = false })
      if (res?.code !== 0) {
        return
      }
      this.tableData = res.data?.records
      this.pagination.total = res.data?.total
    },
    transformCellText({ text, column, record, index }) {
      if (column.dataIndex === 'createTime') {
        return moment(text).format('YYYY-MM-DD HH:mm:ss')
      }
      if (column.dataIndex === "type") {
        return text == 0 ? "Tibco RV" : "未知类型"
      }
      return text
    }
  },
  created() {
    this.getTableData()
  },
}
</script>

<style lang="less" scoped>
</style>