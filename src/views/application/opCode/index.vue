<template>
  <div class="opCode">
    <!-- <div class="opCode-tabs">
      <span :class="tabActiveKey === 1 && 'selected'" @click="tabActiveKey = 1">复判工具</span>
      <span :class="tabActiveKey === 2 && 'selected'" @click="tabActiveKey = 2">复判任务</span>
    </div> -->
    <a-header
      :showSearch="false"
      :showNew="false"
      :showdelete="false"
      :showReload="false"
      :auth="{ add: 'dataMrg-list-add' }"
      :tab-list="tabList"
      :tab-active-key="tabActiveKey"
      :placeholderText="'输入用户名或邮箱搜索'"
      newText="新建"
      @tab-change="onTabClick"
      @create="handCreate"
      @reload="handReload"
      @search="handSearch"
    />
    <template v-if="tabActiveKey === '1'">
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
                  <a-select-option :value="2">在线任务</a-select-option>
                  <a-select-option :value="1">离线回放</a-select-option>
                </a-select>
              </a-form-model-item>
              <a-form-model-item label="任务名称">
                <a-select v-model="opCodeFooterForm.taskId" showSearch :filter-option="filterOption" @change="getPredictCodeList">
                  <a-select-option v-for="item in taskList" :key="item.id" :value="item.id"
                    :title="opCodeFooterForm.type === 2 ? item.taskName : item.name">
                    {{ opCodeFooterForm.type === 2 ? item.taskName : item.name }}
                  </a-select-option>
                </a-select>
              </a-form-model-item>
              <a-form-model-item v-if="opCodeFooterForm.type === 2" label="时间段" :labelCol="{ span: 3 }" :wrapperCol="{ span: 21 }" style="width: 35%">
                <a-range-picker
                  v-model="opCodeFooterForm.dateRangValue"
                  :disabled-date="disabledDate"
                  show-time
                  @change="changeTime"
                  @calendarChange="calendarChange"
                />
              </a-form-model-item>
              <a-form-model-item :wrapperCol="{ span: 24 }" style="width: 15%">
                <a-checkbox v-model="opCodeFooterForm.reviewCode">是否过滤已复判</a-checkbox>
              </a-form-model-item>
            </a-form-model>
          </div>
          <div class="opCode-search-item" v-for="(item, index) in opCodeSearchForm" :key="item.id">
            <a-form-model
              :model="item"
              :labelCol="{ span: 6 }"
              :wrapperCol="{ span: 18 }"
              layout="horizontal"
              labelAlign="left"
            >
              <a-form-model-item
                :label="item.name">
                <a-select
                  v-model="item.value"
                  @change="changeParent(item, index)"
                  mode="multiple"
                  :token-separators="[';']">
                  <a-select-option v-for="(option, optionIndex) in directoryDataList[item.name]" :key="optionIndex" :value="option">
                    {{ option }}
                  </a-select-option>
                </a-select>
              </a-form-model-item>
            </a-form-model>
          </div>
          <div class="opCode-search-footer">
            <a-form-model
              :model="opCodeFooterForm"
              layout="horizontal"
              :labelCol="{ span: 6 }"
              :wrapperCol="{ span: 18 }"
              labelAlign="left"
            >
              <a-form-model-item label="查询方式">
                <a-select v-model="opCodeFooterForm.queryType">
                  <a-select-option :value="0">全局查询</a-select-option>
                  <a-select-option :value="1">随机查询</a-select-option>
                </a-select>
              </a-form-model-item>
              <a-form-model-item v-if="opCodeFooterForm.queryType === 1" label="随机数量">
                <a-input-number v-model="opCodeFooterForm.randNum" :min="0" :step="1" style="width: 100%" />
              </a-form-model-item>
              <a-form-model-item v-if="opCodeFooterForm.queryType === 0" label="预测Code" :style="{
                width: opCodeFooterForm.queryType === 1 ? '50%' : '60%'
              }" :labelCol="{ span: 4 }" :wrapperCol="{ span: 20 }">
                <!-- <a-select
                  v-model="opCodeFooterForm.predictCodes"
                  showSearch
                  :filter-option="filterOption"
                  mode="multiple"
                  :maxTagCount="4"
                  @select="addCode"
                  @deselect="delCode">
                  <a-select-option v-for="item in predictCodeList" :key="item" :value="item">
                    {{ item }}
                  </a-select-option>
                </a-select> -->
                <span style="margin-right: 10px">是否设置Code抽检数量</span>
                <a-radio-group v-model="opCodeFooterForm.setCount">
                  <a-radio :value="1">是</a-radio>
                  <a-radio :value="0">否</a-radio>
                </a-radio-group>
                <a-button type="primary" :disabled="!opCodeFooterForm.setCount || !(opCodeFooterForm.startTime && opCodeFooterForm.endTime)" @click="showSelectCodeModal">设置Code数量</a-button>
              </a-form-model-item>
              <a-form-model-item v-if="opCodeFooterForm.queryType === 0" style="clear: both;height: auto" :labelCol="{ span: 0 }" :wrapperCol="{ span: 24 }">
                <div class="codeThreshold">
                  <div class="codeThreshold-item">
                    <span class="codeThreshold-item-label">是否设置Code阈值</span>
                    <a-radio-group v-model="opCodeFooterForm.isCodeThreshold">
                      <a-radio :value="1" :disabled="opCodeFooterForm.codeThreshold && opCodeFooterForm.codeThreshold.length === 0">是</a-radio>
                      <a-radio :value="2">否</a-radio>
                    </a-radio-group>
                    <a-input-number
                      :min="0"
                      :max="1.1"
                      :precision="4"
                      :step="0.0001"
                      v-model="changeAllCodeVal"
                      @change="changeAllCodeListVal"
                      v-if="opCodeFooterForm.isCodeThreshold === 1"
                    />
                  </div>
                  <template v-if="opCodeFooterForm.isCodeThreshold === 1">
                    <div
                    class="codeThreshold-item"
                    v-for="code in opCodeFooterForm.codeThreshold"
                    :key="code">
                    <span class="codeThreshold-item-label">{{ code.code }}</span>
                    <a-select v-model="code.conf">
                      <a-select-option v-for="conf in confList" :key="conf.value" :value="conf.value">
                        {{ conf.title }}
                      </a-select-option>
                    </a-select>
                    <a-input-number
                      :min="0"
                      :max="1.1"
                      :precision="4"
                      :step="0.0001"
                      v-model="code.value"
                    />
                  </div>
                  </template>
                </div>
              </a-form-model-item>
            </a-form-model>
          </div>
        </a-spin>
        <a-button class="search" :hidden="hiddenTop" :disabled="isSearch" type="primary" @click="search()">查询</a-button>
        <div class="hiddenBtn top" v-show="false" @click="hiddenTop = !hiddenTop" :title="hiddenTop ? '显示搜索条件' : '隐藏搜索条件'">
          <a-icon :type="hiddenTop ? 'caret-down' : 'caret-up'" />
        </div>
      </div>
      <a-spin :spinning="contentLoading" style="margin-top: 15px">
        <div class="opCode-content" v-show="!(imageList.length === 0 && !opCodeFooterForm.imgName)">
          <div class="opCode-content-left" :class="[hiddenLeft && 'leftHidden']">
            <div style="width: 100%; height: 100%; overflow: hidden">
              <div class="opCode-content-left-header">
                <a-input-search :disabled="isSearch" v-model="searchName" @search="search('search')"></a-input-search>
              </div>
              <div class="opCode-content-left-content">
                <!-- 滚动加载请求后台分页接口 -->
                <ul class="image-list" ref="list">
                  <li
                    :class="['image-list-item', item.selected && 'selected']"
                    :style="{
                      color: item.reviewCode ? 'green' : ''
                    }"
                    v-for="item in imageList"
                    :key="item.id"
                    :title="item.imgName"
                    @click="selectImage(item)">
                    <span>{{ item.imgName }}</span>
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
            <div class="opCode-content-center-header">
              <h4>预测Code：{{ currentImage.predictCode || '无' }}</h4>
              <h4>复判Code：{{ currentImage.reviewCode || '无' }}</h4>
              <h4>阈值：{{ currentImage.confidence || '无' }}</h4>
            </div>
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
              <h4 style="text-align: right">
                复判标识：{{ this.currentImage.reviewCode ? '已复判' : '未复判' }}
                <a-tooltip>
                  <template slot="title">
                    复判时，当直接进入下一张图片，系统认为图片预测code正确，会将预测code直接赋值至复判code。
                  </template>
                  <span style="margin-left: 10px;cursor: pointer"><a-icon type="question-circle" /></span>
                </a-tooltip>
              </h4>
            </div>
            <div class="opCode-content-right-content">
              <div class="tag-list">
                <div class="tag-list-item" v-for="(item, index) in codeList.predictCodeTag" :key="item.name">
                  <span @click="selectTag(item.name)" :class="['tag', item.selected && 'selected']">
                    <span class="label">{{ item.name }}</span>
                    <a-popconfirm
                      title="确定删除该标签么?"
                      ok-text="确定"
                      cancel-text="取消"
                      @confirm="deleteTag(index)"
                    >
                      <span v-action:opCode-tag-delete class="delete"><a-icon type="close" /></span>
                    </a-popconfirm>
                  </span>
                </div>
                <div class="tag-list-item">
                  <a-popconfirm
                      ok-text="确定"
                      cancel-text="取消"
                      @confirm="addTag"
                      @cancel="addTagName = ''"
                    >
                      <div slot="title">
                        <span>标签名：</span>
                        <a-input placeholder="请输入标签名" v-model="addTagName"></a-input>
                      </div>
                      <span class="addTag" v-action:opCode-tag-add><a-icon type="plus" /></span>
                    </a-popconfirm>
                </div>
              </div>
              <div class="tag-button">
                <a-button :type="currentImage.turnon && 'primary'" @click="selectTag('turnon', true)">turnon</a-button>
                <a-button :type="currentImage.rework && 'primary'" style="float: left" @click="selectTag('rework', true)">rework</a-button>
                <a-button v-action:opCode-list-add type="primary" style="float: left" @click="handCreate">指标计算</a-button>
              </div>
            </div>
          </div>
        </div>
        <a-empty v-show="imageList.length === 0 && !opCodeFooterForm.imgName"></a-empty>
      </a-spin>
    </template>
    <template v-else>
      <opCodeTaskList :taskList="taskList"></opCodeTaskList>
    </template>
    <addOpCodeTask ref="addOpCodeTask" @addSuccess="addSuccess"></addOpCodeTask>
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
      @updatePredictCodes="updatePredictCodes"
    />
  </div>
</template>
<script>
import {
  getApplicationcenterList,
  inferenceCatalogConfList,
  getChildrenList,
  OPCode,
  getModelById,
  offlineBack
} from '@/api/appCenter'
import moment from 'moment'
import ImagePreview from './imagePreview'
export default {
  name: "opCode",
  components: {
    opCodeTaskList: () => ({ component: import('./opCodeTaskList') }),
    addOpCodeTask: () => ({ component: import('./addOpCodeTask') }),
    selectPredictCode: () => ({ component: import('./selectPredictCode') }),
    ImagePreview
  },
  data () {
    return {
      tabList: [
        {
          name: "复判工具",
          key: "1"
        },
        {
          name: "复判任务",
          key: "2"
        }
      ],
      opCodeSearchForm: [],
      opCodeFooterForm: {
        type: 2,
        queryType: 0,
        codeCount: [],
        predictCodes: [],
        codeThreshold: [],
        isCodeThreshold: 2
      },
      currentImage: {},
      imageList: [],
      sampleTableImageList: [],
      showImagePreview: false,
      codeList: {},
      directoryTableData: [],
      directoryDataList: {},
      loadImagePage: {
        pageSize: 40,
        pageNo: 1,
        total: 1,
        current: 1
      },
      addTagName: '',
      topLoading: false,
      contentLoading: false,
      showEmpty: false,
      tabActiveKey: '1',
      taskList: [],
      requestNumber: new Date().getTime(),
      // predictCodeList: [],
      startTime: '',
      searchName: '',
      hiddenTop: false,
      hiddenLeft: false,
      confList: [{
        title: '=',
        value: '='
      }, {
        title: '>',
        value: '>'
      }, {
        title: '>=',
        value: '>='
      }, {
        title: '<',
        value: '<'
      }, {
        title: '<=',
        value: '<='
      }],
      changeAllCodeVal: 0,
      defaultCodeThreshold: {}
    }
  },
  created () {
    this.imageList = this.imageList.map(item => {
      return {
        ...item,
        selected: false
      }
    })
  },
  computed: {
    isSearch () {
      if (this.contentLoading) return true
      const file1 = this.opCodeSearchForm.filter(item => {
        return item.value.length === 0
      })
      const footer = this.opCodeFooterForm
      if (
        // file1.length > 0 ||
        !footer.startTime ||
        !footer.endTime ||
        !footer.taskId ||
        (footer.isCodeThreshold === 1 && footer.codeThreshold.filter(item => !item.value).length > 0) ||
        (footer.queryType === 1 && !footer.randNum)
        ){
        return true
      } else {
        return false
      }
    },
    opCodeSearchFormHeight () {
      return 80 + Math.ceil((this.opCodeSearchForm.length + 1) / 4) * 40
    },
    opCodeContentHeight () {
      return `calc(100vh - ${200 + this.opCodeSearchFormHeight}px)`
    }
  },
  mounted () {
    this.getDataList()
    this.$nextTick(() => {
      const list = this.$refs.list
      console.log(list)
      if (list) {
        list.onscroll = this.listScroll
      }
    })
    this.getTaskDataList()
    // window.addEventListener('keydown', this.keydwon, false)
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
    onTabClick (e) {
      console.log(e)
      this.tabActiveKey = e
    },
    async getTaskDataList () {
      const getData = this.opCodeFooterForm.type === 2 ? getApplicationcenterList : offlineBack.getOfflineBackList
      const responseData = await getData({
        limit: 999999,
        isReplay: this.opCodeFooterForm.type
      })
      if (responseData.code === 0) {
        this.taskList = responseData.data.records
      }
    },
    async listScroll (e) {
      if (e.target.scrollTop + e.target.offsetHeight + 3 > e.target.scrollHeight && !this.showEmpty) {
        this.$set(this.loadImagePage, 'current', this.loadImagePage.current + 1)
        await this.search('page')
      }
    },
    async search (type, callback) {
      // 查询图片列表
      this.hiddenTop = true
      if (type === 'search') this.$set(this.opCodeFooterForm, 'imgName', this.searchName)
      const { startTime, endTime, reviewCode, imgName, queryType, randNum, taskId, codeCount, predictCodes, isCodeThreshold, setCount } = this.opCodeFooterForm
      let customFields = {}
      this.opCodeSearchForm.forEach(element => {
        if (!element.value || element.value.length === 0) return false
        const key = this.directoryTableData.filter(item => {
          return item.name === element.name
        })[0].value
        customFields[key] =
          '==' + element.value.join(';')
      })
      this.contentLoading = true
      if (type !== 'page') {
        this.$set(this.loadImagePage, 'current', 1)
        this.requestNumber = new Date().getTime()
      }
      const codeThreshold = this.opCodeFooterForm.codeThreshold.map(item => {
        return {
          code: item.code,
          expression: `${item.conf}${item.value}`
        }
      })
      const { pageSize: limit, current: pageNo } = this.loadImagePage
      if (!type) await this.getCodeList(customFields)
      const params = {
        conditionJson: JSON.stringify(customFields),
        endTime,
        reviewCode: reviewCode ? 1 : 0,
        startTime,
        imgName,
        limit,
        pageNo,
        queryType,
        randNum,
        taskId,
        opUniqueCode: this.requestNumber,
        type: this.opCodeFooterForm.type,
        predictCodes,
        codeCount,
        setCount,
        condition: isCodeThreshold === 2 ? [] : codeThreshold
      }
      const res = await OPCode.searchImageList(params)
      this.contentLoading = false
      if (res.code !== 0) return false
      if (type === 'page') {
        if (res.data.records.length === 0) {
          this.showEmpty = true
          this.$set(this.loadImagePage, 'current', this.loadImagePage.current - 1)
          if (callback) callback(false)
          return false
        }
        this.imageList.push(...res.data.records.map(item => {
          return {
            ...item,
            selected: false
          }
        }))
      } else {
        this.imageList = res.data.records.map(item => {
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
          name: item.imgName,
          url: '',
          markPositions: [],
          existPicMark: false
        }
      })
      this.loadImagePage.total = res.data.total
      if (callback) callback(true)
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
      this.codeList.predictCodeTag.forEach(item => {
        item.selected = false
        if (item.name === this.currentImage.reviewCode) item.selected = true
      })
      OPCode.getPicture(data.id, this.opCodeFooterForm.type).then(res => {
        this.currentImage.url = window.URL.createObjectURL(res)
        this.$forceUpdate()
      })
    },
    async getDataList () {
      const list = await inferenceCatalogConfList()
      if (list.code === 0) {
        this.directoryTableData = list.data.records
        this.opCodeSearchForm = list.data.records.map(item => {
          return {
            id: item.id,
            name: item.name,
            value: [],
            key: item.value
          }
        })
      }
      this.getChildrenList({
        level: 1
      })
    },
    async getPredictCodeList () {
      const taskInfo = this.taskList.filter(item => item.id === this.opCodeFooterForm.taskId)[0]
      if (this.opCodeFooterForm.type === 1) {
        this.$set(this.opCodeFooterForm, 'startTime', taskInfo.startTime)
        this.$set(this.opCodeFooterForm, 'endTime', taskInfo.endTime)
      } else {
        this.$set(this.opCodeFooterForm, 'startTime', '')
        this.$set(this.opCodeFooterForm, 'endTime', '')
      }
      // const getCode = OPCode.getPredictCodeList(this.opCodeFooterForm.taskId)
      const configId = taskInfo.configId
      const getTask = configId && getModelById(configId)
      // this.topLoading = true
      // const res = await getCode
      // this.topLoading = false
      // if (res.code !== 0) return false
      // this.predictCodeList = res.data
      // res.data.length > 0 && this.$set(this.opCodeFooterForm, 'predictCode', res.data[0])
      if (!configId) return false
      this.topLoading = true
      const task = await getTask
      this.topLoading = false
      if (task.code !== 0) return false
      this.defaultCodeThreshold = JSON.parse(task.data.codeThreshold)
      const customFields = JSON.parse(task.data.customFields)
      Object.keys(customFields).forEach((item, index) => {
        this.getChildrenList({ level: this.directoryTableData.filter(key => key.value === item)[0] ?
          this.directoryTableData.filter(key => key.value === item)[0].level : index + 1 }, true)
        this.opCodeSearchForm.filter(child => {
          if (child.key === item) {
            child.value = customFields[item].split(/([>,<,=]=?)/)[2].split(';')
          }
        })
      })
      this.$set(this.opCodeFooterForm, 'codeThreshold', [])
      this.$set(this.opCodeFooterForm, 'isCodeThreshold', 2)
    },
    async getPicture (id) {
      return await OPCode.getPicture(id, this.opCodeFooterForm.type)
    },
    changeParent (record, index) {
      if (index === this.opCodeSearchForm.length - 1) return false
      if (record.value.length === 0) {
        this.opCodeSearchForm.forEach((item, rowIndex) => {
          if (rowIndex > index) {
            item.value = []
            this.directoryDataList[item.name] = []
          }
        })
      } else {
        this.getChildrenList({
          level: index + 2,
          parentValue: record.value.join(';')
        })
      }
    },
    getCodeList (value) {
      const params = {
        condition: JSON.stringify(value)
      }
      this.contentLoading = true
      OPCode.getCodeList(params).then(res => {
        this.contentLoading = false
        if (res.code !== 0) return false
        this.codeList.predictCodeTag = JSON.parse(res.data.predictCodeTag).map(item => {
          return {
            name: item,
            selected: item === this.currentImage.reviewCode
          }
        })
        this.codeList.id = res.data.id
      })
    },
    async getChildrenList (params, type) {
      this.topLoading = true
      const res = await getChildrenList(params)
      this.topLoading = false
      if (res.code === 0) {
        this.directoryTableData.forEach((item, index) => {
          if (index + 1 > params.level - 1) {
            this.$set(this.directoryDataList, item.name, [])
            !type && (this.opCodeSearchForm[index].value = [])
          }
          if (item.level === params.level) {
            this.$set(this.directoryDataList, item.name, res.data)
          }
        })
      }
    },
    changeTime (date, str) {
      if (date.length === 2) this.startTime = ''
      this.opCodeFooterForm.startTime = moment(str[0]).valueOf()
      this.opCodeFooterForm.endTime = moment(str[1]).valueOf()
    },
    calendarChange (date, dateString) {
      if (date.length === 2) {
        this.startTime = ''
      } else {
        this.startTime = date[0]
      }
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
      const { reviewCode, predictCode } = this.currentImage
      if (!reviewCode) {
        this.$set(this.currentImage, 'reviewCode', predictCode)
        await this.saveChange(true)
      }
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
      const { reviewCode, predictCode } = this.currentImage
      if (!reviewCode) {
        this.$set(this.currentImage, 'reviewCode', predictCode)
        await this.saveChange(true)
      }
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
    addTag () {
      // 添加标签
      if (!this.codeList.id) return false
      if (!this.addTagName) {
        this.$message.warning('标签名不能为空')
        return false
      }
      if (this.codeList.predictCodeTag.filter(item => item.name === this.addTagName).length > 0) {
        this.$message.warning('标签名不能重复')
        return false
      }
      this.codeList.predictCodeTag && this.codeList.predictCodeTag.push({
        name: this.addTagName,
        selected: false
      })
      this.editTag()
    },
    async editTag () {
      const params = {
        id: this.codeList.id,
        predictCodeTag: JSON.stringify(this.codeList.predictCodeTag.map(item => item.name))
      }
      const res = await OPCode.editCode(params)
      if (res.code !== 0) return false
      this.addTagName = ''
      this.$message.success('操作成功')
      this.$forceUpdate()
    },
    deleteTag (index) {
      if (!this.codeList.id) return false
      this.codeList.predictCodeTag.splice(index, 1)
      this.editTag()
    },
    selectTag (name, isNext) {
      if (!isNext) {
        this.codeList.predictCodeTag.forEach(el => {
          el.selected = false
          if (name === el.name) el.selected = true
        })
        this.$set(this.currentImage, 'reviewCode', name)
      } else {
        const reverseName = name === 'rework' ? 'turnon' : 'rework'
        this.$set(this.currentImage, name, !this.currentImage[name])
        if (this.currentImage[reverseName]) {
          this.$set(this.currentImage, reverseName, false)
        }
        const { reviewCode, predictCode } = this.currentImage
        this.$set(this.currentImage, 'reviewCode', reviewCode || predictCode)
      }
      this.saveChange(isNext)
    },
    async saveChange (isNext) {
      // 确认修改标签
      if (!this.currentImage.id || !this.codeList.id) return false
      const { rework, turnon, reviewCode, predictCode } = this.currentImage
      const reviewThresholds = this.opCodeFooterForm.codeThreshold.filter(item => {
        return item.code === reviewCode
      })
      let reviewThreshold = 0.5
      if (reviewThresholds.length > 0) {
        reviewThreshold = reviewThresholds[0].value
      }
      const res = await OPCode.editImageTag({
        id: this.currentImage.id,
        reviewCode: reviewCode || predictCode,
        rework,
        turnon,
        reviewThreshold,
        isReview: this.opCodeFooterForm.type
      })
      if (res.code !== 0) false
      this.$message.success('操作成功')
      this.imageList.forEach(el => {
        if (el.id === this.currentImage.id) {
          el.reviewCode = reviewCode
          el.rework = rework
          el.turnon = turnon
        }
      })
      !isNext && this.nextImage()
    },
    disabledDate (current) {
      if (!this.startTime) {
        return current > moment(new Date())
      }
      const time = moment(this.startTime)
      return current && (current > moment(new Date()) || (current < time.subtract(1,'months') || current > time.add(2,'months')))
    },
    handCreate () {
      const { taskId, startTime, endTime, codeThreshold } = this.opCodeFooterForm
      const codeThresholds = {
        codeList: codeThreshold.map(item => item.code).join(','),
        value: codeThreshold.map(item => `${item.code}${item.conf}${item.value}`).join(',')
      }
      const params = {
        conditionJson: {},
        taskId,
        startTime,
        endTime,
        opUniqueCode: this.requestNumber,
        codeThreshold: JSON.stringify(codeThresholds),
        isReplay: this.opCodeFooterForm.type
      }
      this.opCodeSearchForm.forEach(element => {
        const key = this.directoryTableData.filter(item => {
          return item.name === element.name
        })[0].value
        params.conditionJson[key] = '==' + element.value.join(';')
      })
      params.conditionJson = JSON.stringify(params.conditionJson);
      this.$refs.addOpCodeTask.showModal(params)
    },
    addSuccess () {
      this.tabActiveKey = '2'
    },
    closePreview () {
      this.showImagePreview = false
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
    addCode (val) {
      if (this.defaultCodeThreshold[val]) {
        this.opCodeFooterForm.codeThreshold.push({
          code: val,
          conf: '<=',
          value: this.defaultCodeThreshold[val] || 0.5
        })
        this.$set(this.opCodeFooterForm, 'isCodeThreshold', 1)
      }
    },
    delCode (val) {
      let codeIndex = null
      this.opCodeFooterForm.codeThreshold.forEach((item, index) => {
        if (item.code === val) {
          codeIndex = index 
        }
      })
      codeIndex !== null && this.opCodeFooterForm.codeThreshold.splice(codeIndex, 1)
      if (this.opCodeFooterForm.codeThreshold.length === 0) {
        this.$set(this.opCodeFooterForm, 'isCodeThreshold', 2)
      }
    },
    changeAllCodeListVal (val) {
      this.opCodeFooterForm.codeThreshold.forEach(item => {
        item.value = val
      })
      this.$forceUpdate()
    },
    showSelectCodeModal () {
      this.$refs.selectPredictCode.showModal()
    },
    updateSelectCode (data) {
      this.$set(this.opCodeFooterForm, 'codeCount', JSON.parse(JSON.stringify(data)))
    },
    updatePredictCodes (data) {
      this.$set(this.opCodeFooterForm, 'predictCodes', data)
    }
  }
}
</script>
<style>
.ant-select-selection {
  border-radius: 8px !important;
}
</style>
<style lang="less" scoped>
@import "~@/config/theme.less";
//.opCode-search-footer .ant-form-item {
//  margin-bottom: 24px!important;
//}

.ant-form-item {
  margin-bottom: 24px!important;
}



.opCode-search {
  padding-top: 24px;
  border-radius: @borderRadiusBig;
}
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
      &-header{
        overflow: hidden;
        h4{
          line-height: 32px;
          padding-left: 12px;
          float: left;
          width: 33.33%;
        }
      }
      &-content{
        height: calc(100% - 80px);
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
        h4{
          line-height: 32px;
        }
      }
      &-content{
        height: calc(100% - 50px);
        .tag-list{
          border: 1px solid #ccc;
          border-radius: 5px;
          padding: 10px;
          height: calc(100% - 40px);
          overflow-y: auto;
          &-item{
            width: 33%;
            float: left;
            text-align: center;
            line-height: 25px;
            margin-bottom: 10px;
            span{
              display: inline-block;
              cursor: pointer;
              width: 55px;
              position: relative;
              &>.label{
                border: 1px solid #ccc;
                border-radius: 3px;
                display: inline-block;
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
              }
              &.selected .label{
                background: #0072C6;
                color: #fff;
              }
              &:hover{
                .delete{
                  display: inline;
                }
              }
              &>.delete{
                display: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: red;
                color: #fff;
                font-size: 10px;
                line-height: 16px;
                position: absolute;
                right: -8px;
                top: -8px;
                border: none;
              }
            }
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
