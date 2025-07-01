<template>
  <a-modal v-model="showModal" title="资源配置" @ok="handleOk" @cancel="handleCancel" width="35%" okText="保存"
    :keyboard="false" :confirm-loading="confirmLoading">
    <a-form-model ref="refConfigForm" class="create-model-form" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }"
      layout="horizontal" :model="configData" :rules="resourceFormRules">
      <a-form-model-item label="引擎">
        <a-radio-group v-model="configData.computeEngineType">
          <a-radio :value="1"> CPU</a-radio>
          <a-radio :value="2"> GPU</a-radio>
        </a-radio-group>
      </a-form-model-item>
      <a-form-model-item label="cpu" prop="coreSize">
        <a-input-number v-model="configData.coreSize" :min="1" :max="RESOURCE_MAX_CONFIG.coreSizeMax" :precision="0"
          placeholder="请输入cpu核心数" style="width: 80%;margin-right:5px" />
        <span>核</span>
      </a-form-model-item>
      <a-form-model-item label="内存" prop="memorySize">
        <a-input-number v-model="configData.memorySize" :min="0" :max="RESOURCE_MAX_CONFIG.memorySizeMax"
          placeholder="请输入cpu内存数" style="width: 80%;margin-right:5px" />
        <span>GB</span>
      </a-form-model-item>
      <a-form-model-item label="gpu" prop="gpuSize" v-if="configData.computeEngineType == 2">
        <a-input-number type="number" v-model="configData.gpuSize" placeholder="请输入gpu数"
          style="width: 80%;margin-right:5px" disabled />
        <span>张</span>
      </a-form-model-item>
      <a-form-model-item label="显存" prop="videoMemorySize" v-if="configData.computeEngineType == 2">
        <a-input-number v-model="configData.videoMemorySize" placeholder="请输入gpu显存数" style="width: 80%;margin-right:5px"
          :min="0" :max="RESOURCE_MAX_CONFIG.gpuMaxSize" :step="0.1" :precision="2" />
        <span>GB</span>
        <a-tooltip class="gpuNumber"
          :style="{ position: 'absolute', 'margin-left': '10px', color: '#ccc', 'line-height': '40px', cursor: 'pointer' }">
          <template slot="title">
            {{ `当前GPU最大显存：${(RESOURCE_MAX_CONFIG.gpuMaxSize + 0.01).toFixed(2)}GB` }}
          </template>
          <a-icon type="question-circle" />
        </a-tooltip>
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
import { getResourceConfig } from '@/utils/util';
export default {
  data() {
    return {
      showModal: false,
      state: {}, // 状态对象
      configData: {
        coreSize: '',
        memorySize: '',
        gpuSize: '',
        videoMemorySize: '',
        computeEngineType: 1,
      },
      RESOURCE_MAX_CONFIG: {
        coreSizeMax: 8,
        memorySizeMax: 16,
        gpuMaxSize: 23.69 - 0.3,
      },
      resourceFormRules: {
        dlId: [{ required: true, message: "请选择数据集", trigger: "change" }],
        coreSize: [{ required: true, message: "请输入cpu核心数", trigger: "blur" }],
        memorySize: [{ required: true, message: "请输入cpu内存数", trigger: "blur" }],
        gpuSize: [{ required: true, message: "请输入gpu数", trigger: "blur" }],
        videoMemorySize: [{ required: true, message: "请输入gpu显存数", trigger: "blur" }],
      },
    }
  },
  methods: {
    // 获取资源设置的默认值以及最大值
    async getSysConfigs() {
      getResourceConfig().then(res => {
        // this.resourceFormData.coreSize = res.cpu_core_default || 1
        // this.resourceFormData.memorySize = res.cpu_size_default || 2
        // this.resourceFormData.gpuSize = res.gpu_core_default || 1
        // this.resourceFormData.videoMemorySize = res.gpu_size_default || 2
        // this.resourceFormData.gpuMaxSize = (res.gpu_size_max || 23.69) - 0.3
        this.RESOURCE_MAX_CONFIG.coreSizeMax = res.cpu_size_max || 8
        this.RESOURCE_MAX_CONFIG.memorySizeMax = res.mem_size_max || 16
        this.RESOURCE_MAX_CONFIG.gpuMaxSize = (res.gpu_size_max || 23.69) - 0.3
      })
    },
    /**
     * @public
     */
    invoke(configData) {
      this.getSysConfigs()
      const { computeEngineType, coreSize, memorySize, gpuSize, videoMemorySize } = configData || {}
      this.configData.computeEngineType = computeEngineType
      this.configData.coreSize = coreSize
      this.configData.memorySize = memorySize
      this.configData.gpuSize = gpuSize
      this.configData.videoMemorySize = videoMemorySize
      this.showModal = true
      this.$nextTick(() => {
        this.$refs.refConfigForm.clearValidate()
      })
      return new Promise((resolve, reject) => {
        this.state = {
          resolve,
          reject
        }
      })
    },
    handleOk() {
      this.$refs.refConfigForm.validate(valid => {
        if (valid) {
          this.showModal = false
          this.state.resolve(this.configData)
        }
      })
    },
    handleCancel() {
      this.showModal = false
      this.state.reject("cancel save resource config")
    },
  },
}
</script>

<style lang="less" scoped></style>