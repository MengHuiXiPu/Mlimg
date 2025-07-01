<template>
  <div class="imageList">
    <a-spin :spinning="exportLoading">
      <div class="imageList-image">
        <div class="imageList-left">
          <div class="search-sit">
            <a-input-search
              placeholder="请输入类别名称"
              @search="onSearch"
              @change="onSearchChange"
            />
          </div>
          <ul class="left-list">
            <li
              v-for="(val, index) in menuData"
              :key="index"
              class="left-list-item"
              :class="{
                select: selectMenu === val.name
              }"
              @click="handleCategorySelect(val.name)">
              <span class="lebel" :title="val.name">{{ val.name }}</span>
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
        <div class="imageList-right">
          <div class="imageList-header">
            <div class="imageList-check">
              <span>筛选条件1：</span>
              <a-select v-model="queryType1" @change="changeMarkRange" style="margin-right: 10px">
                <a-select-option :value="0">全部</a-select-option>
                <a-select-option :value="1">{{'turnon&rework'}}</a-select-option>
                <a-select-option :value="2">turnon</a-select-option>
                <a-select-option :value="3">rework</a-select-option>
              </a-select>
              <span>筛选条件2：</span>
              <a-select v-model="queryType2" @change="changeMarkRange" style="margin-right: 10px">
                <a-select-option :value="0">全部</a-select-option>
                <a-select-option :value="1">预测与复判结果一致</a-select-option>
                <a-select-option :value="2">预测与复判结果不一致</a-select-option>
              </a-select>
              <a @click="exportDataSet">转化为数据集</a>
              <a @click="downloadTask">下载</a>
              <a @click="changeListType">
                <a-icon type="interaction" style="margin-right: 3px" />
                <span>{{ listType ? '列表模式' : '图片模式' }}</span>
              </a>
            </div>
          </div>
          <div class="imageList-right-content">
            <a-spin :spinning="imgListLoading">
              <template v-if="listType">
                <div class="img-item" v-for="pictureId in pictureIds" :key="pictureId.id">
                  <img
                    :id="'img_' + pictureId.id"
                    :src="pictureList[pictureId.id]"
                    @click="handleShowLargePicture(pictureId.id)"
                  />
                  <a-icon v-if="!pictureList[pictureId.id]" type="loading" />
                </div>
              </template>
              <template v-else>
                <a-table
                  :columns="columns"
                  :data-source="pictureIds"
                  :scroll="{ y: '50vh' }"
                  :pagination="false">
                  <span slot="name" slot-scope="text, record">
                    <span
                      class="image-name"
                      @click="handleShowLargePicture(record.id)">
                      {{ text }}
                    </span>
                  </span>
                </a-table>
              </template>
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
      </div>
    </a-spin>
    <ImagePreview
      v-if="previewImage"
      :menuData="menuNumber"
      :data="pictureIds"
      :pictureList="pictureList"
      :default="previewImage"
      :detailData="{ dlTagType: '分类' }"
      :pagination="pagination"
      @close="closePreview"
      @save="handleCategorySelect(selectMenu)"
      @reload="getData(currentID, selectMenu)"
      @page="imagePreviewPageChange"
      @delete="deleteImage"
      @moveTo="moveTo"/>
    <createDataSet ref="createDataSet" />
  </div>
</template>

<script>
import ImagePreview from '@/components/ImagePreview'
import { downloadFile } from '@/utils/util'
import debounce from 'lodash.debounce'
import {
  OPCode
} from "@/api/appCenter"
import createDataSet from './createDataSet'
import moment from 'moment'
export default {
  name: 'opCodeTaskImageList',
  components: {
    ImagePreview,
    createDataSet
  },
  data () {
    return {
      loading: false,
      imgListLoading: false,
      exportLoading: false,
      menuData: [],
      menuNumber: [],
      currentID: null,
      selectMenu: '',
      pictureData: [],
      pictureIds: [],
      pictureList: {},
      pagination: {
        total: 0,
        pageSize: 12,
        current: 1,
        showSizeChanger: false,
        pageSizeOptions: ["16", "20", "24", "28"]
      },
      previewImage: null,
      listType: true,
      queryType1: 0,
      queryType2: 0,
      columns: [{
        title: '图片名称',
        dataIndex: 'imgPath',
        key: 'imgPath',
        width: 475,
        scopedSlots: { customRender: "name" }
      }, {
        title: '算法Code',
        dataIndex: 'predictCode',
        key: 'predictCode',
      }, {
        title: '置信度',
        dataIndex: 'confidence',
        key: 'confidence',
        customRender: (text) => {
          return String(text)
        }
      }, {
        title: '复判Code',
        dataIndex: 'reviewCode',
        key: 'reviewCode',
      }, {
        title: 'turnon标识',
        dataIndex: 'turnon',
        key: 'turnon',
        customRender: (text) => {
          return String(text)
        }
      }, {
        title: 'rework标识',
        dataIndex: 'rework',
        key: 'rework',
        customRender: (text) => {
          return String(text)
        }
      }]
    }
  },
  props: {
    detailData: {
      type: Object,
      default: () => {}
    },
    id: {
      type: String,
      default: ''
    }
  },
  mounted () {
    this.currentID = this.id
    this.active()
    this.getData(this.currentID)
  },
  methods: {
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
    closePreview () {
      this.previewImage = null
      // this.getMenuData(this.currentID)
    },
    changeListType () {
      this.listType = !this.listType
    },
    selectImage (e, id) {
      this.pictureIds.forEach((item, index) => {
        if (item.id === id) {
          item.selected = e.target.checked
          this.$set(this.pictureIds, index, item)
        }
      })
    },
    changeMarkRange () {
      this.pagination = {
        total: 0,
        pageSize: 12,
        current: 1,
        showSizeChanger: false,
        pageSizeOptions: ["16", "20", "24", "28"]
      }
      this.getData(this.selectMenu)
    },
    // 根据选择的类别获取到对应的图片列表val
    async handleCategorySelect (val, callback) {
      if (this.selectMenu !== val) {
        this.selectMenu = val
        this.pagination = {
          total: 0,
          pageSize: 12,
          current: 1,
          showSizeChanger: false,
          pageSizeOptions: ["16", "20", "24", "28"]
        }
      }
      this.imgListLoading = true
      const { taskId, startTime, endTime, conditionJson, isReplay } = this.detailData
      const res = await OPCode.getImageList({
        limit: this.pagination.pageSize,
        pageNo: this.pagination.current,
        taskId,
        startTime,
        endTime,
        isReplay,
        conditionJson,
        queryType1: this.queryType1,
        queryType2: this.queryType2,
        reviewCode: val
      })
      if (res.code !== 0) return false
      this.imgListLoading = false
      this.pagination.total = res.data.total
      this.pictureIds = res.data.records
      if (callback) callback(this.pictureIds)
      this.$forceUpdate()
      this.pictureIds.forEach((picId, index) => {
        picId.selected = false
        if (this.pictureList[picId.id]) {
          picId.url = this.pictureList[picId.id]
          this.$forceUpdate()
        } else {
          // picId.url = `${this.imageUrl}/${picId.id}`
           OPCode.getPicture(picId.id, this.detailData.isReplay).then(res => {
            const url = window.URL.createObjectURL(res)
            picId.url = url
            this.$set(this.pictureList, picId.id, url)
            this.$forceUpdate()
          })
        }
      })
    },
    handleShowLargePicture (imageID) {
      if (this.editType) {
        this.pictureIds.forEach((item, index) => {
          if (item.id === imageID) {
            item.selected = !item.selected
            this.$set(this.pictureIds, index, item)
          }
        })
      } else {
        this.previewImage = imageID
      }
    },
    async getMenuData (id, selectMenu) {
      const { taskId, startTime, endTime, conditionJson, isReplay } = this.detailData
      const res = await OPCode.getImageCodeList({
        taskId,
        startTime,
        endTime,
        conditionJson,
        queryType1: this.queryType1,
        queryType2: this.queryType2,
        isReplay
      })
      if (res.code !== 0) return false
      console.log(res)
      this.menuNumber = res.data.map(item => {
        return {
          name: item.code,
          value: item.count
        }
      }).sort((a, b) => {
        return b.value - a.value
      })
      this.menuData = JSON.parse(JSON.stringify(this.menuNumber))
      if (selectMenu) {
        this.handleCategorySelect(selectMenu)
      } else {
        this.menuNumber[0] && this.handleCategorySelect(this.menuNumber[0].name)
      }
      return res
    },
    async getData (id, selectMenu) {
      this.loading = true
      this.pictureIds = []
      await this.getMenuData(id, selectMenu)
      this.loading = false
    },
    active () {
      this.listType = true
      this.pagination = {
        total: 0,
        pageSize: 12,
        current: 1,
        showSizeChanger: false,
        pageSizeOptions: ["16", "20", "24", "28"]
      }
      this.pictureIds = []
      this.menuNumber = []
    },
    onSearchChange:
      debounce(function (e) {
        this.search = e.target.value
        this.getSearchingDataList()
      }, 300),
    onSearch:
      debounce(function (value) {
        this.search = value
        this.getSearchingDataList()
      }, 300),
    async getSearchingDataList () {
      this.menuData = this.menuNumber.filter(item => {
        return item.name.toLocaleUpperCase().includes(this.search.toLocaleUpperCase())
      })
    },
    exportDataSet () {
      const { taskId, startTime, endTime, conditionJson, isReplay } = this.detailData
      this.$refs.createDataSet.showDialog({
        taskId,
        startTime,
        endTime,
        conditionJson,
        isReplay,
        queryType1: this.queryType1,
        queryType2: this.queryType2
      })
    },
    async downloadTask () {
      const { taskId, startTime, endTime, conditionJson, isReplay } = this.detailData
      const params = {
        limit: 10000,
        pageNo: 1,
        taskId,
        // startTime: moment(startTime).format('YYYY-MM-DD HH:mm:ss'),
        // endTime: moment(endTime).format('YYYY-MM-DD HH:mm:ss'),
        start: startTime,
        end: endTime,
        conditionJson,
        queryType1: this.queryType1,
        queryType2: this.queryType2,
        isReplay
      }
      let url = '/api/v1/applicationcenter/inferenceReviewTaskResult/exportReviewDetail?'
      Object.keys(params).forEach(item => {
        url += item + '=' + params[item] + '&'
      })
      downloadFile(encodeURI(url))
    }
  }
}
</script>

<style lang="less" scoped>
.pagation-image {
  float: right;
  padding: 5px 10px;
}
.imageList {
  &-header{
    height: 40px;
    padding: 0 1%;
  }
  &-check{
    text-align: right;
    .ant-select{
      width: 150px;
    }
    & > a{
      display: inline-block;
      text-align: center;
      margin-left: 10px;
    }
  }
  &-group{
    float: left;
  }
  &-image{
    height: calc(100vh - 405px);
    margin-bottom: 10px;
  }
  .ant-radio-button-wrapper{
    padding: 0 11px;
  }
  &-left{
    background: #fff;
    width: 200px;
    padding: 10px;
    float: left;
    height: 100%;
    border-radius: 16px;
    .search-sit {
      width: 100%;
      height: 36px;
      background:#fff;
      border-radius:2px;
    }
    .left-list{
      margin-top: 10px;
      height: 100%;
      overflow-y: auto;
      list-style: none;
      .addMenu{
        text-align: center;
        line-height: 30px;
        border-radius: 5px;
        margin-top: 3px;
        cursor: pointer;
        &:hover{
          background: #E6E7EA;
        }
      }
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
        &>.lebel{
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          width: 90px;
          display: inline-block;
          margin-left: 5px;
        }
        &.select{
          background: #E6E7EA;
          border-radius: 4px;
        }
        &>.number.isZero{
          .anticon{
            display: none;
            font-size: 18px;
            vertical-align: middle;
            color: red
          }
        }
        &:hover>.number.isZero{
          .ant-badge{
            display: none;
          }
          .anticon{
            display: inline-block;
          }
        }
      }
    }
  }
  &-right{
    width: calc(100% - 216px);
    float: left;
    margin-left: 16px;
    height: 100%;
    background: #fff;
    border-radius: 16px;
    padding: 12px;
    // transition: all 0.5s;
    &-content{
      height: calc(100% - 75px);
      .ant-spin-nested-loading, /deep/ .ant-spin-container{
        height: 100%
      }
    }
    .img-item{
      width: 25%;
      height: calc(33.33% - 10px);
      padding: 0 1%;
      margin-bottom: 10px;
      min-width: 200px;
      float: left;
      position: relative;
      cursor: pointer;
      .selectBtn{
        position: absolute;
        top: 0;
        z-index: 2;
      }
      img{
        width: 100%;
        height: 100%;
        user-select: none;
      }
      &>svg{
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
        padding: 0 10px;
      }
      i{
        position: absolute;
        left: 50%;
        top: 50%;
        font-size: 50px;
        transform: translate3d(-50%, -50%, 0);
        z-index: 2;
        // transform: translateX(-50%)!important;
        // transform: translateY(-50%)!important;
      }
    }
  }
}
</style>