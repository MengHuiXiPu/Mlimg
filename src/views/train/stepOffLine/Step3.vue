<template>
  <div class="stepOffline3">
    <step-layout>
      <template slot="right">
        <a-tabs type="card">
          <a-tab-pane key="2" tab="资源设置">
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
                <a-radio-group v-model="form.computEngineType"  @change="handleSelectChange">
                  <a-radio :value="1"> CPU</a-radio>
                  <a-radio :value="2"> GPU</a-radio>
                </a-radio-group>
              </a-form-model-item>

              <a-form-model-item label="cpu" prop="coreSize">
                <a-input-number
                  v-model="form.coreSize"
                  :min="1"
                  :max="sysConfig.coreSizeMax"
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
                  :max="sysConfig.memorySizeMax"
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
                  :max="sysConfig.gpuMaxSize"
                  :step="0.001"
                  :precision="2"
                  placeholder="请输入gpu显存数"
                  style="width: 95%;margin-right:5px"
                />
                <span>GB</span>
                <a-tooltip class="gpuNumber"
                  :style="{  position: 'absolute',  'margin-left': '10px',  color: '#ccc',  'line-height': '40px',  cursor: 'pointer'}" >
                <template slot="title">
                  {{ `当前GPU最大显存：${sysConfig.gpuMaxSize + 0.01}GB` }}
                </template>
                <a-icon type="question-circle" />
              </a-tooltip>
              </a-form-model-item>
            </a-form-model>
          </a-tab-pane>
          <a-tab-pane key="3" tab="超参设置" v-if="modelType =='1'">
            <param-set :algorithmParam="algorithmParam" ref="refParamSet" height="auto"></param-set>
          </a-tab-pane>
        </a-tabs>
      </template>
      <template slot="bottom">
        <a-button @click="prevStep">上一步</a-button>
        <a-button type="primary" style="margin-left: 15px" @click="startTask" :loading="saveLoading">开始任务</a-button>
        <a-button style="margin-left: 10px;" @click="cancel">取消</a-button>
      </template>
    </step-layout>
  </div>
</template>

<script>
import StepLayout from '@/components/StepLayout'
import { createOffLineTask } from "@/api/offlineForecast"
import { mapState } from 'vuex'
import bus from '@/utils/bus'
import paramSet from "@/components/business/paramSet/index.vue"
import { getImageManageById } from "@/api/imageManage";
export default {
  name: "Step3",
  components: {
    paramSet,
    StepLayout
  },
  data () {
    const { computEngineType, coreSize, memorySize, gpuSize, videoMemorySize, gpuMaxSize, memorySizeMax, coreSizeMax } = { ...this.$store.state.offline }
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
      sysConfig: {
        coreSizeMax,
        memorySizeMax,
        gpuMaxSize
      },
      loading: false,
      saveLoading: false,
      nodeId: null,
      form: {
        computEngineType, coreSize, memorySize, gpuSize, videoMemorySize,
      },
      rules: {
        coreSize: [{ required: true, message: '请输入cpu核心数!', trigger: 'blur' }],
        memorySize: [{ required: true, message: '请输入cpu内存数!', trigger: 'blur' }],
        // gpuSize: [{ required: true, message: '请输入gpu核心数!', trigger: 'blur' }],
        gpuSize: [{ required: true, validator: gpuValidator, trigger: 'blur' }],
        videoMemorySize: [{ required: true, validator: gpuMemory, trigger: 'blur' }]
      },
      algorithmParam: "", //算法超参默认设置 JSON字符串
    }
  },
  created () {
    // 根据模型里的算法id，查询算法对应的超参信息
    this.getAlgorithmParam()
  },
  computed: {
    // 模型类型 1：通用模型  2： 业务模型
    modelType() {
      return this.$route.query?.modelType
    },
    ...mapState({
      dlId: state => state.offline.dlId,
      dlItem: state => state.offline.dlItem,
      tagType: state => state.offline.tagType,
      offline: state => state.offline,
      algorithmId: state => state.offline.algorithmId
    })
  },
  methods: {
    async startTask () {
      const refParamSet =  this.$refs.refParamSet
      let algorithmParam
      if(refParamSet) {
        algorithmParam = JSON.stringify(refParamSet.getValue() || [])
      }else {
        algorithmParam = this.algorithmParam
      }
      if (this.dlId.length > 0) {
        this.saveLoading = true
        const params = {
          ...this.offline,
          ...this.form,
          dlId: this.offline.dlId.join(','),
          algorithmParam,
        }
        const res = await createOffLineTask(params)
        const { code, msg } = res
        this.saveLoading = false
        if (code === 0) {
          this.$message.success('新建离线评估成功')
          bus.$emit('reloadOffline')
          this.$store.commit('clearOfflineState')
          this.$router.push("/train/offline")
        }
      } else {
        this.$message.error('请选择数据集')
      }
    },
    // 根据模型下的算法id，查询算法详情，里面有算法对应的超参配置默认数据
    getAlgorithmParam() {
      if(!this.algorithmId) return
      getImageManageById(this.algorithmId).then(res => {
        if(res.code == 0) {
          this.algorithmParam = res.data?.algorithmParam || ""
        }
      })
    },
    prevStep () {
      this.$store.commit('setConfig', JSON.parse(JSON.stringify(this.form)))
      this.$emit("prevStep")
    },

    cancel () {
      this.$emit('cancel')
    },
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
// 修改tab样式
.ant-tabs {
  padding-top: 8px;
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
  background: #ffffff;
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
