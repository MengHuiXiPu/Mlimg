<template>
  <div class="detailpannel">
    <div v-if="status == 'node-selected'" class="pannel" id="node_detailpannel">
      <div class="pannel-title">算子参数</div>
      <div class="block-container">
        <el-row
          type="flex"
          align="middle"
          :gutter="10"
          style="margin-bottom: 8px"
        >
          <el-col :span="6">名称</el-col>
          <el-col :span="18">
            {{ node.label }}
          </el-col>
        </el-row>
        <DynamicFormRow
          :items="node.items"
          :values="values"
          :node="node"
          :hasInherit="true"
          :inheritNode="inheritNode"
          :inheritEdge="inheritEdge"
          :realNode="realNode"
          :graph="graph"
          @custom-change="handleSelectChange"
          @inherit-change="handleInheritChange"
          @on-fileChange="beforeUpload"
          @on-uploadSuccess="handleUploadSuccess"
        />
        <!-- inits不需要继承，所以分开 -->
        <DynamicFormRow
          :items="node.inits"
          :values="values"
          :node="node"
          :hasInherit="false"
          :inheritNode="inheritNode"
          :inheritEdge="inheritEdge"
          :realNode="realNode"
          :graph="graph"
          @custom-change="handleSelectChange"
          @inherit-change="handleInheritChange"
          @on-fileChange="beforeUpload"
          @on-uploadSuccess="handleUploadSuccess"
        />
      </div>
    </div>
    <div
      v-if="status === 'canvas-selected'"
      class="pannel"
      id="canvas_detailpannel"
    >
      <div class="pannel-title">画布</div>
      <div class="block-container">
        <el-checkbox v-model="showGrid" @change="changeGridState"
          >网格对齐</el-checkbox
        >
      </div>
    </div>
    <!--我添加的-->
    <div
      v-if="status === 'edge-selected'"
      id="edge_detailpannel"
      class="pannel"
    >
      <div class="pannel-title">连线</div>
      <div class="block-container">
        <el-row
          type="flex"
          align="middle"
          :gutter="10"
          style="margin-bottom: 8px"
        >
          <el-col :span="8">文字内容</el-col>
          <el-col :span="16">
            <el-input v-model="edge.label" @change="handleTxtChange" />
          </el-col>
        </el-row>
        <el-row
          type="flex"
          align="middle"
          :gutter="10"
          style="margin-bottom: 8px"
        >
          <el-col :span="8">文字颜色</el-col>
          <el-col :span="16">
            <el-color-picker v-model="textColor" @change="handleChangeColor" />
          </el-col>
        </el-row>
        <el-row
          type="flex"
          align="middle"
          :gutter="10"
          style="margin-bottom: 8px"
        >
          <el-col :span="8">条件</el-col>
          <el-col :span="16">
            <el-input-number
              v-model="edgeConditionNum"
              @change="handleConditionChange"
              :min="0"
              :max="2"
            />
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script>
import eventBus from "../../utils/eventBus";
import Grid from "@antv/g6/build/grid";
import DynamicFormRow from "./dynamicFormRow";
// import closeSvg from "@/assets/icons/close.svg";
// import Config from "../Base/Config"
export default {
  components: {
    DynamicFormRow,
  },
  data() {
    return {
      status: "canvas-selected",
      showGrid: false,
      page: {},
      graph: {},
      item: {},
      node: {},
      //【我添加的】
      edge: {},
      edgeConditionNum: 0,
      //【我添加的】
      textColor: "rgba(19, 206, 102, 0.8)",
      grid: null,
      // uploadUrl : Config.url + "/uploadImage",
      values: {},
      inheritNode: [],
      inheritEdge: [],
      realNode: [],
    };
  },
  created() {
    this.init();
    this.bindEvent();
  },
  beforeDestroy() {
    // 务必移除事件监听
    eventBus.$off('nodeselectchange')
    eventBus.$off('afterAddPage')
  },
  // computed: {
  //   inputItems() {
  //     return [...this.node.items, ...this.node.inits];
  //   },
  // },
  methods: {
    init() {},
    bindEvent() {
      let self = this;
      eventBus.$on("afterAddPage", (page) => {
        self.page = page;
        self.graph = self.page.graph;
        eventBus.$on("nodeselectchange", (item) => {
          if (item.select === true && item.target.getType() === "node") {
            self.status = "node-selected";
            self.item = item.target;
            self.node = item.target.getModel();
            // 构建values
            this.processItems([...this.node.items, ...this.node.inits]);
            this.inheritNode = [];
            this.inheritEdge = [];
            this.realNode = [];
            const edges = self.graph.getEdges();
            const nodes = self.graph.getNodes();
            // 找出指向当前node的所有祖先节点
            this.findAncestors(self.node, { nodes, edges });
            // console.log(this.inheritNode);
            // console.log(self.node);
            // console.error(this.inheritEdge);
          } else if (item.select === true && item.target.getType() === "edge") {
            //【我添加的】
            self.status = "edge-selected";
            self.item = item.target;
            self.edge = item.target.getModel();
            this.edgeConditionNum = self.edge.condition || 0;
            // console.log(self.edge);
            // console.log(self.item);
          } else {
            self.status = "canvas-selected";
            self.item = null;
            self.node = null;
          }
        });
      });
    },
    // 寻找所有祖先节点
    findAncestors(selfNode, graph) {
      // 遍历图的边
      for (const edge of graph.edges) {
        let edgeModel = edge.getModel();
        // 如果当前节点是某个边的目标节点
        if (edgeModel.targetId == selfNode.id) {
          // 找到对应的源节点
          const sourceNode = graph.nodes.find(
              (node) => node.getModel().id == edgeModel.sourceId
          );

          if(this.inheritNode.find((node) => node.id == sourceNode.getModel().id) == null) {
            // 将源节点添加到结果数组中
            this.inheritNode.push(sourceNode.getModel());
            this.realNode.push(sourceNode);
            this.inheritEdge.push(edge);
            // 递归查找源节点的祖先节点
            this.findAncestors(sourceNode.getModel(), graph);
          }
        }
      }
    },
    // 构建values：{key: value}
    processItems(items, prefix = "") {
      items.forEach((item) => {
        const fullVarName = prefix + item.varName;
        if (item.controlType === "struct") {
          this.processItems(item.struct, fullVarName + ".");
        } else {
          this.$set(this.values, fullVarName, item.value);
        }
      });
    },
    // handleChangeName(e) {
    //   const model = {
    //     label: e,
    //   };

    //   this.graph.update(this.item, model);
    // },
    changeGridState(value) {
      if (value) {
        this.grid = new Grid();
        this.graph.addPlugin(this.grid);
      } else {
        this.graph.removePlugin(this.grid);
      }
    },
    //【我添加的】
    handleTxtChange(e) {
      const model = {
        label: e,
      };
      //console.log(model)
      this.graph.update(this.item, model);
    },
    handleChangeColor(e) {
      const model = {
        textColor: e,
      };
      this.graph.update(this.item, model);
    },
    // condition的graph赋值
    handleConditionChange(num) {
      const deepCopy = JSON.parse(JSON.stringify(this.edge));
      // console.log(deepCopy);
      deepCopy.condition = num;
      this.graph.update(this.item, deepCopy);
    },
    beforeUpload(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
          const imageUrl = event.target.result;

          // const model = {
          //   // stateImage: imageUrl,
          //   result: imageUrl,
          // };
          // this.graph.update(this.item, model);
          // // 在此处对图片进行预览或其他操作
          // // console.log("图片内容:", imageUrl);
          // eventBus.$emit("nodeselectchange", {
          //   target: this.item,
          //   select: true,
          // });

          // 将图片内容存储到 file 对象中
          file.imageUrl = imageUrl;

          resolve(file); // 继续执行上传
        };

        reader.onerror = (error) => {
          console.error("读取文件失败:", error);
          reject(error); // 中止上传
        };

        reader.readAsDataURL(file); // 读取图片内容
      });
    },
    handleUploadSuccess(response, hasInherit) {
      // 在这里处理上传成功的逻辑
      const filePath = response.data; // 假设服务器返回的路径存储在 response.filePath 中
      const modelId = response.modelId
      this.$emit("on-savePath", filePath);
      // console.log("文件上传成功，路径：", filePath);

      let obj = hasInherit ? this.node.items : this.node.inits;
      const deepCopy = JSON.parse(JSON.stringify(obj));
      deepCopy.forEach((ele) => {
        if (ele.controlType === "fileUpload") {
          ele.value = filePath;
          // 写入modelId
          modelId && (ele.modelId = modelId)
        }
      });
      let model = {};
      if(hasInherit) {
        model = {
          items: deepCopy,
        };
      }else{
        model = {
          inits: deepCopy,
        };
      }
      this.graph.update(this.item, model);
      eventBus.$emit("nodeselectchange", {
        target: this.item,
        select: true,
      });
    },
    handleUploadError(err, file, fileList) {
      // 在这里处理上传失败的逻辑
      console.log("文件上传失败:", err);
    },
    handleSelectChange(varName, hasInherit) {
      // console.log(varName);
      // 递归查找
      const findAndModifyVarName = (arr, varName, newValue) => {
        // 使用点号拆分 varName
        const varNameParts = varName.split(".");

        for (const item of arr) {
          if (item.varName === varNameParts[0]) {
            // 找到了对应 varName 的元素
            if (varNameParts.length === 1) {
              // 如果 varName 只有一层，修改其 value 值
              item.value = newValue;
              return true; // 返回 true 表示找到并修改成功
            } else if (item.controlType === "struct") {
              // 如果 varName 有多层，且当前元素是结构体，递归查找 struct 内部的元素
              const foundInStruct = findAndModifyVarName(
                item.struct,
                varNameParts.slice(1).join("."), // 去掉第一层，传递剩下的部分
                newValue
              );

              if (foundInStruct) {
                return true; // 返回 true 表示在 struct 内找到并修改成功
              }
            }
          }
        }

        return false; // 返回 false 表示未找到对应 varName 的元素
      };

      const model = {};
      const obj = hasInherit ? this.node.items : this.node.inits;
      const deepCopy = JSON.parse(JSON.stringify(obj));
      findAndModifyVarName(deepCopy, varName, this.values[varName]);
      model[hasInherit ? "items" : "inits"] = deepCopy;
      console.log(model);
      this.graph.update(this.item, model);
    },
    // 完成继承赋值
    handleInheritChange(formData) {
      const addAttributesToElement = (data, formData) => {
        function traverseAndUpdate(node) {
          if (node.varName === formData.variable) {
            node.inheritNodeId = Number(formData.inheritNodeId);
            if(formData.inheritVariable != null) {
              node.inheritVariable = formData.inheritVariable.split(".");
              // 为多点继承添加
              if(node.inheritNodeIds?.length) {
                const index = node.inheritNodeIds.findIndex(id => id == formData.inheritNodeId)
                if(index > -1 && node.inheritVariables && node.inheritVariables[index]) {
                  node.inheritVariables[index] = formData.inheritVariable.split(".")
                }
              }else {
                node.inheritNodeIds = [formData.inheritNodeId]
                node.inheritVariables = [formData.inheritVariable.split(".")]
              }
            }else{  //说明在做清楚继承的操作
              node.inheritVariable = [];
              node.inheritNodeId = null;
              // 为多点继承添加
              // 移除继承的当前id以及variable
              if(node.inheritNodeIds?.length) {
                const index = node.inheritNodeIds.findIndex(id => id == formData.inheritNodeId)
                node.inheritNodeIds.splice(index, 1)
                node.inheritVariables.splice(index, 1)
                if(!node.inheritVariables.length) { //如果被清空，默认填充[],保证信息被渲染出来
                  node.inheritVariables = [[]]
                }
              }
            }
            
          } else if (node.struct && Array.isArray(node.struct)) {
            node.struct.forEach(traverseAndUpdate);
          }
        }

        data.forEach(traverseAndUpdate);
      };
      let obj = this.node.items;
      const deepCopy = JSON.parse(JSON.stringify(obj));
      addAttributesToElement(deepCopy, formData);
      let obj2 = this.node.inits;
      const deepCopy2 = JSON.parse(JSON.stringify(obj2));
      addAttributesToElement(deepCopy2, formData);
      console.log(deepCopy);
      const model = {
        // stateImage: imageUrl,
        items: deepCopy,
        inits: deepCopy2,
      };
      this.graph.update(this.item, model);
    },
  },
};
</script>

<style lang="less" scoped>
.detailpannel {
  height: 60%;
  position: absolute;
  right: 0px;
  z-index: 2;
  width: 330px;
  bottom: 0px;
  border: 4px solid #f7f9fb;
  /* border-bottom: 10px solid #f7f9fb; */
}
.pannel {
  height: 100%;
}
.detailpannel .block-container {
  height: calc(100% - 32px);
  padding: 16px 8px;
  overflow: auto;
  /* 示例盒子的滚动条样式 */
  &::-webkit-scrollbar {
    width: 8px; /* 设置滚动条宽度 */
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 8px;
    background-color: #b2b2b2; /* 设置滚动条拖动部分的颜色 */
  }

  &::-webkit-scrollbar-track {
    border-radius: 8px;
    background: #ffffff; /* 设置滚动条轨道的颜色 */
  }
}

.pannel-title {
  height: 32px;
  border-top: 1px solid #dce3e8;
  border-bottom: 1px solid #dce3e8;
  background: #ebeef2;
  color: #000;
  line-height: 28px;
  padding-left: 12px;
}
</style>
