<template>
      <div class="page-content" >
        <a-card :bordered="false" class="step-content">
          <div class="addModelStep-header-steps">
            <a-steps slot="extra" class="steps" :current="currentTab" size="small" @change="onChange">
              <a-step title="算法选择" />
              <a-step title="数据选择" />
              <a-step title="训练参数配置" />
              <a-step title="模型训练" />
              <a-step title="评估测试" />
              <a-step title="模型部署" />
            </a-steps>
          </div>
        </a-card>
        <a-card :bordered="false" class="card-content" v-if="!$route.query.parentId || ($route.query.parentId)">
          <keep-alive>
            <step1 v-if="currentTab === 0" :active="loadData" @nextStep="nextStep" @cancel="cancel" :modelID="modelID" ref="step1"/>
          </keep-alive>
          <keep-alive>
            <step2 v-if="currentTab === 1" @nextStep="nextStep" @prevStep="prevStep" @cancel="cancel" :modelID="modelID" ref="step2"/>
          </keep-alive>
          <keep-alive>
            <step3 v-if="currentTab === 2" @nextStep="nextStep" @prevStep="prevStep" @cancel="cancel" :modelID="modelID" ref="step3"/>
          </keep-alive>
          <keep-alive>
            <step4 v-if="currentTab === 3" @nextStep="nextStep" @prevStep="prevStep" @cancel="cancel" :modelID="modelID"/>
          </keep-alive>
          <keep-alive>
            <step5 v-if="currentTab === 4" @nextStep="nextStep" @finish="finish" @prevStep="prevStep" @cancel="cancel" :modelID="modelID"/>
          </keep-alive>
          <keep-alive>
            <step6 v-if="currentTab === 5" @finish="finish" @prevStep="prevStep" @cancel="cancel" />
          </keep-alive>
        </a-card>
      </div>
</template>

<script>
import Step1 from './Step1'
import Step2 from './Step2'
import Step3 from './Step3'
import Step4 from './Step4'
import Step5 from './Step5'
import Step6 from './Step6'
import { getResourceConfig } from '@/utils/util.js'
import { getBusinessModelManageInfo, getModelInfoById } from '@/api/modelManage'
import {mapMutations, mapState} from "vuex";
import store from '@/store'
import bus from "@/utils/bus";
export default {
  name: 'StepForm',
  components: {
    Step1,
    Step2,
    Step3,
    Step4,
    Step5,
    Step6
  },
  data () {
    return {
      active: 0,
      loadData: false,
      currentTab: -1,
      loadVersion: false,
      url: "/train/model",
      modelID: -1,
      contentHeight: 0,
      monitorList: []
    }
  },
  async beforeRouteEnter (to, from, next) {
    store.commit('setdlItem', [])
    let res = await getModelInfoById(to.query?.id)
    if (res.code === 0 && res.data) {
      // console.log("+++++ main framework  res+++", res)
      // 获取并set State 整个训练模型(整体，即每一步)的数据
      // 如果res.data.needLabelMap为布尔类型，说明已经支持label映射，需要读取接口保存的配置，否则是以前的训练任务，也要支持其配置，为其设置默认值（不调用setLabelMapConfig，就会使用store中的默认值了）
      if([true, false].includes(res.data.needLabelMap)) {
        store.commit('setLabelMapConfig', {
          labelRule: res.data.labelRule,
          needLabelMap: res.data.needLabelMap
        })
      }
      store.commit('setModelInfoRecord', res.data)
      store.commit('setimagesId', res.data.imageId)
    }
    next(vm => {
      // getModelInfoById(vm.$route.query?.id).then(res => {
      //   console.log("+++++ main framework  getModelInfoById+++", res)
      //   if (res.code === 0 && res.data) {
      //     console.log("+++++ main framework  res+++", res)
      //     vm.$store.commit('setModelInfoRecord', res.data)
      //     vm.$store.commit('setimagesId', res.data.imageId)
      //   }
      // })
      if (vm.active !== vm.$route.query.active) {
          if(vm.$route.query?.taskStep) {
            vm.currentTab = parseInt(vm.$route.query.taskStep)
          }else{
            vm.currentTab = 0
          }
          if(vm.$route.query?.id) {
            vm.modelID = vm.$route.query?.id
          }
          // else{
          //   vm.modelID = 0
          // }
          console.log("vm.currentTab: ", vm.currentTab);
          console.log("vm.modelID: ", vm.modelID);
          // vm.clearState();
          vm.$store.commit('setmodelInfoToVersion', null)
          vm.active = vm.$route.query.active
          vm.loadVersion = false
          //若router传来的parentId不为空，则为给id为parentId的模型新增版本
          if (vm.$route.query.parentId) {
            vm.getModelInfo(vm.$route.query.parentId);
          }
          else {
            vm.loadData = true;
            vm.getResourceConfigData();
          }
          vm.$store.commit('setparentId', vm.$route.query.parentId);
        }
      vm.$store.commit('setmodelType', vm.$route.query.modelType)
    })
  },
  beforeRouteLeave (to, from, next) {
    this.resetState();
    this.clearState();
    this.loadData = false
    next()
  },
  computed: {
    // currentModel() {
    //   return this.$store.state.model.currentModel;
    // },
    // modelInfoRecord() {
    //   return this.$store.state.model.modelInfoRecord;
    // },
    ...mapState({
      imagesId: state => state.model.step.imagesId,
      step1ImageType: state => state.model.step.step1ImageType,
      modelInfo: state => state.model.modelInfoToVersion,
      currentModel: state => state.model.currentModel,
      modelInfoRecord: state => state.model.modelInfoRecord,
    })
  },
  mounted () {
    console.log("+++++the main framework+++", this.modelInfoRecord)
    this.$nextTick(() => {
      const windowHeight = window.innerHeight;
      this.contentHeight = windowHeight - 60 - 24 - 32; // 24是headerContent下边距，32是内容区的外边距
    });
    bus.$on("monitorList", list => {
      this.monitorList = list;
    });
  },
  beforeDestroy() {
    // 在组件销毁前清空vuex信息
    this.resetState();
  },
  methods: {
    ...mapMutations(['resetState']),
    nextStep () {
      if (this.currentTab < 6) {
        this.currentTab += 1
      }
    },
    onChange(current) {
      console.log('模型训练状态：',this.modelInfoRecord.taskStatus)
      //训练已完成
      if(this.modelInfoRecord.taskStatus == 2){
        this.currentTab = current;
        return;
      }
      if(current < this.currentTab) {
        this.currentTab = current;
        return ;
      }
      if (current - this.currentTab > 1) return
      if(this.currentTab === 0 && this.modelInfoRecord.imageId === null) {
        this.$message.error('请选择算法')
        return ;
      }
      if(current == 1 ) { // 点击了第二步，保存算法
        // 保存选择的算法
        if(this.modelInfoRecord.taskStatus !== 1) {
          this.$refs.step1.saveAlgorithm()
        }
        this.currentTab = current;
        return ;
      }
      if(this.currentTab === 1 && this.modelInfoRecord.taskStatus == 0 ) {
        const selectedType = this.$store.state.model.step.preParam.selectedType;
        // console.log("selectedType 2222222: ", selectedType)
        if (this.$store.state.model.step.dlId.length > 0 && selectedType.length > 0) {
          this.currentTab = current;
        } else if(this.$store.state.model.step.dlId.length === 0) {
          this.$message.error('请选择数据集')
          return ;
        }else {
          this.$message.error('请选择预测类别')
          return ;
        }
      }
      if(current == 2) { // 点击了第三步，保存数据集
        // 保存选择的数据集
        if (this.$refs.step2 && this.modelInfoRecord.taskStatus !== 1) {
          this.$refs.step2.saveDataset()
        }
        this.currentTab = current;
        return ;
      }
      // if(this.currentTab === 2 && current > this.currentTab && this.currentModel === null) {
      //   this.$message.error('开始训练后才能进入下一步')
      //   return ;
      // }
      if(current == 3) { // 点击了第三步，保存训练参数
        // 保存选择的数据集
        if (this.$refs.step3 && this.modelInfoRecord.taskStatus !== 1) {
          this.$refs.step3.saveParams('index')
        }
        this.currentTab = current;
        return ;
      }
      // if(this.currentTab === 3 && current > this.currentTab && this.modelInfoRecord.taskStatus !== 2) {
        // console.log(this.monitorList, 'this.monitorList')
      if(this.currentTab === 3 && current > this.currentTab && this.monitorList.length === 0) {
        this.$message.error('完成训练后才能进入下一步')
        return ;
      }
      if(current - this.currentTab > 1 && this.currentTab < 2 && this.modelInfoRecord.taskStatus == 0) {
        this.$message.error("当前阶段不能跳转到该步骤")
        return ;
      }
      if(current < 6) {
        this.currentTab = current;
      }
    },
    prevStep () {
      if (this.currentTab > 0) {
        this.currentTab -= 1
      }
    },
    finish () {
      this.currentTab = 0
      this.active = 0
    },

    async getResourceConfigData () {
      const res = await getResourceConfig()
      this.$store.commit('setDefaultValidationSet', res.default_validation_set)
      // 配置默认的参数
      this.$store.commit('setpredataSouce', {
        computEngineType: 2,
        coreSize: res.cpu_core_default || 1,
        memorySize: res.cpu_size_default || 16,
        gpuSize: res.gpu_core_default || 1,
        videoMemorySize: res.gpu_size_default || 12,
        // gpuMaxSize: res.gpu_size_max,
        modelName: '',
        storedDirName: '',
        storedDirId: ''
      })
      this.$store.commit('setResourceMaxConfig', {
        gpuMaxSize: (res.gpu_size_max || 23.69) - 0.3,
        coreSizeMax: res.cpu_size_max || 8,
        memorySizeMax: res.mem_size_max || 16
      })
    },
    //获取需要新增版本的模型id
    async getModelInfo (id) {
      const res = await getBusinessModelManageInfo(id)
      if (res.code !== 0) return false
      this.loadVersion = true
      this.loadData = true
      this.$store.commit('setmodelInfoToVersion', res.data)
      const { imagesId, dataListInfo, needPreTrainModel, selectedType, algorithmParam, tagType, businessParam, preParam,
        computEngineType, coreSize, memorySize, gpuSize, videoMemorySize, modelName, storedDirName,
        storedDirId, verifyWay, verifyIds } = res.data
      const { split_rate } = JSON.parse(preParam) || { split_rate: 0.2 }
      this.$store.commit('setimagesId', imagesId)
      this.$store.commit('setdlId', dataListInfo.map(item => item.id))
      this.$store.commit('setdlItem', dataListInfo)
      this.$store.commit('setpreParam', {
        needPreTrainModel,
        selectedType: selectedType.split(','),
        algorithmParam,
        splitRatio: split_rate * 100,
        tagType,
        businessParam,
        verifyWay,
        verifyIds
      })
      const gpuMax = await getResourceConfig()
      this.$store.commit('setpredataSouce', {
        computEngineType,
        coreSize,
        memorySize,
        gpuSize,
        videoMemorySize,
        modelName,
        storedDirName,
        storedDirId,
        gpuMaxSize: gpuMax.gpu_size_max
      })
    },
    cancel () {
      // 重置vuex model模块中的某些字段
      this.resetState();
      this.$router.push(this.url)
    },
    // 返回或者取消时，清空分步表单状态
    clearState () {
      this.$store.commit('clearState')
    },
  }
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
.page-content{
  // border-radius: 20px;
  // background-color: @tabBackgroundColor;
  .step-content{
    padding: 0!important;
    /deep/ .ant-card-body {
      padding: 15px 20px 5px 20px;
    }
    /deep/ .addModelStep-header-steps{
      margin: 0 auto;
    }
  }
  .card-content  /deep/ .ant-card-body {
    padding: 0;
  }
  .card-content {
    &::v-deep .step-content{
      height: calc(100vh - 200px);
    }
  }
  .steps {
    max-width: 80%;
    margin: 0 auto 15px auto;
  }
}
</style>