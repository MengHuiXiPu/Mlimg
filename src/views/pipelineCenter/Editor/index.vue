<template>
  <div class="pl-wrapper-container page-content-height" ref="pipelineEditorRef" v-loading="Boolean(loadingText)"
    :element-loading-text="loadingText" element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(255, 255, 255, 0.3)" @click.stop="contextMenuVisible = false">
    <editor-header v-if="graphLoaded"></editor-header>
    <div id="pipeline-container">
      <div class="stencil-wrapper" :style="{ width: showStencilPanel ? '200px' : '0' }">
        <stencil id="stencil" v-show="showStencilPanel"></stencil>
        <span class="show-panel-button" @click="showStencilPanel = !showStencilPanel">
          <i :class="showStencilPanel ? 'el-icon-arrow-right' : 'el-icon-arrow-left'"></i>
        </span>
      </div>
      <!-- 因为graph配置了autoResize, graph-container需要有包裹（官网说明） -->
      <!-- <div class="graph-wrapper"> -->
      <div class="center-content">
        <div id="graph-container" ref="graph"></div>
        <logger ref="refLogger" class="logger-widget" :showDrawer="showDrawer"></logger>
      </div>
      <config-panel id="config-container" :visible.sync="showDrawer" v-if="graphLoaded"
        :class="{ 'config-container-show': showDrawer }"></config-panel>
    </div>
    <!-- 右键菜单 -->
    <context-menu v-if="contextMenuVisible" ref="contextMenuRef" :context-menu-item="contextMenuItem" />
    <!-- 算子组视图graph -->
    <group-view :visible.sync="groupViewVisible" v-if="groupViewVisible" :groupCellData="groupCellData"></group-view>
  </div>
</template>
<script>
import Header from "@pipeline/Editor/layout/header/index.vue";
// import registerCellTools from "./cellTools/registerTools.js";
import Stencil from "@pipeline/Editor/layout/stencil/index.vue";
import Logger from "@pipeline/Editor/layout/logger/index.vue";
import { initGraph, renderGraph } from "@pipeline/Editor/common/graph.js";
import { useSetState, useGetState, useProvideDebugResult, useSetSocketInstance, useGraph } from "@pipeline/Editor/store/index.js";
import configPanel from "@pipeline/Editor/layout/configPanel/index.vue";
import contextMenu from "@pipeline/Editor/layout/contextMenu/index.vue";
import contextMenuMixin from "@pipeline/Editor/mixins/contextMenu.mixin.js";
import { useRoute } from '@/hooks/vueApi.js';
import { ref } from "vue";
import { matchRequestMethod } from "@pipeline/Editor/common/request.js";
import groupView from "@pipeline/Editor/layout/groupView/index.vue";
import Emitter from "@pipeline/Editor/util/channel.js";
import Operator from "@/api/operator";
export default {
  name: "PipelineEditor",
  mixins: [contextMenuMixin],
  data() {
    return {
      graphLoaded: false, //工具栏/右侧配置面板依赖graph对象，所以在graph实例化后挂载
      groupViewVisible: false, // 算子组视图
      groupCellData: {},
      isDisplayMiniMap: true, //展开小地图
      showStencilPanel: true,
      showLoggerPanel: true,
    }
  },
  components: {
    EditorHeader: Header,
    Stencil,
    Logger,
    configPanel,
    contextMenu,
    groupView,
  },
  methods: {
    queryData() {
      matchRequestMethod("loadPipeline")(this.pipelineId).then((res) => {
        if (res.code === 0) {
          // this.pipelineName = res.data?.name
          renderGraph(res.data.graph)
          useProvideDebugResult(res.data.debugResult)
          useSetState("envConfig", {
            customImageId: res.data?.customImageId,
          })
          const pipelineInferTaskConfigId = res.data?.pipelineInferTaskConfigId
          // 查询资源配置
          pipelineInferTaskConfigId && Operator.schemeGetConfig(pipelineInferTaskConfigId).then(cres => {
            const { data, code } = cres
            if (code == 0 && data) {
              useSetState('envConfig', {
                computeEngineType: data.computeEngineType,
                coreSize: data.coreSize,
                memorySize: data.memorySize,
                gpuSize: data.gpuSize || 1,
                videoMemorySize: data.videoMemorySize,
                pipelineInferTaskConfigId,
              })
            }
          })
        }
      })
    }
  },
  setup() {
    const $route = useRoute()
    const pipelineId = ref(null)
    const pipelineType = ref("")
    const showDrawer = ref(false)
    const loadingText = useGetState("loadingText")
    const graph = useGraph()
    const initState = () => {
      pipelineId.value = parseInt($route.query?.id)
      pipelineType.value = $route.query?.type
      useSetState('pipelineId', pipelineId)
      useSetState('pipelineType', pipelineType)
      //initWebsocket()
    }
    Emitter.on('cellSelected', ({ cell, isSelected, }) => {
      if (isSelected) {
        cell.isNode() && (showDrawer.value = true)
      } else {
        showDrawer.value = false
      }
    })
    initState()
    return {
      pipelineId,
      pipelineType,
      loadingText,
      graph,
      showDrawer,
    }
  },
  mounted() {
    // registerCellTools()
    initGraph()
    this.graphLoaded = true
    this.queryData()
  }
}
</script>
<style lang="less" scoped>
.toggle-icon {
  position: absolute;
  top: 50%;
  right: -18px;
  width: 18px;
  height: 80px;
  line-height: 80px;
  text-align: center;
  transform: translateY(-50%);
  background: #ffffff;
  border: 1px solid #EEF0F2;
  border-radius: 0 12px 12px 0;
  cursor: pointer;

  i {
    font-size: 18px;
    color: #A3AFBB;
  }

  &:hover {
    background-color: #E9F3FF;

    i {
      color: #1E86FF;
    }
  }
}

.pl-wrapper-container {
  width: 100%;
  // height: 100%;
  position: relative; //设置为relative会导致右键菜单定位异常，后续需要仔细调试
  padding: 5px 15px;

  &::backdrop {
    //设置全屏时的背景色
    background-color: #bedcff;
  }

  #pipeline-container {
    display: flex;
    border: 1px solid #dfe3e8;
    height: calc(100% - 40px);
    width: 100%;

    .stencil-wrapper {
      // width: 200px; //改为style中动态设置
      height: 100%;
      position: relative;
      border-right: 1px solid #dfe3e8;
      position: relative;
      z-index: 2;
      transition: width 0.5s;

      .show-panel-button {
        .toggle-icon();

      }
    }

    .center-content {
      flex: 1;
      height: 100%;
      overflow: auto; //必须设置，否则无法做到画布自适应,且配置面板会超出screen
      display: flex; //必须设置
      position: relative;

      #graph-container {
        // flex: 1;
        width: 100%;
        height: 100%;
      }

      .logger-widget {
        position: absolute;
        bottom: 0;
        // height: 200px;
        // background: #888888;
        width: 100%;
      }
    }

    // .graph-wrapper {
    //   flex: 1;
    //   height: 100%;
    //   overflow: auto; //必须设置，否则无法做到画布自适应
    // }
    // 没有包裹时使用该样式
    // #graph-container {
    //   flex: 1;
    //   z-index: 1;
    // }

    #config-container {
      // position: relative;
      // width: 350px;
      height: 100%;
    }

    .config-container-show {
      width: 380px;
      padding: 0 10px;
      border-left: 1px solid #dfe3e8;
    }
  }
}
</style>
<style>
@keyframes ant-line {
  to {
    stroke-dashoffset: -1000;
    /* stroke-dashoffset: -1000; */
  }
}
</style>