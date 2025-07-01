<template>
  <div class="page-content image-search">
    <div class="image-search-tabs">
      <span class="selected">查询工具</span>
    </div>
    <div class="image-search-config">
      <a-spin :spinning="formLoading">
        <p style="font-weight: bold;">基本查询信息</p>
        <div class="opCode-search-item" v-for="(item, index) in opCodeSearchForm" :key="item.id">
          <a-form-model
            :model="item"
            :labelCol="{ span: 6 }"
            :wrapperCol="{ span: 18 }"
            layout="horizontal"
            labelAlign="left"
          >
            <a-form-model-item
              :label="item.name"
              required>
              <a-select
                v-model="item.value"
                showSearch
                :filter-option="filterOption"
                :mode="item.multiple ? 'multiple' : 'default'"
                @change="changeParent(item, index + 1)"
              >
                <a-select-option v-for="(option, optionIndex) in directoryDataList[item.id]" :key="optionIndex" :value="option">
                  {{ option }}
                </a-select-option>
              </a-select>
            </a-form-model-item>
          </a-form-model>
        </div>
        <a-form-model
          :model="opCodeFooterForm"
          layout="horizontal"
          :labelCol="{ span: 6 }"
          :wrapperCol="{ span: 18 }"
          labelAlign="left"
        >
          <a-form-model-item required label="时间段" :labelCol="{ span: 24 }" style="margin: -16px 0 0 0">
          </a-form-model-item>
          <a-form-model-item
            :labelCol="{ span: 0 }"
            :wrapperCol="{ span: 24 }">
            <a-range-picker
              v-model="opCodeFooterForm.dateRangValue"
              format="YYYY-MM-DD HH:mm:ss"
              :show-time="{ format: 'HH:mm:ss' }"
              :disabled-date="disabledDate"
              style="width: 100%"
              @change="changeTime"
              @calendarChange="calendarChange"
            />
          </a-form-model-item>
          <a-form-model-item label="Code">
            <a-select
              v-model="opCodeFooterForm.codes"
              showSearch
              :filter-option="filterOption"
              mode="multiple">
              <a-select-option v-for="item in predictCodeList" :key="item" :value="item">
                {{ item }}
              </a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item label="图片类型">
            <a-select
              v-model="opCodeFooterForm.imgConfIds"
              showSearch
              :filter-option="filterOption"
              mode="multiple">
              <a-select-option v-for="item in imageTypeList" :key="item.id" :value="item.id">
                {{ item.name }}
              </a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item style="text-align: right" :wrapperCol="{ span: 24 }">
            <a-button :disabled="dataLoading" type="primary" @click="search()">查询</a-button>
          </a-form-model-item>
        </a-form-model>
      </a-spin>
    </div>
    <div class="image-search-content">
      <a-spin :spinning="dataLoading">
        <div class="image-search-content-chart">
          <p style="font-weight: bold;">
            概览
            <span
              style="float: right;cursor:pointer;color:#050dff;font-weight:normal"
              @click="createDataSet"
              v-if="menuNumber.length !== 0">制作数据集</span>
          </p>
          <echart
            v-if="menuNumber.length !== 0"
            :styleObj="'100%'"
            :option="option"
          />
          <a-empty v-else></a-empty>
        </div>
        <div class="image-search-content-image">
          <p style="font-weight: bold;">详情({{ this.imageTotal }}张)</p>
          <div class="image-search-content-image-content" v-if="menuNumber.length !== 0">
            <div class="data-card-left">
              <span style="margin-left: 10px;font-size: 12px;font-weight: bold;">Code列表</span>
              <ul class="left-list">
                <li
                  v-for="(val, index) in menuNumber"
                  :key="index"
                  class="left-list-item"
                  :class="{
                    select: selectMenu === val.name
                  }"
                  @click="handleCategorySelect(val.name)">
                  <span class="label" :title="val.name">{{ val.name }}</span>
                  <span class="number" :class="val.value === 0 && 'isZero'" style="float: right">
                    <a-badge
                      :overflow-count="9999"
                      :count="val.value"
                      show-zero
                      :number-style="{ backgroundColor: '#52c41a' }"
                    />
                  </span>
                </li>
              </ul>
            </div>
            <div class="data-card-right">
              <a-spin :spinning="imgListLoading">
                <div class="img-item" v-for="pictureId in pictureIds" :key="pictureId.id">
                  <img
                    :ref="'img_' + pictureId.id"
                    :src="pictureList[pictureId.id]"
                    @click="previewImage = pictureId.id"
                  />
                  <a-icon v-if="!pictureList[pictureId.id]" type="loading" />
                </div>
              </a-spin>
            </div>
            <div class="pagation-image">
              <a-pagination
                :show-total="() => `共 ${pagination.total} 条`"
                show-quick-jumper
                :defaultPageSize="pagination.pageSize"
                :default-current="pagination.current"
                :current="pagination.current"
                :total="pagination.total"
                show-less-items
                @change="pageChange"
              />
            </div>
          </div>
          <a-empty v-else></a-empty>
        </div>
      </a-spin>
    </div>
    <ImagePreview
      v-if="previewImage"
      :menuData="menuNumber"
      :data="pictureIds"
      :pictureList="pictureList"
      :detailData="{ dlTagType: '分类' }"
      :default="previewImage"
      :getImageFun="getImage"
      :pagination="pagination"
      @close="closePreview"
      @page="imagePreviewPageChange"/>
    <create-data-set
      :queryId="queryId"
      :codeList="menuNumber"
      ref="createDataSet" />
  </div>
</template>

<script>
import { Echart } from "@/components"
import ImagePreview from '@/components/ImagePreview'
import createDataSet from './createDataSet'
import {
  inferenceCatalogConfList,
  imageSearch,
  taskGroupConfig
} from '@/api/appCenter'
import debounce from 'lodash.debounce'
import moment from 'moment'
export default {
  name: 'imageSearch',
  components: {
    Echart,
    ImagePreview,
    createDataSet
  },
  data () {
    return {
      imageTotal: 0,
      opCodeSearchForm: [],
      opCodeFooterForm: {},
      directoryTableData: [],
      directoryDataList: {},
      predictCodeList: [],
      searchParam: {},
      startTime: '',
      menuNumber: [],
      pictureList: {},
      pictureIds: [],
      imgListLoading: false,
      dataLoading: false,
      formLoading: false,
      selectMenu: '',
      previewImage: '',
      pagination: {
        total: 0,
        pageSize: 12,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "30", "50"]
      },
      option: {
        color: ["#0098d9", "#2b821d", "#005eaa", "#339ca8", "#cda819", "#32a487"],
        grid: {
          top: 30
        },
        yAxis: {
          name: '数量',
          type: 'value'
        },
        legend: {
          show: true
        },
        tooltip: {
          show: true
        }
      },
      rangeMax: 30
    }
  },
  beforeRouteEnter (to, from, next) {
    next((vm) => {
      vm.$nextTick(() => {
        vm.option = { ...vm.option }
        next()
      })
    })
  },
  mounted () {
    this.getDataList()
    this.getRangeData()
    this.getImageTypeList()
  },
  methods: {
    async getRangeData () {
      const res = await imageSearch.getRangeConfig()
      if (res.code !== 0) return false
      this.rangeMax = res.data || 30
    },
    async getDataList () {
      const list = await inferenceCatalogConfList()
      if (list.code === 0) {
        this.directoryTableData = list.data.records
        this.opCodeSearchForm = list.data.records.map(item => {
          const multiple = item.value === 'MESSAGE.BODY.PROCESSOPERATIONNAME' || item.value === 'MESSAGE.BODY.PRODUCTSPECNAME'
          return {
            id: String(item.id),
            name: item.name,
            value: multiple ? [] : '',
            multiple
          }
        })
      }
      this.changeParent(undefined, 0)
    },
    changeParent (record, index) {
      this.opCodeSearchForm.forEach((item, _index) => {
        if (item.value) {
          this.searchParam[item.id] = item.multiple ? item.value.join() : item.value
        }
        if (_index >= index) {
          item.value = item.multiple ? [] : ''
          delete this.searchParam[item.id]
          delete this.directoryDataList[item.id]
        }
      })
      this.$set(this.opCodeFooterForm, 'codes', [])
      this.$forceUpdate()
      if (Object.keys(this.searchParam).length === this.opCodeSearchForm.length &&
        this.opCodeFooterForm.startDate && this.opCodeFooterForm.endDate) this.getCode()
      if (this.opCodeSearchForm[index]) this.getChildrenList(this.opCodeSearchForm[index].id)
    },
    async getChildrenList (id) {
      this.formLoading = true
      const res = await imageSearch.getChildrenCodeList({
        searchParam: this.searchParam
      })
      this.formLoading = false
      if (res.code !== 0) return false
      this.$set(this.directoryDataList, id, res.data)
    },
    changeTime (date, str) {
      if (date.length === 2) this.startTime = ''
      // this.opCodeFooterForm.startDate = moment(str[0]).valueOf() - moment(str[0]).valueOf() % (32 * 60 * 60 * 1000)
      // this.opCodeFooterForm.endDate = moment(str[1]).valueOf() + ((16 * 60 * 60 * 1000) - moment(str[0]).valueOf() % (24 * 60 * 60 * 1000))
      this.opCodeFooterForm.startDate = moment(str[0]).valueOf()
      this.opCodeFooterForm.endDate = moment(str[1]).valueOf()
      if (Object.keys(this.searchParam).length === this.opCodeSearchForm.length &&
        this.opCodeFooterForm.startDate && this.opCodeFooterForm.endDate) this.getCode()
    },
    calendarChange (date, dateString) {
      if (date.length === 2) {
        this.startTime = ''
      } else {
        this.startTime = date[0]
      }
    },
    disabledDate (current) {
      if (!this.startTime) {
        return current > moment(new Date())
      }
      const time = moment(this.startTime)
      const time1 = moment(this.startTime)
      // return current && (current > moment(new Date()) || (current < time.subtract(1,'months') || current > time.add(2,'months')))
      return current && (current > moment(new Date()) || (current < time.subtract(this.rangeMax,'days') || current > time1.add(this.rangeMax,'days')))
    },
    closePreview () {
      this.previewImage = null
    },
    async getCode () {
      const params = {
        searchParam: this.searchParam,
        startDate: this.opCodeFooterForm.startDate,
        endDate: this.opCodeFooterForm.endDate
      }
      this.formLoading = true
      const res = await imageSearch.getCodeList(params)
      this.formLoading = false
      if (res.code !== 0) return false
      this.predictCodeList = res.data
    },
    async getImageTypeList () {
      this.formLoading = true
      const res = await taskGroupConfig.getDataList({
        limit: 99999999,
        pageNo: 1
      })
      this.formLoading = false
      if (res.code !== 0) return false
      this.imageTypeList = res.data.records
    },
    async search () {
      const { startDate, endDate } = this.opCodeFooterForm
      if (!startDate || !endDate) {
        this.$message.warning('当前还有条件未选择，请确认')
        return false
      }
      this.menuNumber = []
      this.imageTotal = 0
      const params = {
        searchParam: JSON.stringify(this.searchParam),
        codes: this.opCodeFooterForm.codes || [],
        imgConfIds: this.opCodeFooterForm.imgConfIds || [],
        startDate,
        endDate
      }
      this.dataLoading = true
      const res = await imageSearch.getCodeListNumber(params)
      this.dataLoading = false
      if (res.code !== 0) return false
      if (!res.data.codeData || res.data.codeData.length === 0) return false
      this.menuNumber = res.data.codeData.map(item => {
        return {
          name: item.fileCategory,
          value: item.imgCount
        }
      }).sort((a, b) => {
        return b.value - a.value
      })
      this.imageTotal = this.menuNumber.map(item => item.value).reduce((total, item) => {
        return total + item
      })
      this.queryId = res.data.queryId
      this.option = {
        ...this.option,
        legend: {
          show: false
        },
        xAxis: {
          name: 'Code',
          type: 'category',
          data: this.menuNumber.map(item => item.name)
        },
        series: [{
          name: 'Code数量',
          data: this.menuNumber.map(item => item.value),
          type: 'bar',
          barWidth: 50
        }]
      }
      this.menuNumber.length > 0 && this.handleCategorySelect(this.menuNumber[0].name)
    },
    async handleCategorySelect (code, callback) {
      if (this.selectMenu !== code) {
        this.selectMenu = code
        this.pagination = {
          total: 0,
          pageSize: 12,
          current: 1,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "30", "50"]
        }
      }
      const params = {
        searchParam: this.searchParam,
        startDate: this.opCodeFooterForm.startDate,
        endDate: this.opCodeFooterForm.endDate,
        fileCategory: this.selectMenu,
        limit: this.pagination.pageSize,
        pageNo: this.pagination.current
      }
      this.imgListLoading = true
      const res = await imageSearch.getImageList(params)
      this.imgListLoading = false
      if (res.code !== 0) return false
      this.pictureIds = res.data.records.map(item => {
        return {
          id: item.imgId,
          name: item.imgName
        }
      })
      if (callback) callback(this.pictureIds)
      this.pagination.total = res.data.total
      this.pictureIds.forEach(item => {
        if (this.pictureList[item.id]) return false
        imageSearch.getImage(item.id).then(data => {
          item.url = window.URL.createObjectURL(data)
          this.$set(this.pictureList, item.id, item.url)
        })
      })
      this.$forceUpdate()
    },
    getImage (id) {
      return imageSearch.getImage(id)
    },
    pageChange (page, pageSize) {
      this.pagination.pageSize = pageSize
      this.pagination.current = page
      this.handleCategorySelect(this.selectMenu)
    },
    async imagePreviewPageChange (data, callback) {
      if (data === 'prev') {
        if (this.pagination.current === 1) {
          return callback([])
        }
        this.$set(this.pagination, 'current', this.pagination.current - 1)
      } else {
        if (this.pagination.current === Math.ceil(this.pagination.total / this.pagination.pageSize)) {
          return callback([])
        }
        this.$set(this.pagination, 'current', this.pagination.current + 1)
      }
      await this.handleCategorySelect(this.selectMenu, callback)
    },
    createDataSet () {
      this.$refs.createDataSet.showDialog()
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
  }
}
</script>

<style lang="less" scoped>
.image-search{
  height: 100%;
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
  &-config{
    width: 250px;
    float: left;
    border-right: 1px solid #ccc;
    padding-right: 10px;
    height: calc(100% - 70px);
  }
  &-content{
    float: left;
    width: calc(100% - 250px);
    padding: 0 10px;
    border-left: 1px solid #ccc;
    margin-left: -1px;
    &-chart{
      height: 300px;
    }
    &-image{
      overflow: hidden;
      margin-bottom: 10px;
      &-content{
        .data-card{
          &-left{
            width: 200px;
            float: left;
            border: 1px solid #e4e4e4;
            box-shadow: 0px 0px 2px #ccc;
            height: 540px;
            .left-list{
              margin-top: 10px;
              height: 393px;
              overflow-y: auto;
              list-style: none;
              &-item{
                height: 24px;
                line-height: 24px;
                padding: 0 10px;
                color: #09102F;
                cursor: pointer;
                overflow: hidden;
                &>label{
                  display: inline-block;
                  vertical-align: top;
                }
                &>.label{
                  text-overflow: ellipsis;
                  overflow: hidden;
                  white-space: nowrap;
                  width: 90px;
                  display: inline-block;
                  margin-left: 5px;
                }
                &.select, &:hover{
                  background: #E6E7EA;
                  border-radius: 4px;
                }
              }
            }
          }
          &-right{
            width: calc(100% - 200px);
            float: left;
            padding-left: 10px;
            height: 495px;
            .img-item{
              width: 25%;
              height: 150px;
              padding: 0 10px;
              margin-bottom: 20px;
              min-width: 100px;
              min-height: 100px;
              float: left;
              position: relative;
              cursor: pointer;
              img{
                width: 100%;
                height: 100%;
                user-select: none;
              }
              i{
                position: absolute;
                left: 50%;
                top: 50%;
                font-size: 50px;
                transform: translate3d(-50%, -50%, 0);
                z-index: 2;
              }
            }
          }
        }
        .pagation-image {
          float: right;
          padding: 10px;
        }
      }
    }
  }
}
</style>