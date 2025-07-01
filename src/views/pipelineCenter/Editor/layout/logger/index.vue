<template>
  <div class="logger-container">
    <header>
      <span>运行日志</span>
      <span class="show-panel-button" @click="showLogPanel = !showLogPanel">
        <i :class="showLogPanel ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
      </span>
      <span>&nbsp;</span>
    </header>
    <el-collapse-transition>
      <div class="logger-content scrollbar" ref="logContainer" v-show="showLogPanel" v-text="logText">

      </div>
    </el-collapse-transition>
    <el-backtop target=".logger-content" :style="{ right: showDrawer ? '420px' : '40px' }">
      <div class="back-top">UP</div>
    </el-backtop>
  </div>
</template>

<script>
import { ref, watch, nextTick, onBeforeUnmount } from "vue";
import { useGetState } from "@pipeline/Editor/store/index.js";
import Operator from "@/api/operator.js"
export default {
  data() {
    return {
      // logText: "日志内容",

    }
  },
  props: {
    // 右侧是否显示姐弟那配置的panel，根据他来确定回到顶部按钮的位置
    showDrawer: {
      type: Boolean,
    }
  },
  setup() {
    const logText = ref("")
    const debuging = useGetState("debuging"); //是否进入调试状态全局标识
    const podInfo = useGetState("podInfo");
    const showLogPanel = ref(false)
    const logContainer = ref(null)
    let timer = null
    watch(debuging, (newVal) => {
      if (newVal) {
        // 打开日志面板,并清空日志
        showLogPanel.value = true
        logText.value = ""
        fetchLogs()
      } else {
        // console.log("debuging false, 清除定时器：")
        // 查询最后一次日志（后端会在前端手动close socket后，延时3s关闭pod），并清除定时轮训任务
        fetchLogs()
        clearInterval(timer)
        // 为避免时间差看不到最后的日志，在调试模式结束后，请求最后一次日志
        // fetchLogs()
      }
    })
    const scrollToBottom = () => {
      // 滚动到底部
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
    const fetchLogs = () => {
      if (!podInfo.value?.name) {
        throw new Error("pod name is empty, podInfo: ", podInfo)
      }
      return Operator.getPodLogs(podInfo.value.name).then(res => {
        if (res.code !== 0) return
        const isFirstLog = !logText.value
        logText.value = res.data.content
        // .replace(/\n/g, '<br>').replace(/</g, "&lt;").replace(/>/g, "&gt;")
        // 如果是首次请求日志，则将滚动条定位到最底部
        if (isFirstLog) {
          nextTick(() => {
            scrollToBottom()
          })
        }
        // 轮训日志, 加在这里，即如果日志接口报错，就不再请求日志了(后端存在处理不了的问题)
        if (!debuging.value) return
        clearTimeout(timer)
        timer = setTimeout(() => {
          fetchLogs()
        }, 1000)
      })
    }
    onBeforeUnmount(() => {
      clearTimeout(timer)
    })
    return {
      logText,
      showLogPanel,
      logContainer,
    }
  },
}
</script>

<style lang="less" scoped>
.logger-container {
  background-color: #454545;
  max-height: 228px;

  header {
    color: #333333;
    background-color: #f6f7fa;
    display: flex;
    justify-content: space-between;
    height: 28px;
    line-height: 28px;
    padding: 0 10px;

    .show-panel-button {
      width: 200px;
      cursor: pointer;
      font-size: 18px;
      text-align: center;
      i {
        font-size: 18px;
        color: #a3afbb;
      }
      &:hover {
        // background-color: #E9F3FF;
        opacity: 0.7;
        i {
          color: #1e86ff;
        }
      }
    }
  }
  .logger-content {
    font-size: 12px;
    height: 200px;
    overflow-y: auto;
    padding: 5px 5px 10px 5px;
    color: #27aa5e;
    white-space: pre-wrap;
  }

  &::v-deep .el-backtop {
    width: 30px;
    height: 30px;
  }

  .back-top {
    background-color: #f2f5f6;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.12);
    text-align: center;
    font-size: 12px;
    color: #1989fa;
  }
}
</style>