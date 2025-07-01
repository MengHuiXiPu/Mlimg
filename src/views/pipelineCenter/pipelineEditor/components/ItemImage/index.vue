<template>
  <div id="navigator">
    <div class="pannel-title">算子输出</div>
    <div v-if="fileUpload && node && node.result" id="itemimage">
      <el-image :src="node.result"></el-image>
    </div>
    <item
      v-else-if="node != null && node.outputs != null"
      :items="node.outputs"
    ></item>
  </div>
</template>

<script>
import eventBus from "../../utils/eventBus";
import Operator from "@/api/operator";
import item from "./item.vue";
import ImageLoader from '@/utils/imageLoader'
export default {
  inject: ["G6Instance"],
  components: {
    item,
  },
  data() {
    return {
      node: null,
      graph: null,
      debugResult: null,
      fileUpload: false,
      imageLoader: null
    };
  },
  created() {
    this.bindEvent();
    this.imageLoader = new ImageLoader()
  },
  beforeDestroy() {
    // 务必移除事件监听
    eventBus.$off('nodeselectchange')
    eventBus.$off('afterAddPage')
    eventBus.$off('initDebugResult')
    eventBus.$off('deleteItem')
    eventBus.$off('on-uploadSuccess')
  },
  methods: {
    bindEvent() {
      let self = this;
      eventBus.$on("afterAddPage", (page) => {
        this.graph = page.graph;
      });
      eventBus.$on("initDebugResult", (debugResult) => {
        if (debugResult != null) {
          this.cache = [];
          this.debugResult = debugResult;
          // 更新当前node的输出信息
          this.getOutputs(self.node)
        }
      });
      eventBus.$on("nodeselectchange", (item) => {
        if (item.select === true && item.target.getType() === "node") {
          self.status = "node-selected";
          self.node = item.target.getModel();
          // this.$forceUpdate();
        }else {
          //没有选中节点，这里应该清空node
          this.node = null
        }
        if (!self.node) {
          return;
        }
        // 由self.node.outputs还原为之前代码的self.node.items，与罗哥确认，在算子出入中找fileupload来enable调试按钮
        const ele = self.node.items.find(
          (ele) => ele.controlType === "fileUpload"
        );
        // 在算子组输出中找fileUpload的算子，加载输出图片
        const outputEle = self.node.outputs.find(
          el => el.controlType === "fileUpload"
        );
        if (ele != null) {
          this.$emit("on-savePath", ele.value);
        }
        this.fileUpload = false;
        let value = null;
        // if (!self.node.result && ele != null && ele.value) {
        if (!self.node.result && outputEle != null && outputEle.value) {
          this.fileUpload = true;
          value = outputEle.value;
          if(typeof(value) ==='string' && value.endsWith('.npy') ) return
          this.imageLoader.loadImage(Operator.getImage, {
            id: this.G6Instance.pipelineId,
            imgPath: value,
          }).then(imgUrl =>{
            this.$emit("on-savePath", value);
            this.$set(self.node, "result", imgUrl);
            this.$forceUpdate();
          })
        } else {
          this.getOutputs(self.node);
        }
      });
      eventBus.$on("deleteItem", () => {
        try {
          this.handleDelete && this.handleDelete();
        } catch (e) {
          console.error(e);
        }
      });
      eventBus.$on("on-uploadSuccess", () => {
        self.node.result = null;
        self.debugResult = null;
        self.fileUpload = false;
        // self.$forceUpdate();
      });
    },
    getOutputs(node) {
      if(!node) return
      let modelName = node.id + "_" + node.name;
      if (this.debugResult?.tvm_modules?.[modelName] == null) {
        return false;
      }
      let result = this.debugResult?.tvm_modules?.[modelName]?.output;
      // console.log(result)
      for (const output of node.outputs) {
        // 获取对应的 result 属性值
        const resultValue = result[output.varName];
        // 如果 resultValue 存在
        if (resultValue !== undefined) {
          // 如果输出是一个结构体
          if (output.controlType === "struct") {
            for (const structField of output.struct) {
              // // 拼接结构体属性名，如 dst.data
              const structFieldName = `${output.varName}.${structField.varName}`;

              // 获取对应的 result 结构体属性值
              const structFieldValue = resultValue[structField.varName];

              // 如果结构体属性值存在，则赋值给 outputs 对应的 value
              if (structFieldValue !== undefined) {
                structField.value = structFieldValue;
                this.setFieldValue(
                  structField,
                  structFieldName,
                  structFieldValue,
                  modelName
                );
              }
            }
          } else {
            // 如果输出不是结构体，直接赋值给 outputs 对应的 value
            output.value = resultValue;
            this.setFieldValue(output, output.varName, resultValue);
          }
        } else {
          // runstaus不是0(之前的代码用resultValue是否有值判断的)  表示失败，此时应清空output
          // 如果输出是一个结构体
          if (output.controlType === "struct") {
            for (const structField of output.struct) {
              // // 拼接结构体属性名，如 dst.data
              const structFieldName = `${output.varName}.${structField.varName}`;
              this.setFieldValue(
                structField,
                structFieldName,
                null,
                modelName
              );
            }
          } else {
            // 如果输出不是结构体，直接赋值给 outputs 对应的 value
            output.value = resultValue;
            this.setFieldValue(output, output.varName, resultValue);
          }
        }
      }
      return true;
    },
    setFieldValue(output, structFieldName, structFieldValue, modelName) {
      if (output.varType !== "raw") {
        output.value = structFieldValue;
        return;
      }
      if(!structFieldValue || structFieldValue.endsWith('.npy') ) return 
      this.imageLoader.loadImage(Operator.getImage, {
        id: this.G6Instance.pipelineId,
        imgPath: structFieldValue,
      }).then(imgUrl =>{
        output.value = imgUrl;
      })
    },
  },
};
</script>

<style lang="less" scoped>
#navigator {
  width: 330px;
  height: 40%;
  position: absolute;
  z-index: 3;
  right: 0px;
  border: 4px solid #f7f9fb;
  overflow-y: auto;
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

#itemimage {
  display: flex;
  align-items: center; /* Vertical center alignment */
  justify-content: center; /* Horizontal center alignment */
  height: calc(100% - 32px); /* Subtract the height of the title */
}
</style>
