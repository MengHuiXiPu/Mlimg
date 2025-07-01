<template>
  <a-modal
    v-model="logShow"
    title="查看日志"
    :width="800"
    :maskClosable="false"
    centered>
    <template slot="footer">
      <a-button key="back" @click="handlerCancel">
        关闭
      </a-button>
    </template>
    <a-table
      :rowKey="(record)=>record.id"
      :columns="columns"
      :data-source="tableData"
      :scroll="{
        y: 500
      }"
      @change="tableDataChange"
      :loading="loading"
      :pagination="pagination">
      <span slot="createTime" slot-scope="text">
        {{ text | moment }}
      </span>
      <div slot="expandedRowRender" slot-scope="record" style="margin: 5px 0;">
        <h4>更新数据详情：</h4>
        <pre>{{ record.data }}</pre>
      </div>
    </a-table>
  </a-modal>
</template>

<script>
import moment from 'moment'
import { getTaskLog } from '@/api/appCenter'
export default {
  name: 'taskLog',
  data () {
    return {
      logShow: false,
      loading: false,
      taskId: 0,
      columns: [
        { title: '用户', dataIndex: 'createBy', key: 'createBy' },
        { title: '操作时间', dataIndex: 'createTime', key: 'createTime', scopedSlots: { customRender: "createTime" } },
        { title: '执行动作', dataIndex: 'operate', key: 'operate' }
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
    }
  },
  methods: {
    showModal (id) {
      this.logShow = true
      this.taskId = id
      this.getTaskLog({
        taskId: this.taskId
      })
    },
    async getTaskLog (params) {
      const res = await getTaskLog(params)
      if (res.code !== 0) return false
      this.tableData = res.data.records.map(item => {
        const infoData = JSON.parse(item.data)
        return {
          ...item,
          data: JSON.stringify(infoData, null, 4)
        }
      })
      this.pagination.total = res.data.total
    },
    tableDataChange (pagination, filters) {
      this.getTaskLog({
        pageSize: pagination.pageSize,
        pageIndex: pagination.current,
        taskId: this.taskId
      })
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
    },
    handlerCancel () {
      this.logShow = false
      this.tableData = []
    }
  }
}
</script>