<template>
  <!-- <div class="page-content"> -->
  <div style="border-radius: 16px; overflow: hidden;">
    <a-card :bordered="false" class="step-content">
      <back-title @onBack="onBack">
      </back-title>
      <div class="addOfflineStep-header-steps">
        <a-steps slot="extra" class="steps" :current="currentTab" size="small">
          <a-step title="选择图像题库集" />
          <a-step title="资源配置" />
        </a-steps>
      </div>
    </a-card>
    <a-card :bordered="false" style="flex: 1" class="card-content">
      <step2 v-if="currentTab === 0" @nextStep="nextStep" @prevStep="prevStep" @cancel="cancel"/>
      <step3 v-if="currentTab === 1" @nextStep="nextStep" @prevStep="prevStep" @cancel="cancel"/>
    </a-card>
  </div>

</template>

<script>
import Step2 from './Step2'
import Step3 from './Step3'
import { getResourceConfig } from '@/utils/util'
export default {
  name: 'Step2OffLine',
  components: {
    Step2,
    Step3
  },
  data () {
    return {
      currentTab: 0
    }
  },
  beforeRouteLeave (to, from, next) {
    next()
    this.$store.commit('setModelOffline', {
      dlId: '',
      computEngineType: 2,
      coreSize: 1,
      memorySize: 2,
      gpuSize: 1,
      videoMemorySize: 2
    })
  },
  mounted () {
    getResourceConfig().then(res => {
      this.$store.commit('setModelOffline', {
        dlId: '',
        computEngineType: 2,
        coreSize: res.cpu_core_default || 1,
        memorySize: res.cpu_size_default || 2,
        gpuSize: res.gpu_core_default || 1,
        videoMemorySize: res.gpu_size_default || 2,
        gpuMaxSize: res.gpu_size_max,
      })
    })
  },
  methods: {
    onBack () {
      this.$store.commit('setisShowDetail', true)
    },
    cancel () {
      this.$store.commit('setisShowDetail', true)
    },
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
  }
}
</script>

<style lang="less" scoped>
.page-content{
  .step-content /deep/ .ant-card-body {
    padding: 15px 20px 5px 20px;
    border-bottom: 2px solid #e6e7ea;
    /deep/ .back-title{
      float: left;
    }
  }
  /deep/ .addOfflineStep-header-steps{
    margin: 0 auto
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