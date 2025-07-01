<template>
  <a-modal
    :visible="visible"
    :title="`${scheme.name} 方案配置`"
    @cancel="handleCancel"
    :maskClosable="false"
    width="50%"
  >
    <a-tabs type="card">
      <a-tab-pane key="resource" tab="资源配置" v-loading="!!loadingText" :element-loading-text="loadingText || ''">
        <a-form-model :model="resourceFormData" :label-col="{ span: 4 }" :wrapper-col="{ span: 17 }" layout="horizontal" class="dynamic-form scrollbar"  ref="refResourceForm">
          <a-form-model-item label="配置记录" v-if="isUpdate">
            <a-radio-group v-model="saveFlag" @change="toggleSaveFlag">
              <a-radio :value="1">更新配置</a-radio>
              <a-radio :value="0"> 新增配置</a-radio>
            </a-radio-group>
          </a-form-model-item>
          <a-form-model-item label="名称" prop="name">
            <a-input v-model="resourceFormData.name"/>
          </a-form-model-item>
          <a-form-model-item label="计算引擎" prop="computeEngineType">
            <a-radio-group  v-model="resourceFormData.computeEngineType">  
              <a-radio :value="1"> CPU</a-radio>
              <a-radio :value="2"> GPU</a-radio>
            </a-radio-group>
          </a-form-model-item>
          <a-form-model-item label="cpu数" prop="coreSize">
            <a-input-number class="input-numner" v-model="resourceFormData.coreSize" :min="1" :max="sysConfigs.coreSizeMax" :precision="0" placeholder="请输入cpu核心数"/>
          </a-form-model-item>
          <a-form-model-item label="内存" prop="memorySize">
            <a-input-number class="input-numner" v-model="resourceFormData.memorySize" :min="0" :max="sysConfigs.memorySizeMax" placeholder="请输入内存数"/>
          </a-form-model-item>
          <a-form-model-item label="gpu数" prop="gpuSize" v-if="resourceFormData.computeEngineType == 2">
            <a-input-number class="input-numner" v-model="resourceFormData.gpuSize" :min="1" :max="1" placeholder="请输入gpu数" disabled/>
          </a-form-model-item>
          <a-form-model-item label="显存" prop="videoMemorySize" v-if="resourceFormData.computeEngineType == 2">
            <a-input-number class="input-numner" v-model="resourceFormData.videoMemorySize" :min="1" :max="sysConfigs.gpuMaxSize || 23.39" :precision="2" :step="0.1" placeholder="请输入gpu显存数"/>
              <a-tooltip :style="{  position: 'absolute',  'margin-left': '10px',  color: '#ccc',  'line-height': '40px',  cursor: 'pointer'}" >
                <template slot="title"> {{ `当前GPU最大显存：${(sysConfigs.gpuMaxSize + 0.01).toFixed(2)}GB` }}</template>
                <a-icon type="question-circle" />
              </a-tooltip>
          </a-form-model-item>
          <a-form-model-item :label="item.displayName" :prop="item.varName" v-for="item in resourceConfigItems" :key="item.varName">
            <!-- computeEngineType、coreSize、memorySize、gpuSize、videoMemorySize是必有的 -->
            <!-- 文本 -->
            <template v-if="item.controlType === 'textInput'">
              <a-input v-model="resourceFormData[item.varName]"/>
            </template>
            <!-- 下拉选择 -->
            <a-select v-model="resourceFormData[item.varName]" v-else-if="item.controlType === 'dropdown'">
              <a-select-option :value="option.value" v-for="option in item.options" :key="option.value">{{ option.label }}</a-select-option>
            </a-select>
            <!-- upload -->
            <template v-else-if="item.controlType === 'fileUpload'">
              <a-input v-model="resourceFormData[item.varName]" disabled />
              <!-- 仅数据集上传的时候显示 -->
                <span v-if="item.varName==='dlPath'" @click="removeDlPath">
                  <a-tooltip title="移除当前上传数据" class="input-suffix">
                    <a-icon type="delete"/>
                  </a-tooltip>
                </span>
              <a-upload style="margin-right: 10px;"
                :multiple = "item.fileOption.isMultiselect"
                :action="(uploadConfig[item.varName] || uploadConfig['default']).url"
                :showUploadList="false"
                :data="(uploadConfig[item.varName] || uploadConfig['default']).data"
                :headers="{ Authorization: getToken() }"
                :before-upload="(file) => beforeUpload(file, item)"
                @change="info => handleUploadChange(info, item)"
              >
                <a-button type="primary"> <a-icon type="upload"/> 点击上传 </a-button>
              </a-upload>
              <!-- 为模型的时候还需要支持选择系统内的 -->
              <a-button v-if="['pth','onnx'].includes(item.fileOption.filterName)" @click="$event => callModelSelector(item)" type="primary"><a-icon type="block"/>选择模型</a-button>
            </template>
            <!-- slider(inpur-number) -->
            <a-input-number class="input-numner" v-model="resourceFormData[item.varName]" 
              :step="item.step || 1" 
              :min="item.minValue" 
              :max="item.maxValue"
              :precision="getPrecision(item.step || values[prefixName(item.varName)])"
              v-else-if="item.controlType === 'slider'"
            />
          </a-form-model-item>
          <a-form-model-item label="配置数据集">
            <a-radio-group v-model="dlFlag">
              <a-radio :value="1">选择数据集</a-radio>
              <a-radio :value="0"> 上传数据集</a-radio>
            </a-radio-group>
          </a-form-model-item>
          <a-form-model-item label="选择数据集" prop="dlId" v-show="dlFlag == 1">
            <dataset-select v-model="resourceFormData.dlId" width="100%" allowClear></dataset-select>
          </a-form-model-item>
          <a-form-model-item label="上传数据集" prop="dlPath" v-show="dlFlag == 0">
            <a-input v-model="resourceFormData.dlPath" disabled />
                <span @click="removeDlPath">
                  <a-tooltip title="移除当前上传数据" class="input-suffix">
                    <a-icon type="delete"/>
                  </a-tooltip>
                </span>
              <a-upload style="margin-right: 10px;"
                :multiple = "false"
                :action="uploadConfig.dlPath.url"
                :showUploadList="false"
                :data="uploadConfig.dlPath.data"
                :headers="{ Authorization: getToken() }"
                :before-upload="(file) => beforeUpload(file, dlPathItem)"
                @change="info => handleUploadChange(info, dlPathItem)"
              >
                <a-button type="primary"> <a-icon type="upload"/> 点击上传 </a-button>
                <span style="margin-left: 15px;" @click="$event => { $event.stopPropagation() }">
                  文件上传有严格规范，请查看
                  <a-popover title="数据集上传说明" destroyTooltipOnHide>
                    <template slot="content" >
                      <p class="example" style="width: 600px;">
                          文件仅支持（1）zip格式的压缩包，压缩包大小请控制在20GB以内；（2）指定网盘共享目录的文件夹路径；<br>Images、Anotations为固定文件夹名称，其下的文件夹名即是标签名，只能包含字母/数字/下划线。图片命名不能以.开头。其中，Images、Annotations下的标签名与文件名应同名对应。
                      </p>
                      <div class="div-img">
                        <img :src="require('@/assets/img/classTwo.jpg')" class="example-img"/>
                      </div>
                    </template>
                    <a href="#">上传说明</a>
                  </a-popover>
                </span>
              </a-upload>
          </a-form-model-item>
          <a-form-model-item label="存放目录" prop="storedDirIdFront">
            <dict-select-tree v-model="resourceFormData.storedDirIdFront"  @change="handleDictChange" width="100%" size="default"></dict-select-tree>
          </a-form-model-item>
        </a-form-model>
      </a-tab-pane>
      <a-tab-pane :tab="node.label || node.name" v-for="node in paramConfigNodes" :key="node.id">
        <a-form-model :model="paramFormData[node.name]" :label-col="{ span: 4 }" v-if="Object.keys(paramFormData).length"
          :wrapper-col="{ span: 17 }" layout="horizontal" class="dynamic-form scrollbar">
          <a-form-model-item :label="item.displayName" :prop="item.varName" v-for="item in node.items" :key="item.varName">
            <!-- 文本 -->
            <template v-if="item.controlType === 'textInput'">
              <a-input v-model="paramFormData[node.name][item.varName]"/>
            </template>
            <!-- 下拉选择 -->
            <a-select v-model="paramFormData[node.name][item.varName]" v-else-if="item.controlType === 'dropdown'">
              <a-select-option :value="option.value" v-for="option in item.options" :key="option.value">{{ option.label }}</a-select-option>
            </a-select>
            <!-- upload -->
            <template v-else-if="item.controlType === 'fileUpload'">
              <a-input v-model="paramFormData[node.name][item.varName]" disabled ></a-input>
              <a-upload style="margin-right: 10px;"
                :multiple = "item.fileOption.isMultiselect"
                :action="uploadUrl"
                :showUploadList="false"
                :data="{ id: uploadId }"
                :headers="{ Authorization: getToken() }"
                :before-upload="(file) => beforeUpload(file, item)"
                @change="info => handleUploadChange(info, item)"
              >
                <a-button type="primary">  <a-icon type="upload"/> 点击上传</a-button>
              </a-upload>
            </template>
            <!-- slider(inpur-number) -->
            <a-input-number class="input-numner" v-model="paramFormData[node.name][item.varName]" 
              :step="item.step || 1" 
              :min="item.minValue" 
              :max="item.maxValue"
              :precision="getPrecision(item.step || values[prefixName(item.varName)])"
              v-else-if="item.controlType === 'slider'"
            />
          </a-form-model-item>
        </a-form-model>
      </a-tab-pane>
    </a-tabs>
    <!-- 系统内模型选择组件 -->
    <onnx-model-selector ref="onnxModelSelector"></onnx-model-selector>
    <template slot="footer">
        <a-button @click="handleCancel"> 取消</a-button>
        <a-button type="primary"  @click="$event => handleOk($event)">保存</a-button>
        <a-button type="primary"  @click="runScheme">运行</a-button>
      </template>
  </a-modal>
</template>

<script>
import Operator from "@/api/operator";
import { getToken } from "@/utils/auth";
import datasetSelect from "@/components/business/datasetSelector/index.vue"
import OnnxModelSelector from "./OnnxModelSelector.vue";
import pipelineApi from "@/api/pipeline";
import dictSelectTree from "@/components/business/dictSelectTree/index.vue";
import { checkNotSpace } from "@/utils/formValidate.js";
import { getResourceConfig } from '@/utils/util'
// 算法方案的配置页面
export default {
  components: {
    datasetSelect,
    OnnxModelSelector,
    dictSelectTree,
  },
  data() {
    return {
      saveFlag: 1,    // 1: 更新  0  新建
      dlFlag: 1, // 1: 选择数据集  0   上传数据集
      uploadUrl: "/api/v1/pipelinecenter/pipelineTemplateInfo/uploadImage",
      loadingText: false, //modal loading文本， 设置文本后显示，可设置上传文件进度，为空或false时会关闭loading
      resourceConfigItems: [],  //pipeline nodes中的resource节点，内容可能不固定，所以也需要动态渲染
      paramConfigNodes: [], //参数配置节点
      resourceFormData: {
        // storedDirId: "8900;10;",    //后端要的格式： ${nodeCode}${id}; 两个id的拼接
        // storedDirName: ''， //目录名称
        // storedDirIdFront: '',  //前端反显之前保存的目录id,从保存的storedDirId解析出来
      },   //资源配置表单formData
      paramFormData: {},  //参数设置表单formData
      scheme: {},  // 记录当前方案 data，从方案table带过来
      uploadId: null,
      dlPathItem: { //数据集选择的固定item
        controlType: "fileUpload",
        displayName: "数据集路径",
        fileOption: {isMultiselect: false, filterName: "zip"},
        varName: "dlPath"
      },
      // 资源配置表单校验
      resourceFormRules: {
        name: [{ required: true, validator: checkNotSpace, trigger: "blur"}],
        coreSize: [{ required: true, message: "请输入cpu核心数", trigger: "blur"}],
        memorySize: [{ required: true, message: "请输入cpu内存数", trigger: "blur"}],
        gpuSize: [{ required: true, message: "请输入gpu数", trigger: "blur"}],
        videoMemorySize: [{ required: true, message: "请输入gpu显存数", trigger: "blur"}],
        dlId: [{ required: true, message: "请选择数据集", trigger: "change"}],
        dlPath: [{ required: true, message: "请上传数据集", trigger: "change"}],
      },
      sysConfigs: {
        gpuMaxSize: 23.69 -0.3,
        coreSizeMax: 8,
        memorySizeMax: 16,
      }, //记录系统配置
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
  },
  computed: {
    // 更新配置标识，false则表示create配置
    isUpdate() {
      return this.scheme.pipelineInferTaskConfigId != null && this.scheme.pipelineInferTaskConfigId != undefined
    },
    uploadConfig() {
      return  {
        "default": {  //默认上传的配置
          url: "/api/v1/pipelinecenter/pipelineTemplateInfo/uploadImage",
          data: { id: this.uploadId, returnAbsPath: new Blob([true], { type: "application/json"}) }
        },
        "dlPath": { //数据集上传的配置
          url: "/api/v1/pipelinecenter/pipelineTemplateInfo/uploadDataList",
          data: { id: this.uploadId, returnAbsPath: new Blob([true], { type: "application/json"}) }
        }
      }
    }
  },
  methods: {
    getToken,
    beforeUpload(file, item) {
      const allowedExtensions = item.fileOption?.filterName.split(",");
      const isAllowedExtension = allowedExtensions.some((ext) =>
        file.name.endsWith(`.${ext}`)
      );
      if (!isAllowedExtension) {
        this.$message.error(`文件类型不符合要求！仅支持${item.fileOption?.filterName}类型文件`);
        return false;
      }
      return true
    },
    /**
     * @description: 调用选择算子模型页面以及后续逻辑处理
     * @param {Object} item 
     */
     async callModelSelector(item) {
      const instance = this.$refs?.onnxModelSelector;
      try {
        const selectResult = await instance.invokeModel({
          modelId: item.modelId,
          tagType: item.fileOption.modelType,   //用该字段过滤分类 分割模型
        });
        this.loadingText = "模型绑定中..."
        const bindResult = await pipelineApi.bindOperatorModelPipeline(this.scheme.id,{
          modelId: selectResult.id,
          modelType: item.fileOption?.filterName,
          returnAbsPath: true
        })
        this.loadingText = false
        if(bindResult.code == 0) {
          this.$message.success('模型绑定成功')
          this.$set(this.resourceFormData, item.varName, bindResult.data)
        }
        
      }catch(e) {
        // this.$message.warning(e)
        console.log(e)
        this.loadingText = false
      }
    },
    // 处理上传文件的上传状态变化
    handleUploadChange(info, item) {
      // status : uploading done error removed
      if (info.file.status === 'uploading') {
        this.loadingText = `${Math.floor(info.file.percent)}%`;
        return;
      }
      if (info.file.status === 'done') {
        this.$message.success(`${info.file.name} 上传成功`);
        this.loadingText = false;
        this.$set(this.resourceFormData, item.varName, info.file?.response?.data)
        this.$refs.refResourceForm.clearValidate([item.varName])
      } else if (info.file.status === 'error') {
        this.loadingText = false;
        this.$message.error(`${info.file.name} 上传失败, ${info.file?.response?.msg}`);
      }else {
        this.loadingText = false;
      }
    },
    /**
     * @public
     * scheme: 方案record data
     */
    async init(scheme = {}) {
      // 上传模型所需要的id
      this.uploadId = new Blob([scheme.id], {
        type: "application/json",
      });
      try {
        this.scheme = scheme
        // 通过查详情，获取graph.json 配置信息,动态渲染表单
        this.loadingText = "配置加载中..."
        const configRes = await Operator.getPipelineTemplateInfoById(scheme.id)
        if(configRes.code != 0 || !Array.isArray(configRes.data.graph?.nodes)) {
          this.loadingText = false;
          return this.$message.warning("无法解析方案配置");
        }
        const nodes = configRes.data.graph?.nodes || []
        this.resourceConfigItems = nodes.filter(item => item.name === "resource")[0]?.items
        this.paramConfigNodes = nodes.filter(item => item.name !== "resource")
        // 初始化表单格式及初始值
        this.paramConfigNodes.forEach(node => {
          this.$set(this.paramFormData, node.name, {})
          node.items.forEach(item => {
            this.$set(this.paramFormData[node.name], item.varName, item.value)
          })
        })
        if(this.isUpdate) {  //pipelineInferTaskConfigId：当前推理任务配置id，该字段存在表示已存在配置，需要查询详情，将已保存的配置反显
          const detaiRes = await  Operator.schemeGetConfig(scheme.pipelineInferTaskConfigId)
          if(detaiRes.code == 0) {
            this.resourceFormData = detaiRes.data || {}
            // 解析已设置的参数
            if(!detaiRes.data?.algorithmParam) return
            try {
              this.paramFormData = JSON.parse(detaiRes.data?.algorithmParam)
              delete this.paramFormData.resource
              delete this.paramFormData.algorithmParam
            } catch (error) {
              console.error("解析algorithmParam异常， 配置id： ", scheme.pipelineInferTaskConfigId)
            }
            delete this.resourceFormData.algorithmParam
          }
        }else { //该pipeline的第一条配置时，将item中的value作为初始值
          (this.resourceConfigItems || []).forEach(item => {
            this.$set(this.resourceFormData, item.varName, item.value)
          })
        }
        // 根据dlPath 设置 dlFlag
        this.dlFlag = this.resourceFormData.dlPath ? 0 : 1
        // 根据storedDirId解析出storedDirIdFront, 反显已选择的目录
        if(this.resourceFormData.storedDirId) {
          const arr = this.resourceFormData.storedDirId.split(";")
          const val = arr[arr.length -2]
          this.$set(this.resourceFormData, 'storedDirIdFront', val)
        }
        // 移除resourceConfigItems中前端固定渲染的
        this.resourceConfigItems = this.resourceConfigItems.filter(item => !['computeEngineType','gpuSize','coreSize', 'memorySize','videoMemorySize', 'dlId','dlPath'].includes(item.varName))
        this.loadingText = false;
      }catch(e) {
        console.error(e)
        this.loadingText = false;
      }
    },
    handleCancel($event, refreshFlag) {
      this.$emit("update:visible", false)
      if(refreshFlag) {
        this.$emit('refreshList')
      }
    },
    /**
     * 执行配置，先创建/更新配置，再调用执行
     */
    async handleOk($event, callback) {
      const {dlPath, dlId, storedDirId } = this.resourceFormData
      if(!dlPath && !dlId) return this.$message.warning("请选择或上传数据集")
      if(!storedDirId) return this.$message.warning("请选择存放目录")
      // this.$refs.refResourceForm.validate((valid) => {
      //   debugger
      // })
      try {
        let saveResult
        this.loadingText = "数据保存中..."
        if(this.dlFlag == 1) {  //选择数据集，移除dlPath字段
          this.resourceFormData.dlPath = null
        }else { //移除dlId
          this.resourceFormData.dlId = null
        }
        let algorithmParam = JSON.stringify({
          resource: this.resourceFormData,
          ...this.paramFormData,
        })
        if(this.isUpdate && this.saveFlag === 1) {
          saveResult = await Operator.schemeUpdateConfig(this.scheme.pipelineInferTaskConfigId, {
            ...this.resourceFormData,
            algorithmParam
          })
        }else {
          saveResult = await Operator.schemeCreateConfig({
            pipelineId: this.scheme.id,
            ...this.resourceFormData,
            algorithmParam
          })
        }
        if(saveResult.code == 0) {
          if(callback) {
            callback()
            return 
          }
          this.$message.success("已保存")
          this.handleCancel({}, true)
        }
      }catch(e){
        this.loadingText = false
      }
    },
    // 运行方案
    runScheme() {
      this.handleOk({}, async () => {
        // // 保存好配置后，执行方案
        this.$message.success("配置已保存")
        this.loadingText = "正在启动执行方案..."
        const runRes = await Operator.schemeRunConfig(this.scheme.id)
        this.loadingText = false
        if(runRes.code == 0) {
          this.$message.success("方案已启动执行")
          this.handleCancel({}, true)
        }
      })
    },
    prefixName(name) {
      return Boolean(this.prefix) ? this.prefix + "." + name : name;
    },
    getPrecision(step) {
      // 根据 step 值决定小数位数
      const decimalPart = step.toString().split(".")[1];
      return decimalPart ? decimalPart.length : 0;
    },
    // 清除资源表单的某条数据
    removeDlPath(item = { }) {
      this.$set(this.resourceFormData, item.varName || 'dlPath', "")
    },
    // 切换选择： 新增配置 or 更新配置
    toggleSaveFlag() {
      if(this.saveFlag == 0) {  //新增记录时，
        if(this.resourceFormData.name) { //按领导要求，自动更新名称
          this.resourceFormData.name = this.resourceFormData.name + "-1"
        }
      }
    },
    // 选择存放目录
    handleDictChange(res = {}) {
      this.$set(this.resourceFormData, 'storedDirName', res.title)
      this.$set(this.resourceFormData, 'storedDirId', `${res.nodeCode}${res.id};`)
    },
    getSysConfigs() {
      getResourceConfig().then(res => {
        // this.formData.coreSize = res.cpu_core_default || 1
        // this.formData.memorySize = res.cpu_size_default || 2
        // this.formData.gpuSize = res.gpu_core_default || 1
        // this.formData.videoMemorySize = res.gpu_size_default || 2
        this.sysConfigs.gpuMaxSize = (res.gpu_size_max || 23.69) - 0.3
        this.sysConfigs.coreSizeMax = res.cpu_size_max || 8
        this.sysConfigs.memorySizeMax = res.mem_size_max || 16
      })
    },
  },
  created() {
    this.getSysConfigs()
  }
}
</script>

<style lang="less" scoped>
.dynamic-form {
  height: 550px;
  overflow: auto;
  /deep/ .ant-form-item {
    margin-bottom: 15px;
  }
  /deep/ .ant-btn {
    border-radius: 6px;
  }
  ::v-deep .ant-input-group-addon{
    border: none;
    background-color: transparent;
  }
}
.input-numner {
  width: 100%;
}
::v-deep .ant-input-group-addon{
  border: none;
}
// 修改a-tab默认样式 start
.ant-tabs {
  padding-top: 8px;
}
/deep/ .ant-modal-body {
  padding: 12px 24px;
}
/deep/ .ant-tabs-bar {
  display: flex;
  align-items: center;
  height: 100%;
}
/deep/ .ant-tabs.ant-tabs-card .ant-tabs-card-bar .ant-tabs-tab {
  /*主要内容标签样式*/
  // padding: 20px 0 4px 20px;
  margin-right: 0;
  font-size: 14px;
  line-height: 36px;
  font-weight: 500;
  font-family: "微软雅黑", sans-serif;
  padding: unset;
  background: #f2f2f2;
  padding: 0px 16px;
  height: 36px;
  margin-right: 16px;
  border-radius: 8px;
  // min-width: 116px;
  text-align: center;
  border: none;
  &.ant-tabs-tab-active {
    background: #1990ff;
    color: #fff;
  }
}
/deep/ .ant-tabs-bar {
  border-bottom: 0;
}
/deep/ .ant-tabs-ink-bar {
  display: none !important;
  width: 0 !important;
}
// end
.input-suffix {
  margin: 10px 0 0 10px;
  position: absolute;
  font-size: 18px;
  cursor: pointer;
  color: #a8a6a6;
}
</style>