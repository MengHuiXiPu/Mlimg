<template>
  <div>
    <div class="top-group" v-if="false">
      <a-button icon="reload" class="reload" @click="handReload" />
    </div>
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
      <span slot="name" slot-scope="text, record">
        <span
          class="image-name"
          @click="toDetail(record)"
          :title="text"
          :style="{
            color: record.reviewStatus === 0 ? '#ccc' : '',
            'max-width': '150px',
            display: 'block',
            overflow: 'hidden',
            'text-overflow': 'ellipsis'
          }">
          {{ text }}
        </span>
      </span>
      <span slot="taskId" slot-scope="text, record">
        {{ taskName(record) }}
      </span>
      <span slot="createTime" slot-scope="text">
        {{ text | moment }}
      </span>
      <span slot="reviewStatus" slot-scope="text">
        <template>
          <a-tag :color="text === 1 ? '#87d068' : ''">
            {{ status[text] }}
          </a-tag>
        </template>
      </span>
      <span slot="operate" slot-scope="text,record">
        <a-popconfirm
          :title="`确定删除 ${record.name} 么?`"
          ok-text="确定"
          cancel-text="取消"
          @confirm="handleDelete(record)"
        >
          <a v-action:opCode-list-delete style="margin-left: 10px">删除</a>
        </a-popconfirm>
      </span>
    </a-table>
  </div>
</template>

<script>
import { mixinHeader } from "@/utils/mixin"
import { inferenceCatalogConfList, OPCode } from "@/api/appCenter"
export default {
  name: "opCodeTaskList",
  props: {
    taskList: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  mixins: [mixinHeader],
  data () {
    return {
      status: ['进行中', '已完成'],
      tabActiveKey: '1',
      columns: [
        {
          title: "复判名称",
          dataIndex: "name",
          key: "name",
          ellipsis: true,
          scopedSlots: { customRender: "name" },
          align: 'left',
          fixed: 'left',
          width: 150
        },
        {
          title: "任务名称",
          dataIndex: "taskId",
          key: "taskId",
          scopedSlots: { customRender: "taskId" },
          ellipsis: true,
          width: 180,
          align: ''
        },
        {
          title: "图片数量(已复判)",
          dataIndex: "imgNum",
          key: "imgNum",
          ellipsis: true,
          scopedSlots: { customRender: "imgNum" },
          align: 'right',
        },
        {
          title: "复判准确率",
          dataIndex: "precisionRate",
          key: "precisionRate",
          ellipsis: true,
          align: 'right',
          customRender: (text) => {
            return text + '%'
          }
        },
        {
          title: "turnon准确率",
          dataIndex: "turnonPrecisionRate",
          key: "turnonPrecisionRate",
          ellipsis: true,
          align: 'right',
          customRender: (text) => {
            return text + '%'
          }
        },
        {
          title: "rework准确率",
          dataIndex: "reworkPrecisionRate",
          key: "reworkPrecisionRate",
          ellipsis: true,
          align: 'right',
          customRender: (text) => {
            return text + '%'
          }
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
          dataIndex: "reviewStatus",
          key: "reviewStatus",
          ellipsis: true,
          scopedSlots: { customRender: "reviewStatus" },
          // align: 'center',
        },
        {
          title: "操作",
          dataIndex: "operate",
          key: "operate",
          ellipsis: true,
          scopedSlots: { customRender: "operate" },
          align: 'right',
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
      loading: false
    }
  },
  created () {
    this.getInferenceCatalogConfList()
    this.getDataList()
  },
  methods: {
    tableDataChange (pagination, filters, sorter) {
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
      this.getDataList()
    },
    async getDataList () {
      const params = {
        limit: this.pagination.pageSize,
        pageNo: this.pagination.current
      }
      if (!params?.noLoading) {
        this.loading = true
      }
      const res = await OPCode.getOPCodeTaskList(params)
      this.loading = false
      if (res.code !== 0) return false
      const data = res.data.records
      this.tableData = data.map(item => {
        const field = item.conditionJson ? JSON.parse(item.conditionJson) : {}
        return {
          ...item,
          ...field
        }
      })
      this.pagination.total = res.data.total
      clearTimeout(this.timer)
      if (this.tableData.filter(item => item.reviewStatus === 0).length > 0) {
        this.setTimeOut(this.getDataList, {}, 15 * 1000)
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
        this.columns.splice(2, 0, ...data)
        this.directoryTableData = res.data.records
      }
    },
    handReload () {
      this.getDataList()
    },
    taskName (record) {
      const task =  this.taskList.filter(item => item.id === record.taskId)
      return task.length > 0 ? task[0].taskName : '无'
    },
    async handleDelete (record) {
      this.loading = true
      const res = await OPCode.deleteOPCodeTask(record.id, 'delete')
      this.loading = false
      if (res.code !== 0) return false
      this.$message.success('删除成功')
      this.getDataList()
    },
    toDetail (record) {
      console.log(record)
      if (record.reviewStatus !== 1) return false
      let bread = {
        ...this.$route.meta,
        path: this.$route.path
      }
      localStorage.setItem("bread", JSON.stringify(bread))
      this.$router.push({
        path: "/application/opCode/detail",
        query: { id: record.id }
      })
    }
  }
}
</script>

<style lang="less" scoped>
/deep/ .ant-table td { white-space: nowrap; }
.top-group{
  position: absolute;
  right: 0;
  top: 10px;
  button{
    margin-left: 10px;
  }
}
</style>
