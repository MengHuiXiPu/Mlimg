<template>
  <div class="tool-List">
    <span class="process-info">{{ processText }}</span>
    <!-- <span class="process-info" v-show="singlePicIsRun">任务正在运行，请稍等...</span> -->
    <!-- <i class="el-icon-loading" style="color:#409EFF"></i>&nbsp; -->
    <el-tooltip content="抓手工具" placement="bottom" effect="light">
      <el-button type="text" icon="fa fa-hand-pointer-o" class="tool-icon" :class="{ 'active-icon': activeTool === 'select' }" @click="toggleActiveTool('select')"></el-button>
    </el-tooltip>
    <el-tooltip content="适应画布" placement="bottom" effect="light">
      <el-button type="text" icon="el-icon-aim" class="tool-icon" @click="doOperate('centerView')"></el-button>
    </el-tooltip>
    <el-tooltip content="BBox" placement="bottom" effect="light" v-if="commonState && commonState.annotationItemKeys && commonState.annotationItemKeys.size>0">
      <el-button type="text" icon="fa fa-object-group" class="tool-icon" :class="{ 'active-icon': activeTool === 'bbox' }" @click="toggleActiveTool('bbox')"></el-button>
    </el-tooltip>
    
    <a-divider type="vertical" style="height: 25px;"/>
    <!-- 单次运行 连续运行 停止运行 保存 放大 缩小 全屏 -->
    <el-tooltip content="清除当前图片推理结果" placement="bottom" effect="light">
      <el-button type="text" icon="el-icon-document-remove" class="tool-icon"  :disabled="processing" @click="deleteDebugResult('single')"></el-button>
    </el-tooltip>
    <el-tooltip content="清除所有图片推理结果" placement="top" effect="light">
      <el-button type="text" icon="el-icon-folder-remove" class="tool-icon"  :disabled="processing" @click="deleteDebugResult('all')"></el-button>
    </el-tooltip>
    <el-tooltip content="保存配置" placement="bottom" effect="light">
      <el-button type="text" icon="fa fa-save" class="tool-icon" @click="$event => handleSave($event, '保存成功')" :disabled="processing"></el-button>
    </el-tooltip>
    <el-tooltip content="单次运行" placement="bottom" effect="light">
      <el-button type="text" icon="el-icon-video-play" class="tool-icon" @click="handleStartCurrent" :disabled="processing"></el-button>
    </el-tooltip>
    <el-tooltip content="连续运行" placement="bottom" effect="light">
      <!-- <i class="fa fa-align-center tool-icon" @click="handleStartAll"></i> -->
      <el-button type="text" icon="el-icon-connection" class="tool-icon" @click="handleStartAll" :disabled="processing"></el-button>
    </el-tooltip>
    <el-tooltip content="停止运行" placement="bottom" effect="light">
      <el-button type="text" icon="el-icon-switch-button" class="tool-icon" @click="handleStopTask" :disabled="!taskId"></el-button>
    </el-tooltip>
    
    <!-- <el-tooltip content="放大" placement="bottom" effect="light">
      <el-button type="text" icon="el-icon-zoom-in" class="tool-icon" @click="doOperate('zoomIn')"></el-button>
    </el-tooltip>
    <el-tooltip content="缩小" placement="bottom" effect="light">
      <el-button type="text" icon="el-icon-zoom-out " class="tool-icon" @click="doOperate('zoomOut')"></el-button>
    </el-tooltip> -->
    <!-- <el-tooltip content="全屏" placement="bottom" effect="light">
      <el-button type="text" icon="el-icon-full-screen" class="tool-icon" @click="doOperate('fullScreen')"></el-button>
    </el-tooltip> -->
  </div>
</template>

<script>
import { useState } from "../hooks/state.js";
import { saveOrUpdateConfig, runDebugTask, runDebugTaskSingle, stopDebugTask, getDebugTaskStatus, deletePicsDebugResult } from "@/api/runtorun.js";
import EventBus from "@/utils/bus.js";
// import SelectTool from "../graph/tools/SelectTool.vue";
export default {
  data() {
    return {
      // activeTool: '', //BBox
      // 推理任务进度信息(多图连续运行)
      // progressData: {
      //   completedImages: 0,
      //   totalImages: 0,
      //   isCompleted: undefined,
      // },
      timer: null, //轮训任务定时器
      processTextType: '',  //'single' /'all'： 控制显示
      processText: '',
      singlePicIsRun: '', //单张执行进行中时，以此变量来控制防重复点击和进度文本
    }
  },
  computed: {

  },
  watch: {
    taskId: {
      handler(val) {
        if(!val) return
        this.loopTaskProcess(val)
      },
      // immediate: true
    }
  },
  methods: {
    toggleActiveTool(toolName) {
      if(toolName === this.activeTool) {  //再次点击同一工具，则置空activeTool
        return this.setActiveTool("")
      }
      this.setActiveTool(toolName)
    },
    doOperate(operate) {
      switch (operate) {
        case 'centerView':
          EventBus.$emit("r2rCenterView")
          break;
        case 'zoomIn':
          this.$message.warning("to do ...")
          break;
        case 'zoomOut':
          this.$message.warning("to do ...")
          break;
        case 'fullScreen':
          this.$message.warning("to do ...")
          break;
        default:
          break;
      }
    },
    //删除推理结果
    deleteDebugResult(type = "") {
      const { id, dataType,dlId, focusId } = this.configData
      if(type ==='single' && !focusId) return this.$message.warning("请选择要清除结果的图片")
      if(dataType == 1 && !dlId) return this.$message.warning("请选择数据集")
      const loading = this.$GLoading('记录清除中...')
      this.processText = ""
      const params = new URLSearchParams();
      params.append('configId', id);
      params.append('dataType', dataType);
      if(![null, undefined, ''].includes(dlId)) {  //后端只接收long类型，不然就报错，所以不能是null
        params.append('dlId', dlId);
      }
      params.append('pictureId', type === 'all' ? "": focusId);
      deletePicsDebugResult(params).then(res => {
        if(res.code === 0) {
          this.$message.success('清除成功')
          // 清除当前focus图片的推理结果
          if(focusId) {
            EventBus.$emit('r2rClearShapes')
            this.setOutputs([])
          }
        }
      }).finally(() => { loading.close() })
    },
    // 保存配置信息
    handleSave(event, succMsg) {
      return new Promise(async (resolve, reject) => {
        const collectData = {
          checkFlag: false
        }  //用于状态传递，$on中注意不要重新赋值
        EventBus.$emit("r2rInputParamsSubmit", collectData)
        // 校验失败，return
        if(!collectData.checkFlag) {
          reject()
          return
        }
        const { id, dataType,dlId, inputParams } = this.configData
        try {
          const res = await saveOrUpdateConfig({
            id,
            dataType,
            dlId,
            inputParams
          })
          if(res.code == 0) {
            succMsg &&this.$message.success(succMsg)
            resolve()
          }else {
            reject(res)
          }
        } catch (error) {
          reject(error)
        }
      })
    },
    /**
     * 启动单张调试任务
     */
    async handleStartCurrent() {
      if(this.singlePicIsRun) return
      const { id, dataType,dlId, focusId, algorithmId } = this.configData
      if(!focusId) return this.$message.warning("请选择调试图片")
      this.setGroupLoading(focusId)
      this.singlePicIsRun = true
      this.processText = "任务正在运行，请稍等..."
      try {
        await this.handleSave()
        const data = {
          configId: id,
          dataType,
          dlId,
          pictureId: focusId,
          // algorithmId,
        }
        const res = await runDebugTaskSingle(data)
        this.singlePicIsRun = false
        this.setGroupLoading([])
        // 先清空上次推理输出绘制的图形
        EventBus.$emit('r2rClearShapes')
        if(res.code == 0 && res.data) {
          this.processText = "推理任务已完成"
          try {
            const result = JSON.parse(res.data)
            if(result.code !==0 ) {
              this.setOutputs(result.data || [], res.data)
              this.$message.error(result.msg)
              return
            }
            this.setOutputs(result.data || [], res.data)
            this.$message.success("任务已完成")
          }catch(e) {
            console.log("推理结果解析失败，未按照约定返回", result.data)
          } 
        }else {
          this.processText = "任务执行异常"
        }
      }catch(e) {
        console.error(e)
        this.processText = "任务执行异常"
        this.singlePicIsRun = false
        this.setGroupLoading([])
      }
    },
    /**
     * 启动连续调试任务
     */
    async handleStartAll() {
      const { id, dataType,dlId, algorithmId } = this.configData
      if(dataType == 1 && !dlId) return this.$message.warning("请选择数据集")
      const loading = this.$GLoading('任务启动中...')
      // this.setGroupLoading()
      this.processText = ""
      try {
        await this.handleSave()
        const res = await runDebugTask({
          configId: id,
          dataType,
          dlId,
          // algorithmId,
        })
        loading.close()
        this.setGroupLoading([])
        if(res.code == 0) {
          this.setTaskId(res.data)
          this.$message.success("任务启动成功")
        }
      }catch(e) {
        this.processText = "任务启动失败"
        loading.close()
        this.setGroupLoading([])
      }
    },
    // 停止调试任务
    handleStopTask() {
      if(!this.taskId) return this.$message.warning("当前配置无运行中任务")
      stopDebugTask(this.taskId).then(res => {
        if(res.code === 0) {
          this.timer && clearTimeout(this.timer)
          this.setTaskId(null)
          this.$message.success("任务已停止")
          this.processText = "任务手动停止"
        }
      })
    },
    // 轮训推理任务进度
    loopTaskProcess(id) {
      id = id || this.taskId
      getDebugTaskStatus(id).then(res => {
        this.timer && clearTimeout(this.timer)
        // this.progressData = res.data || {}
        this.processText = this._getProcessText(res.data)
        if(res.data?.isCompleted === false) {
          this.timer = setTimeout(() => {
            this.loopTaskProcess()
          }, 2000)
        }
        if(res.data.isCompleted === true) { //任务已结束 1、clear taskId,  2、如果存在focus图片，刷新对应的推理结果
          this.setTaskId(null)
          // 如果存在focusId，要刷新当前聚焦图片的推理结果
          const { id, dataType,dlId, focusId } = this.configData
          if(focusId) {
            // 先清空上次推理输出绘制的图形
            EventBus.$emit('r2rClearShapes')
            this.queryOutputs({
              configId: id,
              dataType,
              dlId,
              pictureId: focusId,
              page: 1,
              size: 100000
            })
          }
        }
      }).catch(error => {
        console.error(error)
        this.timer && clearTimeout(this.timer)
      })
    },
    // 存在批量推理任务时，根据状态获取显示文本信息
    _getProcessText(result = {}) {
      let { isCompleted, completedImages, totalImages, successTotal} = result
      if(isCompleted === false) {
        return `任务进行中，已完成 ${completedImages}/${totalImages}`
      }
      if(isCompleted === true) {
        return `推理任务已完成，推理成功：${successTotal}/${totalImages}`
      }
      return ""
    }
  },
  setup(props, {}) {
    const { configData, setConfigData, setGroupLoading,taskId, setTaskId,setOutputs, processing, activeTool, setActiveTool, commonState, queryOutputs } = useState()
    return {
      // 共享hook中的数据
      configData,
      setConfigData,
      setGroupLoading,

      taskId,
      setTaskId,
      setOutputs,
      processing,

      activeTool,
      setActiveTool,
      commonState,
      queryOutputs,
    }
  },
  beforeDestroy() {
    // EventBus.$off("r2rReloadImage")
    this.timer && clearTimeout(this.timer)
  },
}
</script>

<style lang="less" scoped>
.tool-List {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  .process-info {
    padding-right: 25px;
  }
}
.tool-icon {
  height: 30px;
  width: 30px;
  font-size: 20px;
  color: #fff;
  cursor: pointer;
  text-align: center;
  margin: 0 2px;
  // 以下为由图标换成el-button修改
  padding: 0;
  // line-height: 30px;
  // &:hover {
  //   // border: 1px solid #c9c7c7;
  //   opacity: 0.8;
  // }
}

/deep/ .fa {
  font-size: 18px;// fa图标字体小一码
  line-height: 20px; //line-height仍为20  与element图标一致
}
.active-icon {
  color: #2ecc71;
}
.tooltip-inner {
  font-size: 12px!important; /* 调整字体大小 */
}
</style>