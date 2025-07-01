<template>
  <step-layout>
    <template slot="rightSpecial">
      <!-- 接入sdk后的显示内容 v-if="isSdkAlgorithm"-->
      <a-tabs type="card">
        <a-tab-pane key="2" tab="监控">
          <div v-if="confirmLoading" class="mask" ></div>
          <a-spin :spinning="confirmLoading" :indicator="indicator" style="position:absolute;top: 50%;left: 50%;"></a-spin>
          <monitor ref="monitor" :modelDetail="modelDetail" :showLog="true"/>
        </a-tab-pane>
        <!-- 开始训练后，algorithmStoredDir才有值，有值才可以查看tensorboard -->
        <a-tab-pane key="3" tab="tensorboard" :disabled="!modelInfoRecord.algorithmStoredDir" >
          <frame-container :src="tensorboardUrl" style="height: calc(100vh - 360px)"></frame-container>
        </a-tab-pane>
      </a-tabs>
      <!-- 原始显示内容 -->
      <!-- <template v-else>
        <div v-if="confirmLoading" class="mask" ></div>
        <a-spin :spinning="confirmLoading" :indicator="indicator" style="position:absolute;top: 50%;left: 50%;"></a-spin>
        <monitor ref="monitor" :modelDetail="modelDetail" :showLog="true"/>
      </template> -->
    </template>
    <template slot="bottomSpecial">
      <!-- 屏蔽暂停/继续训练 -->
      <!-- <a-button type="primary" style="margin-right: 10px" @click="changeTrainState" class="btnStep" v-if="[1,4,5].includes(modelInfoRecord.taskStatus)">{{ [1,4].includes(modelInfoRecord.pauseStatus) || [4].includes(modelInfoRecord.taskStatus)? '继续训练':'暂停训练'}}</a-button> -->
      <!-- 新增在手动终止状态(taskStatus: 4)下也可以开始训练 -->
      <a-button type="primary" style="margin-right: 10px" @click="startTrain" class="btnStep" v-if="[0,2,3,4].includes(modelInfoRecord.taskStatus)">开始训练</a-button>
      <!-- 只有在训练完成前，才可以终止训练 -->
      <a-button type="primary" style="margin-right: 10px" @click="stopTrain" class="btnStep" v-if="[1].includes(modelInfoRecord.taskStatus)">终止训练</a-button>
      <a-button @click="prevStep" class="btnStep"  style="margin-left: 10px">上一步</a-button>
      <a-button type="primary" @click="nextStep" class="btnStep" style="margin-left: 10px;">下一步</a-button>
      <a-button style="margin-left: 10px;" @click="cancel" class="btnStep">取消</a-button>
    </template>
  </step-layout>
</template>

<script>
import { axios } from '@/utils/request'
import StepLayout from '@/components/StepLayout'
import { mapState } from 'vuex'
import monitor from '@/views/train/model/components/monitor'
import { getParams } from '@/utils/util'
import {
  getModelInfoById,
  getModelTableList,
  getModelDLtByDLId,
  stopModelTrain,
  getCodeData,
  getCodeList,
  startTrainIM,
  pauseTrainModel,
  recoverTrainModel,
  setTrainStart,
  stopTensorboardServe,
} from "@/api/modelManage"//利用axios从后端获取模型数据
import FrameContainer from "@/components/FrameContainer/index.vue"
export default {
  name: 'Step4',
  components: {
    StepLayout,
    monitor,
    FrameContainer,
  },
  props: {
    // modelID: {
    //   type: Number,
    //   default: -1,
    // }
  },
  data () {
    return {
      fastClick: false,
      indicator: <a-icon type="loading" style="font-size: 32px" spin />,
      confirmLoading: false, // 回显时加载
      modelDetail: {
        id: ''
      },
      loading: false,
      // modelInfo: null,
      pagination: {
        current: '',
        pageSize: '',
      },
      tempdatalist: {},
      modelInfo1: {},
      datalist: [],//数据集分code统计信息
      selectedTypeList: [],//储存可以被选中加入预测类别的code列表

    }
  },
  computed: {
    ...mapState({
      step: state => state.model.step,
      // step1ImageItem: state => state.model.step.step1ImageItem,
      // preParam: state => state.model.step.preParam,
      // 暂时注释掉
      // modelInfo: state => state.model.modelInfoToVersion,
      dataSource: state => state.model.step.dataSouce,
      modelInfoRecord: state => state.model.modelInfoRecord,
      // currentModel: state => state.model.currentModel,
    }),
    modelInfo () {
      return this.modelInfoRecord
    },
    modelId() {
      return this.$route.query.id
    },
    tensorboardUrl() {
      const logdir = `${this.modelInfoRecord.algorithmStoredDir}/tensorboard`
      return `${window.location.origin}/api/v1/adapter/tensorboard/${this.modelId}/?logdir=${escape(logdir)}`
      // return `${window.location.origin}/api/v1/adapter/tensorboard/${this.modelId}/?logdir=/data/admin/`
    },
    // 是否是SDK算法，告知通过解析算法参数中有没有特定字段来判断
    // isSdkAlgorithm() {
    //   const algorithmParam = this.modelInfoRecord?.algorithmParam
    //   if(!algorithmParam) return false
    //   try {
    //     // 乱的跟屎一样的代码，不知道为什么在getModelInfoById又将algorithmParam解析成数组commit到modelInfoRecord中
    //     const jsonList = Array.isArray(algorithmParam) ? algorithmParam : JSON.parse(algorithmParam)
    //     // 解析算法参数
    //     const params = JSON.parse(jsonList[0].content)
    //     if(params.model_train_params || params.special_params || params.model_params) {
    //       return true
    //     }else {
    //       return false
    //     }
    //   }catch(e) {
    //     console.log("算法参数不合法：", e)
    //     return false
    //   }
    // }
  },
 async mounted () {
    console.log("挂载了：", this.modelId, this.modelInfoRecord)
    this.modelDetail.id = this.modelId;
    console.log("挂载了：", this.modelId, "this.modelDetail.id:  ", this.modelDetail.id, this.modelInfoRecord)
    // await this.getModelInfoById(this.modelId)
    // await this.getModelList({ modelType: this.$route.query.modelType, isFirst: true, pageSize: 999999, pageIndex: 1 })
    sessionStorage.setItem("model_id_for_tensorboard", this.modelId)
  },
  async activated() {
    await this.getModelList({ modelType: this.$route.query.modelType, isFirst: true, pageSize: 999999, pageIndex: 1 })
    // await this.getModelInfoById(this.modelId)
    sessionStorage.setItem("model_id_for_tensorboard", this.modelId)
  },
  methods: {
    // 开始训练
    async startTrain () {
      // console.log("this.$refs.modelBaseInfo++++++",  this.$refs.modelBaseInfo)
      console.log("this.$store.state.model.preParam: ", this.modelInfoRecord)
      if(this.modelInfoRecord.algorithmParam === '') {
        this.$message.error('请设置超参数')
        return
      }
      if (this.fastClick) return
      this.fastClick = true
      this.confirmLoading = true
      // 获取模型名称、模型保存路径、模型描述
      // const info = JSON.parse(localStorage.getItem("info"))
      // console.log("info: ++++++++++", info)
      this.$store.commit('setModelInfo', this.modelInfoRecord);
      // const info = await getModelInfoById(this.modelId);
      // this.$store.commit('setModelInfo', info);
      console.log("state.step.dataSouce", this.$store.state.model.step.dataSouce)
      // this.saveLoading = true//表单有效，开始保存

      const dataSourceParams = { ...this.dataSource } // 解构赋值
      console.log("dataSourceParams+++++: ", dataSourceParams)
      const params = {
        ...dataSourceParams,
        modelId: Number(this.modelInfoRecord.id),
        algorithmParam: Array.isArray(this.modelInfoRecord.algorithmParam) ? JSON.stringify(this.modelInfoRecord.algorithmParam) : this.modelInfoRecord.algorithmParam,
        businessParam: this.modelInfoRecord.businessParam || '',
        needPreTrainModel: this.modelInfoRecord.needPreTrainModel,
        preTrainModelId: this.modelInfoRecord.preTrainModelId || '',
        preTrainImageId: this.modelInfoRecord.preTrainImageId || '',
        dlId: this.modelInfoRecord.dlId,
        imagesId: this.modelInfoRecord.imageId,
        modelType: this.modelInfoRecord.modelType,
        tagType: this.modelInfoRecord.preParam.tagType,
        selectedType: this.modelInfoRecord.selectedType,
        // preParam: JSON.stringify({
        //   split_rate: this.modelInfoRecord.splitRatio / 100,
        //   normalization: this.modelInfoRecord.oneness === '1', // 没有地方设置这个参数
        //   // dataStrong: this.preParam.dataStrong,
        //   // augment: this.preParam.dataStrong.includes('augment'),
        //   // random_crop: this.preParam.dataStrong.includes('random_crop'),
        // }),
        preParam:this.modelInfoRecord.preParam,
        taskStatus: 1, // 正常训练模型
        verifyWay: this.modelInfoRecord.verifyWay, // 没有地方设置这个参数
        verifyIds: this.modelInfoRecord.verifyIds, // 没有地方设置这个参数
        isPublish: 0,
        remark: '',
        pauseStatus: 2,
        // 添加step2的label映射配置信息
        ...this.step.labelMapConfig,
        // isTrain: true,
      }
      if (this.modelInfo) {
        params.parentVersionId = this.modelInfo.parentVersionId;
      }
      // else {
      //   params.parentVersionId = this.modelId; // 暂时这样设置，是为了有v1.0的标签
      // }

      // const params = {
      //   modelId: this.modelId
      // }
      // startTrainIM(params).then(async (res) => {//调用api，开始训练模型，并传入params参数
      // setTrainStart(params).then(async (res) => {//调用api，开始训练模型，并传入params参数
      startTrainIM(params).then(async (res) => {//调用api，开始训练模型，并传入params参数
        // this.saveLoading = false//正在保存的过程结束
        console.log("res++++++++: ", res);
        if (res.code === 0) {//startTrain执行成功后，更新状态
          // bus.$emit('reloadModel');//触发reloadModel事件
          // this.nextStep();
          this.$store.commit('setCurrentModel', res.data);
          // console.log("kkkkkkkkkk")
          // await this.getModelInfoById(this.modelId)
          // await this.getModelList({ modelType: this.$route.query.modelType, isFirst: true, pageSize: 999999, pageIndex: 1 })
          this.$message.success('开始训练!');
          localStorage.removeItem("info");
          this.confirmLoading = false
          await this.getModelInfoById(this.modelInfoRecord.id)
          // this.$store.commit('clearState');//更新状态
          // this.$emit('finish');
          // this.$router.push('/train/model');//路由跳转
          setTimeout(() => {
            this.fastClick = false
          }, 1000);
        }
      })

      // this.$refs.computeResource.$refs.ruleForm.validate((valid) => { //调用roleForm的validate方法
      //   if (!valid) {
      //     console.log("modelBaseInfo表单验证失败+++++++++")
      //     return false // 表单无效返回false
      //   }
      //   else {
      //
      //     // this.$refs.computeResource.$refs.ruleForm.validate((valid) => {
      //     //   if(!valid) {
      //     //     console.log("computeResource表单验证失败+++++++++")
      //     //     return false // 表单无效返回false
      //     //   } else {
      //
      //     // this.$refs.trainParamSet.$refs.ruleForm.validate((valid) => {
      //     //   console.log("valid: ", valid);
      //     //   if(!valid) {
      //     //     console.log("trainParamSet表单验证失败+++++++++")
      //     //     return false // 表单无效返回false
      //     //   } else {
      //     //
      //     //   }
      //     // })
      //     // }
      //     // })
      //
      //   }
      // })
    },
    async getModelList(param) {
      const params = getParams(param, this, "model")
      await this.getList(params)//调用方法读取列表内容
      // this.setTimer(this.getList, params, 2 * 60 * 1000)
    },
    // 请求获取模型列表
    async getList(params) {
      // params.modelType = this.$route.query.modelType // 模型类型，默认为通用模型，所以设置为1；
      // this.loading = true//默认loading为true，显示加载中动效
      // const res = await getModelTableList(params)//使用import的函数调用axios方法，从后端接口读取数据
      // //对象属性解构，把res中的属性拆成records、code、msg，这里面records为原对象属性data的别名
      // const { data: { records = [] } = {}, code, msg } = res
      // if (code === 0) {//校验码，0表示成功
      //   //如果可以正确获取数据，则把loading设置为false
      //   // this.loading = false
      //   this.modelInfo = records.filter(item => item.id == this.modelId ); // 返回的是数组
      //   this.modelInfo = this.modelInfo[0] // 获取第一个对象
      //   this.modelInfo.modelSchedule = this.modelInfo.taskStatus === 2? 100 : this.modelInfo.modelSchedule;
      //   this.$store.commit('setModelInfoRecord', this.modelInfo);
      // }else {
      //   // this.loading = false
      // }
      this.$nextTick(async () => {
        if (this.$refs.monitor) {
          if(this.modelInfo.taskStatus > 0) {
            await this.$refs.monitor.getChartData()
            await this.$refs.monitor.getTableList()
            await this.$refs.monitor.getModelLogData()
          }

          // if(this.modelInfo.taskStatus > 1) {
          //   await this.$refs.monitor.getModelLogData()
          // }
        }
      })
      console.log("Step4 this.modelInfo++++++++: ", this.modelInfo)
    },
    // 查询基本信息
    async getModelInfoById (id = this.modelId) {
      this.confirmLoading = true
      this.loading = true;//先设置加载中动效，载入数据后取消此动效
      //调用api获取模型数据集信息并赋值给modelInfo
      const data = await getModelInfoById(id)
      this.confirmLoading = false
      if (data.code === 0) {//成功返回code为0
        const modelInfo = data?.data
        // 参数格式化
        if (modelInfo?.algorithmParam) {
          modelInfo.algorithmParam = this.getActiveParams(modelInfo.algorithmParam);
        }
        console.log(data);
        this.$store.commit('setModelInfoRecord', data.data)
        this.$store.commit('setimagesId', data.data.imageId)
        this.$store.commit('setStep3AlgorithmParam', data.data.algorithmParam)
        const modelInfoForm = {
          modelName: data.data.modelName,
          storedDirName: data.data.storedDirName,
          modelDescription: data.data.modelDescription,
          storedDirId: data.data.storedDirId,
          modelId: data.data.id
        }
        localStorage.setItem("info", JSON.stringify(modelInfoForm))
        await this.getCodeList(modelInfo);
      }
    },
    //继续训练 or 暂停训练
    changeTrainState() {
      if (this.fastClick) return
      this.fastClick = true
      this.loading = true
      console.log("暂停继续modelInfoRecord： ", this.modelInfoRecord);
      if ([1, 4].includes(this.modelInfoRecord.pauseStatus) || [4].includes(this.modelInfoRecord.taskStatus)) {
        this.continueTrain()
      } else {
        pauseTrainModel({ modelId: this.modelId }).then(async res => {
          if (res.code === 0) {
            this.loading = false
            // this.$store.commit('setpauseStatus', 1)
            await this.getModelInfoById(this.modelId)
            // await this.getDataList({ modelType: this.$route.query.modelType, isFirst: true, pageSize: 99999 })
            await this.getModelList({ modelType: this.$route.query.modelType, isFirst: true, pageSize: 999999, pageIndex: 1 })
            console.log('操作成功')
            this.$message.success('操作成功')
            this.fastClick = false
            // this.getDataList({
            //   pageSize: this.pagination.pageSize,
            //   pageIndex: this.pagination.current,
            // })
          }
        })
      }
    },
    // 继续训练
    continueTrain() {
      const configForm = {
          engineCoreType: this.modelInfoRecord.computEngineType,
          cpuSetMem: this.modelInfoRecord.memorySize,
          cpuSetCount: this.modelInfoRecord.coreSize,
          gpuSetMem: this.modelInfoRecord.videoMemorySize,
          gpuSetCount: this.modelInfoRecord.gpuSize
      }
      const params = {
        ...configForm,
        modelId: this.modelId
      }
      recoverTrainModel(params).then(async res => {
        console.log("res: +++++", res);
        if (res.code === 0) {
          this.loading = false
          // this.$store.commit('setpauseStatus', 2)
          await this.getModelInfoById(this.modelId)
          // await this.getDataList({ modelType: this.$route.query.modelType, isFirst: true, pageSize: 9999999 })
          await this.getModelList({ modelType: this.$route.query.modelType, isFirst: true, pageSize: 999999, pageIndex: 1 })
          console.log('继续训练操作成功')
          this.$message.success('操作成功')
          this.fastClick = false
        }
      })
    },
    // 终止训练
    stopTrain(record) {
      this.$confirm({
        title: "确定要终止训练吗?",
        content: "此操作将终止训练，请确认是否终止?",
        cancelText: '取消',
        okText: '确定',
        onOk: () => {
          const obj = {
            modelId: this.modelId
          }
          this.loading = true
          stopModelTrain(obj).then(async (res) => {
            if (res.code === 0) {
              this.$message.success('终止成功!')
              await this.getModelInfoById(this.modelId)
              // await this.getDataList({ modelType: this.$route.query.modelType, isFirst: true, pageSize: 99999 })
              await this.getModelList({ modelType: this.$route.query.modelType, isFirst: true, pageSize: 999999, pageIndex: 1 })
            }
          }).finally(() => { this.loading = false })
          // .catch(err => this.$message.error(err))
        },
        onCancel() { }
      })
    },
    nextStep () {
      console.log(this.$refs.monitor.tableData, 'monitorList')
      // if(this.modelInfoRecord.taskStatus !== 2) {
        // 判断修改：monitor组件的tableData.length > 0就可以跳下一步
      if(this.$refs.monitor.tableData.length === 0) {
        this.$message.error('完成训练后才能进入下一步')
        return ;
      }
      this.$emit('nextStep')
    },
    prevStep () {
      this.$emit('prevStep')
    },
    cancel () {
      this.$emit('cancel')
    },
    getDataList(param) {
      const params = getParams(param, this, "model")
      // if (param?.isFirst) {
      //   params.nodeId = 0
      //   params.nodeCode = ''
      // }
      // this.currentNode = params.nodeId || 0
      this.getList(params)//调用方法读取列表内容
      // this.setTimer(this.getList, params, 2 * 60 * 1000)
    },
    getActiveParams (data) {
      const _data = JSON.parse(data).map((item, index) => {
        if (item.type) {
          let children = null
          if (item.type === 1) {
            children = item.childreans.map((child, childIndex) => {
              return {
                ...child,
                key: `${index}-${childIndex}-${child.name}`
              }
            })
          } else {
            delete item.childreans
          }
          return {
            ...item,
            childrens: children || undefined,
            key: `${index}-${item.name}`
          }
        } else {
          const child = Object.keys(item)[0]
          return {
            name: child,
            type: 2,
            content: item[child],
            key: `${index}-${child}`
          }
        }
      })
      // this.backupAlgorithmParam = JSON.parse(JSON.stringify(_data))
      // this.algorithmParam = _data
      return _data;
    },
    // 查询数据集列表
    async getModelDLtByDLId () {
      if (!this.modelInfo1.dataList) return false
      console.log("test this.modelInfo1.dataList: ", this.modelInfo1.dataList)
      //调用import的axios函数，通过后端接口获取数据库数据
      const res = await getModelDLtByDLId(this.modelInfo1.dataList)//返回一个包含dlID的对象
      console.log("getModelDLtByDLId res 6666666xxxxxx++++: ", res)
      const { data = [], code, msg } = res
      if (code === 0) {
        this.data = data.map(item => {
          const { id, maxCategoryName, maxCategoryRatio, minCategoryName, minCategoryRatio } = item//数据拆分
          return {
            ...item,
            key: id,
            //将maxCategoryName和转换成百分数的maxCategoryRatio拼接成字符串
            maxCategory: `${maxCategoryName} (${this.fomat(maxCategoryRatio)})`,
            minCategory: `${minCategoryName} (${this.fomat(minCategoryRatio)})`,
          }
        })
      }
      else {
      }
    },
    fomat (num) {
      return (num).toFixed(2) * 100 + '%'
    },
    //获取code 图片及标注数量（及分辨率）信息
    // async getCodeData() {
    //   if (!this.modelInfo1.dataList) return false
    //   //调用import的axios函数，通过后端接口获取数据库数据，根据modelInfo.dataList获取数据表
    //   let dataList = this.modelInfo1.dataList.split(',');//数据集列表数组，每个元素是一个数据集id
    //   for (var i = 0; i < dataList.length;i++) {
    //     const res = await getCodeData(dataList[i]);//调用接口每次回复一个数据集的统计信息
    //     console.log("getCodeData res 6666666666: ", res);
    //     const { data = [], code, msg } = res//数据解构
    //     if (code === 0) {//将各数据集的详细信息合并显示
    //       //遍历data数组中的每个元素item，拆分出item的四个属性，然后添加新属性，把每个元素拆分出来保存为data0
    //       let data0 = data.map(item => {
    //         const { pixelWidth, pixelHeight } = item//数据拆分
    //         return {
    //           ...item,
    //           resolution: `${pixelWidth}×${pixelHeight}`,//拼合分辨率数据
    //         }
    //       })
    //       for (var j in data0) {//把新读到的列表和已有数据表比对，已有则更新，没有则添加
    //         var flag = 0;
    //         for (var k in this.datalist) {//已有数据
    //           if (data0[j].folderName == this.datalist[k].folderName && data0[j].resolution == this.datalist[k].resolution) {
    //             this.datalist[k].pixelCount += data0[j].pixelCount;
    //             flag = 1;//表示该类数据已有
    //           }
    //         }
    //         if (!flag) {//该类数据尚未存入已有数据表
    //           this.datalist.push(data0[j]);
    //         }
    //       }
    //       this.loading = false;
    //     }
    //   }
    //   this.loading = false;
    // },
    // 查询当前模型数据集目录类别信息及完成设置选定目录信息
    // async getCodeList(flag) {
    //   if (!this.modelInfo1?.id||!this.modelInfo1?.dataList) return false
    //   //调用import的axios函数，传输模型id，通过后端接口获取数据集code选择列表
    //   let params = this.modelInfo1.id;
    //   params = params + "?dlId="+this.modelInfo1.dataList;
    //   const res = await getCodeList(params);//输入模型和数据集，返回codelist选中项
    //   console.log("getCodeList res 6666666666: ", res);
    //   const { data = [], code, msg } = res
    //   if (code === 0) {
    //     this.$store.commit('setModelInfoRecord', res.data);
    //     console.log("after setModelInfoRecord: ", this.$store.state.model.modelInfoRecord)
    //   }
    // },
    // 查询当前模型数据集目录类别信息及完成设置选定目录信息
    async getCodeList(modelInfo) {
      console.log("modelInfo校验： ", modelInfo)
      if (!modelInfo?.id || !modelInfo.dataList) return false
      //调用import的axios函数，传输模型id，通过后端接口获取数据集code选择列表
      let params = modelInfo.id;
      params = params + "?dlId=" + modelInfo.dataList;
      const res = await getCodeList(params);//输入模型和数据集，返回codelist选中项
      const { data = [], code, msg } = res
      console.log("检查getCodeList： ", res);
      if (code === 0) {
        console.log("getCodeList res+++++: ", res)
        this.$store.commit('setModelInfoRecord', {...res.data, ...modelInfo});
        console.log("after setModelInfoRecord: 检查", this.$store.state.model.modelInfoRecord)
      }
    },
    // 手动停止tensorboard服务
    stopTBServe() {
      // if(!this.isSdkAlgorithm) return
      // 由于index中路由守卫中，都会清除reset state，组件都是在路由变更之后卸载。生命周期hook中拿不到modelid，所以借用sessionStorage来暂存
      const model_id_for_tensorboard = sessionStorage.getItem('model_id_for_tensorboard')
      model_id_for_tensorboard && stopTensorboardServe(model_id_for_tensorboard)    //手动停止tenserboard服务
      sessionStorage.removeItem('model_id_for_tensorboard')
    }
  },
  beforeDestroy() {
    this.stopTBServe()
  },
  deactivated() {
    this.stopTBServe()
  },
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
.mask {
  position: absolute;
  width: 100%;
  height: 100%;
  top:0;
  left:0;
  background-color: rgba(255, 255, 255, .8);
}
.modelLog {
  height: 100%;
  overflow: auto;
}
.btnStep {
  width: @nextStepWidth;
  height: @nextStepHeight;
  color: @nextStepColor;
  background-color: @nextStepBgc;
  border-radius: @borderRadiusSmall;
}
/deep/ .ant-table-wrapper .ant-table-thead > tr:first-child > th:last-child {
  border-top-right-radius: 0!important;
}

/deep/ .ant-table-header {
  background-color: transparent;
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
