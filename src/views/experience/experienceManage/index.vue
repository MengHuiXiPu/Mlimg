<template>
  <div class="experienceManage">
    <a-header
      :tab-list="tabList"
      :showNew="false"
      :tab-active-key="tabActiveKey"
      :placeholderText="'请输入参数名称'"
      @create="handleCreate"
      @reload="getDataList"
      @search="handSearch"
    />
    <a-table
      :columns="columns"
      :data-source="tableData"
      :pagination="pagination"
      :loading="loading"
      @change="tableDataChange"
      :rowKey="record => record.id"
    >
      <span slot="name" slot-scope="text,record">
        <span
          class="image-name"
          :title="text"
          @click="toDetail(record)">{{ text }}</span>
      </span>
      <span slot="createTime" slot-scope="text">
        {{ text | moment }}
      </span>
      <span slot="operate" slot-scope="record">
        <a style="margin-right: 5px" v-action:dataSoure-list-edit @click="handleEdit(record)">编辑</a>
        <a-popconfirm
          :title="`确定删除 ${record.title} 么?`"
          ok-text="确定"
          cancel-text="取消"
          @confirm="handleDelete(record)"
        >
          <a v-action:dataSoure-list-delete>删除</a>
        </a-popconfirm>
      </span>
    </a-table>
    <createTask ref="createTask" @reload="getDataList"></createTask>
  </div>
</template>

<script>
import createTask from './createTask'
import PHeader from '@/components/PHeader'
import experience from '@/api/experience'
import bus from '@/utils/bus'
export default {
  name: 'experienceManage',
  components: { createTask, PHeader },
  data () {
    return {
      tableData: [],
      tabActiveKey: 1,
      tabList: [
        { key: 1, name: "体验任务列表" }
      ],
      search: '',
      loading: false,
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
      appTypeList: [{
        title: '人脸人体',
        value: 1
      }, {
        title: '文字识别',
        value: 2
      }, {
        title: '工业质检',
        value: 3
      }],
      serviesList: ['接口服务', '系统服务', '其他']
    }
  },
  computed: {
    columns () {
      return [{
        title: "编号",
        dataIndex: "id",
        key: "id",
        // width: 80
      }, {
        title: "标题",
        dataIndex: "title",
        key: "title",
        ellipsis: true,
        scopedSlots: { customRender: "name" },
        // width: 150
      }, {
        title: "备注",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        // width: 150
      }, {
        title: "应用类型",
        dataIndex: "appType",
        key: "appType",
        ellipsis: true,
        // width: 150
        customRender: (text) => {
          return this.appTypeList[text - 1].title
        }
      }, {
        title: "来源",
        dataIndex: "serviceType",
        key: "serviceType",
        ellipsis: true,
        customRender: (text) => {
          console.log(this.serviesList)
          return this.serviesList[text - 1]
        }
      }, {
        title: "创建时间",
        dataIndex: "createTime",
        key: "createTime",
        scopedSlots: { customRender: "createTime" },
        // width: 150
      }, {
        title: "操作",
        key: "operate",
        scopedSlots: { customRender: "operate" },
        // width: 120
      }]
    }
  },
  mounted () {
    this.getDataList()
    bus.$on('reloadTask', () => {
      this.getDataList()
    })
  },
  beforeDestroy () {
    bus.$off('reloadTask')
  },
  methods: {
    handSearch(value) {
      this.search = value
      this.getDataList({ search: value })
    },
    tableDataChange (pagination) {
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
      this.getDataList()
    },
    async getDataList () {
      const { current, pageSize } = this.pagination
      const params = {
        pageNo: current,
        limit: pageSize,
        title: this.search
      }
      this.loading = true
      const res = await experience.manage.list(params)
      this.loading = false
      if (res.code !== 0) return false
      this.tableData = res.data.records
      this.$set(this.pagination, 'total', res.data.total)
    },
    handleEdit (record) {
      this.$refs.createTask.showModal(record)
    },
    handleCreate () {
      this.$refs.createTask.showModal()
    },
    async handleDelete (record) {
      this.loading = true
      const res = await experience.manage.getTaskInfo(record.id, 'delete')
      this.loading = false
      if (res.code !== 0) return false
      this.$message.success('删除成功')
      if (this.tableData.length === 1 && this.pagination.current !== 1) {
        this.$set(this.pagination, 'current', current--)
      }
      this.getDataList()
      bus.$emit('reloadTask')
    },
    toDetail (record) {
      this.$router.push({
        path: "/experience/experienceManage/info",
        query: { id: record.id }
      })
    }
  }
}
</script>

<style lang="less" scoped>

</style>