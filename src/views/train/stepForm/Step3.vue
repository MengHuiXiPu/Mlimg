<template>
  <step-layout>
    <template slot="right">
      <div class="mask" v-if="saveLoading">
        <a-spin :spinning="saveLoading" :indicator="indicator" style="position:absolute;top: 50%;left: 50%;">
        </a-spin>
      </div>
      <a-tabs type="card">
        <a-tab-pane key="2" tab="训练资源设置">
          <ComputeResource ref="computeResource"/>
        </a-tab-pane>
        <a-tab-pane key="3" tab="超参设置">
          <TrainParamSet ref="trainParamSet"/>
        </a-tab-pane>
        <a-tab-pane key="4" tab="预训练模型设置">
          <PreTrainModel ref="preTrainModel"/>
        </a-tab-pane>
      </a-tabs>
    </template>
    <template slot="bottom">
      <a-button @click="prevStep" style="margin-left: 10px" class="btnStep">上一步</a-button>
      <a-button type="primary" @click="nextStep" style="margin-left: 10px" class="btnStep">下一步</a-button>
      <a-button style="margin-left: 10px;" @click="cancel" class="btnStep">取消</a-button>
    </template>
  </step-layout>
</template>

<script>
import StepLayout from '@/components/StepLayout'
import { mapState } from 'vuex'
import {
  getCategoryInfo,
  fetchSuccessTrainModelList,
  fetchModelPublicCategory,
  modelVersion,
  selectDatasetSeNoAddMinMustAdd, startTrainIM, saveTrainSet, createModel,
  getModelInfoById
} from '@/api/modelManage'
import { checkImageModel, getImageManageList, imageVersion } from '@/api/imageManage'
import TrainParamSet from "@/views/train/stepForm/components/TrainParamSet";
import ComputeResource from "@/views/train/stepForm/components/ComputeResource";
import PreTrainModel from "@/views/train/stepForm/components/PreTrainModel";
import bus from "@/utils/bus";

export default {
  name: 'Step3',
  components: {
    StepLayout,
    TrainParamSet,
    ComputeResource,
    PreTrainModel
  },
  data () {
    return {
      indicator: <a-icon type="loading" style="font-size: 32px" spin />,
      labelCol: { lg: { span: 5 }, sm: { span: 5 } },
      wrapperCol: { lg: { span: 19 }, sm: { span: 19 } },
      selectedTypeList: [],//储存可以被选中加入预测类别的code列表
      modelList: [],
      imageList: [],//算法列表
      imageChildrenList: [],
      modelChildrenList: [],
      indeterminate: false,
      checkAll: false,
      illegal:false,
      sortType: 2,
      wrongcodelist: [],//不能被选中的code
      wrongcodelistchecked: "",//已被选中的错误code
      mincount: 0,//所有被选中code的数据数量必须达到的最小值
      mustcodelist: [],//必须被选中的code
      mustmincount: 0,//必选code的数据数量必须达到的最小值
      // isMark: false,
      saveLoading: false,
      // confirmLoading: false,
    }
  },
  computed: {
    ...mapState({
      step: state => state.model.step,
      // step1ImageItem: state => state.model.step.step1ImageItem,
      preParam: state => state.model.step.preParam,
      // modelInfo: state => state.model.modelInfoToVersion,
      dataSource: state => state.model.step.dataSouce,
      modelInfoRecord: state => state.model.modelInfoRecord,
      currentModel: state => state.model.currentModel,
    }),
    modelId() {
      return this.$route.query.id
    }
  },
  async created () {
    // if (this.$route.query.id) {
    //   const res = await getModelInfoById(this.$route.query.id)
    //   if (res.code === 0 && res.data) {
    //     this.$store.commit('setModelInfoRecord', res.data)
    //     this.$store.commit('setimagesId', res.data.imageId)
    //     if (res.data.algorithmParam) {
    //       this.$store.commit('setStep3AlgorithmParam', res.data.algorithmParam)
    //     }
    //     const modelInfoForm = {
    //       modelName: this.modelInfoRecord.modelName,
    //       storedDirName: this.modelInfoRecord.storedDirName,
    //       modelDescription: this.modelInfoRecord.modelDescription,
    //       storedDirId: this.modelInfoRecord.storedDirId,
    //       modelId: this.modelInfoRecord.id
    //     }
    //     localStorage.setItem("info", JSON.stringify(modelInfoForm))
    //   }
    // }
  },
  async mounted () {//挂载完后执行
    console.log("-------modelInfoRecord: ", this.modelInfoRecord);
    console.log("-------state.step.dataSouce", this.$store.state.model.step.dataSouce)
  },
  methods: {
    async getChildren (id) {
      const model = this.modelList.filter(item => item.modelId === id)
      if (model.length === 0) return false
      const res = await modelVersion.getImageVersionList({ sourceVersionId: model[0].sourceVersionId })
      if (res.code !== 0) return false
      this.modelChildrenList = res.data
      this.$refs.ruleForm.clearValidate(['preTrainModelId'])
      this.$set(this.form, 'preTrainModelId', '')
    },
    async getPublicList (value) {
      const params = {
        preTrainModelId: value,
        dataListId: this.$store.state.model.step.dlId.join(',')
      }
      const responseData = await fetchModelPublicCategory(params)
      if (responseData.code === 0) {
        this.form.selectedType = responseData.data
      }
    },
    async getImageList () {
      const res = await getImageManageList({//调用api获取图片列表
        limit: 9999999,
        // imageStatus: 1,
        imageType: 1
      })
      console.log("getImageList res: ", res)
      if (res.code !== 0) return false
      this.imageList = res.data.records
      this.$set(this.form, 'preTrainImageId', '')
      this.$set(this.form, 'preTrainModelId', '')

      this.$nextTick(() => {
        console.log("this.$refs: ", this.$refs)
        console.log("ruleForm： ", this.$refs.ruleForm)
        this.$refs.ruleForm.clearValidate(['preTrainModelId']);
      })
    },
    async getImageChildren (imagesId) {
      const imageArr = this.imageList.filter(item => {
        return item.id === imagesId
      })
      if (imageArr.length === 0) return false
      const sourceVersionId = imageArr[0].sourceVersionId
      const res = await imageVersion.getImageVersionList({ sourceVersionId })
      if (res.code !== 0) return false
      this.$set(this.form, 'preTrainModelImageId', '')
      this.imageChildrenList = res.data
      this.$set(this.form, 'preTrainImageId', '')
      this.$set(this.form, 'preTrainModelId', '')
      this.$refs.ruleForm.clearValidate(['preTrainModelId']);
    },
    async getModelList (id) {//获取模型列表
      const res = await checkImageModel(id, { filter: 1 })
      if (res.code !== 0) return false
      this.modelList = res.data.map(item => {
        return {
          ...item,
          modelId: item.id
        }
      })
    },
    changeTrain () {
      this.$forceUpdate()
    },
    // 保存参数
    async saveParams (value) {
      // console.log("this.$refs.modelBaseInfo++++++",  this.$refs.modelBaseInfo)
      this.saveLoading = true
      let algorithmParam =  this.step.preParam.algorithmParam || this.modelInfoRecord.algorithmParam
      console.log("this.$store.state.model.preParam: ", this.preParam, algorithmParam)
      if(!algorithmParam) {
        this.$message.error('请设置超参数')
        this.saveLoading = false
        return
      }
      // 获取模型名称、模型保存路径、模型描述
      // const info = JSON.parse(localStorage.getItem("info"))
      const info = this.modelInfoRecord;
      console.log("info: ++++++++++", info)
      this.$store.commit('setModelInfo', this.modelInfoRecord);
      // const info = await getModelInfoById(this.modelId);
      // this.$store.commit('setModelInfo', info);
      console.log("state.step.dataSouce", this.$store.state.model.step.dataSouce)
      // this.saveLoading = true//表单有效，开始保存

      const dataSourceParams = { ...this.dataSource } // 解构赋值
      console.log("dataSourceParams+++++: ", dataSourceParams, this.modelInfoRecord, this.modelInfoRecord.datalist)
      let datalist = this.modelInfoRecord.dataList ? this.modelInfoRecord.dataList.split(',') : ''
      datalist = [...new Set(datalist)].join(',')
      console.log(datalist);
      const params = {
        ...dataSourceParams,
        modelId: Number(this.modelInfoRecord.id),
        algorithmParam: Array.isArray(algorithmParam) ? JSON.stringify(algorithmParam) : algorithmParam,
        businessParam: this.step.preParam.businessParam || this.modelInfoRecord.businessParam || '',
        needPreTrainModel: this.step.preParam.needPreTrainModel  || 0,
        preTrainModelId: this.step.preParam.preTrainModelId || 0, //不设置的时候默认值为0 ，否则后端无法更新到数据库
        preTrainImageId: this.step.preParam.preTrainImageId || 0, //不设置的时候默认值为0 ，否则后端无法更新到数据库
        preTrainImageParentId: this.step.preParam.preTrainImageParentId || this.modelInfoRecord.preTrainImageParentId || '',
        preTrainModelImageId: this.step.preParam.preTrainModelImageId || this.modelInfoRecord.preTrainModelImageId || '',
        dlId: this.step.dlId.join(',') || datalist || '',
        imagesId: this.modelInfoRecord.imageId,
        modelType: this.modelInfoRecord.modelType,
        tagType: this.step.preParam.tagType || this.modelInfoRecord.tagType,
        selectedType: this.step.preParam.selectedType.join(',') || this.modelInfoRecord.selectedType || '',
        preParam: JSON.stringify({
          split_rate: this.step.preParam.splitRatio / 100,
          normalization: this.step.preParam.oneness === '1', // 没有地方设置这个参数
          // dataStrong: this.preParam.dataStrong,
          // augment: this.preParam.dataStrong.includes('augment'),
          // random_crop: this.preParam.dataStrong.includes('random_crop'),
        }),
        // taskStatus: this.step.taskStatus, // 正常训练模型
        verifyWay: this.step.preParam.verifyWay, // 没有地方设置这个参数
        verifyIds: this.step.preParam.verifyIds, // 没有地方设置这个参数
        isPublish: 3,
        // 添加step2的label映射配置信息
        ...this.step.labelMapConfig,
        // taskStatus: 0
      }
      if (this.modelInfo?.parentVersionId) {
        params.parentVersionId = this.modelInfo.parentVersionId;
      }
      // else {
      //   params.parentVersionId = this.modelId; // 暂时这样设置，是为了有v1.0的标签
      // }
      console.log("params:+++++++++++++++++++ ", params);
      // const res = await startTrainIM(params) //调用api，开始训练模型，并传入params参数
      try {
        this.$store.commit('setModelInfoRecord', params)
        const res = await createModel(params);
        const data=  await getModelInfoById(this.$route.query.id)
      if (data.code === 0 && data.data) {
        this.$store.commit('setModelInfoRecord', data.data)
        this.$store.commit('setimagesId', data.data.imageId)
      }
        console.log("Step3 参数设置的res: ", res);
        if (res.code === 0) { // createModel执行成功后，更新状态
          this.saveLoading = false
          if (value !== 'index') {
            this.$emit('nextStep');
          }
        } else {
          this.saveLoading = false
        }
      } catch(e) {
        this.saveLoading = false
      }
    },
    nextStep () {
      this.$refs.computeResource.$refs.ruleForm.validate(async (valid) => { //调用roleForm的validate方法
        if (!valid) {
          console.log("modelBaseInfo表单验证失败+++++++++")
          return false // 表单无效返回false
        } else {
          if (this.$refs.trainParamSet) {
            this.$refs.trainParamSet.getformdata()
          }
          if(this.modelInfoRecord.taskStatus !== 1) {
            await this.saveParams()
          } else {
            this.$emit('nextStep');
          }
        }
      })
    },
    prevStep () {
      this.$emit('prevStep')
    },
    cancel () {
      this.$emit('cancel')
    },
  },
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
/deep/ .step-content .right .top {
  padding-bottom: 0px!important;
}
.btnStep {
  width: @nextStepWidth;
  height: @nextStepHeight;
  color: @nextStepColor;
  background-color: @nextStepBgc;
  border-radius: @borderRadiusSmall;
}
.mask {
  position: absolute;
  width: 100%;
  height: 100%;
  top:0;
  left:0;
  background-color: rgba(255, 255, 255, .5);
  //background-color: pink;
  z-index: 9999;
}
/deep/ .step-content{
 height: calc(100vh - 178px);
}
/deep/ .ant-checkbox-group{
  max-height: calc(100vh - 500px);
  overflow-y: auto;
  padding-bottom: 5px;
  &-item{
      width: 130px;
  }
  .error{
      text-align:center;
  }
}

/deep/ .ant-tabs.ant-tabs-card .ant-tabs-card-bar .ant-tabs-tab {
  width: 186px;
  height: 39px;
  font-size: 14px;
  font-family: "微软雅黑", sans-serif;
  text-align: center;
  margin-right: 16px;
  border-radius: @borderRadiusSmall;
  background: @modelTabsBgc;
  color: @modelTabsColor;
  font-weight: 400;
  border: 0;
}

/deep/ .ant-tabs.ant-tabs-card .ant-tabs-card-bar .ant-tabs-tab-active {
  width: 186px;
  height: 39px;
  font-size: 14px;
  font-family: "微软雅黑", sans-serif;
  text-align: center;
  color: @modelActiveTabsColor;
  background: @modelActiveTabsBgc;
  border-radius: @borderRadiusSmall;
}

/deep/ .page-content .ant-tabs-bar {
  border: 0;
}

/deep/ .ant-tabs-bar {
  border: 0;
}
    
</style>
