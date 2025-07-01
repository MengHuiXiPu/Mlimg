<template>
  <div class="page">
    <div :id="pageId" class="graph-container" style="position: relative"></div>
  </div>
</template>


<script>
import G6 from "@antv/g6/build/g6";
import { initBehavors } from "../../behavior";
import eventBus from "@/views/pipelineCenter/pipelineEditor/utils/eventBus";
import pageMixins from "./pageMixins.js"
import {
  conditionPoints,
  evenlyDistributeVarName,
  getItemInfo,
} from "../../utils";
export default {
  mixins: [pageMixins],
  data() {
    return {
      // pageId: "graph-container",
      graph: null,
      debugResult: null,
    };
  },
  props: {
    height: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: 0,
    },
    graphData: {
      type: Object,
      default: () => {},
    },
    debugData: {
      type: Object,
      default: () => {},
    },
    pageId: {
      type: String,
      default: "graph-container1",
    },
  },
  created() {
    initBehavors();
  },
  mounted() {
    this.$nextTick(() => {
      this.init();
    });
  },

  watch: {
    graphData(val) {
      if (Object.keys(val).length !== 0) {
        val.nodes = val.nodes || [];
        val.edges = val.edges || [];
        val.nodes = val.nodes.map((ele) => {
          if (ele.group.name == "logic") {
            return {
              ...ele,
              id: String(ele.id),
              shape: "customDiamond",
              ...conditionPoints(ele.name),
            };
          } else {
            return {
              ...ele,
              id: String(ele.id),
              inPoints: evenlyDistributeVarName(0, ele.items, "varName"),
              outPoints: evenlyDistributeVarName(1, ele.outputs, "varName"),
            };
          }
        });
        val.edges = val.edges.map((ele) => {
          return {
            ...ele,
            start: ele.startPoint,
            end: ele.endPoint,
            source: String(ele.sourceId),
            target: String(ele.targetId),
            shape: "customEdge",
          };
        });
        console.log(this.graph);
        this.graph.read(val);
      }
    },
    debugData(val) {
      this.debugResult = val;
      eventBus.$emit("initDebugResult", this.debugResult);
    },
  },
  methods: {
    init() {
      const height = this.height - 61;
      const width = this.width - 550;
      this.graph = new G6.Graph({
        // container: "graph-container",
        container: this.pageId,
        height: height,
        width: width,
        modes: {
          // 支持的 behavior
          default: [
            "drag-canvas",
            "zoom-canvas",
            "hover-node",
            "select-node",
            "hover-edge",
            "keyboard",
            "customer-events",
            "add-menu",
          ],
          mulitSelect: ["mulit-select"],
          addEdge: ["add-edge"],
          moveNode: ["drag-item"],
        },
      });
      const { editor, command } = this.$parent;
      editor.emit("afterAddPageGroup", { graph: this.graph, command });

      // this.readData();
    },
    // readData() {
    //   let data = this.graphData;
    //   if (data) {
    //     this.graph.read(data);
    //   }
    // }
  },
};
</script>

<style scoped>
.page {
  margin-left: 250px;
  margin-right: 330px;
}
</style>
<style lang="less" scoped>
@import "../../../common.less";
</style>