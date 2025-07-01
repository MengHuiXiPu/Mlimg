<template>
  <div>
    <div class="top-group">
      <a-button icon="reload" class="reload" @click="handReload" />
    </div>
    <a-table
      :columns="columns"
      :data-source="tableData"
      :pagination="pagination"
      :loading="loading"
      @change="tableDataChange"
      :rowKey="record => record.id"
    >
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
          :title="`确定删除 ${record.reviewTaskName} 么?`"
          ok-text="确定"
          cancel-text="取消"
          @confirm="handleDelete(record)"
        >
          <a>删除</a>
        </a-popconfirm>
        <a-dropdown :trigger="['click']">
          <a class="tcl-dropdown-link" @click="e => e.preventDefault()" style="margin-left: 5px">
            更多
          </a>
          <a-menu slot="overlay">
            <a-menu-item key="0">
              <a @click="exportData(record)">导出数据</a>
            </a-menu-item>
            <a-menu-item key="1">
              <a @click="exportImage(record)">导出图片</a>
            </a-menu-item>
          </a-menu>
        </a-dropdown>
      </span>
    </a-table>
  </div>
</template>

<script>
import { esdReview } from "@/api/appCenter"
import { downloadFile } from '@/utils/util'
export default {
  name: "esdReviewList",
  data () {
    return {
      status: ['进行中', '已完成'],
      columns: [
        {
          title: "任务名称",
          dataIndex: "reviewTaskName",
          key: "reviewTaskName",
          ellipsis: true,
          scopedSlots: { customRender: "name" },
          align: 'center',
          width: 150
        },
        {
          title: "模型版本号",
          dataIndex: "reviewVersion",
          key: "reviewVersion",
          width: 180,
          align: 'center'
        },
        {
          title: "图片总数",
          dataIndex: "pictureTotalCount",
          key: "pictureTotalCount",
          ellipsis: true,
          align: 'center',
        },
        {
          title: "复判数",
          dataIndex: "reviewPictureCount",
          key: "reviewPictureCount",
          ellipsis: true,
          align: 'center'
        },
        {
          title: "复判完成率",
          dataIndex: "reviewRate",
          key: "reviewRate",
          ellipsis: true,
          align: 'center',
          customRender: (text) => {
            return (text * 100).toFixed(2) + '%'
          }
        },
        {
          title: "不一致数",
          dataIndex: "diffCount",
          key: "diffCount",
          ellipsis: true,
          align: 'center'
        },
        {
          title: "准确率",
          dataIndex: "acc",
          key: "acc",
          ellipsis: true,
          align: 'center',
          customRender: (text) => {
            return (text * 100).toFixed(2) + '%'
          }
        },
        {
          title: "创建人",
          dataIndex: "createBy",
          key: "createBy",
          ellipsis: true,
          align: 'center'
        },
        {
          title: "创建时间",
          dataIndex: "createTime",
          width: 150,
          ellipsis: true,
          key: "createTime",
          scopedSlots: { customRender: "createTime" },
          align: 'center'
        },
        {
          title: "状态",
          dataIndex: "taskStatus",
          key: "taskStatus",
          ellipsis: true,
          scopedSlots: { customRender: "reviewStatus" },
          align: 'center',
        },
        {
          title: "操作",
          dataIndex: "operate",
          key: "operate",
          ellipsis: true,
          scopedSlots: { customRender: "operate" },
          align: 'center',
          width: 100
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
      loading: false
    }
  },
  created () {
    this.getDataList()
  },
  methods: {
    tableDataChange (pagination) {
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
      const res = await esdReview.getReviewTaskList(params)
      this.loading = false
      if (res.code !== 0) return false
      const data = res.data.records
      this.tableData = data
      this.pagination.total = res.data.total
      clearTimeout(this.timer)
      if (this.tableData.filter(item => item.reviewStatus === 0).length > 0) {
        this.setTimeOut(this.getDataList, {}, 15 * 1000)
      }
    },
    handReload () {
      this.getDataList()
    },
    async handleDelete (record) {
      this.loading = true
      const res = await esdReview.delReviewTask(record.id)
      this.loading = false
      if (res.code !== 0) return false
      this.$message.success('删除成功')
      this.getDataList()
    },
    async exportData (record) {
      const url = `/api/v1/applicationcenter/inferenceEsdReviewTaskDetail/exportEsdReviewData?id=${record.id}`
      await downloadFile(url)
    },
    async exportImage (record) {
      const params = {
        id: record.id
      }
      this.loading = true
      const res = await esdReview.zipImage(params)
      this.loading = false
      if (res.code !== 0) return false
      console.log(res)
      this.loading = true
      const url = `/api/v1/applicationcenter/inferenceEsdReviewTaskDetail/downloadReviewTaskPicture?zipFilePath=${res.data.zipFilePath}`
      await downloadFile(url)
      this.loading = false
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
