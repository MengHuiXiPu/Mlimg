<template>
  <step-layout style="position: relative;">
    <template slot="left">
      <div v-if="confirmLoading" class="mask" ></div>
      <a-spin :spinning="confirmLoading" :indicator="indicator" style="position:absolute;top: 50%;left: 50%;">
      </a-spin>
      <div class="left-content">
        <div class="search">
          <a-input-group compact>
            <dict-select-tree  @change="handleDictChange" allowClear ref="dictSelectTree" width="40%" size="default"></dict-select-tree>
            <a-input-search placeholder="请输入数据集名称"  style="width: 45%"  @change="onSearchChange"  @search="onSearch" />
          </a-input-group>
          <span>未找到合适数据集？<a @click="handleToImageManage" href="javascript:;" style="color: #00f">新建数据集</a></span>
        </div>
        <div
            class="dataset-list scrollbar"
            :infinite-scroll-disabled="isBottom || loading"
            v-infinite-scroll="loadBottom"
            element-loading-text="拼命加载中"
            element-loading-spinner="el-icon-loading"
            element-loading-background="rgba(0, 0, 0, 0.2)"
            :infinite-scroll-distance="50"
            v-loading="loading && currentPage == 1">
          <Card
              :data="item"
              :index="index"
              v-for="(item, index) in tableData"
              :key="item.id"
              class="card"
              :isSelect="true"
              :card-style="true"
              :moreOption="false"
              :disabled="modelInfoRecord.taskStatus === 1"
              @toSingleDataDetail="handleSelected" />
          <el-empty :image-size="200" v-if="!loading && tableData.length === 0"></el-empty>
          <p style="text-align: center; line-height: 30px;height: 30px;" v-if="loading"><i class="el-icon-loading"/>&nbsp;加载中...</p>
          <p style="text-align: center;" v-if="isBottom && tableData.length !== 0">没有更多了</p>
          <!-- 底部占位，可以让用户看到加载中 -->
          <div style="height: 20px;"></div>
        </div>
      </div>
    </template>
    <template slot="right">
        <div class="right-content">
          <!-- 供查看已选数据集信息的切换按钮 -->
          <div class="btn-tabs" style="margin: -10px 0 10px 0;">
            <a-button :type="currentDatasetDetail.id ? 'text':'primary'" @click="currentDatasetDetail = {}" v-show="dlItem && dlItem.length">汇总信息</a-button>
            <a-button :type="currentDatasetDetail.id  == item.id ? 'primary': 'text'" v-for="(item, index) in dlItem" :key="item.id" @click="showDatasetDetail(item, index)">{{ item.dlName }}</a-button>
          </div>
          <div class="summary-info-wrap" v-show="!currentDatasetDetail.id">
            <DatasetLabelSelect ref="labelSelect" />
          </div>
          <div class="dataset-detail-wrap" v-show="currentDatasetDetail.id">
            <div class="dataset-info" v-if="dlItem.length">
              <div class="content">
                <a-card :bordered="false" class="detailTitle basic-card">
                  <a-descriptions :column="{ xs: 1, sm: 2, md: 3}" size="small" :title="currentDatasetDetail.dlName" class="detailTitle">
                    <a-descriptions-item label="创建用户">{{ currentDatasetDetail.createBy }}</a-descriptions-item>
                    <a-descriptions-item label="创建时间">{{ currentDatasetDetail.createTime | moment }}</a-descriptions-item>
                    <a-descriptions-item label="修改用户">{{ currentDatasetDetail.updateBy }}</a-descriptions-item>
                    <a-descriptions-item label="修改时间">{{ currentDatasetDetail.updateTime | moment }}</a-descriptions-item>
                    <a-descriptions-item label="数据集目录">{{ currentDatasetDetail.storedDirName }}</a-descriptions-item>
                    <a-descriptions-item label="备注信息">{{ currentDatasetDetail.dlDescribe }}</a-descriptions-item>
                    <a-descriptions-item>
                        <span slot="label" :style="{color: isNotClassify(currentDatasetDetail.dlTagType) ? '' : '#ccc'}">
                            标注格式
                        </span>
                        <span :style="{color: isNotClassify(currentDatasetDetail.dlTagType) ? '' : '#ccc'}">
                          {{ isNotClassify(currentDatasetDetail.dlTagType) ? (currentDatasetDetail.markFileType === 1 ? 'JSON' : 'XML') : '无' }}
                        </span>
                    </a-descriptions-item>
                  </a-descriptions>
                </a-card>
              </div>
              <div class="content">
                <a-card :bordered="false" class="basic-card">
                  <a-descriptions :column="{ xs: 1, sm: 2, md: 3}" size="small" title="样本信息">
                    <a-descriptions-item label="样本数">{{ detailSampleData.sampleNum }}</a-descriptions-item>
                    <a-descriptions-item label="类别数">{{ detailSampleData.categoryNum }}</a-descriptions-item>
                    <a-descriptions-item>
                      <span slot="label" :style="{color: isNotClassify(currentDatasetDetail.dlTagType) ? '' : '#ccc'}">
                        智能标注
                      </span>
                      <span :style="{color: isNotClassify(currentDatasetDetail.dlTagType) ? '' : '#ccc'}">{{ false }}</span>
                    </a-descriptions-item>
                    <a-descriptions-item>
                      <span slot="label" :style="{color: isNotClassify(currentDatasetDetail.dlTagType) ? '' : '#ccc'}">已标注</span>
                      <span :style="{color: isNotClassify(currentDatasetDetail.dlTagType) ? '' : '#ccc'}">{{ detailSampleData.markNum }}</span>
                    </a-descriptions-item>
                    <a-descriptions-item>
                      <span slot="label" :style="{color: isNotClassify(currentDatasetDetail.dlTagType) ? '' : '#ccc'}">标注比例</span>
                      <span :style="{color: isNotClassify(currentDatasetDetail.dlTagType) ? '' : '#ccc'}">{{ tagRate }}</span>
                    </a-descriptions-item>
                  </a-descriptions>
                </a-card>
              </div>
            </div>
            <!-- 数据集样本详情 -->
            <sampleDetail :detailData="currentDatasetDetail" :currentID="currentDatasetDetail.id"  readOnly v-if="currentDatasetDetail.id" :key="currentDatasetDetail.id"/>
          </div>
        </div>
        <!-- 数据集详情dialog方式展示 -->
        <!-- <a-modal :title="`${currentDatasetDetail.dlName}样本详情`" v-model="showDatasetDetailDialog" :footer="null" width="90%" :dialog-style="{ top: '3vh' }">
          <sampleDetail :detailData="currentDatasetDetail" :currentID="currentDatasetDetail.id" v-if="showDatasetDetailDialog" readOnly/>
        </a-modal> -->
    </template>
    <template slot="bottom">
      <a-button @click="prevStep" style="margin-left: 10px" class="btnStep">上一步</a-button>
      <a-button type="primary" @click="nextStep" style="margin-left: 10px;" class="btnStep">下一步</a-button>
      <a-button style="margin-left: 10px;" @click="cancel" class="btnStep">取消</a-button>
    </template>
  </step-layout>
</template>

<script>
import StepLayout from '@/components/StepLayout'
import tree from "@/components/tree"
import {getDataSetList, getPictureIdPageList, getTargetType} from "@/api/dataCenter"
import {mapMutations, mapState} from 'vuex'
import { mixinHeader } from "@/utils/mixin"
import { getParams, formatTime } from '@/utils/util'
import debounce from 'lodash.debounce'
import Card from '@/components/Card/index.vue'
import DatasetLabelSelect from "./components/DatasetLabelSelect";
import {createModel, getFileCategoryAndCount} from "@/api/modelManage";
import * as modelApi from "@/api/modelManage";
import {
  getSingleDataListDetailById,
  getSingleDataListSampleDetailById//单个数据集样本详情
} from "@/api/dataCenter"
import dictSelectTree from "@/components/business/dictSelectTree/index.vue"
import sampleDetail from '@/views/dataCenter/dataMrg/components/sampleDetail.vue'
import cloneDeep from "lodash/cloneDeep";

export default {
  name: "Step2",
  mixins: [mixinHeader],
  components: {
    DatasetLabelSelect,
    StepLayout,
    tree,
    dictSelectTree,
    sampleDetail,
    Card
  },
  data () {
    return {
      indicator: <a-icon type="loading" style="font-size: 32px" spin />,
      confirmLoading: false, // 回显时加载
      tableData: [],
      dlTagTypeOpt: [],
      loading: false,
      total: 0,
      search: "",
      infoVisible: false, // 是否显示数据集详细信息
      selectedRowKeys: [],
      selectedRows: [],
      currentPage: 1,
      splitRatio: 20,
      pageSize: 1,
      recordImageID: '', // 记录选中的算法ID
      queryDictObj: {},  //检索目录对象
      // showDatasetDetailDialog: false,  //展示数据集详情dialog
      currentDatasetDetail: {} ,  //点击要查看的数据集详情，将详情给到sampleDetail.vue，查看样本详情,
      detailSampleData: {}, // 数据集详情标注数据
    }
  },
  computed: {
    ...mapState({
      dlId: state => state.model.step.dlId,
      // imagesId: state => state.model.step.imagesId,
      // step1ImageItem: state => state.model.step.step1ImageItem,
      dlItem: state => state.model.step.dlItem,
      step: state => state.model.step,
      modelInfoRecord: state => state.model.modelInfoRecord,
      // currentModel: state => state.model.currentModel,
      tagRate: function () { // 计算标注比例
      if(Object.keys(this.detailSampleData).length > 0 && this.detailSampleData.markNum && this.detailSampleData.sampleNum) 
        return Math.floor((this.detailSampleData.markNum) / (this.detailSampleData.sampleNum) * 10000) / 100 + '%'
      else return '--'
    }
    }),
    datasetInfo () {
      let datasetInfo = {
        dlName: "",
        createBy: "",
        createTime: "",
        updateTime: "",
        dlTagType: "",
        dlRealDir: "",
        imgUrl: "",
        cover: ""
      }
      if (this.dlItem && this.dlItem.length) {
        let num = this.dlItem.length - 1
        let item = this.dlItem[num]
        datasetInfo.dlName = item.dlName;
        datasetInfo.createBy = item.createBy;
        datasetInfo.createTime = item.createTime;
        datasetInfo.updateTime = item.updateTime;
        datasetInfo.dlTagType = item.dlTagType;
        datasetInfo.dlRealDir = item.dlRealDir;
        datasetInfo.cover = item.cover;
      }
      return datasetInfo
    },
    isBottom () {
      return this.tableData.length >= this.total
    },
    modelId() {
      return this.$route.query.id
    },
    imageSource() {
      if (this.currentDatasetDetail.cover) {
        // 如果 data.cover 存在，添加前缀后返回
        return `data:image/jpeg;base64,${this.currentDatasetDetail.cover}`;
      } else {
        // 如果 data.cover 不存在，使用占位图像
        return require("@/assets/images/place.gif");
      }
    },

  },
  async created () {
    // this.recordImageID = this.imagesId;
    // console.log("Step2 created this.recordImageID", this.recordImageID, "Step2 state.step.dataSouce", this.$store.state.model.step.dataSouce)
    // await this.getTargetTypeData()

    // console.log("Step2 this.step1ImageItem.tagType: ", this.step1ImageItem.tagType, " this.modelInfoRecord.tagType: ", this.modelInfoRecord.tagType);
    // await this.getModelInfoById(this.modelId)
    // console.log("Step2 this.step1ImageItem.tagType: "," this.modelInfoRecord.tagType: ", this.modelInfoRecord.tagType);
    // this.selectedRowKeys = []
    // this.selectedRows = []
    // this.tableData = []
    // await this.getDataList({ isFirst: true, dlTagType: this.modelInfoRecord.tagType, pageSize: 10, pageIndex: 1 })
    // // 设置DatasetLabelSelect组件的回显
    // // if(this.modelInfoRecord?.isPublish > -3) {
    //   this.$nextTick(() => {
    //     if(this.$refs.labelSelect) {
    //       if(this.modelInfoRecord?.isPublish > -3 && this.modelInfoRecord?.preParam) {
    //         console.log("DatasetLabelSelect this.modelInfoRecord: ", this.modelInfoRecord)
    //         this.$refs.labelSelect.form.splitRatio = JSON.parse(this.modelInfoRecord.preParam).split_rate * 100;
    //       }
    //       // if(this.modelInfoRecord.taskStatus > 0) {
    //         console.log("this.modelInfoRecord datasetlabel select数据选择:  ", this.modelInfoRecord)
    //         if(this.modelInfoRecord?.selectedType) {
    //           console.log("this.modelInfoRecord.dataSetDirs: ", this.modelInfoRecord.selectedType)
    //           this.$refs.labelSelect.form.selectedType = this.modelInfoRecord?.selectedType.split(',');
    //         } else {
    //           this.$refs.labelSelect.form.selectedType = this.$store.state.model.step.preParam.selectedType
    //       }
    //     }
    //   })
    // // }
    // this.loading = false
    // console.log("after this.tableData+++: ", this.tableData)
  },

  async activated(){
    // if(this.modelInfoRecord.taskStatus === 1) { // 模型正在训练，不能更改数据集
    //   return ;
    // }
    // console.log('Step2 activated this.imagesId: ', this.modelInfoRecord.imageId, 'this.recordImageID: ', this.recordImageID)
    // // 选择的算法变化了，更新数据集列表
    // if(this.imageId !== this.recordImageID) {
    //   this.recordImageID = this.imageId; // 记录选中的算法
    //   console.log("activated this.recordImageID", this.recordImageID)
    //   // 清空选中的数据集和表格数据
    //   this.tableData = [];
    //   this.resetItem();
    //   this.selectedRowKeys = [] // 更新为空
    //   this.selectedRows = []
    //   this.infoVisible = true
    //   await this.getDataList({ isFirst: true, dlTagType: this.modelInfoRecord.tagType, pageSize: 10, pageIndex: 1 })
    //   // console.log("this.step1ImageItem.tagType: ", this.step1ImageItem.tagType)
    // }
    console.log("Step2 this.step1ImageItem.tagType: "," this.modelInfoRecord.tagType: ", this.modelInfoRecord.tagType);
    this.selectedRowKeys = []
    this.selectedRows = []
    this.tableData = []
    await this.getDataList({ isFirst: true, dlTagType: this.modelInfoRecord.tagType, pageSize: 10, pageIndex: 1 })
    // 设置DatasetLabelSelect组件的回显
    // if(this.modelInfoRecord?.isPublish > -3) {
    this.$nextTick(() => {
      if(this.$refs.labelSelect) {
        if(this.modelInfoRecord?.isPublish > -3 && this.modelInfoRecord?.preParam) {
          console.log("DatasetLabelSelect this.modelInfoRecord: ", this.modelInfoRecord)
          this.$refs.labelSelect.form.splitRatio = JSON.parse(this.modelInfoRecord.preParam).split_rate * 100;
        }
        // if(this.modelInfoRecord.taskStatus > 0) {
        console.log("this.modelInfoRecord datasetlabel select数据选择:  ", this.modelInfoRecord)
        if(this.modelInfoRecord?.selectedType) {
          console.log("this.modelInfoRecord.dataSetDirs: ", this.modelInfoRecord.selectedType)
          this.$refs.labelSelect.form.selectedType = this.modelInfoRecord?.selectedType.split(',');
        } else {
          this.$refs.labelSelect.form.selectedType = this.$store.state.model.step.preParam.selectedType
        }
      }
    })
    // }
    this.loading = false
    console.log("after this.tableData+++: ", this.tableData)
  },
  watch: {
    dlId(value) {
      console.log("dlId value: ", value);
      this.selectedRowKeys = value
    },
    dlItem(value) {
      console.log("dlItem value: ", value);
      this.selectedRows = value
    }
  },
  methods: {
    formatTime,
    ...mapMutations(['resetItem']),
    // 移除某个数据集
    removeDateset(e) {
      console.log("removeDateset: ", e);
    },
    // 判断dataList是否有该id
    checkDataList(id) {
      if(this.modelInfoRecord.dataList) {
        const array = this.modelInfoRecord.dataList && this.modelInfoRecord.dataList.split(',').map(item => parseInt(item));
        if(array && array.indexOf(id) !== -1) {
          return true;
        }else{
          return false;
        }
      }
      if(this.modelInfoRecord.dlId) {
        console.log("this.dlItem: ", this.modelInfoRecord.dlId)
        const array = this.modelInfoRecord.dlId && this.modelInfoRecord.dlId.map(item => parseInt(item));
        if(array && array.indexOf(id) !== -1) {
          return true;
        }else{
          return false;
        }
      }
    },
    // 筛选目录变更
    handleDictChange(dictObj) {
      this.queryDictObj = dictObj;
      this.getDataList({ pageSize: 10, pageIndex: 1 });
    },
    changeSelected(data) {
      // if(this.dlItem?.length >= 5) return this.$message.warning("最多支持选择5个数据集")
      this.selectedRowKeys.push(data.id);
      this.selectedRows.push(data);
      this.$store.commit('setdlId', this.selectedRowKeys)
      this.$store.commit('setdlItem', this.selectedRows)
      let index = this.tableData.findIndex(e => e.id === data.id)
      if(index > -1 && index < this.tableData.length)
        this.tableData[index].isSelected = true;
    },
    removeSelected(data) {
      this.selectedRowKeys = this.selectedRowKeys.filter(key => key !== data.id)
      this.selectedRows = this.selectedRows.filter(row => row.id !== data.id)
      this.$store.commit('setdlId', this.selectedRowKeys);
      this.$store.commit('setdlItem', this.selectedRows);
      let index = this.tableData.findIndex(e => e.id === data.id)
      if(index > -1 && index < this.tableData.length)
        this.tableData[index].isSelected = false;
      // 移除选中的数据集是正在展示样本详情的数据集的话，则清空currentDatasetDetail，将tab重新定位到汇总信息
      if(data?.id == this.currentDatasetDetail?.id) {
        this.currentDatasetDetail = {}
      }
      // 清除preParam和modelInfoRecord中 取消掉勾选的数据集对应的类别信息(fix bug： 取消勾选数据集，但其类别仍然存在在selectedType的问题)  todo...
      // const categoryList = data.categoryList.join(",")  ->使用existMarkCategoryList
      // 用户取消了选中已保存的数据集，如果处在配置映射关系页面，则需要清空重置labeRule
      // if(this.step?.labelMapConfig?.needLabelMap && (this.modelInfoRecord.dataList||"").includes(data.id) && this.modelInfoRecord.needLabelMap) {
      //   this.$store.commit('setLabelMapConfig', {
      //     labelRule: [{
      //       mainLabel: "",
      //       originalLabel: [
      //         // ""
      //       ],
      //       // 表示是全部还是自定义数量, 前端使用，保存时去除
      //       _isAll: true,
      //       limit: -1
      //     }]
      //   })
      // }
    },
    handleChange (value) {
      this.$store.commit('setdlId', value)
      const newdlItem = this.dlItem.filter(item => value.includes(item.id))
      this.$store.commit('setdlItem', newdlItem)
      this.selectedRowKeys = value
      this.selectedRows = newdlItem
      // this.$refs.labelSelect.getCategoryInfo()
    },
    // 处理卡片点击事件
    handleSelected(item) {
      if(this.modelInfoRecord.taskStatus !== 1) { // 正在训练，不允许更改数据集选择
        this.toSingleDataDetail(item);
        if(item.isSelected) {
          this.removeSelected(item)
        }else{
          this.changeSelected(item)
        }
      }else{
        this.$message.error('模型训练阶段不可修改数据')
      }

    },
    // 设置Card是否选中
    selectState(item) {
      for(const i of this.selectedRows) {
        if(i.id === item.id) {
          return true;
        }
      }
      return false;
      // return this.selectedRows.includes(item);
    },

    onSearchChange:
      debounce(async function (e) {
      this.search = e.target.value
      await this.getDataList({ pageSize: 10, pageIndex: 1 })
    }, 300),

    onSearch:
      debounce(async function (value) {
      this.search = value
      await this.getDataList({ pageSize: 10, pageIndex: 1 })
    }, 300),

    removeDuplicates() {
      // const tempDatalistID = this.modelInfoRecord?.dataList?.split(',').map(item => parseInt(item)).filter((item, index, array) => array.indexOf(item) === index);
      // fix-bug: ADCP-1020
      const tempDatalistID = (this.dlId && this.dlId.length) ? this.dlId : this.modelInfoRecord?.dataList?.split(',').map(item => parseInt(item)).filter((item, index, array) => array.indexOf(item) === index);
      if (tempDatalistID && tempDatalistID.length) {
        const tempDatasetDetailInfo = cloneDeep(this.dlItem)
        this.tableData.forEach((item, index) => {
          if (tempDatalistID.includes(item.id)) {
            // this.tableData.splice(index, 1)
            // this.tableData.unshift(item)
            item.isSelected = true;
            if(!tempDatasetDetailInfo.find(data => data.id === item.id)) {
              tempDatasetDetailInfo.push(item)
            }
          }
        })
        this.$store.commit('setdlId', tempDatalistID);
        this.$store.commit('setdlItem', tempDatasetDetailInfo);
        this.selectedRowKeys = tempDatalistID
        this.selectedRows = tempDatasetDetailInfo
        if(tempDatasetDetailInfo.length > 0) {
        let num = tempDatasetDetailInfo.length - 1
        this.toSingleDataDetail(tempDatasetDetailInfo[num]);
      }
      }
    },

    // 根据数据集ID获取数据集详细信息
    async getDataByID (id, selectMenu) {
      // this.loading = true//先设置加载中动效，载入数据后取消此动效
      const res = await getSingleDataListDetailById(id)
      return res.data || []
    },

    async getImageByDataId(id) {
      const response = await getFileCategoryAndCount({
        id: id,
        markRange: 0,
        reviewRange: 0
      })
      // console.log("getFileCategoryAndCount++++: ", response);
      if(response.data.DataListCategory && response.data.DataListCategory.length > 0) {
        const obj = {
          categoryName: response.data.DataListCategory[0],
          id: id,//数据集id
          limit: 10,
          pageNo: 1,
          markRange: 0,
          reviewRange: 0,
        }
        const res = await getPictureIdPageList(obj)
        if (res.code === 0) {
          if (res.data.records.length) {
            const blob = await modelApi.getPicture(res.data.records[0].id)
            const url = window.URL.createObjectURL(blob)
            return url
          }
        }
      }
    },
    async getDataList (param) {//获取数据集列表
        // const params = getParams(param, this, "modelDataMrg");//调用api整理参数
        const params = getParams(param, this, "modelDataMrg");//调用api整理参数
        // 添加筛选目录参数
        // 接口nodeCode。nodeId必须要有值，没值就不能上送这俩字段
        if(!param.isFirst && this.queryDictObj?.nodeCode && this.queryDictObj?.nodeId) {
          params.nodeCode = this.queryDictObj?.nodeCode
          params.nodeId = this.queryDictObj?.nodeId
        }
        // 用户可能多选数据集，后台返回的已选择数据集列表里只有 id，前端会从左侧分页列表里匹配名称等数据集基本信息显示在右侧，这就导致在选中多于 10个时，反显时只会匹配到 第一次分页的 10 条
        // 这里暂时先改成首次加载 30 条，后续训练这里要重构的
        if(param.isFirst) { //
          params.limit = 30
        }else {
          params.limit = 10
        }
        this.pageSize = params.pageNo
        if (this.search.trim()) {
          params.dlName = this.search
        }
        params.dlTagType = this.modelInfoRecord.tagType
        // params.limit = 40
        // 告知后端将已绑定数据集在列表前面返回, 所有情况均携带该ids字段，重复逻辑等后端处理
        if(this.modelInfoRecord.dataList) {
          params.ids = this.modelInfoRecord.dataList
        }
        try{
        this.loading = true;
        const responseData = await getDataSetList(params);//调用api返回可用数据集列表
        this.loading = false;
        
        if (params?.pageNo == 1) {
          // 筛选数据集
          this.tableData = responseData.data.records
          this.tableData = this.tableData.map((item) => {
              return typeof item.isSelected === 'undefined' ? {
                ...item,
                isSelected: false
              } : item
            })
        } else {
          if (responseData.code === 0) {//校验码正确
            (responseData.data?.records|| []).forEach(val => {
              val.isSelected = typeof val.isSelected === 'undefined' ? false : val.isSelected
            })
            this.tableData = this.tableData.concat(responseData.data?.records || [])
          }
        }
        this.total = responseData.data.total; // 设置数据集总数
        this.removeDuplicates()
        }catch{
          this.loading = false
        }
    },
    async loadBottom() {
      await this.getDataList({
        pageSize: 10,
        pageIndex: this.pageSize + 1,
        dlTagType: this.modelInfoRecord.tagType,
        // type: "bottom"
      })
      // this.removeDuplicates();
    },
    handleToImageManage () {
      this.$router.push("/dataCenter/dataMrg/index")
    },
    // 保存选中的数据集
    async saveDataset() {
      const params = {
        modelType: '1', // modelType暂时写为1，因为通用模型采用这种方式新建模型
        modelId: Number(this.modelInfoRecord.id),
        imagesId: this.modelInfoRecord.imagesId,
        modelName: this.modelInfoRecord.modelName,
        modelDescription: this.modelInfoRecord.modelDescription,
        storedDirName: this.modelInfoRecord.storedDirName,
        storedDirId: this.modelInfoRecord.storedDirId,
        isPublish: -1,
        tagType: this.modelInfoRecord.tagType,
        dlId: this.step.dlId.join(','),
        selectedType: this.step.preParam.selectedType.join(',') || this.modelInfoRecord.selectedType || '',
        preParam: JSON.stringify({
          split_rate: this.step.preParam.splitRatio / 100,
          normalization: this.step.preParam.oneness === '1',
        }),
        // 添加label映射配置信息
        ...this.step.labelMapConfig,
        // taskStatus: 0
      };
      console.log("Step2 params: ", params);
      await createModel(params);
      await this.getModelInfoById(this.modelId)
    },
    async nextStep () {//下一步
      const selectedType = this.$store.state.model.step.preParam.selectedType;
      if(this.modelInfoRecord.taskStatus === 1) { // 如果正在训练时，直接跳转到下一步
        this.$emit('nextStep')
        return ;
      }
      if (this.dlId.length > 0 && selectedType.length > 0) {
        // 将选择的数据集信息更新到 modelInfoRecord的dataList
        // fix bug: 改变选中数据集调到下一步再返回时，给后台的选中数据集已更新，但因为前端没有重新请求并更新modelInfoRecord的dataList,导致页面显示的仍是保存之前选中的数据集
        this.$store.commit('setModelInfoRecord', { dataList:  this.dlId.join(",")});
        this.$store.commit('setModelInfoRecord', { selectedType: this.step.preParam.selectedType.join(',')});

        await this.$refs.labelSelect.collectLabelMapData()
        await this.saveDataset()
        this.$emit('nextStep')//触发父组件nextStep事件，切换到下一步的页面
      } else if(this.$store.state.model.step.dlId.length === 0) {
        this.$message.error('请选择数据集')
      }else {
        this.$message.error('请选择预测类别')
      }
    },
    prevStep () {
      this.$emit("prevStep")
    },
    cancel () {
      this.$emit('cancel')
    },
    async toSingleDataDetail(item) { //点击某个数据集在右侧展示信息

      
      this.infoVisible = true;
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
      return _data;
    },
    // 查询基本信息
    async getModelInfoById (id) {
      if (this.$store.state.model.modelInfoRecord.taskStatus) return
      try{
      this.loading = true;//先设置加载中动效，载入数据后取消此动效
      //调用api获取模型数据集信息并赋值给modelInfo
      const data = await modelApi.getModelInfoById(id)
      this.loading = false
      if (data.code === 0) {//成功返回code为0
        const modelInfo = data?.data
        // 参数格式化
        if (modelInfo?.algorithmParam) {
          modelInfo.algorithmParam = this.getActiveParams(modelInfo.algorithmParam);
        }
        this.$store.commit('setModelInfoRecord', modelInfo);
        // const res = await this.getCodeList(modelInfo);
        // const temp = {...modelInfo, ...res.data};
        // this.$store.commit('setModelInfoRecord', temp);
        if (modelInfo.algorithmParam) {
          this.$store.commit('setStep3AlgorithmParam', modelInfo.algorithmParam)
        }
      }
      }catch{
        this.loading = false
      }
    },
    // 查询当前模型数据集目录类别信息及完成设置选定目录信息
    async getCodeList(modelInfo) {
      if (!modelInfo?.id || !modelInfo.dataList) return false
      //调用import的axios函数，传输模型id，通过后端接口获取数据集code选择列表
      let params = modelInfo.id;
      params = params + "?dlId=" + modelInfo.dataList;
      const res = await modelApi.getCodeList(params);//输入模型和数据集，返回codelist选中项
      const { data = [], code, msg } = res
      if (code === 0) {
        console.log("getCodeList res+++++: ", res)
        return res
      }
    },
    // 查看数据集样本详情
    async showDatasetDetail(dataset = {}, index = 0) {
      if(dataset.id == this.currentDatasetDetail.id) return
      const loading = this.$GLoading('数据加载中...')
      getSingleDataListDetailById(dataset.id).then(res => {
        this.currentDatasetDetail = res.data || {};
        this.$set(this.currentDatasetDetail, 'cover', this.dlItem[index]?.cover ?? "")
        getSingleDataListSampleDetailById(dataset.id).then(res => {
          this.detailSampleData = res.data || {};
        }).catch(err => {
          this.$message.error(err.data?.msg || err.data?.message)
        })
      }).finally(() => {
        loading.close()
      });
    },
     // 判断是否是分类数据集/非分类(分割/目标检测)数据集
     isNotClassify(dlTagType) {
      return ["分割", "目标检测"].includes(dlTagType)
    },
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
.btnStep {
  width: @nextStepWidth;
  height: @nextStepHeight;
  color: @nextStepColor;
  background-color: @nextStepBgc;
  border-radius: @borderRadiusSmall;
}
.left-content {
  width: 100%;
  height: 100%;
  //padding-left: 10px;
  //padding-right: 10px;
  .search {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .dataset-list {
    margin-top: 20px;
    width: 100%;
    overflow-y: auto;
    height: 90%;
    .card {
      //width: 80%;
      margin: 0 auto 10px;
    }
  }
}

.right-content {
  height: 100%;
  padding: 0;
  color: @paneTextColor;
  font-size: @paneFontSize;
  .dataset-info {
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    .content{
      margin: 6px 0px;
      padding-bottom: 15px;
    }
    .left {
      flex: 3;
      height: 100%;
      p {
        font-size: @descFontSize;
        font-weight: 700;
        span {
          font-weight: 400;
        }
      }
    }
    .right {
      flex: 2;
      width: 100%;
      height: 80%;
      .el-image {
        width: 100%;
        height: 80%;
        max-height: 240px;
      }
      img {
        width: 100%;
        height: 100%;
      }
    }
  }
  ::v-deep {
    .sample-detail-image{
      height: auto;
    }
    .sample-detail-left{
      height: auto;
    }
    .img-item {
      min-width: 100px;
    }
  }
  
}
.ant-card {
  padding: 12px;
  border-radius: 16px;
}
/deep/ .el-image__inner {
  max-width: 300px;
  max-height: 300px;
}
/deep/ .splitter-pane.vertical.splitter-paneR{
  min-height: 100%;
  height: auto;
  border-left: 1px solid rgba(0,0,0,0.2);
}
/deep/ .vue-splitter-container{
  min-height: calc(100vh - 230px);
}
/deep/ .bottom{
  padding-top: 10px;
}
/deep/ .ant-tag, .ant-tag a, .ant-tag a:hover {
  color: @tagColor;
  background-color: @tagBgc;
  font-size: @descFontSize;
  padding: 8px;
  border-radius: @borderRadiusSmall;
  margin: 4px;
  border: 0;
}
/deep/ .ant-form label {
  font-size: @descFontSize;
  color: @paneTextColor;
}
/deep/ .el-loading-spinner i,
/deep/ .el-loading-spinner .el-loading-text {
  color: @cardALBorderColor!important;
}
</style>
