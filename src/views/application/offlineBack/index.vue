<template>
  <div class="offline">
    <a-header
      :auth="{ add: 'offlineBack-list-add' }"
      :tab-list="tabList"
      :tab-active-key="tabActiveKey"
      :placeholderText="'请输入离线回放名称'"
      @tab-change="tabOnChange"
      @create="handCreate"
      @reload="handReload"
      @search="handSearch"
    ></a-header>
    <div class="borderStyle">
      <a-table
          v-if="directoryTableData"
          v-resize
          :columns="columns"
          :data-source="tableData"
          :pagination="pagination.total > 10 ? pagination : false"
          :loading="loading"
          :scroll="{ x: 2000 }"
          @change="tableDataChange"
          :rowKey="record => record.id"
      >
      <span slot="name" slot-scope="text,record">
        <span
            class="image-name"
            :title="text"
            @click="toImageDetail(record)"
            :style="{
            color: record.taskStatus !== 3? '#ccc' : '',
          }">{{ text }}</span>
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
        <span slot="taskStatus" slot-scope="text">
        {{ status[text - 1] }}
      </span>
        <span slot="operate" slot-scope="text,record">
        <a v-action:offlineBack-list-edit @click="handleEdit(record)">编辑</a>
        <a-popconfirm
            :title="`确定删除 ${record.name} 么?`"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDelete(record)"
        >
          <a v-action:offlineBack-list-delete style="margin-left: 10px">删除</a>
        </a-popconfirm>
      </span>
      </a-table>
    </div>
    <add-offline-back ref="addOfflineBack" @getDataList="getDataList"></add-offline-back>
  </div>
</template>

<script>
import { inferenceCatalogConfList, offlineBack } from "@/api/appCenter"
import { mixinHeader } from "@/utils/mixin"
export default {
  name: "OfflineBack",
  mixins: [mixinHeader],
  components: {
    addOfflineBack: () => ({ component: import('./addOfflineBack') })
  },
  data () {
    return {
      status: ['容器启动中', '进行中', '已完成', '异常终止'],
      tabActiveKey: '1',
      tabList: [
        { key: "1", name: "离线回放列表" }
      ],
      columns: [
        {
          title: "回放名称",
          dataIndex: "name",
          key: "name",
          // ellipsis: true,
          scopedSlots: { customRender: "name" },
          // align: 'center',
          fixed: 'left',
          width: 250
        },
        {
          title: "任务名称",
          dataIndex: "taskName",
          key: "taskName",
          ellipsis: true,
          // align: 'center'
        },
        {
          title: "消息源",
          dataIndex: "dataSourceName",
          key: "dataSourceName",
          ellipsis: true,
          // align: 'center'
        },
        {
          title: "文件源",
          dataIndex: "fileSourceName",
          key: "fileSourceName",
          ellipsis: true,
          // align: 'center'
        },
        {
          title: "回放开始时间",
          dataIndex: "startTime",
          width: 150,
          ellipsis: true,
          key: "startTime",
          scopedSlots: { customRender: "startTime" },
          // align: 'center'
        },
        {
          title: "回放结束时间",
          dataIndex: "endTime",
          width: 150,
          ellipsis: true,
          key: "endTime",
          scopedSlots: { customRender: "endTime" },
          // align: 'center'
        },
        {
          title: "创建时间",
          dataIndex: "createTime",
          width: 150,
          ellipsis: true,
          key: "createTime",
          scopedSlots: { customRender: "createTime" },
          // align: 'center'
        },
        {
          title: "状态",
          dataIndex: "taskStatus",
          key: "taskStatus",
          ellipsis: true,
          scopedSlots: { customRender: "taskStatus" },
          // align: 'center',
        },
        {
          title: "操作",
          dataIndex: "operate",
          key: "operate",
          ellipsis: true,
          scopedSlots: { customRender: "operate" },
          align: 'center',
          fixed: 'right',
          width: 100
        }
      ],
      tableData: [],
      directoryTableData: null,
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
    this.getInferenceCatalogConfList()
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
        name: this.searchName
      })
    },
    handleEdit (record) {
      this.$refs.addOfflineBack.showModal(record)
    },
    async handleDelete (record) {
      const res = await offlineBack.delOfflineBack(record.id, 'delete')
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
        name: this.searchName
      })
    },
    handCreate () {
      this.$refs.addOfflineBack.showModal()
    },
    toImageDetail (record) {
      if (record.taskStatus !== 3) return false
      this.$router.push({
        path: "/application/offlineBack/detail",
        query: { id: record.id, taskId: record.taskId }
      })
    },
    async getDataList (params) {
      if (!params?.noLoading) {
        this.loading = true
      }
      const res = await offlineBack.getOfflineBackList(params)
      if (!res.code === 0) return false
      this.loading = false
      const data = res.data.records
      this.tableData = data.map(item => {
        const field = JSON.parse(item.customFields)
        return {
          ...item,
          ...field
        }
      })
      this.pagination.total = res.data.total
      clearTimeout(this.timer)
      if (this.tableData.filter(item => (item.taskStatus === 1) || (item.taskStatus === 2)).length > 0) {
        this.setTimeOut(this.getDataList, params, 15 * 1000)
      }
    },
    async getInferenceCatalogConfList (params) {
      this.loading = true
      const res = await inferenceCatalogConfList(params)
      if (res.code === 0) {
        this.loading = false
        const data = res.data.records.map(item => {
          return {
            title: item.name,
            dataIndex: item.value,
            key: item.value,
            ellipsis: true,
            align: 'center',
            customRender: (text) => {
              return text ? text.split(/([>,<,=]=?)/)[2] : ''
            }
          }
        })
        this.columns.splice(4, 0, ...data)
        this.directoryTableData = res.data.records
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
/deep/ .ant-table td { white-space: nowrap; }
.borderStyle {
  overflow: hidden;
  border-radius: @borderRadiusBig;
}
</style>
<style lang="less">

.offline {
  .ant-table-wrapper {
  .ant-table-fixed-left .ant-table-fixed, .ant-table-fixed-right .ant-table-fixed{
    background: unset !important;
  }
  }
}
</style>
