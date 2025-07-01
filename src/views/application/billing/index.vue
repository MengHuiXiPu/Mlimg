<template>
  <div>
    <a-header
      :auth="{ add: 'billing-list-add' }"
      :tab-list="tabList"
      :tab-active-key="tabActiveKey"
      :placeholderText="'请输入名称'"
      faName="billing"
      :showReload="true"
      @tab-change="tabOnChange"
      @create="handCreate"
      @reload="handReload"
      @search="handSearch"
    ></a-header>
    <a-table
      v-resize
      :columns="columns"
      :data-source="tableData"
      :pagination="pagination"
      :loading="loading"
      @change="tableDataChange"
      :rowKey="record => record.id"
    >
      <span slot="displayId" slot-scope="text,record">
        <span
          class="image-name"
          :title="text"
          @click="toBilllingDetail(record)">{{ text }}</span>
      </span>
      <span slot="startTime" slot-scope="text">
        {{ text | moment }}
      </span>
      <span slot="endTime" slot-scope="text">
        {{ text | moment }}
      </span>
      <span slot="createTime" slot-scope="text">
        {{ text | moment }}
      </span>
      <span slot="kdStatus" slot-scope="text,record">
        <a-popover title="异常信息" trigger="hover" class="red-color" v-if="text === 3">
          <template slot="content">
            <p>{{ record.remark }}</p>
          </template>
          <span>
            <a-tag color="#f50">
              {{ status[text - 1] }}
            </a-tag>
          </span>
        </a-popover>

        <span v-else-if="text === 2">
          <a-tag color="#87d068">
              {{ status[text - 1] }}
          </a-tag>
        </span>
        <span v-else-if="text === 1">
          <a-tag :title="status[text - 1]">
            进行中<a-icon type="loading" />
          </a-tag>
        </span>
      </span>
      <span slot="operate" slot-scope="text,record">
        <a v-action:billing-list-edit @click="handleEdit(record)">编辑</a>
        <a-popconfirm
          :title="`确定删除 ${record.displayId} 么?`"
          ok-text="确定"
          cancel-text="取消"
          @confirm="handleDelete(record)"
        >
          <a v-action:billing-list-delete style="margin-left: 10px">删除</a>
        </a-popconfirm>
      </span>
    </a-table>
    <add-billing ref="addBilling" @getDataList="getDataList"></add-billing>
  </div>
</template>

<script>
import { billing } from "@/api/appCenter"
// import addBilling from './addBilling'
import { mixinHeader } from "@/utils/mixin"
export default {
  name: "billing",
  mixins: [mixinHeader],
  components: {
    addBilling: () => ({ component: import('./addBilling') })
  },
  data () {
    return {
      status: ['进行中', '已完成', '异常'],
      tabActiveKey: '1',
      tabList: [
        { key: "1", name: "开单列表" }
      ],
      columns: [
        {
          title: "开单ID",
          dataIndex: "displayId",
          key: "displayId",
          ellipsis: true,
          scopedSlots: { customRender: "displayId" },
          align: 'center',
          width: 95
        },
        {
          title: "任务名称",
          dataIndex: "taskName",
          key: "taskName",
          ellipsis: true,
          align: 'center',
          width: '25%'
        },
        {
          title: "开单题库",
          dataIndex: "kdDatalistName",
          key: "kdDatalistName",
          ellipsis: true,
          align: 'center',
          width: '25%'
        },
        {
          title: "开单阈值",
          dataIndex: "kdFieldValue",
          key: "kdFieldValue",
          ellipsis: true,
          align: 'center',
          width: '25%'
        },
        {
          title: "turnon准确率",
          dataIndex: "turnonRate",
          width: 150,
          ellipsis: true,
          key: "turnonRate",
          scopedSlots: { customRender: "turnonRate" },
          align: 'center'
        },
        {
          title: "rework准确率",
          dataIndex: "reworkRate",
          width: 150,
          ellipsis: true,
          key: "reworkRate",
          scopedSlots: { customRender: "reworkRate" },
          align: 'center'
        },
        {
          title: "创建时间",
          dataIndex: "createTime",
          width: 135,
          ellipsis: true,
          key: "createTime",
          scopedSlots: { customRender: "createTime" },
          align: 'center'
        },
        {
          title: "状态",
          dataIndex: "kdStatus",
          key: "kdStatus",
          scopedSlots: { customRender: "kdStatus" },
          align: 'center',
          width: 75
        },
        {
          title: "操作",
          dataIndex: "operate",
          key: "operate",
          ellipsis: true,
          scopedSlots: { customRender: "operate" },
          align: 'center',
          width: 90
        }
      ],
      tableData: [],
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
      searchName: ''
    }
  },
  created () {
    this.getDataList()
  },
  methods: {
    tabOnChange () {},
    tableDataChange (pagination, filters, sorter) {
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
      this.getDataList({
        limit: this.pagination.pageSize,
        pageNo: this.pagination.current,
        taskName: this.searchName
      })
    },
    handleEdit (record) {
      this.$refs.addBilling.showModal(record)
    },
    async handleDelete (record) {
      const res = await billing.deleteBilling(record.id)
      if (!res.code === 0) return false
      this.$message.success('删除成功')
      if (this.tableData.length === 1 && this.pagination.total !== 1) this.pagination.current--
      this.getDataList({
        limit: this.pagination.pageSize,
        pageNo: this.pagination.current
      })
    },
    handSearch (value) {
      this.searchName = value
      this.getDataList({
        limit: this.pagination.pageSize,
        pageNo: 1,
        taskName: this.searchName
      })
    },
    handCreate () {
      this.$refs.addBilling.showModal()
    },
    toBilllingDetail (record) {
      this.$router.push({
        path: "/application/billing/detail",
        query: { id: record.id, taskId: record.taskId, debugPath: record.debugPath }
      })
    },
    async getDataList (params) {
      if (!params?.noLoading) {
        this.loading = true
      }
      const res = await billing.billingList(params)
      if (!res.code === 0) return false
      this.loading = false
      this.tableData = res.data.records
      this.pagination.total = res.data.total
      clearTimeout(this.timer)
      if (this.tableData && this.tableData.filter(item => item.kdStatus === 1).length > 0) {
        this.setTimeOut(this.getDataList, params, 15 * 1000)
      }
    }
  }
}
</script>

<style lang="less" scoped>
/deep/ .ant-table td { white-space: nowrap; }
</style>
