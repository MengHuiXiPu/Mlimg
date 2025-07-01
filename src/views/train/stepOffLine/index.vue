<template>
  <div class="page-content">
    <a-card :bordered="false" class="step-content">
      <!-- <back-title :url="url" title="新建离线预测" >
      </back-title> -->
      <div class="addOfflineStep-header-steps">
        <a-steps slot="extra" class="steps" :current="currentTab" size="small">
          <a-step title="选择模型" />
          <a-step title="选择数据集" />
          <a-step title="资源配置" />
        </a-steps>
      </div>
    </a-card>
    <a-card :bordered="false" style="flex: 1" class="card-content">
      <step1 :tabActiveKey="tabActiveKey" v-if="currentTab === 0 && tabActiveKey" @nextStep="nextStep" @cancel="cancel"/>
      <step2 v-if="currentTab === 1" @nextStep="nextStep" @prevStep="prevStep" @cancel="cancel"/>
      <step3 v-if="currentTab === 2" @nextStep="nextStep" @prevStep="prevStep" @cancel="cancel"/>
    </a-card>
  </div>

</template>

<script>
import Step1 from './Step1'
import Step2 from './Step2'
import Step3 from './Step3'
import { getResourceConfig } from '@/utils/util'
export default {
  name: 'StepOffLine',
  components: {
    Step1,
    Step2,
    Step3
  },
  data () {
    return {
      currentTab: 0,
      url: "/train/offline",
      tabActiveKey: null
    }
  },
  beforeRouteEnter (to, from, next) {
      next(vm => {
        // vm.currentTab = 0
        const { modelType, taskName } = vm.$route.query
        if (vm.$store.state.offline?.taskName !== taskName || vm.$store.state.offline?.modelType !== modelType) {
          vm.clearState()
          vm.currentTab = 0
          vm.tabActiveKey = modelType
          vm.$store.commit('setmodelTypeAndtaskName', { modelType, taskName })
        }
      })
  },
  beforeRouteLeave (to, from, next) {
    next()
  },
  beforeDestroy () {
    this.clearState()
  },
  mounted () {
    getResourceConfig().then(res => {
      this.$store.commit('setConfig', {
        computEngineType: 2,
        coreSize: res.cpu_core_default || 1,
        memorySize: res.cpu_size_default || 2,
        gpuSize: res.gpu_core_default || 1,
        videoMemorySize: res.gpu_size_default || 2,
        gpuMaxSize: res.gpu_size_max,
        coreSizeMax: res.cpu_size_max || 8,
        memorySizeMax: res.mem_size_max || 16
      })
    })
  },
  methods: {
    nextStep () {
      if (this.currentTab < 2) {
        this.currentTab += 1
      }
    },
    prevStep () {
      if (this.currentTab > 0) {
        this.currentTab -= 1
      }
    },
    cancel () {
      this.$router.push(this.url)
    },
    // 返回或者取消时，清空分步表单状态
    clearState () {
      this.tabActiveKey = null
      this.$store.commit('clearOfflineState')
    }
  }
}
</script>

<style lang="less" scoped>
.page-content{
  .step-content{
    /deep/ .ant-card-body {
      padding: 15px 20px 5px 20px;
        border-bottom: 2px solid #e6e7ea;
    }
    /deep/ .addOfflineStep-header-steps{
      margin: 0 auto
    }
  }
  .card-content  /deep/ .ant-card-body {
    padding: 0;
    height: 100%;
  }
  .steps {
    max-width: 400px;
    margin: 0 auto 15px auto;
        // float: right;
  }
}
</style>