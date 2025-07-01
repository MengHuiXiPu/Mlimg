<template>
  <div class="header-container">
    <!-- <div class="banner-area">
      <span class="title"><strong>TCL</strong>图形化应用开发平台</span>
    </div> -->
    <run-config :pipelineId="pipelineId" ref="refRunConfig"></run-config>
    <div class="toolbar-area">
      <!-- 快捷键说明 -->
      <el-popover width="280" placement="bottom-start" trigger="hover" :append-to-body="false">
        <span slot="reference" class="icon">
          <svg-icon type="tips" title="快捷键说明" />
        </span>
        <div class="tips-container">
          <div class="tips-container-title"> 快捷键</div>
          <div v-for="(tipItem, key) of tipsContent" :key="key" class="tips-container-item">
            <div class="tips-container-item-left">{{ tipItem.value }} </div>
            <div class="tips-container-item-right">
              <div class="right-text">{{ tipItem.label }}</div>
            </div>
          </div>
        </div>
      </el-popover>
      <!-- 图编辑工具栏 -->
      <span v-for="(icon, key) in tools" :key="key" class="icon" :title="icon.title"
        @click="handleTrigger(icon.directive, icon)">
        <svg-icon
          :class="['can' in icon && !icon.can ? 'disabled' : 'enabled', icon.directive == 'toggleMode' ? 'active' : '']"
          :type="icon.svg" />
      </span>
      <a-divider type="vertical" style="height: 30px;" />
      <!-- 保存 调试等功能 -->
      <span v-for="(icon, key) in debugTools" :key="key" class="icon" :title="icon.title"
        @click="handleTrigger(icon.directive, icon)">
        <svg-icon :class="'can' in icon && !icon.can ? 'disabled' : 'enabled'" :type="icon.svg" />
      </span>
      <!-- <a-divider type="vertical" style="height: 30px;" /> -->
      <!-- <span class="icon enabled" title="关闭编辑器" @click="handleTrigger('close')">
        <svg-icon type="close" />
      </span> -->
    </div>
  </div>
</template>

<script>
import { Tools, TipsContent, DebugTools } from "./config.js";
import { useGraph, useSocketInstance, useGetState, useResetState, useSetState, readOnly, useInitWebsocket } from "@pipeline/Editor/store/index.js";
import { reactive, onMounted, toRefs, ref, getCurrentInstance, watch, onBeforeUnmount, computed, nextTick } from 'vue';
import { deleteCells, onPaste, selectAll, freezeGraph, unfreezeGraph } from "@pipeline/Editor/common/trigger.js";
import Emitter from "@pipeline/Editor/util/channel.js";
import { useRouter, useRoute } from '@/hooks/vueApi.js';
import { useFullscreen } from '@vueuse/core';
import { saveGraph, startDebugMode, runAllPipeline, debugExecutor, stopDebugMode, runPipelineStep } from "@pipeline/Editor/common/request.js";
import { Message } from "element-ui";
import { resizeGraph } from "@pipeline/Editor/common/graph.js";
import { validGraph, validGraphConfig } from "@pipeline/Editor/common/validGraph.js";
import throttle from 'lodash/throttle';
import runConfig from "@pipeline/Editor/layout/header/runConfig.vue"
export default {
  name: 'EditorHeader',
  components: { runConfig },
  props: {

  },
  setup(props) {
    const refRunConfig = ref(null);
    const graph = useGraph();
    const router = useRouter();
    // const route = useRoute();
    const debuging = useGetState("debuging"); //是否进入调试状态全局标识
    const pipelineType = useGetState("pipelineType")
    const pipelineId = useGetState('pipelineId');
    const toggleFullscreen = ref(null);
    const _isFullscreen = ref(false);
    let executor = null;  //启动断点/单步调试，生成的执行器

    // const { isFullscreen, enter, exit, toggle } = useFullscreen(props.fullscreenEl)
    const instance = getCurrentInstance();
    const data = reactive({
      freeze: false,
      tools: Tools,
      debugTools: DebugTools,
      // 引导文案
      tipsContent: TipsContent,
    });

    const methods = {
      // 关闭编辑器
      closeEditor() {
        // 处在调试模式中，发送stop指令通知引擎端退出线程
        if (debuging.value) {
          methods.stopDebug()
        }
        window.__x6_instances__ = null
        // 销毁graph实例
        graph.value.dispose();
        // 清空历史记录
        graph.value.cleanHistory()
        // off所有事件监听
        Emitter.all.clear()
        // 重置store
        useResetState()
        // 返回上一页
        router.back()
      },
      // 切换选择工具与拖拽抓手工具
      toggleSelectTool(iconConfig) {
        if (iconConfig.active) {
          iconConfig.active = false
          iconConfig.title = "切换为选择模式"
          iconConfig.svg = "drag"
          graph.value.setRubberbandModifiers(['alt']) //还原为默认的需要绑定修饰键
          graph.value.enablePanning()
        } else {
          iconConfig.active = true
          iconConfig.title = "切换为拖拽模式"
          iconConfig.svg = "selectMode"
          graph.value.disablePanning()  //禁用拖拽画布
          graph.value.enableSelection() //启用选择
          graph.value.setRubberbandModifiers(null)  //清除初始化插件时绑定的alt修饰键，否则仍需要按住alt才能框选
        }
      },
      async handleRunAll() {
        try {
          // 校验画布节点配置（配置列表中的配置项）
          await validGraphConfig(graph.value)
          // 校验graph
          await validGraph(graph.value)
          // 校验镜像，环境配置
          await validRunConfig()

          useSetState('loadingText', "正在保存数据...")
          await saveGraph(false)
          // 启动websocket服务，并创建连接
          await useInitWebsocket()
          // 先进入调试模式
          await startDebugMode()
          // 关闭loading
          useSetState('loadingText', "")
          await runAllPipeline()
        } catch (err) {
          useSetState('loadingText', "")
          console.error(err)
        }
      },
      async stopDebug() {
        stopDebugMode()
      },
      async runBreakpoint() {
        try {
          // 校验画布节点配置
          await validGraphConfig(graph.value)
          // 校验graph
          await validGraph(graph.value)
          // 校验镜像，环境配置
          await validRunConfig()
          if (!debuging.value) {  //先保存，并进入调试模式
            useSetState('loadingText', "正在保存数据...")
            await saveGraph(false)
            // 启动websocket服务，并创建连接
            await useInitWebsocket()
            // 先进入调试模式
            await startDebugMode()
            useSetState('loadingText', "")
            executor = debugExecutor()
          }
          await executor.runBreakpoint()
        } catch (err) {
          useSetState('loadingText', "")
          console.log(err)
        }
      },
      // 单步运行至下一步, 目前做成： 只有先进入断点才可以单步
      async runNextStep() {
        try {
          // 校验画布节点配置
          await validGraphConfig(graph.value)
          // 校验graph
          await validGraph(graph.value)
          // 校验镜像，环境配置
          await validRunConfig()
          if (!debuging.value) {  //先保存，并进入调试模式
            useSetState('loadingText', "正在保存数据，并启动调试模式...")
            await saveGraph(false)
            // 启动websocket服务，并创建连接
            await useInitWebsocket()
            // 先进入调试模式
            await startDebugMode()
            useSetState('loadingText', "")
            executor = debugExecutor()
          }
          // await runPipelineStep()
          if (!debuging.value || !executor) {
            return Message.warning("请先通过断点进入调试模式")  //理论上不存在该情况
          }
          executor.runNextStep()
        } catch (err) {
          useSetState('loadingText', "")
          console.log(err)
        }
      },
      handleToggleFullscreen(iconConfig) {
        toggleFullscreen.value();
        // 修改图标
        if (!_isFullscreen.value) {
          iconConfig.svg = "exitfullscreen1"
          iconConfig.title = "退出全屏"
        } else {
          iconConfig.svg = "fullscreen1"
          iconConfig.title = "全屏"
        }
        // 切换全屏是异步的，但是nextTick,requestAninationFrame都没办法获取到最新的dom，
        setTimeout(() => {
          resizeGraph()
        }, 1000)
      },
      /**
       * 响应工具栏事件
       * @param {*} directive : 指令名称
       * @param {*} iconConfig : 图标配置对象
       */
      handleTrigger(directive, iconConfig = {}) {
        if (iconConfig.can === false) return
        switch (directive) {
          // 撤销/重做
          case "undo":
          case "redo":
            if (data.tools[directive].can) graph.value[directive]();
            break;
          case "zoomin":
            graph.value.zoom(0.1);
            break;
          case "zoomout":
            graph.value.zoom(-0.1);
            break;
          case "copy":
            onPaste(graph.value);
            break;
          case "dustbin":
            deleteCells(graph.value);
            break;
          case "focus":
            graph.value.centerContent();
            break;
          case "toggleMode":
            methods.toggleSelectTool(iconConfig)
            break;
          case "select_all":
            selectAll(graph.value);
            break;
          case "save":
            methods.handleSave();
            break;
          case "close":
            methods.closeEditor();
            break;
          case "fullscreen":
            // toggleFullscreen.value();
            methods.handleToggleFullscreen(iconConfig);
            break;
          case "runAll":
            methods.handleRunAll();
            break;
          case "nextStep":
            methods.runNextStep();
            break;
          case "nextBreakPoint":
            methods.runBreakpoint();
            break;
          case "stop":
            methods.stopDebug();
            break;
          default:
            break;
        }
      },
      handleSave() {
        saveGraph()
      },
    };
    // 校验运行环境及资源是否填写
    const validRunConfig = () => {
      return refRunConfig.value.checkRunConfig()
    }
    const handleBindHotkey = (event) => {
      if (!debuging.value) return
      event.preventDefault(); // 防止默认行为
      if (event.key === 'F8') { //下一断点
        methods.runBreakpoint()
      } else if (event.key === 'F10') { //下一步
        methods.runNextStep()
      }
    }
    // 节流执行
    const throttledKeydownHandler = throttle(handleBindHotkey, 1000)
    onMounted(() => {
      // useSetState('debuging', false)
      // 监听cell选中情况，以改变工具栏状态
      Emitter.on('cellSelected', (state) => {
        if (readOnly.value) {
          data.tools.delete.can = false;
          data.tools.copy.can = false;
        } else {
          // 非只读模式，将删除，复制按钮置为可用
          data.tools.delete.can = state.isSelected;
          data.tools.copy.can = state.isSelected;
        }
      });
      graph.value.on('history:change', () => {
        data.tools.undo.can = graph.value.canUndo();
        data.tools.redo.can = graph.value.canRedo();
      })
      // 此时能获取到要全屏的元素
      // const parentEl = instance.proxy.$parent.$el; // 获取父组件的 $el
      const parentEl = document.body      //改为对body全局，对画布全屏有很多tooltip/popover/下拉框需要特殊处理，后续有特性需求再做
      const { isFullscreen, enter, exit, toggle } = useFullscreen(parentEl)
      _isFullscreen.value = isFullscreen
      toggleFullscreen.value = toggle
      // 绑定快捷键
      window.addEventListener('keydown', throttledKeydownHandler)
    });
    onBeforeUnmount(() => {
      useSetState('debuging', false)
      window.removeEventListener('keydown', throttledKeydownHandler)
      // 如果socket存在,则关闭
      const { close } = useSocketInstance() || {};
      close && close()
      window.__x6_instances__ = null
      // 销毁graph实例
      graph.value.dispose();
      // 清空历史记录
      graph.value.cleanHistory()
      // off所有事件监听
      Emitter.all.clear()
      // 重置store
      useResetState()
    })
    watch(debuging, (newVal) => {
      //进入调试模式
      // 将单步按钮和停止调试按钮置为可用
      // data.debugTools.nextStep.can = newVal;
      data.debugTools.stop.can = newVal;
      data.debugTools.run.can = !newVal; //运行中时，无论断点还是单步，还是全速，都置为不可用
      data.debugTools.run.title = newVal ? "请退出调试模式再运行" : "全速运行"
      // 将复制和删除置为不可用
      data.tools.copy.can = !newVal
      data.tools.delete.can = !newVal

      if (newVal) {
        // 冻结画布
        freezeGraph(graph.value)
      } else {
        // 解冻画布
        unfreezeGraph(graph.value)
      }
    }, { immediate: true })

    // const leftHeaderText = computed(() => {
    //   return `${pipelineType.value == "scheme" ? "方案名称" : "算子组名称"}：`
    // })
    return {
      refRunConfig,
      _isFullscreen: _isFullscreen,
      pipelineId,
      // leftHeaderText,
      ...toRefs(data),
      ...methods,
    };
  },
}
</script>

<style lang="less" scoped>
.header-container {
  position: relative;
  top: -3px; //向上提填补router容器的padding
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 35px;

  //.banner-area {
  //   font-family: "微软雅黑 Bold", "微软雅黑 Regular";
  //   display: flex;
  //   align-items: center;
  //   padding-left: 5px;

  //   .title {
  //     font-size: 22px;
  //     color: #0000FF;
  //     font-weight: 700;

  //     strong {
  //       color: #D9001B;
  //     }
  //   }

  //   .pupiline-info {
  //     padding-left: 20px;
  //     font-size: 16px;
  //     color: #333333;

  //     strong {
  //       font-weight: 700;
  //     }
  //   }
  // }

  .toolbar-area {
    position: relative;
    display: flex;
    align-items: center;
    height: 100%;

    .icon {
      margin: 0px 4px;
      font-size: 20px;
      height: 25px;
      line-height: 30px;
      width: 25px;
      text-align: center;
      border-radius: 5px;
    }

    .enabled {
      cursor: pointer;
      transition: all 0.2s;
      color: #888888;

      &:hover {
        transform: scale(1.1);
        color: #409EFF;
      }

      &:active {
        transform: scale(0.9);
      }
    }

    .active {
      // color: #67c23a;
      // opacity: 0.9;
    }

    .disabled {
      cursor: not-allowed;
      transition: none;
      color: #b3b1b1;

      &:hover {
        transform: none;
        color: #b3b1b1;
      }

      &:active {
        transform: none;
      }
    }

    .freeze {
      cursor: not-allowed;
      transition: none;
      color: #999;

      &:hover {
        transform: none;
        color: #999;
      }

      &:active {
        transform: none;
      }
    }
  }
}

// 快捷键说明的样式
.tips-container {
  padding: 8px;

  &-title {
    font-family: PingFang SC, PingFang SC-Semibold, sans-serif;
    font-weight: bold;
    color: #434B5B;
  }

  &-item {
    height: 36px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #EEF0F2;

    &-left {
      font-size: 12px;
      color: #434B5B;
    }

    &-right {
      font-size: 12px;
      color: #747E8C;
      display: flex;
      align-items: center;

      .right-text {
        padding: 2px 8px;
        background: #EEF0F2;
        border-radius: 4px;
      }
    }
  }
}
</style>
