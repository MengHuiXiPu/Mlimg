<template>
  <div class="page-content">
    <a-table
      :columns="columns"
      :data-source="tableData"
      :pagination="pagination.total > 10 ? pagination : false"
      :loading="loading"
      @change="tableDataChange"
      :rowKey="record => record.id"
    >
      <span slot="updateTime" slot-scope="text">
        {{ text | moment }}
      </span>
      <span slot="operate" slot-scope="record">
        <a style="margin-right: 5px" v-action:dataSoure-list-edit @click="handleEdit(record)">编辑</a>
        <a-popconfirm
          :title="`确定删除 ${record.id} 么?`"
          ok-text="确定"
          cancel-text="取消"
          @confirm="handleDelete(record)"
        >
          <a v-action:dataSoure-list-delete>删除</a>
        </a-popconfirm>
      </span>
    </a-table>
    <edit-node-config ref="editNodeConfig" :nodeTypeList="nodeTypeList" @getDataList="getDataList" />
  </div>
</template>
<script>
import editNodeConfig from './editNodeConfig'
import system from '@/api/system'
export default {
  name: "nodeConfig",
  components: {
    editNodeConfig
  },
  data () {
    return {
      loading: false,
      nodeTypeList: [{
        value: 1,
        text: '数据集管理',
        api: 'getTreeList'
      }, {
        value: 2,
        text: '模型管理',
        api: 'getModelTreeList'
      }, {
        value: 3,
        text: '任务管理',
        api: 'getAppTaskTreeList'
      }],
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
      }
    }
  },
  computed: {
    columns () {
      return [{
        title: "编号",
        dataIndex: "id",
        key: "id",
        width: 80,
        align: "center"
      }, {
        title: "目录类型",
        dataIndex: "nodeType",
        key: "nodeType",
        customRender: (text) => {
          const name = this.nodeTypeList.filter(item => item.value == text)[0].text
          return <span>{ name }</span>
        },
        filters: this.nodeTypeList.map(item => {
          return { ...item, value: String(item.value) }          
        }),
        filterMultiple: false,
        width: 120,
        // align: "center"
      }, {
        title: "节点",
        dataIndex: "nodeDetail",
        key: "nodeDetail",
        ellipsis: true,
        width: 160,
        align: "right"
      }, {
        title: "关联用户",
        dataIndex: "relationUserNick",
        key: "relationUserNick",
        ellipsis: true,
        customRender: (text) => {
          const name = text.split(',')
          return <a-tooltip overlayStyle={ {'word-break': 'break-all'} }>
            <template slot="title">{ text }</template>
            { name.map(item => <a-tag>{item}</a-tag>) }
          </a-tooltip>
        },
      }, {
        title: "更新时间",
        dataIndex: "updateTime",
        key: "updateTime",
        scopedSlots: { customRender: "updateTime" },
        width: 180
      }, {
        title: "操作",
        key: "operate",
        scopedSlots: { customRender: "operate" },
        width: 120,
        align: 'right'
      }]
    }
  },
  mounted () {
    this.getDataList()
  },
  methods: {
    tableDataChange (pagination, filter) {
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
      if (filter?.nodeType && filter?.nodeType.length > 0) {
        this.getDataList(filter?.nodeType[0])
      } else {
        this.getDataList()
      }
    },
    async getDataList (nodeType) {
      const { current, pageSize } = this.pagination
      const params = {
        pageNo: current,
        limit: pageSize,
        nodeType
      }
      this.loading = true
      const res = await system.nodeConfig.getDataList(params)
      this.loading = false
      if (res.code !== 0) return false
      this.tableData = res.data.records
      this.$set(this.pagination, 'total', res.data.total)
    },
    handleEdit (record) {
      this.$refs.editNodeConfig.showModal(record)
    },
    handleCreate () {
      this.$refs.editNodeConfig.showModal()
    },
    async handleDelete (record) {
      const res = await system.nodeConfig.deleteNodeConfig(record.id)
      this.loading = false
      if (res.code !== 0) return false
      this.$message.success('删除成功')
      if (this.tableData.length === 1 && this.pagination.current !== 1) {
        this.$set(this.pagination, 'current', current--)
      }
      this.getDataList()
    }
  }
}
</script>

<style scoped lang="less">
</style>
