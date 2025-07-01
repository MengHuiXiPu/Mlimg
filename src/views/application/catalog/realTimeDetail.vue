<template>
  <div class="detail">
    <div class="detail-info">
      <div class="detail-info-top">
        <a-statistic title="ID号" :value="detail.id" groupSeparator="" />
        <a-statistic title="预测时间" :value="detail.createTime"></a-statistic>
      </div>
      <div class="detail-info-form">
        <a-checkbox v-model="isCode" @change="changeIsCode"></a-checkbox>
        <a-popover title="阈值条件" trigger="click" placement="bottomLeft">
          <template slot="content">
            <div class="detail-info-form-item" v-for="item in codeList" :key="item.code">
              <span>{{ item.code }}</span>
              <a-select v-model="item.conf">
                <a-select-option v-for="conf in confList" :key="conf" :value="conf">{{ conf }}</a-select-option>
              </a-select>
              <a-input-number v-model="item.value" :min="0" :max="1.1" :step="0.0001" />
            </div>
            <div style="text-align: right; margin-top: 10px">
              <a-button type="primary" @click="searchToCode">确定</a-button>
            </div>
          </template>
          <a style="margin: 0 5px">设置阈值条件</a>
        </a-popover>
        <a @click="getDetailData">刷新<a-icon type="reload" :spin="loading"/></a>
      </div>
    </div>
    <div class="detail-content">
      <template v-if="tableData.length > 0">
        <div class="detail-content-left">
          <a-table
            :rowKey="(record) => record.id"
            :columns="columns"
            :data-source="tableData"
            :rowClassName="rowClassName"
            :customRow="getCustomRow"
            @change="tableDataChange"
            :pagination="pagination">
          </a-table>
        </div>
        <div class="detail-content-right">
          <div class="image-item" v-for="item in tableData" :key="item.id">
            <img @click="selectImage(item.id)" :class="item.id === clickRowId && 'selected'" :src="imgList[item.id]">
          </div>
        </div>
      </template>
      <NoData v-else/>
    </div>
    <ImagePreview
      v-if="imagePreviewId"
      :data="sampleTableImageList"
      :default="imagePreviewId"
      :pictureList="imgList"
      :detailData="{ dlTagType: '分类' }"
      :getImageFun="getPicture"
      :pagination="pagination"
      @close="closePreview"
      @page="imagePreviewPageChange"/>
  </div>
</template>

<script>
import { realTimeDetail, OPCode, getModelById } from '@/api/appCenter'
import debounce from 'lodash.debounce'
import ImagePreview from '@/components/ImagePreview'
import moment from 'moment'
import { NoData } from "@/components"
export default {
  name: 'realTimeDetail',
  components: { ImagePreview, NoData },
  data () {
    return {
      loading: false,
      detail: {
        id: '',
        createTime: '',
        msgId: ''
      },
      codeList: [],
      condition: [],
      confList: ['=', '>', '>=', '<', '<='],
      tableData: [],
      isCode: false,
      reloadTime: null,
      imgList: {},
      columns: [{
        title: "图片名称",
        dataIndex: "imgName",
        key: "imgName",
        ellipsis: true
      }, {
        title: "预测结果",
        dataIndex: "predictCode",
        key: "predictCode",
        width: 100
      }, {
        title: "置信度",
        dataIndex: "confidence",
        key: "confidence",
        width: 100
      }],
      pagination: {
        total: 0,
        pageSize: 12,
        current: 1,
        showSizeChanger: false,
        // pageSizeOptions: ["12", "24", "36", "48"],
        showTotal: function (total) {
          return `共 ${total} 条`
        }
      },
      clickRowId: '',
      imagePreviewId: 0,
      sampleTableImageList: [],
    }
  },
  props: {
    configId: {
      default: 0,
      type: Number
    }
  },
  mounted () {
    this.getDetailData()
    this.getTaskDetail()
  },
  beforeDestroy () {
    clearTimeout(this.reloadTime)
  },
  methods: {
    async getTaskDetail () {
      const res = await getModelById(this.configId)
      if (res.code !== 0) return false
      if (res.data.codeThreshold) {
        const codeThreshold = JSON.parse(res.data.codeThreshold)
        this.codeList = Object.keys(codeThreshold).map(item => {
          return {
            code: item,
            conf: '<=',
            value: codeThreshold[item]
          }
        })
      }
    },
    async getDetailData () {
      const params = this.$route.query.id
      this.loading = true
      const res = await realTimeDetail.getDetailData(params)
      this.loading = false
      if (res.code !== 0) return false
      this.$set(this.detail, 'msgId', res.data.msgId)
      this.$set(this.detail, 'createTime', moment(res.data.createTime).format('YYYY-MM-DD HH:mm:ss'))
      if (res.data.transactionId !== this.detail.id) {
        this.$set(this.detail, 'id', res.data.transactionId)
        this.$set(this.pagination, 'current', 1)
        this.getDataList('reload')
      }
      clearTimeout(this.reloadTime)
      this.reloadTime = setTimeout(this.getDetailData, 15 * 1000)
    },
    async getDataList (reload, callback) {
      const params = {
        condition: this.isCode ? this.condition : [],
        limit: this.pagination.pageSize,
        pageNo: this.pagination.current,
        taskId: Number(this.$route.query.id),
        msgId: this.detail.msgId
      }
      const res = await realTimeDetail.getTableData(params)
      if (res.code !== 0) return false
      this.tableData = res.data.records
      this.$set(this.pagination, 'total', res.data.total)
      if (reload) this.imgList = {}
      this.tableData.forEach((item, index) => {
        if (this.imgList[item.id]) return false
        OPCode.getPicture(item.id).then(res => {
          this.$set(this.imgList, item.id, window.URL.createObjectURL(res))
          // this.sampleTableImageList[index].url = this.imgList[item.id]
          window.URL.revokeObjectURL(res)
        })
      })
      this.sampleTableImageList = this.tableData.map(item => {
        return {
          id: item.id,
          name: item.imgName,
          url: this.imgList[item.id],
          markPositions: [],
          existPicMark: false
        }
      })
      if (callback) callback(this.sampleTableImageList)
    },
    searchToCode:
      debounce(function (e) {
        this.isCode = true
        this.condition = this.codeList.map(item => {
          return {
            code: item.code,
            expression: `${item.conf}${item.value}` 
          }
        })
        this.getDataList()
      }, 300),
    changeIsCode:
      debounce(function (e) {
        this.getDataList()
      }, 300),
    tableDataChange (pagination) {
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
      this.getDataList()
    },
    rowClassName (record) {
      return record.id === this.clickRowId ? 'selected' : ''
    },
    getCustomRow (record) {
      return {
        on: {
          click: () => {
            this.clickRowId = record.id
          }
        }
      }
    },
    closePreview () {
      this.imagePreviewId = false
      this.getDetailData()
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
      // this.loadImagePage.current++
      await this.getDataList('', callback)
    },
    async getPicture (id) {
      return await OPCode.getPicture(id)
    },
    selectImage (id) {
      this.imagePreviewId = id
      clearTimeout(this.reloadTime)
    }
  }
}
</script>

<style lang="less" scoped>
.detail{
  padding: 0 10px;
  &-info{
    overflow: hidden;
    border-bottom: 1px solid #ccc;
    position: relative;
    padding-bottom: 15px;
    &-top{
      & > * {
        float: left;
        margin-right: 20px;
        padding-right: 20px;
        min-width: 150px;
        border-right: 1px solid #ccc
      }
    }
    &-form{
      position: absolute;
      right: 5px;
      bottom: 10px;
      &-item{
        margin-top: 10px;
        & > * {
          margin-right: 10px;
          line-height: 30px;
        }
        .ant-select{
          width: 80px;
        }
      }
    }
  }
  &-content{
    margin-top: 10px;
    overflow: hidden;
    height: 67vh;
    &-left{
      width: 40%;
      height: 100%;
      float: left;
      padding-right: 10px;
      .ant-table-wrapper{
        height: 100%
      }
      /deep/ .ant-table-row{
        cursor: pointer;
      }
      /deep/ .ant-table-row.selected{
        background: #0072C6;
        color: #fff;
        &:hover td{
          background: #0072C6;
        }
      }
    }
    &-right{
      width: 60%;
      float: left;
      .image-item{
        float: left;
        width: 25%;
        height: 20vh;
        margin-bottom: 10px;
        padding: 5px;
        img{
          width: 100%;
          height: 100%;
          border: solid #ccc 1px;
          transition: 0.5s all;
          &.selected{
            border: solid #0093ff 5px;
            // transform: scale(1.5);
          }
        }
      }
    }
  }
}
</style>