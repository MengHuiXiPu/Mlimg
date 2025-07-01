<template>
  <a-modal
    :visible="visible"
    title="离线评估"
    @ok="handleOk"
    @cancel="handleCancel"
    :maskClosable="false"
    :confirm-loading="confirmLoading"
    width="60%"
  >
  <a-tabs type="card">
    <a-tab-pane key="2" tab="资源设置">
      <a-form-model
        ref="ruleForm" class="create-model-form"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        layout="horizontal"
        :model="formData"
        :rules="formRules">
          <a-form-model-item label="测试集" prop="dlId">
            <dataset-select v-model="formData.dlId" @getSelectObj="getDlAllData" width="90%" :dlTagType="model.algorithmTagType"></dataset-select>
          </a-form-model-item>
          <a-form-model-item label="计算引擎">
          <a-radio-group  v-model="formData.computEngineType">  
            <a-radio :value="1"> CPU</a-radio>
            <a-radio :value="2"> GPU</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item label="cpu" prop="coreSize">
          <a-input-number
              v-model="formData.coreSize"
              :min="1"
              :max="RESOURCE_MAX_CONFIG.coreSizeMax"
              :precision="0"
              placeholder="请输入cpu核心数"
              style="width: 90%;margin-right:5px"
          />
          <span>核</span>
        </a-form-model-item>
        <a-form-model-item label="内存" prop="memorySize">
          <a-input-number
              v-model="formData.memorySize"
              :min="0"
              :max="RESOURCE_MAX_CONFIG.memorySizeMax"
              placeholder="请输入cpu内存数"
              style="width: 90%;margin-right:5px"
          />
          <span>GB</span>
        </a-form-model-item>
        <a-form-model-item  label="gpu" prop="gpuSize" v-if="formData.computEngineType==2">
          <a-input-number
              type="number"
              v-model="formData.gpuSize"
              placeholder="请输入gpu数"
              style="width: 90%;margin-right:5px"
              disabled
          />
          <span>张</span>
          <!-- <a-tooltip class="gpuNumber" :style="{ position: 'absolute', 'margin-left': '10px', color: '#ccc', 'line-height': '40px', cursor: 'pointer' }">
            <a-icon type="question-circle" />
          </a-tooltip> -->
        </a-form-model-item>
        <a-form-model-item  label="显存" prop="videoMemorySize" v-if="formData.computEngineType==2">
          <a-input-number
              v-model="formData.videoMemorySize"
              placeholder="请输入gpu显存数"
              style="width: 90%;margin-right:5px"
              :min="0"
              :max="formData.gpuMaxSize"
              :step="0.1"
              :precision="2"
          />
          <span>GB</span>
          <a-tooltip class="gpuNumber" :style="{ position: 'absolute', 'margin-left': '10px', color: '#ccc', 'line-height': '40px', cursor: 'pointer'}">
            <template slot="title">
              {{ `当前GPU最大显存：${(formData.gpuMaxSize + 0.01).toFixed(2)}GB` }}
            </template>
            <a-icon type="question-circle" />
          </a-tooltip>
        </a-form-model-item>
      </a-form-model>
    </a-tab-pane>
    <a-tab-pane key="3" tab="超参设置">
      <param-set :algorithmParam="algorithmParam" ref="refParamSet"></param-set>
    </a-tab-pane>
  </a-tabs>
  
  </a-modal>
</template>

<script>
// 离线评估model，用于模型管理和方案管理的离线评估
import datasetSelect from "@/components/business/datasetSelector/index.vue";
import { createOffLineTask } from "@/api/offlineForecast"
import paramSet from "@/components/business/paramSet/index.vue"
import { createModel } from '@/api/modelManage';
import { getResourceConfig } from '@/utils/util'
export default {
  name: 'offlineAssessModal',
  components: {
    datasetSelect,
    paramSet,
  },
  data() {
    return {
      RESOURCE_MAX_CONFIG: {
        coreSizeMax: 8,
        memorySizeMax: 16
      },
      showDialog: false,
      confirmLoading: false,
      activeKey: ["1"],
      algorithmParam: "", //超参配置 JSON string 
      formData: {
        dlId: "",  //数据集id
        dlItem: {}, //数据集全量信息
        computEngineType: 2,
        coreSize: 1,
        memorySize: 8,
        gpuSize: 1,
        gpuMaxSize: 23.69 -0.3,
        videoMemorySize: 4,
      },
      formRules: {
        dlId: [{ required: true, message: "请选择数据集", trigger: "change"}],
        coreSize: [{ required: true, message: "请输入cpu核心数", trigger: "blur"}],
        memorySize: [{ required: true, message: "请输入cpu内存数", trigger: "blur"}],
        gpuSize: [{ required: true, message: "请输入gpu数", trigger: "blur"}],
        videoMemorySize: [{ required: true, message: "请输入gpu显存数", trigger: "blur"}],
      },
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    // 当前模型数据
    model: {
      type: Object,
      default: ()=>({})
    }
  },
  methods: {
    // 获取选中的数据集 data{}
    getDlAllData(data = {}) {
      this.formData.dlItem = data
    },
    handleOk() {
      this.$refs.ruleForm.validate(async (valid, obj) => {//验证表单数据
        if (!valid) return false
        // 创建离线评估任务
        this.confirmLoading = true
        try {
          const { id, modelName, modelType } = this.model
          // 获取超参(可能没有点击超参tab页，此时使用this.algorithmParam)
          const ins = this.$refs.refParamSet
          let algorithmParam
          if(ins) {
            algorithmParam = JSON.stringify(ins.getValue() || [])
          }else {
            algorithmParam = this.algorithmParam
          }
          // 先调用createModel接口，将配置信息更新，再开始离线评估（后端不做任何接口整合，都是用模型训练原有的接口前端自己硬组）
          const saveParams = {
            modelId: id,
            ...this.formData,
            algorithmParam
          }
          delete saveParams.dlItem
          const saveRes = await createModel(saveParams)
          if(saveRes.code != 0) {
            this.confirmLoading = false
            return this.$message.warning('数据保存异常')
          }
          const createRes = await createOffLineTask({
            // 配置信息
            ...this.formData,
            modelId: id,
            modelType,
            // taskName任务参考的是模型训练step5中逻辑，采用模型名称
            taskName: modelName,
            algorithmParam
          })
          if(createRes.code == 0) {
            this.$message.success('新建离线评估成功')
            this.handleCancel( {},true)
          }
          this.confirmLoading = false
        } catch (error) {
          console.error(error)
          this.confirmLoading = false
        }
      })
    },
    handleCancel($event, refreshFlag) {
      this.$emit("update:visible", false)
      if(refreshFlag) {
        this.$emit('refreshList')
      }
    },
    initState() {
      this.algorithmParam = this.model.algorithmParam || ""
      const { computEngineType,coreSize, memorySize, gpuSize, videoMemorySize, gpuMaxSize } = this.model
      // 为训练资源设置默认值，值来源参考的是 store -> model-> offline
      // 后面加了在getSysConfigs中获取系统默认值会覆盖掉这里的设置。是待明确的，如果是从训练管理那里保存的模型，是否从model(model_manage_info表)中来读取配置值
      this.formData = {
        dlId: "",  //数据集id
        dlItem: {}, //数据集全量信息
        computEngineType: computEngineType || 2,
        coreSize: coreSize,
        memorySize: memorySize,   //16->8
        gpuSize: gpuSize,
        gpuMaxSize: 23.69 -0.3,
        videoMemorySize: videoMemorySize || 4,    //12-> 4
      }
    },
    // 获取资源设置的默认值以及最大值
    async getSysConfigs() {
      getResourceConfig().then(res => {
        this.formData.coreSize = res.cpu_core_default || 1
        this.formData.memorySize = res.cpu_size_default || 2
        this.formData.gpuSize = res.gpu_core_default || 1
        this.formData.videoMemorySize = res.gpu_size_default || 2
        this.formData.gpuMaxSize = (res.gpu_size_max || 23.69) - 0.3
        this.RESOURCE_MAX_CONFIG.coreSizeMax = res.cpu_size_max || 8
        this.RESOURCE_MAX_CONFIG.memorySizeMax = res.mem_size_max || 16
      })
    },
  },
  created() {
    this.initState()
    this.getSysConfigs()
  }
}
</script>

<style lang="less" scoped>
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
</style>