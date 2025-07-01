<template>
  <a-modal
    :visible="visible"
    title="离线评估任务记录"
    @cancel="handleCancel"
    :maskClosable="false"
    :footer="null"
    width="60%"
  >
    <a-table
      v-resize
      :scroll="{y: 400}"
      :rowKey="(record)=>record.id"
      :columns="columns"
      :data-source="tableList"
      :loading="loading"
      :pagination="false"
    >
      <span slot="action" slot-scope="text, record">
        <a :disabled="record.modelSchedule < 100 || record.taskStatus === 3 ? true : false" @click="toReport(record)"> 查看报告</a>
      </span>
      <!-- 训练进度 -->
      <span slot="modelSchedule" slot-scope="text, record">
        <a-progress v-if="(record.taskStatus === 1 || record.taskStatus === 2) && record.modelSchedule!=0" :percent="record.modelSchedule" />
        <a-popover overlayClassName="modelSchedule" placement="left">
          <template slot="content">
            <a-alert message="info" :description="record.remark || '资源调度中,请稍等'" type="info" show-icon/>
          </template>
          <a-tag v-if="record.taskStatus === 1 && record.modelSchedule == 0" :color="'blue'">{{record.remark || '资源调度中'}}</a-tag>
        </a-popover>
        <a-popover overlayClassName="modelSchedule" placement="left">
          <template slot="content">
            <a-alert message="Error" :description="record.remark || '未知原因，请联系管理员'" type="error" show-icon/>
          </template>
          <a-tag v-if="record.taskStatus === 3" :color="'red'">异常终止</a-tag>
        </a-popover>
        <a-tag v-if="record.taskStatus === 4" :color="'red'">手动终止</a-tag>
      </span>
    </a-table>
  </a-modal>
</template>

<script>
// 
import { getOfflineTableList } from "@/api/offlineForecast";
export default {

  data() {
    return {
      tableList: [],
      loading: false,
      columns: [{
          title: '离线任务名称',
          dataIndex: "taskName",
        },{
          title: "模型名称",
          dataIndex: "modelName",
        },{
          title: "训练进度",
          dataIndex: "modelSchedule",
          // 任务状态 1、启动  2、执行完成  3、异常终止 4、手动终止
          scopedSlots: { customRender: "modelSchedule" },
        },{
          title: "操作",
          width: 100,
          dataIndex: "action",
          scopedSlots: { customRender: "action" },
          align: 'right',
        }
      ]
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // 当前模型数据
    model: {
      type: Object,
      default: ()=>({})
    }
  },
  methods: {
    handleCancel($event, refreshFlag) {
      this.$emit("update:visible", false)
    },
    getTableList() {
      this.loading = true
      getOfflineTableList({
        pageNo: 1,
        limit: 9999,
        modelType: 1,
        modelId: this.model.id,
      }).then(res => {
        if(res.code == 0) {
          this.tableList = res.data?.records || []
          this.tableList.forEach(data => {
            if(!data.modelSchedule) {
              data.modelSchedule = 0
            }
          })
        }
      }).finally(() => { this.loading = false })
    },
    // 查看报告详情
    // copy from offline/idnex.vue
    toReport(record) {
      this.$store.commit('setCurrentOffline', record.id)
      let bread = {
        ...this.$route.meta,
        path: this.$route.path
      }
      localStorage.setItem("bread", JSON.stringify(bread))
      this.$router.push({
        path: `/train/offline/detail/`,
        query: { id: record.id, modelType: "1", modelId: record.modelId}
      })
    }
  },
  created () {
    this.getTableList()
  },
}
</script>

<style lang="less" scoped>
</style>