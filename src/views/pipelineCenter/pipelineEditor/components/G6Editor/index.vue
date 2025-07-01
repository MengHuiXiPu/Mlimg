<template>
  <div id="mountNode1" :style="{ width: width }">
    <!-- <Banner /> -->
    <div class="editor">
      <!-- <context-menu /> -->
      <!--toolbar-->
      <toolbar :pipelineId="pipelineId" :filePath="filePath" :pipeLineData="pipeLineData"/>
      <div class="bottom-container">
        <!--itempannel-->
        <item-panel />
        <!--        <minimap />-->
        <ItemImage @on-savePath="handleFilePath"/>
        <!--detailpannel-->
        <detail-panel @on-savePath="handleFilePath"/>
        <!--miniMap-->

        <!--page-->
        <page ref="page" pageId="graph-container1" :height="height" :width="width" :graph-data="initData" :debug-data="debugData" :rpaLabelingId="rpaLabelingId"/>
        <!-- copilot -->
        <copilot ></copilot>
      </div>
    </div>
    <Flow />
    <OperatorGroupModal
        :is-show.sync="dialogOperatorGroupVisible"
        :operatorGroupId="operatorGroupId"
        :operatorType="currentOperatorType"
        :rpaLabelingId="rpaLabelingId"
        @on-fresh="handleFresh"
        :read-only="true"
    />
  </div>
</template>
<script>
import Toolbar from "../Toolbar";
import ItemPanel from "../ItemPanel";
import DetailPanel from "../DetailPanel";
import Minimap from "../Minimap";
import Page from "../Page";
import Flow from "../Flow";
import ContextMenu from "../ContextMenu";
import Editor from "../Base/Editor";
import command from "../../command";
import ItemImage from "../ItemImage";
import Banner from "../Banner";
import eventBus from "@/views/pipelineCenter/pipelineEditor/utils/eventBus";
import OperatorGroupModal from "../../../components/operatorGroupModal.vue";
import Copilot from "../Copilot/index.vue"
export default {
  name: "G6Editor",
  components: {
    Toolbar,
    ItemPanel,
    DetailPanel,
    Minimap,
    Page,
    ContextMenu,
    Flow,
    ItemImage,
    Banner,
    OperatorGroupModal,
    Copilot,
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
    pipelineId: {
      required: true,
      type: Number,
      default: null,
    },
    debugData: {
      type: Object,
      default: () => {},
    },
    pipeLineData: {
      type: Object,
      default: () => ({}),
    }
  },
  provide() {
    return {
      G6Instance: this,
      pipelineId: this.pipelineId,
    };
  },
  created() {
    this.init();
  },
  data() {
    return {
      editor: {},
      command: null,
      filePath: '',
      dialogOperatorGroupVisible: false, // 算子组的弹窗
      operatorGroupId: null,
      currentOperatorType: 0,
      rpaLabelingId: 0,
    };
  },
  methods: {
    init() {
      this.editor = new Editor();
      this.command = new command(this.editor);
      console.log(this.initData, 'initData')
      // console.log(this.debugData)

      eventBus.$on("nodeDblclick", (node) => {
        // console.log(node)
        // console.log(node.getModel())
        const modelObj = node.getModel()
        this.currentOperatorType = modelObj.operatorType || 0;
        this.rpaLabelingId = modelObj.rpaLabelingId;
        if([1, 2].includes(this.currentOperatorType)){
          this.operatorGroupId = this.currentOperatorType == 1 ? modelObj.opGroupId : modelObj.operatorId;
          this.dialogOperatorGroupVisible = true;
        }
      })
    },
    handleFilePath(path) {
      console.log(" path = " + path)
      this.filePath = path
    },
    // handleFresh() {
    //   // this.$forceUpdate()
    //   console.log(this.$refs.page)
    //   this.$refs.page.init()
    // }
  },
  beforeDestroy() {
    eventBus.$off('nodeDblclick')
  }
};
</script>

<style lang="less" scoped>
#mountNode1 {
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