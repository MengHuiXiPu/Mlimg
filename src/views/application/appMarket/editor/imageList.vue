<template>
  <div class="img-list-wrap">
    <div class="top-area">
      <a-tabs v-model="picListMode" size="small" type="line" @change="handleTabChange">
        <a-tab-pane :key="0" tab="本地上传">
          <div class="btn-wrap">
            <a-upload slot="addonAfter" :showUploadList="false" :before-upload="beforeUpload" accept=".zip">
              <a-button type="primary" size="small" :disabled="processing">导入图片</a-button>
            </a-upload>
            <!-- <a-button type="primary" size="small"><a-icon type="upload"></a-icon>上传图片</a-button> -->
            <a-button type="danger" size="small" @click="deletePicture" :disabled="processing">删除图片</a-button>
          </div>
        </a-tab-pane>
        <a-tab-pane :key="1" tab="系统选择">
          <dataset-select v-model="dlId" width="100%" dlTagType="" @change="toggleDatasets" :disabled="processing"></dataset-select>
        </a-tab-pane>
      </a-tabs>
    </div>
    <!-- v-loading="loading && pagination.pageNo == 1" -->
    <div class="img-list scrollbar" 
      v-infinite-scroll="loadMore" 
      infinite-scroll-distance="0" 
      infinite-scroll-disabled="loadDisabled"
      infinite-scroll-delay="300"
      infinite-scroll-immediate="false"
    >
      <div class="img-box" :class="{ 'focus-style': focusId === item.id }" v-for="item in imageList" :key="item.id">
        <img :id="'pic_' + item.id" :src="_getImageSrc(item)" @click="handleFocus(item)"/>
        <!-- 图片在调试时显示的loading -->
        <a-icon v-if="groupLoading.includes(item.id)" class="load-icon" type="loading"/>
      </div>
      <p v-if="loading" class="text" :style="`margin-top: ${imageList.length ? '10px': '50px'}`"><i class="el-icon-loading"></i>&nbsp;加载中...</p>
      <p v-if="!loading && loadDisabled" class="text">
        <a-empty class="empty-info" :image="simpleImage" :description="imageList.length ? '无更多数据': '暂无数据'"/>
      </p>
    </div>
    
  </div>
</template>

<script>
import { getPicture } from "@/api/modelManage";
import { getPictureIdPageList } from "@/api/dataCenter.js";
// import { ref } from "@vue/composition-api";
import datasetSelect from "@/components/business/datasetSelector/index.vue";
// import { axios } from '@/utils/request';
import { uploadPicZipToConfig, getConfigPicList, getThumbnailByid, deletePictureById, getDebugResByPicId, saveOrUpdateConfig } from "@/api/runtorun.js";
import { useState } from "./hooks/state";
import EventBus from "@/utils/bus.js";
import { Empty } from 'ant-design-vue';
export default {
  name: 'imageList',
  components: {
    datasetSelect,
  },
  data() {
    return {
      dlId: undefined, //选择的数据集id
      focusId: null,  //当前focus图片id
      imageList: [],  //已加载的图片列表
      picListMode: 0,  //0-本地上传，1-数据集， 配置中的datatype/tab页联动
      
      loading: false,   //图片列表加载中loading
      // noMore: false,
      pagination: { //数据集和本地上传都使用该分页，每次切换重置
        limit: 10,    //pageSize
        pageNo: 1,     //pageNo
        total: 0
      },
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
    }
  },
  computed: {
    // 判定不再需要滚动加载的标识变量
    loadDisabled() {
      // return this.imageList.length >= this.pagination.total
      if(!this.pagination.total) return true
      return this.imageList.length && (this.imageList.length >= this.pagination.total)
    },
  },
  methods: {
    /**
     * 切换数据集时，清除已加载图片列表，重新开始加载数据集第一页图片id及缩略图
     * @param {*} val 选中的数据集id， 同this.dlId
     */
    async toggleDatasets(val) {
      // 将数据集信息update
      this.setConfigData('dlId', val)
      this.resetState()
      this.queryDlPicList()
    },
    /**
     * 分页加载更多图片
     */
    loadMore() {
      // console.log('loadMore')
      if(this.loading) return
      this.pagination.pageNo++
      if(this.picListMode === 0) {
        this.queryConfigPicList()
      }else { //加载数据集
        this.queryDlPicList()
      }
    },
    beforeUpload (file) {
      let formdata = new FormData()
      formdata.append('configId', this.configData.id)
      formdata.append('file', file)
      const loading = this.$GLoading(`图片上传解析中...`)
      uploadPicZipToConfig(formdata).then(res => {
        if(res.code == 0) { //因为后台把导入的图片insert到了最前面，所以需要重置分页，加载第一页的图片列表即可
          this.$message.success("导入完成")
          this.resetState()
          // 将当前页图片清空
          this.queryConfigPicList()
          // 调用一次配置保存， 将dataType保存为0， fixBug： 第一次配置，只打入图片不点击保存/调试再进来无图片问题
          const { id, dataType } = this.configData
          saveOrUpdateConfig({
            id,
            dataType: dataType || 0
          })
        }
      }).finally(() => {
        loading.close()
      })
      return false
    },
    handleTabChange(val) {
      // update dataType
      this.setConfigData('dataType', val)
      // reset视图
      this.resetState()
      if(val ===0) {  //查询配置下的图片列表
        this.queryConfigPicList()
      }
      if(val === 1) {
        this.dlId =  this.configData.dlId
        this.queryDlPicList()
      }
    },
    // 查询选中数据集下的图片列表
    async queryDlPicList() {
      if(!this.dlId) return
      this.loading = true
      const { limit, pageNo } = this.pagination
      const params = {
        // categoryName: "",
        id: this.dlId,
        limit: limit,
        pageNo: pageNo,
        markRange: 0,   //全部，包括已标注，未标注
        reviewRange: 0,   //全部，包括已复核，未复核
      }
      const res = await getPictureIdPageList(params)
      this.loading = false
      if(res.code !== 0) return
      this.imageList = [...this.imageList, ...res.data.records]
      res.data.records.forEach(record => getPicture(record.id, 'thumbnail').then(res => {
        const url = window.URL.createObjectURL(res)
        this.$set(record, 'url', url)
      }))
      this.pagination.total = res.data.total
    },
    // 查询配置下的图片列表
    async queryConfigPicList() {
      this.loading = true
      const { limit, pageNo } = this.pagination
      const res = await getConfigPicList({
        configId: this.configData.id,
        limit,
        pageNo
      })
      this.loading = false
      if(res.code !== 0) return
      // this.imageList = [...this.imageList, ...res.data.records]
      res.data.records.forEach(record => {  //用路径去加载图片
        this.imageList.push(record)
        getThumbnailByid(record.id).then(blob => {
          const url = window.URL.createObjectURL(blob)
          this.$set(record, 'url', url)
        })
      })
      this.pagination.total = res.data.total
    },
    handleFocus(item) {
      if(item.id === this.focusId) return
      this.focusId = item.id
      this.setConfigData('focusId', item.id)
      // emit加载大图以及查询对应的推理结果
      EventBus.$emit("r2rReloadImage", this.focusId)
      // 查询该图的调试结果(放在加载大图后进行,在graph/index里)
      // const { id, dataType,dlId } = this.configData
      // this.queryOutputs({
      //   configId: id,
      //   dataType,
      //   dlId,
      //   pictureId: item.id,
      //   page: 1,
      //   size: 100000
      // })
    },
    // 本地上传模式下，删除当前focus的图片
    deletePicture() {
      if(!this.focusId) return this.$message.warning("请选中要删除的图片")
      this.$confirmEle(`确定删除当前图片吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        center: false
      }).then(async () => {
        const res = await deletePictureById(this.focusId)
        if(res.code == 0) {
          this.$message.success(`已删除`)
          // 应该刷新当前分页数据，不可前端删除imageList，删除几个后会导致没有可触发加载更多的条件
          // 现在发现
          // const { limit, pageNo } = this.pagination
          // this.imageList = this.imageList.slice(0, limit * (pageNo -1))
          this.imageList = []
          this.pagination.pageNo = 1
          this.queryConfigPicList()
          // 自动聚焦到下一张图片
          // 暂时先清空大图
          this.focusId = null
          this.setOutputs([], "")
          this.setConfigData('focusId', this.focusId)
          EventBus.$emit("r2rReloadImage", this.focusId)
        }
      }).catch(() => {});
    },
    // 重置图片列表，分页等数据, emit graph清空画布
    resetState() {
      this.focusId = null
      this.imageList = []
      this.pagination.pageNo = 1
      this.pagination.total = 0
      this.setOutputs([], "")
      this.setConfigData('focusId', this.focusId)
      EventBus.$emit("r2rReloadImage", this.focusId)
    },
    _getImageSrc(item){
      return item.url || require("@/assets/images/place.gif");
    },
    /**
     * @public 进入页面初始化
     */
    initPanel() {
      const { dataType, dlId } = this.configData
      if(![0, 1].includes(dataType)) { //是新的配置记录, 将dataType默认设置为0
        this.setConfigData('dataType', 0)
        return
      }  
      this.picListMode = dataType
      if(dataType === 0) {  //加载第一页图片列表
        this.queryConfigPicList()
      }
      if(dataType === 1 ) {
        this.dlId = dlId  //默认选中数据集
        // 查询数据集第一页图片
        this.queryDlPicList()
      }
    }
  },
  setup(props, {}) {
    const { configData, setConfigData, groupLoading, queryOutputs, processing, setOutputs } = useState()
    return {
      // 共享hook中的数据
      configData,
      groupLoading,
      setConfigData,

      setOutputs,
      queryOutputs,
      processing,
    }
  },
  beforeMount() {
    this.initPanel()
  },
  beforeDestroy() {
    
  }
}
</script>

<style lang="less" scoped>
.img-list-wrap {
  .top-area {
    height: 100px;
    width: 230px;
    // padding: 10px 15px;
    border-radius: 8px;
    margin-bottom: 5px;
    background-color: #bedcff;
    & ::v-deep .ant-tabs .ant-tabs-top-content {
      // padding: 0 15px;
    }
    // & ::v-deep > .ant-tabs-card > .ant-tabs-content {
    //   height: 120px;
    //   margin-top: -16px;
    // }

    // & ::v-deep > .ant-tabs-card > .ant-tabs-content > .ant-tabs-tabpane {
    //   background: #fff;
    //   padding: 16px;
    // }

    // & ::v-deep > .ant-tabs-card > .ant-tabs-bar {
    //   border-color: #fff;
    // }

    // & ::v-deep > .ant-tabs-card > .ant-tabs-bar .ant-tabs-tab {
    //   border-color: transparent;
    //   background: transparent;
    // }

    // & ::v-deep > .ant-tabs-card > .ant-tabs-bar .ant-tabs-tab-active {
    //   border-color: #fff;
    //   background: #fff;
    // }
    .btn-wrap {
      display: flex;
      justify-content: space-around;
      padding: 0 15px;
    }
    .dataset-select {
      width: 100%;
      padding: 0 15px;
      // margin-top: 12px;
    }
  }
  .img-list {
    height: calc(100% - 105px);
    overflow: auto;
    border-radius: 8px;
    width: 230px;
    background-color: #bedcff;
    padding: 0;
    .img-box {
      cursor: pointer;
      padding: 4px;
      position: relative;
      box-sizing: border-box;
      img {
        width: 100%;
        height: 120px;
      }
      .load-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 48px;
        color: #409EFF;
      }
    }
    .text{
      text-align: center;
    }
    .focus-style {
      border: 2px solid #ff0000;
    }
  }
}
</style>