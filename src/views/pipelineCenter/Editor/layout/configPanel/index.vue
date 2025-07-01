<template>
  <div class="config-panel">
    <!-- <i class="el-icon-close close-btn" @click="$emit('close')" v-show="visible"></i> -->
    <!-- <config-modal ref="refConfigModal" /> -->
    <el-tabs v-model="activeKey" v-show="visible" @tab-click="onTabClick">
      <el-tab-pane label="节点信息" name="nodeInfoTab" class="scrollbar panel-content">
        <node-info ref="refNodeInfo"></node-info>
      </el-tab-pane>
      <el-tab-pane label="中间结果" name="middleResultTab">
        <output-panel class="scrollbar panel-content"></output-panel>
      </el-tab-pane>
      <!-- <split-pane split="horizontal" :default-percent='40' :min-percent='20' style="height: 100%;">
        <div slot="paneL" class="top-panel panel-item scrollbar">
          <h3 class="panel-title">基本信息</h3>
          <input-panel class="scrollbar panel-content"></input-panel>
        </div>
        <div slot="paneR" class="bottom-panel panel-item scrollbar">
          <h3 class="panel-title">算子输出</h3>
          <output-panel class="scrollbar panel-content"></output-panel>
        </div>
      </split-pane> -->
    </el-tabs>
    <!-- 未选中节点的empty -->
    <!-- <a-empty class="empty-info" :image="simpleImage" description="未选中节点" v-if="visible && !isSelectedNode" /> -->
    <span class="show-panel-button" @click="$emit('update:visible', !visible)">
      <i :class="visible ? 'el-icon-arrow-left' : 'el-icon-arrow-right'"></i>
    </span>
  </div>
</template>

<script>
import SplitPane from 'vue-splitpane';
import Emitter from "@pipeline/Editor/util/channel.js";
import { useNodeData, useProvideNodeData, useProvideCell, useGetState } from "@pipeline/Editor/store/index.js";
import { ref, onBeforeUnmount, onMounted } from 'vue';
import Output from "@pipeline/Editor/layout/configPanel/output/index.vue";
import Iutput from "@pipeline/Editor/layout/configPanel/input/index.vue";
// import configModal from "../configModal/index.vue";
import nodeInfo from "./nodeInfo/index.vue";
import { isWhileNode } from "@pipeline/Editor/common/cell.js";
import { Empty } from 'ant-design-vue';
export default {
  components: {
    SplitPane,
    outputPanel: Output,
    inputPanel: Iutput,
    // configModal,
    nodeInfo,
  },
  data() {
    return {
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
      // activeKey: "nodeInfoTab"
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    // fix: 因el-tab切换，无法重新渲染codemirror的问题
    onTabClick(tabIns) {
      if (this.activeKey === "nodeInfoTab") {
        const refPyConfig = this.$refs.refNodeInfo?.$refs.refPyConfig
        refPyConfig && refPyConfig.reRenderCodemirror()
      }
    }
  },
  setup() {
    // const graph = useGraph()
    const nodeData = useNodeData();
    const refConfigModal = ref(null);
    const activeKey = ref('nodeInfoTab');
    const pipelineId = useGetState('pipelineId');

    Emitter.on('cellSelected', ({ cell, isSelected, }) => {
      if (!isSelected) {
        useProvideCell({})
        useProvideNodeData({})
        return
      } else {
        const data = cell.getData() //获取节点上的业务数据
        if (isWhileNode(data)) { //后端没有保存dynamicGroupName(仅使用)，引擎端返回调试结果是以这个作为key的
          data.dynamicGroupName = `${pipelineId.value}_while_${data.id}`
        }
        useProvideCell(cell)
        console.log('当前算子data：', data)
        // console.log('当前算子cls：', cell)
        useProvideNodeData(data)
      }
    })
    // Emitter.on("nodeDbClick", ({ cell, isSelected }) => {
    //   const data = cell.getData() //获取节点上的业务数据
    //   if (["Switch", "start", "end"].includes(data.name)) return
    //   const originalNodeData = cloneDeep(data) //原始的节点数据，用于用户点击取消时，将数据还原
    //   refConfigModal.value.invoke(data).catch(errMsg => {
    //     if (errMsg === 'canceled') {
    //       // 点击取消，将数据还原
    //       cell.setData(originalNodeData)
    //     }
    //   })
    // })
    onBeforeUnmount(() => {
      Emitter.off('cellSelected')
      // Emitter.off('nodeDbClick')
    })
    return {
      refConfigModal,
      nodeData,
      activeKey,
    }
  }
}
</script>

<style lang="less" scoped>
.config-panel {
  position: relative;

  // .close-btn {
  //   position: absolute;
  //   right: 20px;
  //   top: 10px;
  //   font-size: 18px;
  //   cursor: pointer;
  //   z-index: 1;
  // }

  .show-panel-button {
    position: absolute;
    top: 50%;
    left: -18px;
    width: 18px;
    height: 80px;
    line-height: 80px;
    text-align: center;
    transform: translateY(-50%);
    background: #ffffff;
    border: 1px solid #EEF0F2;
    border-radius: 12px 0 0 12px;
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

  /deep/ .splitter-pane-resizer {
    height: 12px;
    background-color: #FFFFFF;
  }
}

.panel-item {
  // height: 100%;
  overflow: auto;
}

.panel-title {
  height: 30px;
  line-height: 30px;
  padding: 0 5px 0 5px;
  // box-sizing: border-box;
  font-size: 13px;
  color: #666;
  font-weight: 700;
  user-select: none;
  // border-bottom: .5px solid #EBEEF5;
}

.panel-content {
  // height: calc(100vh - 90px -35px - 40px -15px);
  height: calc(100vh - 210px);
  overflow: auto;
  padding: 0 0 10px 0; //不让底部贴底
}
</style>