<template>
  <a-modal
    :visible="visible"
    title="发布任务记录"
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
      <!-- <span slot="action" slot-scope="text, record">
        <a :disabled="record.modelSchedule < 100 || record.taskStatus === 3 ? true : false" @click="toReport(record)"> 查看报告</a>
      </span> -->
      <!-- 训练进度 -->
      <span slot="createTime" slot-scope="text">{{ text | moment }}</span>
      <!-- 状态 -->
      <span slot="taskStatus" slot-scope="text, record">
        <a-tag color="#87d068" @click="showPublishList(record)"> {{ text }}</a-tag>
      </span>
    </a-table>
  </a-modal>
</template>

<script>
// 
import { getApplicationcenterList } from "@/api/appCenter.js";
export default {

  data() {
    return {
      tableList: [],
      loading: false,
      columns: [{
          title: '任务名称',
          dataIndex: "taskName",
        },{
          title: "资源模式",
          dataIndex: "resouceModelName",
        },{
          title: "运行模式",
          dataIndex: "taskModelName",
        },{
          title: "创建时间",
          dataIndex: "createTime",
          scopedSlots: { customRender: "createTime" },
        },{
          title: "任务状态",
          dataIndex: "taskStatusName",
          scopedSlots: { customRender: "taskStatusName" },
        },
      ],
      // 要显示的配置记录data，据此来查询发布记录
      recordData: { }
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
  },
  methods: {
    handleCancel($event, refreshFlag) {
      this.$emit("update:visible", false)
    },
    getTableList() {
      this.loading = true
      getApplicationcenterList({
        pageNo: 1,
        limit: 9999,
        sourceId: this.recordData.id,
      }).then(res => {
        if(res.code == 0) {
          this.tableList = res.data?.records || []
        }
      }).finally(() => { this.loading = false })
    },
    /**
     * @public 
     * @param {*} data 
     */
    initState(data = {}) {
      this.recordData = data;
      this.getTableList()
    },
    // 查看报告详情
    // toReport(record) {
    //   this.$store.commit('setCurrentOffline', record.id)
    //   let bread = {
    //     ...this.$route.meta,
    //     path: this.$route.path
    //   }
    //   localStorage.setItem("bread", JSON.stringify(bread))
    //   this.$router.push({
    //     path: `/train/offline/detail/`,
    //     query: { id: record.id, modelType: "1", modelId: record.modelId}
    //   })
    // }
  },
  created () {
    
  },
}
</script>

<style lang="less" scoped>
</style>