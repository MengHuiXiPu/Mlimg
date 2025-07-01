<template>
  <div class="stepModelOffline3">
    <step-layout>
      <template slot="right">
        <a-form-model
          :model="form"
          ref="ruleForm"
          :label-col="{ span: 6 }"
          :wrapper-col="{ span: 18 }"
          :rules="rules"
          layout="horizontal"
          style="max-width: 700px; margin: 20px auto 0;"
        >
          <a-form-model-item label="计算引擎">
            <a-radio-group
              v-model="form.computEngineType"
              @change="handleSelectChange"
            >
              <a-radio :value="1">
                CPU
              </a-radio>
              <a-radio :value="2">
                GPU
              </a-radio>
            </a-radio-group>
          </a-form-model-item>

          <a-form-model-item label="cpu" prop="coreSize">
            <a-input-number
              v-model="form.coreSize"
              :min="1"
              :precision="0"
              placeholder="请输入cpu核心数"
              style="width: 95%;margin-right:5px"
            />
            <span>核</span>
          </a-form-model-item>

          <a-form-model-item label="内存" prop="memorySize">
            <a-input-number
              v-model="form.memorySize"
              :min="0"
              placeholder="请输入cpu内存数"
              style="width: 95%;margin-right:5px"
            />
            <span>GB</span>
          </a-form-model-item>

          <a-form-model-item v-if="form.computEngineType === 2" label="gpu" prop="gpuSize">
            <a-input-number
              v-model="form.gpuSize"
              placeholder="请输入gpu数"
              style="width: 95%;margin-right:5px"
              disabled
            />
            <span>张</span>
          </a-form-model-item>

          <a-form-model-item v-if="form.computEngineType === 2" label="显存" prop="videoMemorySize">
            <a-input-number
              v-model="form.videoMemorySize"
              :min="0"
              :max="form.gpuMaxSize"
              :step="0.001"
              :precision="3"
              placeholder="请输入gpu显存数"
              style="width: 95%;margin-right:5px"
            />
            <span>GB</span>
          </a-form-model-item>
        </a-form-model>
      </template>
      <template slot="bottom">
        <a-button type="primary" style="margin-right: 10px" @click="startTask" :loading="saveLoading">开始任务</a-button>
        <a-button @click="prevStep">上一步</a-button>
        <a-button style="margin-left: 10px;" @click="cancel">取消</a-button>
      </template>
    </step-layout>
  </div>
</template>

<script>
import StepLayout from '@/components/StepLayout'
import { createOffLineTask } from "@/api/offlineForecast"
import { mapState } from 'vuex'
import debounce from 'lodash.debounce'
export default {
  name: "Step3",
  components: {
    StepLayout
  },
  data () {
    const { computEngineType, coreSize, memorySize, gpuSize, videoMemorySize } = { ...this.$store.state.offline }
    const gpuValidator = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('请输入gpu核心数!'))
      } else {
        callback()
      }
    }
    const gpuMemory = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('请输入gpu显存数!'))
      } else {
        return callback()
      }
    }
    return {
      loading: false,
      saveLoading: false,
      nodeId: null,
      form: {
        computEngineType, coreSize, memorySize, gpuSize, videoMemorySize
      },
      rules: {
        coreSize: [{ required: true, message: '请输入cpu核心数!', trigger: 'blur' }],
        memorySize: [{ required: true, message: '请输入cpu内存数!', trigger: 'blur' }],
        // gpuSize: [{ required: true, message: '请输入gpu核心数!', trigger: 'blur' }],
        gpuSize: [{ required: true, validator: gpuValidator, trigger: 'blur' }],
        videoMemorySize: [{ required: true, validator: gpuMemory, trigger: 'blur' }]
      },
    }
  },
  mounted () {
    const { computEngineType, coreSize, memorySize, gpuSize, videoMemorySize, gpuMaxSize } = this.offline
    this.form = {
      computEngineType, coreSize, memorySize, gpuSize, videoMemorySize, gpuMaxSize
    }
  },
  computed: {
    ...mapState({
      modelInfo: state => state.model.modelInfo,
      tagType: state => state.model.modelInfo.tagType,
      dlId: state => state.model.offline.dlId,
      taskName: state => state.model.taskName,
      detailmodelType: state => state.model.detailmodelType,
      offline: state => state.model.offline
    })
  },
  methods: {
    async startTask () {
      if (this.dlId.length > 0) {
        this.saveLoading = true
        const { id, tagType, modelType } = this.modelInfo
        const params = {
          modelId: id,
          taskName: this.taskName,
          modelType: modelType || this.detailmodelType,
          tagType,
          ...this.offline,
          ...this.form,
          dlId: this.offline.dlId.join(',')
        }
        const res = await createOffLineTask(params)
        const { code, msg } = res
        this.saveLoading = false
        if (code === 0) {
            this.$message.success('新建离线评估成功')
            this.$store.commit('setisShowDetail', true)
        }
      } else {
        this.$message.error('请选择数据集')
      }
    },

    prevStep () {
      this.$store.commit('setModelOffline', {
        ...this.offline,
        ...this.form
      })
      this.$emit("prevStep")
    },

    cancel () {
      this.$store.commit('setisShowDetail', true)
    }
  },
}
</script>

<style lang="less" scoped>
.right-content {
  height: 100%;
  padding: 20px 20px 0;
  .table-content {
    margin-left: 0;
    margin-right: 0;
  }
}
.stepOffline2{
  /deep/ .ant-tabs-nav .ant-tabs-tab {
    padding-left: 20px;
    padding-right: 0;
    padding-top: 16px;
    padding-bottom: 4px;
    margin-right: 0;
    font-size: 16px;
    line-height: 22px;
    font-weight: 600;
  }
  /deep/ .ant-tabs-bar {
    border-bottom: 0;
  }
  /deep/ .ant-tabs-ink-bar {
    display: none !important;
    width: 0 !important;
  }
  .step-content{
    height: calc(100vh - 230px);
  }
  /deep/ .bottom{
    padding-top: 10px;
  }
}
</style>
