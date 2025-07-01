<template>
  <a-modal
    :visible="visible"
    :footer="null"
    wrapClassName="fullscreen-modal"
    :mask="false"
    :keyboard="false"
    :destroyOnClose="true"
    @cancel="doCloseModal"
  >
    <div class="content">
      <header class="top">
        <div class="title-area">应用名称：{{ configData.algorithmName }}</div>
        <toolbar class="toolbar-wrap"></toolbar>
      </header>
      <article class="main">
        <image-list class="left" ref="refImgList" v-if="isReady"></image-list>
        <graph class="middle"></graph>
        <right-panel class="right" v-if="isReady"></right-panel>
      </article>
    </div>
  </a-modal>
</template>

<script>
import ImageList from "./imageList.vue";
import Graph from "./graph/index.vue";
import Toolbar from './toolbar/index.vue';
import RightPanel from "./rightPanel/index.vue";
import { useState } from "./hooks/state";
import { ref } from "vue";
export default {
  name: 'Editor',
  components: {
    ImageList,
    Graph,
    Toolbar,
    RightPanel,
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // 配置id
    configId: {
      type: Number,
      default: 0
    }
  },
  setup(props, {} ) {
    const isReady = ref(false)
    const { configData, setConfigData, queryConfigById, setGroupLoading, setTaskId, setOutputs, setActiveTool, setAnnotations, setCommonState } = useState()
    queryConfigById(props.configId).then(() => {
      isReady.value = true
    })
    return {
      isReady,
      configData,
      setConfigData,
      setGroupLoading,
      setTaskId,
      setOutputs,
      setActiveTool,
      setAnnotations,
      setCommonState,
      // queryConfigById,
    }
  },
  methods: {
    doCloseModal() {
      this.setActiveTool(null)
      this.setOutputs([], "")
      this.setTaskId(null)
      this.setGroupLoading([])
      this.setConfigData({})
      this.setAnnotations("Empty")
      this.setCommonState("Empty")
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style lang="less" scoped>
@import "../base.less";
.content {
  height: 100%;
  display: flex;
  flex-direction: column;
  .top {
    height: 40px;
    margin-bottom: 10px;
    .base-block();
    position: relative;
    display: flex;
    justify-content: space-between;
    .title-area{  //应用名称标题
      font-weight: 600;
      line-height: 40px;
      padding-left: 20px;
      font-size: 18px;
    }
    .toolbar-wrap {
      height: 100%;
      width: 50%;
      // text-align: right;
      padding-right: 50px;
    }
  }
  .main {
    flex: 1;
    display: flex;
    overflow: auto;
    .left {
      // width: 200px;
      height: 100%;
      // .base-block()
      border-radius: 8px;
    }
    .right{
      width: 300px;
      .base-block();
      background-color: transparent;
    }
    .middle {
      flex: 1;
      height: 100%;
      padding: 0 10px;
    }
  }
}
/deep/ .ant-modal-close {
  outline: none;
  .ant-modal-close-x {
    font-size: 18px;
    height: 40px;
    line-height: 30px;
  }
}
/deep/ .fullscreen-modal .ant-modal {
  width: 100% !important;
  height: 100vh;
  top: 0;
  padding: 0;
}
/deep/ .fullscreen-modal .ant-modal-body {
  height: 100vh;
  padding: 0 5px 5px;
  background-color: @bg-color-g;
}

/deep/ .fullscreen-modal .ant-modal-close-x {
  color: #ffffff;
}
</style>