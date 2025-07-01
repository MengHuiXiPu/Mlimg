<template>
  <div>
    <el-row
      type="flex"
      align="middle"
      :gutter="10"
      v-for="(item, index) in items"
      :key="index"
      style="margin-bottom: 8px"
    >
      <!-- <el-col :span="6" class="single-line-ellipsis">{{ item.varName }}</el-col> -->
      <el-col :span="6" class="single-line-ellipsis"
        ><el-tooltip
          effect="dark"
          :content="item.description || item.varName"
          placement="top"
        >
          <span>{{ item.varName }}</span>

        </el-tooltip></el-col
      >
      <!-- 标注的checkbox -->
      <el-col :span="4">
        <el-checkbox v-if="needLabeling(item.varType, item)" v-model="item.needLabeling"></el-checkbox>
      </el-col>
      <el-col :span="18">
        <template v-if="item.controlType === 'textInput'">
          <div class="vertical-center" v-for="(inheritVariable, idx) in getInitInheritVariables(item.inheritVariables)" :key="idx">
            <el-input
              v-model="values[prefixName(item.varName)]"
              @change="handleSelectChange(prefixName(item.varName), hasInherit)"
              style="margin-right: 8px"
            />
            <span v-for="(variable, index) in inheritVariable || []" :key="index">
              {{(item.inheritNodeIds || []).length > 0 ? `${item.inheritNodeIds[idx]}-`: '' }}{{variable}}{{ index < inheritVariable.length - 1 ? '.' : '' }}
            </span>
            <el-button v-if="inheritVariable && inheritVariable.length > 0" @click="clearInherit(item, getInheritNodeIdFromTemp(item.inheritNodeIds , idx))" icon="el-icon-delete" type="text"></el-button>
            <el-button
              v-if="hasInherit"
              type="text"
              @click="openDialog(item.varName, getInheritNodeIdFromTemp(item.inheritNodeIds , idx), inheritVariable)"
              >继承</el-button
            >
          </div>
        </template>
        <template v-else-if="item.controlType === 'dropdown'">
          <div class="vertical-center" v-for="(inheritVariable, idx) in getInitInheritVariables(item.inheritVariables)" :key="idx">
            <el-select
              v-model="values[prefixName(item.varName)]"
              @change="handleSelectChange(prefixName(item.varName), hasInherit)"
              style="margin-right: 8px"
            >
              <el-option
                v-for="option in item.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <span v-for="(variable, index) in inheritVariable || []" :key="index">
                {{(item.inheritNodeIds || []).length > 0 ? `${item.inheritNodeIds[idx]}-`: '' }}{{variable}}{{ index < inheritVariable.length - 1 ? '.' : '' }}
            </span>
            <el-button v-if="inheritVariable && inheritVariable.length > 0" @click="clearInherit(item, getInheritNodeIdFromTemp(item.inheritNodeIds , idx))" icon="el-icon-delete" type="text"></el-button>
            <el-button
              v-if="hasInherit"
              type="text"
              @click="openDialog(item.varName, getInheritNodeIdFromTemp(item.inheritNodeIds , idx), inheritVariable)"
              >继承</el-button
            >
          </div>
        </template>
        <template v-else-if="item.controlType === 'slider'">
          <div class="vertical-center" v-for="(inheritVariable, idx) in getInitInheritVariables(item.inheritVariables)" :key="idx">
            <el-input-number
              v-model="values[prefixName(item.varName)]"
              :step="item.step || 1"
              :min="item.minValue"
              :max="item.maxValue"
              :precision="getPrecision(item.step || values[prefixName(item.varName)])"
              @change="handleSelectChange(prefixName(item.varName), hasInherit)"
              style="margin-right: 8px; min-width: 100px"
            ></el-input-number>
            <span v-for="(variable, index) in inheritVariable || []" :key="index">
                {{(item.inheritNodeIds || []).length > 0 ? `${item.inheritNodeIds[idx]}-`: '' }}
                {{variable}}
                {{ index < inheritVariable.length - 1 ? '.' : '' }}
            </span>
            <el-button v-if="inheritVariable && inheritVariable.length > 0" @click="clearInherit(item, getInheritNodeIdFromTemp(item.inheritNodeIds , idx))" icon="el-icon-delete" type="text"></el-button>
            <el-button
              v-if="hasInherit"
              type="text"
              @click="openDialog(item.varName, getInheritNodeIdFromTemp(item.inheritNodeIds , idx), inheritVariable)"
              >继承</el-button
            >
          </div>
        </template>
        <template v-else-if="item.controlType === 'fileUpload'">
          <!-- onnx的可以选择系统内模型方式 -->
          <div v-if="item.fileOption.filterName ==='onnx'" class="select-model-wrap">
            <el-button  size="small" type="primary" @click="$event => callOnnxModelSelector(item)">选择模型</el-button>
            <el-popover placement="top-start" width="200" trigger="hover" :content="item.value&&item.value.endsWith('.onnx') ? item.value: ''">
              <el-button type="text" slot="reference" class="onnx-status">
                {{ item.value&&item.value.endsWith('.onnx') ? '已关联': '未关联' }}
              </el-button>
            </el-popover>
            <onnx-model-selector ref="onnxModelSelector"></onnx-model-selector>
          </div>
          <!-- onnx上传方式或者非onnx的controltype为fileUpload的参数(item) -->
          <div>
            <div v-if="isUploading" class="full-screen-overlay">
              <div class="uploading-text">文件正在上传...</div>
              <a-spin class="loading-spinner"></a-spin>
            </div>
            <div class="vertical-center">
            <el-upload
              :action="uploadUrl"
              :data="{ id: uploadId }"
              :headers="{ Authorization: getToken() }"
              :show-file-list="false"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :before-upload="file => beforeUpload(file, item)"
              style="margin-right: 8px"
            >
              <el-button size="small" type="primary">点击上传</el-button>
            </el-upload>
            <div style="flex: 1">
              <!-- onnx不需要也无法反显image -->
              <el-image
                  style="width: 100%"
                  v-if=" item.fileOption.filterName !=='onnx' && valToUrl"
                  :src="valToUrl"
                  :preview-src-list="[valToUrl]"
                  @click="openImageViewer"
                  ref="imageRef"
              />
            </div>
            <el-button
              v-if="hasInherit"
              type="text"
              @click="openDialog(item.varName, getInheritNodeIdFromTemp(item.inheritNodeIds , idx), inheritVariable)"
              >继承</el-button>
            </div>
          </div>
        </template>
        <template v-else-if="item.controlType === 'struct'">
          <div class="struct-border" v-for="(inheritVariable, idx) in getInitInheritVariables(item.inheritVariables)" :key="idx">
            <operatorGroupDynamicFormRow
              v-show="Boolean(item.split)"
              :prefix="prefixName(item.varName)"
              :items="item.struct"
              :values="values"
              :hasInherit="hasInherit"
              :inheritNode="inheritNode"
              :inheritEdge="inheritEdge"
              :realNode="realNode"
              :graph="graph"
              @custom-change="handleSelectChange"
              @inherit-change="handleInheritChange"
              @on-fileChange="beforeUpload"
              @on-uploadSuccess="handleUploadSuccess"
            />
            <span v-for="(variable, index) in inheritVariable || []" :key="index">
                {{(item.inheritNodeIds || []).length > 0 ? `${item.inheritNodeIds[idx]}-`: '' }}
                {{variable}}{{ index < inheritVariable.length - 1 ? '.' : '' }}
            </span>
            <el-button v-if="inheritVariable && inheritVariable.length > 0" @click="clearInherit(item, getInheritNodeIdFromTemp(item.inheritNodeIds , idx))" icon="el-icon-delete" type="text"></el-button>
            <el-button
              v-if="hasInherit"
              type="text"
              @click="openDialog(item.varName, getInheritNodeIdFromTemp(item.inheritNodeIds , idx), inheritVariable)"
              >继承</el-button
            >
          </div>
        </template>
      </el-col>
    </el-row>
    <el-dialog
      title="继承"
      :modal="false"
      :visible.sync="dialogInheritanceVisible"
      @close="cancelDialog"
    >
      <el-form
        ref="InheritanceForm"
        :model="inheritanceForm"
        :rules="rules"
        label-width="120px"
        @submit.native.prevent="confirmInherit"
      >
        <el-form-item label="继承节点" prop="inheritNodeId">
          <el-select
            v-model="inheritanceForm.inheritNodeId"
            @change="getInheritNode"
          >
            <el-option
              v-for="option in inheritNode"
              :key="option.id"
              :label="option.label"
              :value="option.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="继承变量" prop="inheritVariable">
          <el-select v-model="inheritanceForm.inheritVariable">
            <el-option
              v-for="option in inheritVariableOption"
              :key="option"
              :label="option"
              :value="option"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <a-button type="primary" class="mr-8" @click="confirmInherit">
          确 认
        </a-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Operator from "@/api/operator";
import { getToken } from "@/utils/auth";
import eventBus from "@/views/pipelineCenter/pipelineEditor/utils/eventBus";
import {arraysEqual, toLabelType} from "@/views/pipelineCenter/pipelineEditor/utils";
import RPA from "@/api/rpa";
import pipelineApi from "@/api/pipeline";
import OnnxModelSelector from "../../../components/OnnxModelSelector.vue";
export default {
  name: "OperatorGroupDynamicFormRow",
  props: {
    // props里node的items信息，咱也不知道为什么要单独传进来
    items: Object,
    values: Object,
    hasInherit: {
      type: Boolean,
      default: true,
    },
    // 可被继承的节点列表
    inheritNode: Array,
    inheritEdge: Array,
    realNode: Array,
    // 选中节点
    node: Object,
    graph: Object,
    prefix: {
      type: String,
      default: "",
    },
  },
  inject: ["G6Instance", "operatorGroupId"],
  data() {
    return {
      // uploadUrl: "/api/v1/pipelinecenter/pipelineTemplateInfo/uploadImage",
      // 算子组上传图片
      uploadUrl:  '/api/v1/pipelinecenter/operatorGroupTemplate/uploadImage',
      dialogInheritanceVisible: false,
      inheritanceForm: {
        variable: "",
        variableType: "",
        inheritNodeId: null,
        inheritVariable: "",
        struct: null,
      },
      rules: {
        inheritNodeId: [
          {
            required: true,
            message: "请选择要继承的节点",
            trigger: "change",
          },
        ],
        inheritVariable: [
          {
            required: true,
            message: "请选择要继承的变量",
            trigger: "change",
          },
        ],
      },
      inheritVariableOption: [],
      uploadId: "",
      page: {},
      currentEdge: null,
      popoverVisible: true,
      isUploading: false,
      valToUrl: "",
    };
  },
  mounted() {
    this.uploadId = new Blob([this.G6Instance.operatorGroupId], {
      type: "application/json",
    });
    // 找到template的记录，并获取对应的截图。
    const ele =
      this.items.find((item) => item.controlType === "fileUpload") || {};
      console.log(ele)
    if (ele.value) {
      this.getImage(ele.value);
    } else {
      this.valToUrl = "";
    }
  },
  methods: {
    getToken,
    // 模版中使用，获取继承的节点id
    getInheritNodeIdFromTemp(inheritNodeIds, idx) {
      return inheritNodeIds ? inheritNodeIds[idx] : null
    },
    getInitInheritVariables (inheritVariables) {
      if(!inheritVariables) return [[]]
      if(Array.isArray(inheritVariables) && inheritVariables.length <1) return [[]]
      return inheritVariables
    },
    openImageViewer() {
      this.$refs.imageRef.showViewer = true
    },
    needLabeling(varType, item){
      item.labelingType = toLabelType[varType];
      return item.labelingType != null;
    },
    prefixName(name) {
      return Boolean(this.prefix) ? this.prefix + "." + name : name;
    },
    getPrecision(step) {
      // 根据 step 值决定小数位数
      const decimalPart = step.toString().split('.')[1];
      return decimalPart ? decimalPart.length : 0;
    },
    handleSelectChange(name, hasInherit) {
      // 触发自定义事件
      this.$emit("custom-change", name, hasInherit);
    },
    beforeUpload(file, item) {
      const allowedExtensions = item.fileOption?.filterName.split(',');
      const isAllowedExtension = allowedExtensions.some(ext => file.name.endsWith(`.${ext}`));
      if (!isAllowedExtension) {
        this.$message.error('文件类型不符合要求！');
        return false;
      }
      this.isUploading = true;
      this.$emit("on-fileChange", file);
    },
    handleUploadError(err, file, fileList) {
      this.isUploading = false;
      // handle upload error
    },
    handleUploadSuccess(res) {
      this.isUploading = false;
      if (res.data) {
        this.getImage(res.data);
      } else {
        this.valToUrl = "";
      }
      eventBus.$emit("on-uploadSuccess", res);
      this.$emit("on-uploadSuccess", res, this.hasInherit);
    },
    /**
     * @param varName: 参数名
     * @param nodeId: 当前参数继承的节点id
     * @param variable: 继承的节点的变量名称
     */
    openDialog(varName, nodeId, variable) {
      this.dialogInheritanceVisible = true;
      this.inheritanceForm.variable = varName;
      

      // 继承回显：赋值this.inheritanceForm
      const ele = this.items.find((ele) => ele.varName === varName);
      this.inheritanceForm.variableType = ele.varType;
      this.inheritanceForm.struct = ele.struct;
      if (nodeId) {
        // 
        this.inheritanceForm.inheritNodeId = nodeId;
        this.inheritanceForm.inheritVariable = (variable || []).join('.')
        // 继承回显：变量options
        this.getInheritNode(nodeId);
      }
      this.currentEdge = null;
      this.inheritEdge.forEach((edge)=>{
        let obj = edge.getModel();
        if(obj.sourceId == ele.inheritNodeId && obj.targetId == this.node.id &&
            this.inheritanceForm.inheritVariable.includes(obj.startVar) && obj.endVar == varName){
          this.currentEdge = edge;
        }
      })
    },
    cancelDialog() {
      this.inheritanceForm = {
        variable: "",
        inheritNodeId: null,
        inheritVariable: "",
      };
      this.$refs["InheritanceForm"].resetFields();
      this.dialogInheritanceVisible = false;
    },
    getInheritNode(id) {
      const node = this.inheritNode.find((item) => item.id == id);
      if(node == null){
        this.inheritanceForm.inheritNodeId = null;
        this.inheritanceForm.inheritVariable = null;
        return;
      }
      this.inheritVariableOption = this.extractVarNames(node.outputs);
    },
    extractVarNames(data) {
      const result = [];
      const traverse = (node, parentPath = "") => {
        if (node.varName) {
          const fullPath = parentPath
            ? `${parentPath}.${node.varName}`
            : node.varName;
          if ((arraysEqual(node.struct, this.inheritanceForm.struct) && this.inheritanceForm.variableType == node.varType)
              || this.inheritanceForm.variableType==='any') {
            result.push(fullPath);
          }
        }

        if (node.struct) {
          node.struct.forEach((childNode) => {
            traverse(
              childNode,
              parentPath ? `${parentPath}.${node.varName}` : node.varName
            );
          });
        }
      };
      data.forEach((node) => {
        traverse(node);
      });

      return result;
    },
    confirmInherit() {
      this.$refs["InheritanceForm"].validate((valid) => {
        if (valid) {
          // console.log(this.inheritanceForm);
          this.$emit("inherit-change", this.inheritanceForm);
          this.updateEdge();
          this.cancelDialog();
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
    handleInheritChange(formData) {
      this.$emit("inherit-change", formData);
    },
    updateEdge(){
      // console.error(this.realNode)
      this.realNode.forEach((node)=> {
        const group = node.get('group')
        const children = group._cfg.children
        children.map(child => {
          if (child._attrs.isOutPoint) {
            let item = child._attrs.item;
            if(this.inheritanceForm.inheritVariable.includes(item.varName) ) {
              const startX = parseInt(child._attrs.x)
              const startY = parseInt(child._attrs.y)
              let startPoint = {x: startX, y: startY};
              const model = {
                start: startPoint,
              };
              if(this.currentEdge != null) {
                this.graph.update(this.currentEdge, model);
              }
            }
          }
        })
      });
    },
    clearInherit(item, inheritNodeId){
      let inheritanceForm = {};
      inheritanceForm.variable = item.varName;
      inheritanceForm.variableType = item.varType;
      inheritanceForm.struct = item.struct;
      inheritanceForm.inheritNodeId = inheritNodeId;
      inheritanceForm.inheritVariable = null;
      this.$emit("inherit-change", inheritanceForm);
    },
    base64ToImageUrl(base64String) {
      // 构建data URL
      const imageUrl = `data:image/jpeg;base64,${base64String}`;
      return imageUrl;
    },
    getImage(path) {
      if(this.G6Instance.operatorType == 2) {
        RPA.downloadScreenshot(this.G6Instance.rpaLabelingId, {
          operatorId: this.G6Instance.operatorGroupId,
          imgPath: path,
        }).then((res) => {
          this.valToUrl = this.base64ToImageUrl(res.data);
        });
      }else {
        Operator.getGroupImage({
          id: this.G6Instance.operatorGroupId,
          imgPath: path,
        }).then((res) => {
          this.valToUrl = this.base64ToImageUrl(res.data);
        });
      }
    },
    /**
     * @description: 调用选择算子模型页面以及后续逻辑处理
     * @param {Object} item 当前算子的item对象
     */
     async callOnnxModelSelector(item) {
      const instance = this.$refs?.onnxModelSelector[0];
      try {
        const selectResult = await instance.invokeModel({
          modelId: item.modelId
        });
        const bindResult = await pipelineApi.bindOperatorModelOG(this.operatorGroupId,{
          modelId: selectResult.id
        })
        if(bindResult.code == 0) {
          this.$message.success('模型绑定成功')
          eventBus.$emit("on-uploadSuccess", bindResult );
          this.$emit("on-uploadSuccess", {...bindResult, modelId: selectResult.id}, this.hasInherit);
        }
      }catch(e) {
        // this.$message.warning(e)
        console.log(e)
      }
     }
  },
  components: {
    OnnxModelSelector,
  },
};
</script>

<style scoped>
.single-line-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vertical-center {
  display: flex;
  align-items: center;
}
.struct-border {
  padding: 4px;
  border: 1px solid #e9e9e9;
}

/* 全屏加载指示器样式 */
.full-screen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000; /* 设置一个足够高的 z-index，确保在其他元素上面显示 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* 上传中文字样式 */
.uploading-text {
  font-size: 30px;
  margin-bottom: 10px; /* 文字和旋转动画之间的间距 */
}

/* 旋转动画样式 */
.loading-spinner {
  animation: spin 5s linear infinite;
  font-size: 30px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.select-model-wrap{
  margin-bottom: 5px;
}
.onnx-status {
  margin-left: 10px;
  position: absolute;
  top: 15px;
}
</style>
