<template>
  <step-layout element-loading-spinner="el-icon-loading" element-loading-text="数据保存中..." element-loading-background="rgba(0, 0, 0, 0.2)" v-loading="fullscreenLoading">
    <template slot="left">
      <div class="search">
        <a-input-group compact>
          <a-select
            class="select"
            v-model="algorithmType"
            @change="hanldeChangeCondition"
            size="small"
            style="width: 25%"
          >
            <a-select-option value="">全部</a-select-option>
            <a-select-option :value="item.nodeName" v-for="item in algorithmTypeList" :key="item.id">{{ item.nodeName }}</a-select-option>
          </a-select>
          <a-select
            class="select"
            v-model="supportDistTraining"
            @change="hanldeChangeCondition"
            size="small"
            style="width: 25%"
          >
            <a-select-option value="">全部</a-select-option>
            <a-select-option :value="1">分布式</a-select-option>
            <a-select-option :value="0">非分布式</a-select-option>
          </a-select>
          <a-input-search
            placeholder="请输入算法名称"
            style="width: 40%;"
            @search="onSearch"
            @change="onSearchChange"
          />
          <!-- <a-radio-group v-model="value">
            <a-radio style="display:block;" :value="1" size="small">分布式</a-radio>
            <a-radio style="display:block;" :value="2" size="small">非分布式</a-radio>
          </a-radio-group> -->
        </a-input-group>
        <span>
            未找到合适算法？<a @click="handleToImageManage" href="javascript:;" style="color: #00f">新建算法</a>
        </span>
      </div>
      <div class="algorithm-list scrollbar"
           :infinite-scroll-disabled="isBottom || loading"
           v-infinite-scroll="loadBottom"
           element-loading-text="拼命加载中"
           element-loading-spinner="el-icon-loading"
           element-loading-background="rgba(0, 0, 0, 0.1)"
           v-loading="loading && currentPage == 1" >
           <!-- 1、启动(训练中)  2、正常终止 3、异常终止 4、手动终止 都不可以修改已选的算法-->
        <CardAL :data="item"
                v-for="(item) in data"
                :key="item.id"
                class="card"
                :cardStyle="true"
                @change="showDataDetail"
                :isActive="getActive(item)"
                :radioVisible="true"
                :disabledCheck="[1,2,3,4].includes(modelInfoRecord.taskStatus)"
                :moreOption="false"/>
        <el-empty :image-size="200" v-if="!loading && data.length === 0"></el-empty>
        <p style="text-align: center; line-height: 16px; color: #00f;" v-if="loading && currentPage !== 1">加载中...</p>
        <p style="text-align: center;" v-if="isBottom && data.length !== 0">没有更多了</p>
      </div>
    </template>
    <template slot="right">
      <div class="right-content">
        <div v-if="infoVisible" class="algorithm-info">
          <p>算法名称：<span>{{ algorithmInfo.imageName }}</span></p>
          <p>算法描述：<span>{{ algorithmInfo.imagesDescribe }}</span></p>
          <p>算法创建者：<span>{{ algorithmInfo.createBy }}</span></p>
          <p>算法创建时间：<span>{{ formatTimestamp(algorithmInfo.createTime) }}</span></p>
          <p>算法更新时间：<span>{{ formatTimestamp(algorithmInfo.updateTime) }}</span></p>
          <p>算法标签类型：<span>{{ algorithmInfo.tagType }}</span></p>
        </div>
        <div v-if="infoVisible" class="image-info">
          <img :src="algorithmInfo.imgUrl" alt="" class="img-info">
        </div>
      </div>
    </template>
    <template slot="bottom">
      <a-button type="primary" @click="nextStep" class="btnStep">下一步</a-button>
      <a-button style="margin-left: 10px;" @click="cancel" class="btnStep">取消</a-button>
    </template>
  </step-layout>
</template>

<script>
import StepLayout from '@/components/StepLayout'
import tree from "@/components/tree"
import { getImageManageList,
  imageVersion,
  getImageManageById,
} from '@/api/imageManage'
import {mapMutations, mapState} from 'vuex'
import { mixinHeader } from "@/utils/mixin"
import debounce from 'lodash.debounce'
import { getParams } from '@/utils/util'
import { formatTimestamp } from '@/utils/utils'
import {
  getModelTableList,
  getModelInfoById,
  getModelDLtByDLId,
  stopModelTrain,
  getCodeData,
  getCodeList, createModel,
} from "@/api/modelManage"//利用axios从后端获取模型数据
import { getTargetType } from "@/api/dataCenter"

export default {
  name: 'Step1',
  mixins: [mixinHeader],
  components: {
    StepLayout,
    tree,
    CardAL: () => ({ component: import('@/components/CardAL/index')}),
  },
  data () {
    return {
      loading: false,
      fullscreenLoading:false,
      data: [],
      expandedRowKeys: [],
      // tabActiveKey: "1",
      total: 0,
      algorithmInfo: {
        imageName: "",
        imagesDescribe: "",
        tagType: "",
        createBy: "",
        createTime: 0,
        updateTime: 0,
      },
      infoVisible: false,
      pageSize: 1,
      currentPage: 1,
      // modelInfo: {}, // 保存模型信息，根据模型状态判断是否显示历史数据
      search: '', // 搜索内容
      algorithmType: "", // 算法类型
      supportDistTraining: "" , //算法是否支持分布式训练
      algorithmTypeList: [],    //算法分类列表
    }
  },
  props: {
    active: {
      default: false,
      type: Boolean
    }
  },
  computed: {
    ...mapState({
        // imagesId: state => state.model.step.imagesId,
        // step1ImageType: state => state.model.step.step1ImageType,
        modelInfoRecord: state => state.model.modelInfoRecord,
        // step: state => state.model.step,
        // modelInfo: state => state.model.modelInfoRecord,
    }),
    isBottom () {
      return this.data.length >= this.total
    },
    modelId() {
      return this.$route.query.id
    }
  },
  watch: {
  },
  async activated() {
    // await this.getDataList({ isFirst: true })
    // // 获取当前模型的信息，并保存到model的state中，用于其他步骤的组件渲染信息, pageSize: 999999暂时这样设置，后续要改
    // await this.getModelList({ modelType: this.$route.query.modelType, isFirst: true, pageSize: 999999, pageIndex: 1 })
  },
  async mounted() {
    console.log("Step1 activated!!!!!!")
    // this.modelInfo = this.modelInfoRecord
    // 获取算法列表数据
    await this.getDataList({ isFirst: true, pageSize: 10, pageIndex: 1, tagType: this.algorithmType })
    // 获取当前模型的信息，并保存到model的state中，用于其他步骤的组件渲染信息, pageSize: 999999暂时这样设置，后续要改
    // await this.getModelList({ modelType: this.$route.query.modelType, isFirst: true, pageSize: 999999, pageIndex: 1 })

    // if(this.modelInfo === null) {
    //   await this.getModelInfoById(this.modelId)
    // }
    console.log("全面信息this.modelInfoRecord: ", this.modelInfoRecord)
    // console.log("全面信息this.modelInfo: ", this.modelInfo, this.modelInfo?.taskStatus)
    // if(this.modelInfo?.taskStatus === 0) { // 新建模型但是还未配置信息时
    //   console.log("新建模型但是还未配置信息时 this.modelInfo: ", this.modelInfo)
    //   // 获取模型名称、模型保存路径、模型描述
    //   const info = JSON.parse(localStorage.getItem("info"))
    //   const modelInfoForm = {
    //     modelName: this.modelInfoRecord.modelName,
    //     storedDirName: this.modelInfoRecord.storedDirName || info.storedDirName,
    //     modelDescription: this.modelInfoRecord.modelDescription,
    //     storedDirId: this.modelInfoRecord.storedDirId || info.storedDirId,
    //     modelId: this.modelInfoRecord.id
    //   }
    //   localStorage.setItem("info", JSON.stringify(this.modelInfoRecord))
    //   if(this.modelInfo?.imageId) {
    //     this.$store.commit('setimagesId', this.modelInfo.imageId)
    //     const res = await this.getAlgorithm(this.modelInfo.imageId)
    //     this.data.unshift(res);
    //     this.removeDuplicates();
    //     this.algorithmInfo.imageName = this.data[0].imageName;
    //     this.algorithmInfo.imagesDescribe = this.data[0].imagesDescribe;
    //     this.algorithmInfo.tagType = this.data[0].tagType;
    //     this.algorithmInfo.createBy = this.data[0].createBy;
    //     this.algorithmInfo.createTime = this.data[0].createTime;
    //     this.algorithmInfo.updateTime = this.data[0].updateTime;
    //     this.algorithmInfo.imgUrl = this.getImage(this.data[0])
    //     this.infoVisible = true;
    //   }
    // }
    //
    // if(this.modelInfo?.taskStatus > 0) {
    //   this.$store.commit('setimagesId', this.modelInfo.imageId)
      // const modelInfoForm = {
      //   modelName: this.modelInfo.modelName,
      //   storedDirName: this.modelInfo.storedDirName,
      //   modelDescription: this.modelInfo.modelDescription,
      //   storedDirId: this.modelInfo.storedDirId,
      //   modelId: this.modelInfo.id
      // }
      // localStorage.setItem("info", JSON.stringify(this.modelInfo))
      const res = await this.getAlgorithm(this.modelInfoRecord.imageId)
      if(res != null) {
        this.data.unshift(res);
        this.removeDuplicates();
        this.algorithmInfo.imageName = this.data[0].imageName;
        this.algorithmInfo.imagesDescribe = this.data[0].imagesDescribe;
        this.algorithmInfo.tagType = this.data[0].tagType;
        this.algorithmInfo.createBy = this.data[0].createBy;
        this.algorithmInfo.createTime = this.data[0].createTime;
        this.algorithmInfo.updateTime = this.data[0].updateTime;
        this.algorithmInfo.imgUrl = this.getImage(this.data[0])
        this.infoVisible = true;
      }
    // }
    getTargetType().then(res => {
      this.algorithmTypeList = res.data || []
    })
    this.loading = false;
  },
  methods: {
    ...mapMutations(['resetState']),
    formatTimestamp,
    async getModelList(param) {
      const params = getParams(param, this, "model")
      await this.getList(params)//调用方法读取列表内容
      // this.setTimer(this.getList, params, 2 * 60 * 1000)
    },
    // 请求获取模型列表
    async getList(params) {
      params.modelType = this.$route.query.modelType // 模型类型，默认为通用模型，所以设置为1；
      this.loading = true//默认loading为true，显示加载中动效
      const res = await getModelTableList(params)//使用import的函数调用axios方法，从后端接口读取数据
      //对象属性解构，把res中的属性拆成records、code、msg，这里面records为原对象属性data的别名
      const { data: { records = [] } = {}, code, msg } = res
      if (code === 0) {//校验码，0表示成功
        //如果可以正确获取数据，则把loading设置为false
        // this.loading = false
        this.modelInfo = records.filter(item => item.id == this.modelId ); // 返回的是数组
        this.modelInfo = this.modelInfo[0] // 获取第一个对象
        this.modelInfo.modelSchedule = this.modelInfo.taskStatus === 2? 100 : this.modelInfo.modelSchedule;
        this.$store.commit('setModelInfoRecord', this.modelInfo);
      }else {
        this.loading = false
      }
      console.log("this.modelInfo++++++++: ", this.modelInfo)
    },
    // 将算法参数形式化的表示
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
    // 查询基本信息
    async getModelInfoById (id) {
      // this.loading = true;//先设置加载中动效，载入数据后取消此动效
      //调用api获取模型数据集信息并赋值给modelInfo
      const data = await getModelInfoById(id)
      if (data.code === 0) {//成功返回code为0
        const modelInfo = data?.data
        // 参数格式化
        // if (modelInfo?.algorithmParam) {
        //   modelInfo.algorithmParam = await this.getActiveParams(modelInfo.algorithmParam);
        // }

        this.modelInfo = {...this.modelInfo, ...modelInfo}
        console.log("this.modelInfo++++++++++xxxxxx:根据ID获取模型信息 ", modelInfo);
        this.modelInfo.modelSchedule = this.modelInfo.taskStatus === 2? 100 : this.modelInfo.modelSchedule;
        this.$store.commit('setModelInfoRecord', this.modelInfo);
        if (this.modelInfo.algorithmParam) {
          this.$store.commit('setStep3AlgorithmParam', this.modelInfo.algorithmParam)
        }
        // if(this.modelInfoRecord.taskStatus !== 0)
        //   await this.getCodeList(modelInfo);
      }
    },
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
    async loadBottom() {
      await this.getDataList({
        pageSize: 10,
        pageIndex: this.pageSize + 1,
        tagType: this.algorithmType,
        // type: "bottom"
        supportDistTraining: this.supportDistTraining
      })
    },
    removeDuplicates() {
      this.data =  this.data.filter((item, index, self) => {
        // 使用findIndex方法查找当前元素在之前的数组中是否存在
        const foundIndex = self.findIndex(
            el => el.id === item.id
        );
        // 只保留第一个出现的相同元素，去掉后续的重复元素
        return foundIndex === index;
      });
    },
    async getAlgorithm(id) {
      const response = await getImageManageById(id)
      if (response.code === 0 && response.data != null) {
        this.$store.commit('setbusinessParam', response.data.businessParam)
        this.$store.commit('setStep3AlgorithmParam', response.data.algorithmParam)
        this.modelInfoRecord.businessParam = response.data.businessParam;
        this.modelInfoRecord.algorithmParam = response.data.algorithmParam;
        return response.data
      }
      return null
    },
    // 修改算法分类时触发
    hanldeChangeCondition(){
      this.getDataList({
        pageSize: 10,
        pageIndex: 1,
        tagType: this.algorithmType,
        supportDistTraining: this.supportDistTraining
      })
    },
    async getDataList (param) {
      this.loading = true
      const params = {
        ...getParams(param, this, "mirror"),
        imageStatus: 1,
        // 增加模型管理菜单（那里有另外一种导入模型的方式,被动引入了算法入库），数据库增加了addType字段以区分，这里固定set 0
        addType: 0,
        tagType: this.algorithmType,
        imageName: this.search || ""
        // sourceVersionId: this.modelInfo ? this.modelInfo.imageSourceVersionId : ''
      }
      // console.log("getDataList params: ", params)
      try {
      this.pageSize = params.pageNo
      const responseData = await getImageManageList(params)
      this.loading = false
      // console.log("algorithm responseData: +++++", responseData)
      if (responseData.code === 0) {
        
        const tempData = responseData.data.records.map(item => {
          item.children = item.versionCounts > 1 ? [] : undefined
          return item
        })
        // this.data = []
        if (this.pageSize !== 1) {
          this.data = [...this.data, ...tempData]
        } else {
          this.data = tempData//设置数据集列表的内容
        }
        // if (this.modelInfo && this.modelInfo.imagesId === this.modelInfo.imageSourceVersionId) {
        // this.$store.commit('setimagesId', this.modelInfo.imagesId)
        this.$store.commit('setStep1ImageItem', {
            ...this.data[0],
            algorithmParam: this.modelInfoRecord.algorithmParam,
            businessParam: this.modelInfoRecord.businessParam
          })
        // }

        this.total = responseData.data.total
        this.removeDuplicates();
        // this.loading = false
      }
    }catch{
      this.loading = false
    }
    },

    handleToImageManage () {
      this.$router.push("/train/mirror")
    },
    // 这里应该是把选择的算法信息更新到store
    onChange(selectedRowKeys, selectedRows) {
      // console.log("selectedRowKeys:+++ ", selectedRowKeys)
      // console.log("selectedRows:+++ ", selectedRows)
      this.$store.commit('setpreParam', {
        needPreTrainModel: 0,
        selectedType: [],
        algorithmParam: '',
        splitRatio: 20,
        tagType: selectedRows.tagType,
        businessParam: '',
        verifyWay: 1,
        verifyIds: ''
      })
      // this.$store.commit('setimagesId', selectedRowKeys)
      // this.$store.commit('setStep1ImageItem', selectedRows)

      this.modelInfoRecord.imageId = selectedRowKeys;
      this.modelInfoRecord.businessParam = selectedRows.businessParam;
      this.modelInfoRecord.algorithmParam = selectedRows.algorithmParam;
      this.modelInfoRecord.tagType = selectedRows.tagType;
      // console.log("设置了selectedRowKeys： ", this.$store.state.model.step.imagesId)
      // console.log("设置了step1ImageItem： ", this.$store.state.model.step.step1ImageItem)

      // 如果算法改变了，也需要置空下一步保存的图像训练集
      // this.$store.commit('setdlId', [])
      // this.$store.commit('setdlItem', [])
      // this.$store.commit('setSelectedType', []);
    },
    // 保存选中的算法
    async saveAlgorithm(imageIsChanged) {
      // const info = JSON.parse(localStorage.getItem("info"))
      // console.log("info: ++++++++++", info)
      const info = this.modelInfoRecord;
      const params = {
        modelType: '1', // modelType暂时写为1，因为通用模型采用这种方式新建模型
        modelId: info.id,
        imagesId: info.imageId,
        modelName: info.modelName,
        modelDescription: info.modelDescription,
        storedDirName: info.storedDirName,
        storedDirId: info.storedDirId,
        isPublish: -2,
        tagType: info.tagType,
        algorithmParam: info.algorithmParam,
        businessParam: info.businessParam,
        // taskStatus: 0
      };
      if(imageIsChanged) {
        params.dlId = "";  //清空选择的数据集id
        params.selectedType = "";  //清空选择的数据集label列表
      }
      const res = await createModel(params);
    },
    async nextStep () {
      if (this.modelInfoRecord && this.modelInfoRecord.algorithmParam) {
        try{
          this.fullscreenLoading = true
          // 判断算法是否做了修改，修改了的话需要清除createModel接口中保存的在step2才选的数据集相关信息
          const imageIsChanged = this.modelInfoRecord.imageId !== this.$store.state.model?.step?.imagesId
          console.log('是否修改了算法？', imageIsChanged)
          // 如果算法改变了，也需要置空下一步保存的图像训练集
          if(imageIsChanged) {
            this.$store.commit('setdlId', [])
            this.$store.commit('setdlItem', [])
            this.$store.commit('setSelectedType', []);
          }
          // imageid更新到store  fix bug： 重选算法，算法参数ui无变化问题（详见trainParamSet activated中的逻辑，此处必须更新）
          this.$store.commit('setimagesId', this.modelInfoRecord.imageId)
        // 保存选中的算法
        await this.saveAlgorithm(imageIsChanged);
        await this.getModelInfoById(this.modelId)
        this.fullscreenLoading = false
        this.$emit('nextStep')
        }catch{
          this.fullscreenLoading = false
        }
      } else {
        this.$message.error('请选择算法')
      }
    },
    cancel () {
      this.$emit('cancel')
    },
    onSearchChange:
      debounce(function (e) {
      this.search = e.target.value
      this.getDataList({ 
        pageSize: 10, 
        pageIndex: 1,
        tagType: this.algorithmType,
        supportDistTraining: this.supportDistTraining 
      })
    }, 300),
    onSearch:
      debounce(function (value) {
      this.search = value
      this.getDataList({ 
        pageSize: 10, 
        pageIndex: 1 ,
        tagType: this.algorithmType,
        supportDistTraining: this.supportDistTraining 
      })
    }, 300),
    // 1、启动(训练中)  2、正常终止 3、异常终止 4、手动终止 都不可以修改已选的算法-
    showDataDetail(item) {
      if(![1,2,3,4].includes(this.modelInfoRecord.taskStatus)) {
        this.onChange(item.id, item);
        this.algorithmInfo.imageName = item.imageName;
        this.algorithmInfo.imagesDescribe = item.imagesDescribe;
        this.algorithmInfo.tagType = item.tagType;
        this.algorithmInfo.createBy = item.createBy;
        this.algorithmInfo.createTime = item.createTime;
        this.algorithmInfo.updateTime = item.updateTime;
        this.algorithmInfo.imgUrl = this.getImage(item)
        this.infoVisible = true;
      }else{
        this.$message.error('当前阶段不可修改算法')
      }
    },
    getImage(item) {
      if (item.tagType == '分类') {
        return require('@/assets/images/p7.png')
      }
      if (item.tagType == '目标检测') {
        return require('@/assets/images/p6.png')
      }
      return require('@/assets/images/p8.png')
    },
    getActive(item) {
      if(item.id === this.modelInfoRecord.imageId)
        return true;
      return false;
    }
  },
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
.btnStep {
  width: @nextStepWidth;
  height: @nextStepHeight;
  color: @nextStepColor;
  background-color: @nextStepBgc;
  border-radius: @borderRadiusSmall;
}
.search {
  display: flex;
  // justify-content: space-between;
  // align-items: center;
}
.card {
  margin: 0 auto 10px!important;
}
.algorithm-list {
  width: 100%;
  margin-top: 20px;
  overflow-y: auto;
  height: calc(100% - 65px);
}
.select-style{
  width: 100%;
}
.right-content{
  //height: 100%;
  overflow-y: auto;
  padding: 20px 20px 0;
  color: @paneTextColor;
  align-items: center;
  display: flex;
  .algorithm-info {
    flex: 3;
    p {
      font-weight: 700;
      font-size: @paneFontSize;
      span {
        font-weight: 400;
      }
    }
  }
  .image-info {
    flex: 1;
    img {
      width: 100%;
    }
  }
}
/deep/ .splitter-pane.vertical.splitter-paneR{
  min-height: 100%;
  height: auto;
  border-left: 1px solid rgba(0,0,0,0.2);
}
/deep/ .vue-splitter-container{
  min-height: calc(100vh - 225px);
}
/deep/ .bottom{
  padding-top: 10px;
}
/deep/  .ant-select-selection{
  height: 32px;
  line-height: 32px;
  border-radius: 10%;
}
/deep/  .search .ant-select-selection .ant-select-selection__rendered{
  height: 32px;
  line-height: 32px;
}
</style>
