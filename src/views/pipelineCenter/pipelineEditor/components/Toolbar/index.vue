<template>
  <div class="toolbar">
    <div class="banner">
      <span class="title"><strong>TCL</strong>图形化应用开发平台</span>
      <span class="pupiline-info"><strong>方案名称：</strong>{{ pipeLineName }} </span>
    </div>
    <link
      rel="stylesheet"
      type="text/css"
      href="//at.alicdn.com/t/font_598462_3xve1872wizzolxr.css"
    />
    <i
      class="command iconfont icon-undo"
      title="撤销"
      :class="undoList.length > 0 ? '' : 'disable'"
      @click="handleUndo"
    ></i>
    <i
      class="command iconfont icon-redo"
      title="重做"
      :class="redoList.length > 0 ? '' : 'disable'"
      @click="handleRedo"
    ></i>
    <span class="separator"></span>
    <!-- <i data-command="copy" class="command iconfont icon-copy-o disable" title="复制"></i>
    <i data-command="paste" class="command iconfont icon-paster-o disable" title="粘贴"></i>-->
    <i
      data-command="delete"
      class="command iconfont icon-delete-o"
      title="删除"
      :class="selectedItem ? '' : 'disable'"
      @click="handleDelete"
    ></i>
    <span class="separator"></span>
    <i
      data-command="zoomIn"
      class="command iconfont icon-zoom-in-o"
      title="放大"
      @click="handleZoomIn"
    ></i>
    <i
      data-command="zoomOut"
      class="command iconfont icon-zoom-out-o"
      title="缩小"
      @click="handleZoomOut"
    ></i>
    <!-- <i
      data-command="autoZoom"
      class="command iconfont icon-fit"
      title="适应画布"
      @click="handleAutoZoom"
    ></i> -->
    <i
      data-command="resetZoom"
      class="command iconfont icon-actual-size-o"
      title="实际尺寸"
      @click="handleResetZoom"
    ></i>
    <span class="separator"></span>
    <i
      data-command="toBack"
      class="command iconfont icon-to-back"
      :class="selectedItem ? '' : 'disable'"
      title="层级后置"
      @click="handleToBack"
    ></i>
    <i
      data-command="toFront"
      class="command iconfont icon-to-front"
      :class="selectedItem ? '' : 'disable'"
      title="层级前置"
      @click="handleToFront"
    ></i>
    <span class="separator"></span>
    <span class="separator"></span>
    <i
      data-command="multiSelect"
      class="command iconfont icon-select"
      :class="multiSelect ? 'disable' : ''"
      title="多选"
      @click="handleMuiltSelect"
    ></i>
    <i
      data-command="addGroup"
      class="command iconfont icon-group"
      title="成组"
      :class="addGroup ? '' : 'disable'"
      @click="handleAddGroup"
    ></i>
    <i
      data-command="unGroup"
      class="command iconfont icon-ungroup disable"
      title="解组"
    ></i>
    <el-button @click="saveData" :loading="saveLoading" type="primary" style="margin-left: 15px" size="mini"
      >保存</el-button
    >
    <el-button @click="startDebugging" :disabled="!filePath" :loading="debuggingLoading" type="primary" size="mini">调试</el-button>

    <!-- 窗口 -->
    <!-- <div :class="{ 'minimized-window': minimized, 'normal-window': !minimized }">
      
      <span class="restore-btn" @click="toggleMinimize">{{ minimizeButtonText }}</span>
      <div v-if="minimized" @click="restoreWindow" class="minimized-content">

      </div>
      <div v-else class="normal-content" :style="{ overflow: windowContentOverflow }">
        <div class="scroll-content">
          {{ debugInfo }}
        </div>
      </div>
    </div> -->

    <!-- <el-button @click="consoleData" type="primary">开始执行</el-button> -->
    <!-- <el-button @click="cardData" type="primary">银行卡识别</el-button>
    <el-button @click="muraData" type="primary">MURA</el-button>
    <el-button @click="adcData" type="primary">ADC</el-button> -->
  </div>
</template>

<script>
import eventBus from "../../utils/eventBus";
import Util from "@antv/g6/src/util";
import { uniqueId, getBox } from "../../utils";
import axios from "axios";
import Config from "../Base/Config";
import Operator from "@/api/operator";
import {deleteItem} from "@/views/pipelineCenter/pipelineEditor/utils/inherit";
export default {
  props: {
    filePath: {
      type: String,
      default: "",
    },
    pipelineId: {
      required: true,
      type: Number,
      default: null,
    },
  },
  data() {
    return {
      page: {},
      graph: {},
      redoList: [],
      undoList: [],
      editor: null,
      command: null,
      selectedItem: null,
      multiSelect: false,
      addGroup: false,
      saveLoading: false,
      debuggingLoading: false,
      // filePath: '', // 请确保在您的 data 中定义了 filePath
      minimized: true, // 是否最小化
      windowContent: '正常窗口内容'.repeat(10), // 正常窗口内容（重复多次以产生大量内容）
      debugInfo: '', // 调试信息
    };
  },
  computed: {
    minimizeButtonText() {
      return this.minimized ? '最大化' : '最小化';
    },
    windowContentOverflow() {
      return this.windowContent.length > 500 ? 'auto' : 'visible'; // 根据内容长度决定是否显示滚动条
    },
    pipeLineName() {
      return this.$attrs.pipeLineData?.name
    }
  },
  created() {
    this.init();
    this.bindEvent();
  },
  watch: {
    selectedItem(val) {
      if (val && val.length > 1) {
        this.addGroup = true;
      } else {
        this.addGroup = false;
      }
    },
  },
  methods: {
    init() {
      const { editor, command } = this.$parent;
      this.editor = editor;
      this.command = command;
      this.$store.dispatch("editorMode", 0);
    },
    // 获取头节点,但是有bug,可能有多个head节点.
    headNode(graph) {
      const nodeIds = graph.nodes.map((node) => node.id);
      const endIds = graph.edges.map((edge) => edge.targetId);
      var headIds = nodeIds.filter(function (v) {
        return endIds.indexOf(v) == -1;
      });
      const node = graph.nodes.find((node) => node.id === headIds[0]);

      return node;
    },
    bindEvent() {
      let self = this;
      eventBus.$on("afterAddPage", (page) => {
        self.page = page;
        self.graph = self.page.graph;
      });
      eventBus.$on("add", (data) => {
        this.redoList = data.redoList;
        this.undoList = data.undoList;
      });
      eventBus.$on("update", (data) => {
        this.redoList = data.redoList;
        this.undoList = data.undoList;
      });
      eventBus.$on("delete", (data) => {
        this.redoList = data.redoList;
        this.undoList = data.undoList;
      });
      eventBus.$on("updateItem", (item) => {
        this.command.executeCommand("update", [item]);
      });
      eventBus.$on("addItem", (item) => {
        this.command.executeCommand("add", [item]);
      });
      eventBus.$on("nodeselectchange", (node) => {
        this.selectedItem = this.graph.findAllByState("node", "selected");
        this.selectedItem = this.selectedItem.concat(
          ...this.graph.findAllByState("edge", "selected")
        );
      });
      eventBus.$on("deleteItem", () => {
        try {
          this.handleDelete();
        }catch (e) {
          console.error(e);
        }
      });
      eventBus.$on("muliteSelectEnd", () => {
        this.multiSelect = false;
        this.selectedItem = this.graph.findAllByState("node", "selected");
      });
      // eventBus.$on("nodeDblclick", (node) => {
      //   console.error("nodeDblclick = ", node)
      //   alert(node._cfg.model.operatorType + " eeee " + node._cfg.model.operatorId)
      //   if(node._cfg.model.operatorType == 1){
      //
      //   }
      // })

    },
    handleUndo() {
      if (this.undoList.length > 0) this.command.undo();
    },
    handleRedo() {
      if (this.redoList.length > 0) this.command.redo();
    },
    handleDelete() {
      if (this.selectedItem != null && this.selectedItem.length > 0) {
        deleteItem(this.graph, this.selectedItem);
        this.command.executeCommand("delete", this.selectedItem);
        this.selectedItem = null;
      }
    },
    getFormatPadding() {
      return Util.formatPadding(this.graph.get("fitViewPadding"));
    },
    getViewCenter() {
      const padding = this.getFormatPadding();
      const graph = this.graph;
      const width = this.graph.get("width");
      const height = graph.get("height");
      return {
        x: (width - padding[2] - padding[3]) / 2 + padding[3],
        y: (height - padding[0] - padding[2]) / 2 + padding[0],
      };
    },
    handleZoomIn() {
      const currentZoom = this.graph.getZoom();
      this.graph.zoomTo(currentZoom + 0.5, this.getViewCenter());
    },
    handleZoomOut() {
      const currentZoom = this.graph.getZoom();
      this.graph.zoomTo(currentZoom - 0.5, this.getViewCenter());
    },
    handleToBack() {
      if (this.selectedItem && this.selectedItem.length > 0) {
        this.selectedItem.forEach((item) => {
          item.toBack();
          this.graph.paint();
        });
      }
    },
    handleToFront() {
      if (this.selectedItem && this.selectedItem.length > 0) {
        this.selectedItem.forEach((item) => {
          if (item.getType() === "edge") {
            // const nodeGroup = this.graph.get("nodeGroup");
            // const edgeGroup = item.get("group");
            // nodeGroup.toFront();
            // edgeGroup.toFront()
          } else {
            item.toFront();
          }

          this.graph.paint();
        });
      }
    },
    handleAutoZoom() {
      this.graph.fitView(20);
    },
    handleResetZoom() {
      this.graph.zoomTo(1, this.getViewCenter());
    },
    handleMuiltSelect() {
      this.multiSelect = true;
      this.graph.setMode("mulitSelect");
    },
    handleAddGroup() {
      //TODO 这部分等阿里更新Group之后添加
      // const model = {
      //   id: "group" + uniqueId(),
      //   title: "新建分组"
      // };
      // // this.command.executeCommand("add", "group", model);
      // this.selectedItem.forEach(item => {
      //   console.log(item);
      // });
      //this.getPosition(this.selectedItem);
    },
    getPosition(items) {
      const boxList = [];
      items.forEach((item) => {
        const box = item.getBBox();
        boxList.push(getBox(box.x, box.y, box.width, box.height));
      });
      let minX1, minY1, MaxX2, MaxY2;
      boxList.forEach((box) => {
        if (typeof minX1 == "undefined") {
          minX1 = box.x1;
        }
        if (typeof minY1 == "undefined") {
          minY1 = box.y1;
        }
        if (typeof MaxX2 == "undefined") {
          MaxX2 = box.x2;
        }
        if (typeof MaxY2 == "undefined") {
          MaxY2 = box.y2;
        }
        if (minX1 > box.x1) {
          minX1 = box.x1;
        }
        if (minY1 > box.y1) {
          minY1 = box.y1;
        }
        if (MaxX2 < box.x2) {
          MaxX2 = box.x2;
        }
        if (MaxY2 < box.y2) {
          MaxY2 = box.y2;
        }
      });
      const width = MaxX2 - minX1,
        height = MaxY2 - minY1,
        x = minX1 + width / 2,
        y = minY1 + height / 2,
        id = "team" + uniqueId();
      const model = {
        id: id,
        width,
        height,
        x,
        y,
        shape: "teamNode",
      };
      this.command.executeCommand("add", model);
      // const item = this.graph.findById(id);
      // item.get("group").toBack();
      // const edgeGroup = this.graph.get("edgeGroup");
      // edgeGroup.toFront();
      // this.graph.paint();
    },
    // 执行操作
    consoleData() {
      var obj = this.graph.save();
      // this.exportJSONData(obj, 'data.json');
      console.log(obj);
      // if(this.headNode(obj).name != "图片加载"){
      //   alert("第一个节点必须为'图片加载'算子")
      //   return;
      // }
      //
      // if(this.headNode(obj).stateImage == null || this.headNode(obj).stateImage.length < 100){
      //   alert("请选择图片")
      //   return;
      // }
      console.log(this.headNode(obj).name);
      const jsonString = JSON.stringify(obj);
      console.log(jsonString);
      let url = Config.url + "/flow";
      axios
        .post(url, jsonString)
        .then((response) => {
          let data = response.data;
          //console.log(data)
          this.graph.read(data);
        })
        .catch((error) => {
          console.error(error);
        });
    },
    saveData() {
      const obj = this.graph.save();
      if (obj.edges.length < 1 || obj.nodes.length < 2) {
        console.log("不能保存");
        return;
      }
      const id = this.$parent.pipelineId;
      delete obj.groups;
      console.error(obj.edges)
      obj.edges = obj.edges.map((ele) => {
        return {
          id: ele.id,
          startPoint: ele.start,
          endPoint: ele.end,
          sourceId: Number(ele.sourceId),
          targetId: Number(ele.targetId),
          condition: ele.condition,
          type: ele.type,
          startVar: ele.startVar,
          endVar: ele.endVar,
        };
      });
      obj.nodes = obj.nodes.map((ele) => {
        return {
          id: Number(ele.id),
          label: ele.label,
          name: ele.name,
          group: ele.group,
          inits: ele.inits || [],
          items: ele.items,
          outputs: ele.outputs,
          size: ele.size.map((ele) => Number(ele)),
          type: ele.type,
          shape: ele.shape,
          x: ele.x,
          y: ele.y,
          operatorType: ele.operatorType,
          opGroupId: ele.opGroupId,
          operatorId: ele.operatorId,
          rpaLabelingId: ele.rpaLabelingId,
        };
      });
      const data = {
        graph: obj,
      };
      // console.log(id)
      // console.log(data);
      this.saveLoading = true;
      // 保存流程
      return Operator.updatePipelineTemplateById(id, data)
        .then((res) => {
          console.log(res.data);
          this.saveLoading = false;
          this.$message.success("保存成功");
        })
        .finally(() => {
          this.saveLoading = false;
        });
    },
    async startDebugging() {
      if (!this.filePath) {
        return;
      }
      await this.saveData()
      Operator.pipelineDebug(this.pipelineId, {
        inputImgPath: this.filePath,
      })
        .then((res) => {
          console.log(res.data);
          eventBus.$emit("initDebugResult", res.data);
          this.debugInfo = res.data;
          this.minimized = false;
          this.debuggingLoading = false;
          this.$message.success("调试成功");
        })
        .finally(() => {
          this.debuggingLoading = false;
        });
    },
    toggleMinimize() {
      // 切换最小化和恢复状态
      this.minimized = !this.minimized;
    },
    restoreWindow() {
      // 恢复正常窗口状态
      this.minimized = false;
    },
    // cardData(){
    //   this.getGraph("card")
    // },
    // muraData(){
    //   this.getGraph("mura")
    // },
    // adcData(){

    // },
    // getGraph(demo){
    //   let url =  Config.url + "/graph"
    //   let obj = {
    //     method : demo
    //   }
    //   const jsonString = JSON.stringify(obj);
    //   axios.post(url, jsonString)
    //       .then(response => {
    //         let data = response.data;
    //         //console.log(data)
    //         this.graph.read(data);
    //       })
    //       .catch(error => {
    //         console.error(error);
    //       });
    // },
    exportJSONData(data, fileName) {
      const jsonStr = JSON.stringify(data);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();

      // Clean up the URL object
      URL.revokeObjectURL(url);
    },
  },
  beforeDestroy() {
    // 务必移除事件监听
    eventBus.$off('afterAddPage')
    eventBus.$off('add')
    eventBus.$off('update')
    eventBus.$off('delete')
    eventBus.$off('updateItem')
    eventBus.$off('addItem')
    eventBus.$off('nodeselectchange')
    eventBus.$off('deleteItem')
    eventBus.$off('muliteSelectEnd')
  },
};
</script>


<style lang="less" scoped>
/* 窗口的样式 */
.minimized-window {
  position: fixed;
  bottom: 20px;
  right: 330px;
  height: 10px;
  width: 50px;
  display: flex;
  justify-content: flex-start; /* 右对齐 */
  align-items: flex-end; /* 垂直右对齐 */
  flex-direction: column; /* 设置主轴方向为垂直 */
  cursor: pointer;
  z-index: 1000;
}

.normal-window {
  /* 正常窗口的样式，根据需要设置 */
  position: fixed;
  bottom: 20px;
  left: 250px;
  right: 330px;
  height: 150px;
  background-color: #eee;
  display: flex;
  justify-content: flex-start; /* 右对齐 */
  align-items: flex-end; /* 垂直右对齐 */
  flex-direction: column; /* 设置主轴方向为垂直 */
  cursor: pointer;
  z-index: 1000;
}

/* 最小化窗口的样式 */
.minimized-content {
  cursor: pointer;
}

.restore-btn {
  text-decoration: underline;
  color: blue;
  cursor: pointer;
}

/* 滚动内容的样式 */
.scroll-content {
  max-height: 150px; /* 根据需要设置最大高度 */
  overflow-y: auto; /* 显示垂直滚动条 */
}

.toolbar {
  box-sizing: border-box;
  padding: 8px 60px 8px 10px;
  width: 100%;
  border: 1px solid #e9e9e9;
  height: 50px;
  z-index: 3;
  box-shadow: 0px 8px 12px 0px rgba(0, 52, 107, 0.04);
  /* position: absolute; */
  text-align: right;
  position: relative;
  .banner {
    position: absolute;
    height: 32px;
    line-height: 32px;
    font-family: "微软雅黑 Bold", "微软雅黑 Regular";
    .title{
      font-size: 22px;
      color: #0000FF;
      font-weight: 700;
      strong {
        color: #D9001B;
      }
    }
    .pupiline-info {
      padding-left: 20px;
      font-size: 16px;
      color: #333333;
      strong {
        font-weight: 700;
      }
    }
  }
}
.toolbar .command:nth-of-type(1) {
  margin-left: 24px;
}
.toolbar .command {
  box-sizing: border-box;
  width: 27px;
  height: 27px;
  margin: 0px 6px;
  border-radius: 2px;
  padding-left: 4px;
  display: inline-block;
  border: 1px solid rgba(2, 2, 2, 0);
}
.toolbar .command:hover {
  cursor: pointer;
  border: 1px solid #e9e9e9;
}
.toolbar .disable {
  color: rgba(0, 0, 0, 0.25);
}
.toolbar .separator {
  margin: 4px;
  border-left: 1px solid #e9e9e9;
}
</style>