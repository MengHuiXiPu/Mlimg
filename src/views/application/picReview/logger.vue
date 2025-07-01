<template>
  <a-modal :visible="visible" title="查看日志" :maskClosable="false" @cancel="handleCancel" :footer="null" width="80%" :dialog-style="{ top: '10vh' }">
    <el-tabs v-model="tabActiveKey" @tab-click="tabOnChange" style="width: 210px;">
      <el-tab-pane label="消息处理日志" name="1"></el-tab-pane>
      <el-tab-pane label="异常日志打印" name="2"></el-tab-pane>
    </el-tabs>
    <el-link class="fresh-btn" type="primary" :underline="false" @click="handelFresh">手动刷新</el-link>
    <div class="log-content scrollbar">
      <a-spin :spinning="loading" :indicator="indicator" style="position:absolute;top: 50%;left: 50%;"></a-spin>
      <!-- 日志内容 -->
      <p class="log-line-text" v-text="logItem" v-for="(logItem, index) in logAtrrs" :key="index"></p>
      <!-- 空 -->
      <a-empty :image="simpleImage" v-show="!loading && !logAtrrs.length" class="empty-info-block">
        <span slot="description" class="empty-info-text"> 暂无日志信息</span>
      </a-empty>
    </div>
  </a-modal>
</template>

<script>
/**
 * @description 日志查看modal，但这里的日志是数据库里记录的数据，是List，而不是文本
 */
import { getBusinessLog, getPodLog } from '@/api/picReview';
import { Empty } from 'ant-design-vue';
import moment from 'moment';
export default {
  name: "logger",
  data() {
    return {
      indicator: <a-icon type="loading" style="font-size: 32px" spin />,
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
      logAtrrs: [], //日志记录
      tabActiveKey: '1',
      loopTimer: null,
      loading: false,
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // 任务详情
    taskData: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    // 手动刷新
    handelFresh() {
      this.tabOnChange()
    },
    tabOnChange() {
      clearTimeout(this.loopTimer)
      if (this.tabActiveKey === '1') {
        this.fetchBusinessLog(true)
      } else {
        this.fetchPodLog(true)
      }
    },
    handleCancel() {
      clearTimeout(this.loopTimer)
      this.$emit("update:visible", false)
    },
    // 获取消息处理日志
    fetchBusinessLog(needLoading = false) {
      const { id } = this.taskData
      needLoading && (this.loading = true)
      getBusinessLog({
        taskId: id,
      }).then(res => {
        if (res.code === 0) {
          this.logAtrrs = this.formatLogContent(res.data)
        } else {
          this.logAtrrs = [res.msg || res.data?.msg]
        }
        this.loopTimer && clearTimeout(this.loopTimer)
        this.loopTimer = setTimeout(() => {
          this.fetchBusinessLog()
        }, 5000)
      }).finally(() => {  // 循环请求最新的日志
        this.loading = false
      })
    },
    // 获取容器日志
    fetchPodLog(needLoading = false) {
      const { id } = this.taskData
      needLoading && (this.loading = true)
      getPodLog({
        taskId: id,
      }).then(res => {
        if (res.code === 0) {
          this.logAtrrs = this.formatLogContent(res.data)
        } else {
          this.logAtrrs = [res.msg || res.data?.msg]
        }
        if (this.loopTimer) {
          clearTimeout(this.loopTimer)
        }
        this.loopTimer = setTimeout(() => {
          this.fetchPodLog()
        }, 5000)
      }).finally(() => {  // 循环请求最新的日志
        this.loading = false
      })
    },
    formatLogContent(logList = []) {
      logList.forEach(log => {
        log.createTime = moment(log.createTime || "").format('YYYY-MM-DD HH:mm:ss')
        log.updateTime = moment(log.updateTime || "").format('YYYY-MM-DD HH:mm:ss')
        // log.updateTime = log.updateTime ? new Date(log.updateTime).format('yyyy-MM-dd hh:mm:ss') : ''
      })
      return logList
    }
  },
  created() {
    this.fetchBusinessLog(true)
  }
}
</script>

<style lang="less" scoped>
/deep/ .ant-modal-body {
  padding: 0px 24px 24px 24px;
  position: relative;
}
/deep/ .el-tabs__header {
  margin: 0 0 2px;
}
.fresh-btn {
  position: absolute;
  right: 25px;
  top: 15px;
  // color: #0000ff;
}
.log-content {
  height: 65vh;
  width: 100%;
  background-color: #454545;
  font-size: 12px;
  overflow-y: auto;
  padding: 5px 5px 10px 5px;
  color: #27aa5e;
  // white-space: pre-wrap; // 保留换行
  .log-line-text {
    margin-bottom: 5px;
  }
}
.empty-info-block {
  margin-top: 25vh;
  .empty-info-text {
    color: #fff;
  }
}
</style>