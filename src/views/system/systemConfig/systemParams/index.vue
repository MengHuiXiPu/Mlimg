<template>
  <div>
    <a-table
      :scroll="{
        y: 570
      }"
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
        <a v-action:dataSoure-list-edit @click="() => handleEdit(record)">编辑</a>
      </span>
    </a-table>
    <edit-param ref="editParam" @getDataList="getDataList" />
  </div>
</template>
<script>
import editParam from './editParam'
import system from '@/api/system'
export default {
  name: "systemParams",
  components: {
    editParam
  },
  data () {
    return {
      loading: false,
      tableData: [],
      search: '',
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
      columns: [{
        title: "参数名称",
        dataIndex: "keyInfo",
        key: "keyInfo",
        // align: "center"
      }, {
        title: "参数设置值",
        dataIndex: "valueInfo",
        key: "valueInfo",
        customRender: (text, record) => {
          return <span>{ record.unit ? `${text} ${record.unit}` : text }</span>
        }
      }, {
        title: "参数描述",
        dataIndex: "remark",
        key: "remark",
        // align: "center"
      }, {
        title: "更新时间",
        dataIndex: "updateTime",
        key: "updateTime",
        scopedSlots: { customRender: "updateTime" },
        // align: "center"
      }, {
        title: "操作",
        key: "operate",
        scopedSlots: { customRender: "operate" },
        align: "right"
      }]
    }
  },
  mounted () {
    this.getDataList()
  },
  methods: {
    tableDataChange (pagination) {
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
      this.getDataList(this.search)
    },
    async getDataList (search) {
      if (search !== this.search) {
        this.search = search
        this.pagination.current = 1
      }
      const { pageSize, current } = this.pagination
      const params = {
        pageNo: current,
        limit: pageSize,
        keyInfo: this.search
      }
      this.loading = true
      const res = await system.systemConfig.getDataList(params)
      this.loading = false
      if (res.code !== 0) return false
      this.tableData = res.data.records
      this.$set(this.pagination, 'total', res.data.total)
    },
    handleEdit (record) {
      this.$refs.editParam.showModal(record)
    }
  }
}
</script>

<style scoped lang="less">
</style>
