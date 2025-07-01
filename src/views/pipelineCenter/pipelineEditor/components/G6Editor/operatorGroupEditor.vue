<template>
  <div id="mountNode2" :style="{ width: width }">
    <!-- <OperatorGroupBanner /> -->
    <div class="editor">
      <!-- <context-menu /> -->
      <!--OperatorGroupToolbar-->
      <OperatorGroupToolbar :operatorGroupId="operatorGroupId" :filePath="filePath" :readOnly="readOnly"/>
      <div class="bottom-container">
        <!--OperatorGroupIndex   算子列表-->
        <OperatorGroupIndex />
        <!-- operatorGroupItemImage -->

        <OperatorGroupItemImage @on-savePath="handleFilePath"/>

        
        <!--OperatorGroupdetailpannel-->
        <OperatorGroupDetailPanel @on-savePath="handleFilePath"/>
        <!--miniMap-->

        <!--page-->
        <!-- <page pageId="graph-container2" :height="height" :width="width" :graph-data="initData" :debug-data="debugData"/> -->
        <!-- 画布 -->
        <OperatorGroupPage pageId="graph-container2" :height="height" :width="width" :graph-data="initData" :debug-data="debugData"/>
      </div>
    </div>
    <Flow />
  </div>
</template>
<script>
import OperatorGroupToolbar from "../Toolbar/operatorGroupToolbar.vue";
import OperatorGroupIndex from "../ItemPanel/operatorGroupIndex.vue";
import OperatorGroupDetailPanel from "../DetailPanel/operatorGroupIndex.vue";
import Minimap from "../Minimap";
// import Page from "../Page";
import OperatorGroupPage from "../Page/operatorGroupPage.vue";
import Flow from "../Flow";
import ContextMenu from "../ContextMenu";
import Editor from "../Base/Editor";
import command from "../../command";
import OperatorGroupItemImage from "../ItemImage/operatorGroupIndex.vue";
import OperatorGroupBanner from "../Banner/operatorGroupBanner.vue";
export default {
  name: "operatorGroupEditor",
  components: {
    OperatorGroupToolbar,
    OperatorGroupIndex,
    OperatorGroupDetailPanel,
    Minimap,
    // Page,
    OperatorGroupPage,
    ContextMenu,
    Flow,
    OperatorGroupItemImage,
    OperatorGroupBanner,
  },
  props: {
    height: {
      type: Number,
      default: document.documentElement.clientHeight,
    },
    width: {
      type: Number,
      default: document.documentElement.clientWidth,
    },
    initData: {
      type: Object,
      default: () => {},
    },
    operatorGroupId: {
      required: true,
      type: Number,
      default: null,
    },
    debugData: {
      type: Object,
      default: () => {},
    },
    rpaLabelingId: {
      type: Number,
      default: null,
    },
    operatorType: {
      type: Number,
      default: null
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  provide() {
    return {
      G6Instance: this,
      operatorGroupId: this.operatorGroupId,
    };
  },
  created() {
    this.init();
  },
  data() {
    return {
      editor: {},
      command: null,
      filePath: ''
    };
  },
  methods: {
    init() {
      this.editor = new Editor();
      this.command = new command(this.editor);
      // console.log(this.initData, 'initData')
      // console.log(this.debugData)
    },
    handleFilePath(path) {
      // console.log(" path = " + path)
      this.filePath = path
    }
  },
  mounted () {
    
  },
};
</script>

<style lang="less" scoped>
#mountNode2 {
  height: inherit;
}
.editor {
  // position: absolute;
  width: 100%;
  height: 100%;
  user-select: none;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  // border-bottom: 20px solid #f7f9fb;
  // padding-bottom: 20px;
}
.bottom-container {
  position: relative;
  height: calc(100% - 40px);
}
</style>