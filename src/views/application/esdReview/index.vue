<template>
  <div class="opCode">
    <div class="opCode-tabs">
      <span :class="tabActiveKey === 1 && 'selected'" @click="tabActiveKey = 1">复判工具</span>
      <span :class="tabActiveKey === 2 && 'selected'" @click="tabActiveKey = 2">复判任务</span>
    </div>
    <template v-if="tabActiveKey === 1">
      <div class="opCode-search">
        <a-spin :spinning="topLoading" :class="!hiddenTop && 'hiddenTop'" :style="{
          'max-height': hiddenTop ? '0' : '500px'
        }">
          <div class="opCode-search-footer">
            <a-form-model
              :model="opCodeFooterForm"
              layout="horizontal"
              :labelCol="{ span: 6 }"
              :wrapperCol="{ span: 18 }"
              labelAlign="left"
            >
              <a-form-model-item label="任务类型">
                <a-select v-model="opCodeFooterForm.type" @change="getTaskDataList">
                  <a-select-option
                    v-for="item in taskTypeList"
                    :key="item.value"
                    :value="item.value"
                  >{{ item.text }}</a-select-option>
                </a-select>
              </a-form-model-item>
              <a-form-model-item label="任务名称">
                <a-select
                  v-model="opCodeFooterForm.taskId"
                  showSearch
                  :filter-option="filterOption"
                  @change="getProductAndGlassId"
                >
                  <a-select-option
                    v-for="item in taskList"
                    :key="item.id"
                    :value="item.id"
                    :title="item.taskName">
                    {{ item.taskName }}
                  </a-select-option>
                </a-select>
              </a-form-model-item>
              <a-form-model-item label="时间段" :labelCol="{ span: 3 }" :wrapperCol="{ span: 21 }" style="width: 50%">
                <a-range-picker
                  v-model="opCodeFooterForm.dateRangValue"
                  :disabled-date="disabledDate"
                  show-time
                  @change="changeTime"
                  @calendarChange="calendarChange"
                />
              </a-form-model-item>
              <a-form-model-item label="Product" v-if="opCodeFooterForm.type !== 3">
                <a-select
                  v-model="opCodeFooterForm.productSpecName"
                  showSearch
                  :filter-option="filterOption"
                >
                  <a-select-option
                    v-for="item in productList"
                    :key="item"
                    :value="item"
                    :title="item">
                    {{ item }}
                  </a-select-option>
                </a-select>
              </a-form-model-item>
            </a-form-model>
          </div>
          <div class="opCode-search-footer">
            <a-form-model
              :model="opCodeFooterForm"
              layout="ver"
              :labelCol="{ span: 8 }"
              :wrapperCol="{ span: 16 }"
              labelAlign="left"
            >
              <a-form-model-item label="阈值筛选">
                <a-input-group compact>
                  <a-input v-model="opCodeFooterForm.confidenceMin" placeholder="最小阈值" />
                  <a-input v-model="opCodeFooterForm.confidenceMax" placeholder="最大阈值" />
                </a-input-group>
              </a-form-model-item>
              <a-form-model-item label="Size筛选" v-if="opCodeFooterForm.type !== 3">
                <a-input-group compact>
                  <a-input v-model="opCodeFooterForm.pictureSizeMin" placeholder="最小值" />
                  <a-input v-model="opCodeFooterForm.pictureSizeMax" placeholder="最大值" />
                </a-input-group>
              </a-form-model-item>
              <a-form-model-item label="Alarm筛选">
                <a-radio-group v-model="opCodeFooterForm.alarmLevel">
                  <a-radio :value="2">是</a-radio>
                  <a-radio :value="1">否</a-radio>
                </a-radio-group>
              </a-form-model-item>
              <a-form-model-item label="复判标识筛选">
                <a-radio-group v-model="opCodeFooterForm.reviewFlag">
                  <a-radio :value="1">是</a-radio>
                  <a-radio :value="0">否</a-radio>
                </a-radio-group>
              </a-form-model-item>
              <a-form-model-item :label="opCodeFooterForm.type !== 3 ? 'GlassID筛选' : 'panelID筛选'">
                <a-select
                  v-model="opCodeFooterForm.glassId"
                  mode="multiple"
                  allowClear
                  showSearch
                  :filter-option="filterOption"
                >
                  <a-select-option
                    v-for="item in glassList"
                    :key="item"
                    :value="item"
                    :title="item">
                    {{ item }}
                  </a-select-option>
                </a-select>
              </a-form-model-item>
              <a-form-model-item
                label="Code筛选"
                :style="{
                  width: '50%'
                }"
                :labelCol="{ span: 4 }"
                :wrapperCol="{ span: 20 }"
              >
                <a-radio-group v-model="opCodeFooterForm.setCount">
                  <a-radio :value="1">是</a-radio>
                  <a-radio :value="0">否</a-radio>
                </a-radio-group>
                <a-button
                  type="primary"
                  :disabled="!opCodeFooterForm.setCount ||
                    !(opCodeFooterForm.startDate && opCodeFooterForm.endDate)"
                  @click="showSelectCodeModal">
                  设置Code数量
                </a-button>
              </a-form-model-item>
            </a-form-model>
          </div>
        </a-spin>
        <a-button class="search" :hidden="hiddenTop" :disabled="isSearch" type="primary" @click="search()">查询</a-button>
        <div class="hiddenBtn top" @click="hiddenTop = !hiddenTop" :title="hiddenTop ? '显示搜索条件' : '隐藏搜索条件'">
          <a-icon :type="hiddenTop ? 'caret-down' : 'caret-up'" />
        </div>
      </div>
      <a-spin :spinning="contentLoading" style="margin-top: 15px">
        <div class="opCode-content" v-show="!(imageList.length === 0 && !opCodeFooterForm.imgName)">
          <div class="opCode-content-left" :class="[hiddenLeft && 'leftHidden']">
            <div style="width: 100%; height: 100%; overflow: hidden">
              <!-- <div class="opCode-content-left-header">
                <a-input-search v-model="searchName" @search="search('search')"></a-input-search>
              </div> -->
              <div class="opCode-content-left-content">
                <!-- 滚动加载请求后台分页接口 -->
                <ul class="image-list" ref="list">
                  <li
                    :class="['image-list-item', item.selected && 'selected']"
                    :style="{
                      color: item.reviewJudgeStatus ? 'green' : ''
                    }"
                    v-for="item in imageList"
                    :key="item.id"
                    :title="item.pictureName"
                    @click="selectImage(item)">
                    <span>{{ item.pictureName }}</span>
                  </li>
                  <li v-if="showEmpty" style="text-align: center;color: #ccc"><span>没有更多了</span></li>
                </ul>
              </div>
            </div>
            <div class="hiddenBtn left" @click="hiddenLeft = !hiddenLeft" :title="hiddenLeft ? '显示图片列表' : '隐藏图片列表'">
              <a-icon :type="hiddenLeft ? 'caret-right' : 'caret-left'" />
            </div>
          </div>
          <div class="opCode-content-center" :class="[hiddenLeft && 'leftHidden']">
            <div class="opCode-content-center-content">
              <div class="image">
                <img @click="showImagePreview = true" :src="currentImage.url" />
              </div>
            </div>
            <div class="opCode-content-center-footer">
              <span class="next" @click="nextImage"><a-icon type="right-circle" /></span>
              <span class="prev" @click="prevImage"><a-icon type="left-circle" /></span>
              <span class="page">{{ loadImagePage.pageNo }}/{{ loadImagePage.total }}</span>
            </div>
          </div>
          <div class="opCode-content-right">
            <div class="opCode-content-right-header">
              <h4>AI Level：{{ currentImage.alarmLevel === 1 && 'Warning' || currentImage.alarmLevel === 2 && 'Alarm' || '无' }}</h4>
              <h4>AI Judge：{{ currentImage.judgeStatus || '无' }}</h4>
              <h4 v-if="opCodeFooterForm.type !== 3">AI_OLX：{{ currentImage.aiOlx || '无' }}</h4>
              <h4 v-if="opCodeFooterForm.type !== 3">AI_OLY：{{ currentImage.aiOly || '无' }}</h4>
              <h4>Review Level：{{ currentImage.reviewAlarmLevel === 1 && 'Warning' || currentImage.reviewAlarmLevel === 2 && 'Alarm' || '无' }}</h4>
              <h4>Review Judge：{{ currentImage.reviewJudgeStatus || '无' }}</h4>
              <h4>Review Flag：{{ currentImage.reviewFlag === 1 ? '已复判' : '未复判' }}</h4>
            </div>
            <div class="opCode-content-right-content">
              <div class="tag-list">
                <p>Review Level</p>
                <div class="reviewLevel">
                  <a-button :type="currentImage.reviewAlarmLevel === 2 ? 'primary' : 'default'" @click="reviewLevel(2)">Alarm</a-button>
                  <a-button :type="currentImage.reviewAlarmLevel === 1 ? 'primary' : 'default'" @click="reviewLevel(1)">Warning</a-button>
                </div>
                <p>Review Judge</p>
                <div class="reviewJudge">
                  <reviewCodeList
                    :taskId="opCodeFooterForm.taskId"
                    :judgeStatus="currentImage.reviewJudgeStatus"
                    @reviewCode="reviewCode"
                  />
                </div>
              </div>
              <div class="tag-button">
                <a-button type="primary" @click="review">判定</a-button>
                <a-button type="primary" @click="handCreate">结束</a-button>
              </div>
            </div>
          </div>
        </div>
        <a-empty v-show="imageList.length === 0 && !opCodeFooterForm.imgName"></a-empty>
      </a-spin>
    </template>
    <template v-else>
      <taskList />
    </template>
    <addTask ref="addTask" @addSuccess="addSuccess"></addTask>
    <ImagePreview
      v-if="showImagePreview"
      :data="sampleTableImageList"
      :default="currentImage.id"
      :detailData="{ dlTagType: '分类' }"
      :getImageFun="getPicture"
      :pagination="loadImagePage"
      @close="closePreview"
      @page="imagePreviewPageChange"/>
    <selectPredictCode
      ref="selectPredictCode"
      :opCodeFooterForm="opCodeFooterForm"
      @updateSelectCode="updateSelectCode"
    />
  </div>
</template>
<script>
import { getApplicationcenterList, esdReview, lscReview}  from '@/api/appCenter'
import moment from 'moment'
import ImagePreview from '../opCode/imagePreview'
import reviewCodeList from './reviewCodeList'
export default {
  name: "opCode",
  components: {
    reviewCodeList,
    taskList: () => ({ component: import('./taskList') }),
    addTask: () => ({ component: import('./addTask') }),
    selectPredictCode: () => ({ component: import('./selectPredictCode') }),
    ImagePreview
  },
  data () {
    return {
      taskTypeList: [{
        value: 1,
        text: 't6 ESD'
      }, {
        value: 2,
        text: 't6 CF ESD'
      }, {
        value: 3,
        text: 't2 LSC'
      }],
      taskList: [],
      opCodeFooterForm: {
        type: 1,
        alarmLevel: 1,
        queryType: 0,
        codeCount: [],
        predictCodes: [],
        codeThreshold: [],
        isCodeThreshold: 2,
        setCount: 0,
        glassId: [],
        confidenceMin: null,
        confidenceMax: null,
        pictureSizeMin: null,
        pictureSizeMax: null
      },
      loadImagePage: {
        pageSize: 40,
        pageNo: 1,
        total: 1,
        current: 1
      },
      showEmpty: false,
      searchName: '',
      tabActiveKey: 1,
      topLoading: false,
      contentLoading: false,
      imageList: [],
      startTime: '',
      hiddenTop: false,
      hiddenLeft: false,
      currentImage: {},
      sampleTableImageList: [],
      showImagePreview: false,
      productList: [],
      glassList: '',
      reviewVersion: '',
      reviewCodeList: ['OK', 'NG'],
      api: [esdReview, esdReview, esdReview, lscReview]
    }
  },
  created () {
  },
  computed: {
    isSearch () {
      if (this.contentLoading) return true
      const footer = this.opCodeFooterForm
      if (!footer.startDate ||
        !footer.endDate ||
        !footer.taskId
        ){
        return true
      } else {
        return false
      }
    }
  },
  mounted () {
    this.$refs.list.onscroll = this.listScroll
    this.getTaskDataList()
  },
  activated () {
    window.addEventListener('keydown', this.keydwon, false)
  },
  deactivated () {
    window.removeEventListener('keydown', this.keydwon, false)
  },
  beforeDestroy () {
    window.removeEventListener('keydown', this.keydwon, false)
  },
  methods: {
    async listScroll (e) {
      if (e.target.scrollTop + e.target.offsetHeight + 3 > e.target.scrollHeight && !this.showEmpty) {
        this.$set(this.loadImagePage, 'current', this.loadImagePage.current + 1)
        await this.search('page')
      }
    },
    async getTaskDataList () {
      const responseData = await esdReview.getTaskList({
        programType: this.opCodeFooterForm.type
      })
      if (responseData.code === 0) {
        this.taskList = responseData.data
      }
    },
    showSelectCodeModal () {
      this.$refs.selectPredictCode.showModal()
    },
    disabledDate (current) {
      if (!this.startTime) {
        return current > moment(new Date())
      }
      const time = moment(this.startTime)
      return current && (current > moment(new Date()) || (current < time.subtract(1,'months') || current > time.add(2,'months')))
    },
    changeTime (date, str) {
      if (date.length === 2) this.startTime = ''
      this.opCodeFooterForm.startDate = moment(str[0]).valueOf()
      this.opCodeFooterForm.endDate = moment(str[1]).valueOf()
      this.getProductAndGlassId()
    },
    calendarChange (date, dateString) {
      if (date.length === 2) {
        this.startTime = ''
      } else {
        this.startTime = date[0]
      }
    },
    updateSelectCode (data) {
      this.$set(this.opCodeFooterForm, 'codeCount', JSON.parse(JSON.stringify(data)))
    },
    async selectImage (data) {
      // 选中图片
      this.imageList.forEach((item, index) => {
        item.selected = false
        if (item.id === data.id) {
          item.selected = true
          this.loadImagePage.pageNo = index + 1
        }
      })
      if (this.imageList.length === 0) return false
      this.currentImage = JSON.parse(JSON.stringify(this.imageList.filter(item => {
        return item.id === data.id
      })[0]))
      const res = await this.getPicture(data.id)
      this.$set(this.currentImage, 'url', window.URL.createObjectURL(res))
    },
    async getProductAndGlassId () {
      const { startDate, endDate, taskId, type } = this.opCodeFooterForm
      if (!startDate || !endDate || !taskId || !type) return false
      const params = {
        startDate, endDate, taskId
      }
      const res = await this.api[this.opCodeFooterForm.type].getProductAndGlassId(params)
      if (res.code !== 0) return false
      this.glassList = res.data.glassid
      this.productList = res.data.product
    },
    async search (type, callback) {
      const { startDate,
        endDate,
        taskId,
        productSpecName,
        alarmLevel,
        reviewFlag,
        confidenceMin,
        confidenceMax,
        pictureSizeMin,
        pictureSizeMax,
        codeCount,
        glassId,
        setCount
      } = this.opCodeFooterForm
      const { pageSize: limit, current: pageNo } = this.loadImagePage
      const params = {
        startDate,
        endDate,
        taskId,
        productSpecName,
        alarmLevel,
        codeCount: codeCount.toString(),
        confidence: (confidenceMin !== null && confidenceMin !== null) ?
          `${confidenceMin}-${confidenceMax}` : undefined,
        glassId: glassId.length === 0 ? '0-0' : '1-' + glassId.toString(),
        keyword: '',
        limit,
        pageNo,
        pictureSize: (pictureSizeMin !== null && pictureSizeMax !== null) ?
          `${pictureSizeMin}-${pictureSizeMax}` : undefined,
        reviewFlag,
        setCount
      }
      if (type === 'search') params.keyword = this.searchName
      this.contentLoading = true
      this.hiddenTop = true
      const res = await this.api[this.opCodeFooterForm.type].searchData(params)
      this.contentLoading = false
      if (res.code !== 0) return false
      console.log(res)
      this.reviewVersion = res.data.reviewVersion
      if (type === 'page') {
        if (res.data.pageResult.records.length === 0) {
          this.showEmpty = true
          this.$set(this.loadImagePage, 'current', this.loadImagePage.current - 1)
          if (callback) callback(false)
          return false
        }
        this.imageList.push(...res.data.pageResult.records.map(item => {
          return {
            ...item,
            selected: false
          }
        }))
      } else {
        if (res.data.pageResult.total === 0) {
          this.imageList = []
          return false
        }
        this.imageList = res.data.pageResult.records.map(item => {
          return {
            ...item,
            selected: false
          }
        })
        this.showEmpty = false
        this.selectImage(this.imageList[0])
      }
      this.sampleTableImageList = this.imageList.map(item => {
        return {
          id: item.id,
          name: item.pictureName,
          url: '',
          markPositions: [],
          existPicMark: false
        }
      })
      this.loadImagePage.total = res.data.pageResult.total
      if (callback) callback(true)
    },
    closePreview () {
      this.showImagePreview = false
    },
    async imagePreviewPageChange (data, callback) {
      if (data === 'prev') {
        if (this.loadImagePage.current === 1) {
          return callback(false)
        }
        this.$set(this.loadImagePage, 'current', this.loadImagePage.current - 1)
      } else {
        if (this.loadImagePage.current === Math.ceil(this.loadImagePage.total / this.loadImagePage.pageSize)) {
          return callback(false)
        }
        this.$set(this.loadImagePage, 'current', this.loadImagePage.current + 1)
      }
      // this.loadImagePage.current++
      await this.search('page', callback)
    },
    async getPicture (id) {
      return await this.api[this.opCodeFooterForm.type].getImage(id)
    },
    keydwon (e) {
      if (this.imageList.length === 0) return
      switch (e.keyCode) {
      case 37:
        // left
        this.prevImage()
        break
      case 39:
        // right
        this.nextImage()
        break
      }
      return
    },
    async nextImage () {
      let image = null
      this.imageList.forEach(async (item, index) => {
        if (item.id === this.currentImage.id) {
          if (this.imageList[index + 1]) {
            image = this.imageList[index + 1]
          } else {
            if (!this.showEmpty) {
              this.loadImagePage.current++
              await this.search('page')
              this.nextImage()
            } else {
              this.$message.warning('当前已经是最后一张了')
            }
          }
        }
      })
      if (image) this.selectImage(image)
    },
    async prevImage () {
      let image = null
      this.imageList.forEach((item, index) => {
        if (item.id === this.currentImage.id) {
          if (this.imageList[index - 1]) {
            image = this.imageList[index - 1]
          } else {
            this.$message.warning('当前已经是第一张了')
          }
        }
      })
      if (image) this.selectImage(image)
    },
    reviewLevel (val) {
      this.$set(this.currentImage, 'reviewAlarmLevel', val)
    },
    reviewCode (val) {
      this.$set(this.currentImage, 'reviewJudgeStatus', val)
    },
    async review () {
      const { reviewAlarmLevel, reviewJudgeStatus, id } = this.currentImage
      const params = {
        alarmLevel: reviewAlarmLevel,
        code: reviewJudgeStatus,
        pictureId: id,
        reviewVersion: this.reviewVersion
      }
      const res = await this.api[this.opCodeFooterForm.type].reviewResult(params)
      if (res.code !== 0) return false
      this.imageList.forEach(item => {
        if (item.id === this.currentImage.id) {
          item.reviewAlarmLevel = reviewAlarmLevel
          item.reviewJudgeStatus = reviewJudgeStatus
        }
      })
      this.nextImage()
      this.$message.success('复判成功')
    },
    handCreate () {
      const params = {
        reviewVersion: this.reviewVersion,
        taskId: this.opCodeFooterForm.taskId
      }
      this.$refs.addTask.showModal(params, this.opCodeFooterForm.type)
    },
    addSuccess () {
      this.tabActiveKey = 2
    }
  }
}
</script>

<style lang="less" scoped>
.opCode{
  position: relative;
  &-tabs{
    line-height: 50px;
    padding: 0 10px 10px 10px;
    font-weight: 600;
    font-size: 16px;
    span{
      margin-right: 15px;
      cursor: pointer;
      &.selected{
        color: #4064DF;
      }
    }
  }
  .hiddenBtn{
    border: 1px solid #ccc;
    cursor: pointer;
    color: #fff;
    background: #0072C6;
  }
  &-search{
    // overflow: hidden;
    // padding-bottom: 15px;
    margin-bottom: 15px;
    border-bottom: 1px solid #e8e8e8;
    position: absolute;
    z-index: 5;
    background: #fff;
    width: 100%;
    &-item{
      width: 25%;
      float: left;
      padding: 0 10px;
    }
    /deep/ .ant-form-item{
      margin-bottom: 10px;
    }
    .search{
      position: absolute;
      bottom: 10px;
      right: 20px;
    }
    &-footer{
      float: left;
      width: 100%;
      /deep/ .ant-form-item{
        width: 25%;
        float: left;
        padding: 0 12px;
        height: 32px;
      }
      /deep/ .ant-calendar-picker{
        width: 100%!important;
      }
      .ant-input-group-compact{
        &>*{
          width: 50%;
        }
      }
    }
    .top{
      width: 57px;
      position: absolute;
      height: 12px;
      right: 21px;
      top: 100%;
      line-height: 1px;
      text-align: center;
      border-radius: 0px 0px 8px 8px;
      font-size: 12px;
    }
    .ant-spin-nested-loading{
      overflow: hidden;
      transition: height 0.5s;
      overflow-y: hidden;
      /deep/ .ant-spin-container{
        overflow: hidden;
      }
    }
    .hiddenTop{
      box-shadow: 0px 3px 4px 0px #ccc;
      overflow-y: auto;
    }
  }
  &-content{
    // overflow: hidden;
    height: calc(100vh - 185px);
    min-height: 500px;
    transition: 0.5s all;
    &>*{
      float: left;
      height: 100%;
    }
    &-left{
      width: 20%;
      transition: 0.5s all;
      position: relative;
      .left{
        width: 9px;
        height: 46px;
        position: absolute;
        left: 100%;
        top: 50%;
        line-height: 46px;
        border-left: none;
        font-size: 12px;
        border-radius: 0px 8px 8px 0px;
        text-indent: -1px;
      }
      &.leftHidden{
        width: 1px;
      }
      &-content{
        padding: 10px;
        border: 1px solid #ccc;
        margin-top: 10px;
        border-radius: 5px;
        height: calc(100% - 55px);
        ul{
          list-style: none;
          max-height: 100%;
          overflow-y: auto;
          li{
            line-height: 30px;
            cursor: pointer;
            text-overflow: ellipsis;
            overflow: hidden;
            padding: 0 10px;
            &.selected{
              color: #fff!important;
              background: #0072C6;
            }
            &:not(.selected):hover{
              span{
                color: #4064DF;
              }
            }
          }
        }
      }
    }
    &-center{
      width: 60%;
      padding: 0 15px;
      transition: 0.5s all;
      &.leftHidden{
        width: calc(80% - 1px)
      }
      &-content{
        height: calc(100% - 40px);
        .image{
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          /deep/ .ant-empty{
            margin: 0 auto;
          }
          img{
            width: 100%;
            height: auto;
            max-height: 95%;
          }
        }
      }
      &-footer{
        font-size: 25px;
        line-height: 25px;
        text-align: center;
        .next, .prev{
          margin-right: 10px;
          float: right;
          cursor: pointer;
        }
      }
    }
    &-right{
      width: 20%;
      &-header{
        overflow: hidden;
        h4{
          line-height: 25px;
        }
      }
      &-content{
        height: calc(100% - 235px);
        .tag-list{
          border: 1px solid #ccc;
          border-radius: 5px;
          padding: 10px;
          height: calc(100% - 40px);
          overflow-y: auto;
          &>*{
            width: 100%;
            display: flex;
            &>.ant-btn{
              text-align: center;
              line-height: 25px;
              margin: 0 10px 10px 0;
            }
          }
          .reviewJudge{
            height: calc(100% - 115px);
            overflow-y: auto;
          }
        }
        .tag-button{
          margin-top: 5px;
          overflow: hidden;
          &>*{
            float: left;
            margin: 0 1%;
            /* padding: 5px; */
            width: 30%;
            text-align: center;
            padding: 0;
          }
        }
      }
    }
  }
}
.codeThreshold{
  width: 400px;
  &-item{
    height: 30px;
    margin-bottom: 10px;
    width: 100%;
    & > * {
      width: 33.33%;
      float: left;
      padding: 0 5px;
      line-height: 30px;
    }
  }
}
</style>
