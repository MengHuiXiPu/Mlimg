<template>
  <div class="page-content billingDetail">
    <a-spin :spinning="loading">
      <div class="content">
        <!-- <back-title url="/dataCenter/dataMrg/index" style="margin: 10px 0 0 20px" /> -->
        <a-card :bordered="false" class="detailTitle basic-card">
          <a-descriptions :column="{ xs: 1, sm: 2, md: 3}" size="small" :title="'开单ID：' + detailData.displayId" class="detailTitle">
            <a-descriptions-item label="样本数">{{ detailData.imgTotal }}</a-descriptions-item>
            <a-descriptions-item label="任务名称">{{ detailData.taskName }}</a-descriptions-item>
            <a-descriptions-item label="开单题库">{{ detailData.kdDatalistName }}</a-descriptions-item>
            <a-descriptions-item label="turnon准确率">{{ detailData.turnonRate }}</a-descriptions-item>
            <a-descriptions-item label="rework准确率">{{ detailData.reworkRate }}</a-descriptions-item>
            <a-descriptions-item label="创建时间">{{ detailData.createTime | moment }}</a-descriptions-item>
            <a-descriptions-item label="开单阈值"><span class="kdFieldValue">{{ detailData.kdFieldValue }}</span></a-descriptions-item>
          </a-descriptions>
        </a-card>
      </div>
      <div class="content content-no-line">
        <a-card :bordered="false" class="data-card">
          <a-descriptions :column="{ xs: 1, sm: 1, md: 1 }" title="开单详情">
          </a-descriptions>
          <div class="data-card-image">
            <div class="data-card-left">
              <ul class="left-list">
                <li
                  v-for="(val, index) in menuNumber"
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
            <div class="data-card-right">
              <div class="img-top">
                <div>
                  <a-checkbox :checked="misjudgeStatus" @change="changeMisjudgeStatus">判错图片</a-checkbox>
                  <span @click="toMiddleResult">中间结果</span>
                </div>
              </div>
              <div class="img-item" v-for="pictureId in pictureIds" :key="pictureId.id">
                <img
                  :ref="'img_' + pictureId.id"
                  :src="pictureList[pictureId.id]"
                  @click="handleShowLargePicture(pictureId.id)"
                />
                <a-icon v-if="!pictureList[pictureId.id]" type="loading" />
              </div>
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
            <ImagePreview
              v-if="previewImage"
              :menuData="menuNumber"
              :data="pictureIds"
              :default="previewImage"
              :detailData="detailData"
              :pagination="pagination"
              @close="closePreview"
              @save="handleCategorySelect(selectMenu)"
              @page="imagePreviewPageChange"/>
          </div>
        </a-card>
      </div>
    </a-spin>
  </div>
</template>

<script>
import ImagePreview from './imagePreview'
import { billing } from '@/api/appCenter'
export default {
  name: "BuillingDetail",
  components: {
    ImagePreview
  },
  computed: {
    selectImageList () {
      return this.pictureIds.filter(item => item.selected).map(item => item.id)
    }
  },
  data () {
    return {
      loading: false,
      visible: false,
      detailData: {},
      menuNumber: [],
      currentID: null,
      selectMenu: '',
      pictureData: [],
      pictureIds: [],
      pictureList: {},
      pagination: {
        total: 0,
        pageSize: 18,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "30", "50"]
      },
      previewImage: null,
      editType: false,
      misjudgeStatus: false,
      debugPath: ''
    }
  },
  beforeRouteEnter (to, from, next) {
    next((vm) => {
      vm.$nextTick(() => {
        vm.value = '1'
        vm.editType = false
        if (to.query.id !== vm.currentID) {
          vm.currentID = to.query.id
          vm.debugPath = to.query.debugPath
          vm.getData(vm.currentID)
          next()
        } else {
          next()
        }
      })
    })
  },
  mounted () {
  },
  methods: {
    active () {
      this.pagination = {
        total: 0,
        pageSize: 18,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "30", "50"]
      }
      this.pictureIds = []
      this.detailData = {
        id: '开单ID',
        sampleNum: 5000,
        taskName: '在线任务1',
        dlName: '开单题库',
        billingThreshold: 0.5,
        turnon: 0.9,
        rework: 0.8,
        createTime: 1602658301921,
        taskStatus: 1
      }
      this.menuNumber = []
    },
    async getData (id) {
      this.loading = true
      this.active()
      this.getDetailData()
      const res = await billing.getBillingCategory({ kd_id: id })
      this.menuNumber = Object.keys(res.data).map(item => {
        return {
          name: item,
          value: res.data[item]
        }
      })
      this.menuNumber[0] && this.handleCategorySelect(this.menuNumber[0].name)
      this.loading = false
    },
    async getDetailData () {
      const res = await billing.getBilling({ kd_id: this.currentID })
      if (res.code !== 0) return false
      this.detailData = res.data
    },
    changeMisjudgeStatus (e) {
      this.misjudgeStatus = e.target.checked
      this.handleCategorySelect(this.selectMenu)
    },
    // 根据选择的类别获取到对应的图片列表val
    async handleCategorySelect (val, callback) {
      const selectedKey = this.currentID + '_' + val
      if (this.selectMenu !== val) {
        this.selectMenu = val
        this.pagination = {
          total: 0,
          pageSize: 18,
          current: 1,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "30", "50"]
        }
      }
      const res = await billing.getBillingImageList({
        imgCategory: val,
        id: this.currentID,
        limit: this.pagination.pageSize,
        pageNo: this.pagination.current,
        misjudgeStatus: this.misjudgeStatus ? 1 : null
      })
      this.pagination.total = res.data.total
      this.pictureIds = res.data.records
      this.pictureIds.forEach(picId => {
        billing.getBillingImage(picId.id).then(res => {
          picId.url = window.URL.createObjectURL(res)
          this.$set(this.pictureList, picId.id, window.URL.createObjectURL(res))
        })
      })
      if (callback) callback(this.pictureIds)
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
    closePreview (data) {
      this.previewImage = null
      if (data.image) {
        this.toMiddleResult(data)
      }
    },
    selectImage (e, id) {
      this.pictureIds.forEach((item, index) => {
        if (item.id === id) {
          item.selected = e.target.checked
          this.$set(this.pictureIds, index, item)
        }
      })
    },
    toMiddleResult (data) {
      const image = data.image ? this.selectMenu + '/' + data.image : ''
      this.$router.push({
        path: `/application/billing/middleResult`,
        query: { id: this.debugPath, type: 'billing', image }
      })
    }
  }
}
</script>

<style lang="less">
.upload-file{
  max-height: 200px;
  overflow-y: auto;
  .upload-file-item{
    &>span{
      margin-right: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: inline-block;
      vertical-align: bottom;
      width: 300px;
    }
  }
}
.billingDetail{
  .detailTitle.ant-descriptions{
    // font-size: 20px;
    .ant-descriptions-title{
      font-size: 20px;
    }
  }
  .ant-descriptions-title{
    margin-bottom: 10px
  }
  .ant-descriptions-item{
    padding-bottom: 0!important;
    &-label{
      font-size:12px!important;
      color:rgba(9,16,47,1)!important;
    }
    &-content{
      font-size:12px!important;
      color:rgba(9,16,47,1)!important;
    }
  }
  .ant-card-body{
    padding: 5px 0px 0 0;
  }
  .detailTitle{
    .ant-card-body{
      padding: 0 0 0 24px;
    }
  }
  .data-card {
    position: relative;
    &-check{
      position: absolute;
      top: 50px;
      right: 26px;
    }
    &-group{
      position: absolute;
      top: 47px;
      left: 180px;
    }
    &-image{
      overflow: hidden;
      margin-top: 20px;
    }
    .ant-radio-button-wrapper{
      padding: 0 11px;
    }
    &-preview{
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background:rgba(0, 0, 0, 0.3);
      z-index: 106;
      display: flex;
      justify-content: center;
      align-items: center;
      &>:not(.img-list):not(p){
        position: absolute;
        font-size: 75px;
        color: #fff;
        cursor: pointer;
        z-index: 1;
      }
      & * {
        user-select: none;
      }
      .prevArrow{
        left: 20px;
        top: 50%;
        margin-top: -37.5px;
      }
      .nextArrow{
        right: 20px;
        top: 50%;
        margin-top: -37.5px;
      }
      .closePreview{
        top: 10px;
        right: 10px;
      }
      p{
        position: fixed;
        top: 40px;
        left: 50%;
        transform: translate(-50%, 0);
        text-align: center;
        width: 100%;
        font-size: 20px;
        font-weight: bold;
        color: #fff;
        z-index: 1;
      }
      .img-list{
        .img-item{
          float: left;
          height: 80vh;
          position: relative;
          transform: scale(1);
          cursor: pointer;
          img{
            width: auto;
            height: 100%;
          }
        }
      }
    }
    &-left{
      width: 160px;
      padding: 10px;
      float: left;
      background: rgba(247,247,248,1);
      height: 485px;
      .search-sit {
        width: 140px;
        height: 36px;
        background:rgba(255,255,255,1);
        border-radius:2px;
        border:2px solid rgba(230,231,234,1);
      }
      .left-list{
        margin-top: 10px;
        height: calc(100% - 20px);;
        overflow-y: auto;
        &-item{
          height: 24px;
          line-height: 24px;
          padding: 0 10px;
          color: #09102F;
          cursor: pointer;
          overflow: hidden;
          &>.lebel{
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            width: 70px;
            display: inline-block;
          }
          &.select{
            background: #E6E7EA;
            border-radius: 4px;
          }
        }
      }
    }
    &-right{
      width: calc(100% - 160px);
      float: left;
      padding-left: 10px;
      height: 500px;
      .img-top{
        margin-bottom: 5px;
        overflow: hidden;
        &>div{
          float: right;
          margin-right: 10px;
          &>span{
            color: #4064DF;
            cursor: pointer;
            margin-left: 10px
          }
        }
      }
      .img-item{
        width: 16.66%;
        height: 140px;
        padding: 0 10px;
        margin-bottom: 20px;
        min-width: 100px;
        min-height: 100px;
        float: left;
        position: relative;
        cursor: pointer;
        .selectBtn{
          position: absolute;
          left: 12px;
          top: 0;
          z-index: 2;
        }
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
          // transform: translateX(-50%)!important;
          // transform: translateY(-50%)!important;
        }
      }
    }
  }
}
</style>

<style lang="less" scoped>
  .content {
    margin: 5px 30px;
    border-bottom: 1px solid #d4d4d4;
    padding-bottom: 15px;
    &-no-line{
      border: none;
      padding: 0
    }
    &:first-child{
      margin: 5px;
      border-width: 2px;
    }
    .title {
      font-size: 20px;
      color: #09102f;
      font-weight: 500;
      margin-bottom: 10px;
    }

    .content-header {
      display: flex;
      justify-content: space-between;

      .left {
        display: flex;
        flex-direction: column;
      }
    }
  }
  .pagation-image {
    float: right;
    padding: 10px;
  }

  .ant-tabs-tabpane {
    .text-area {
      height: 300px;
      margin: 10px 0px;
    }

  }

  .edit-icon {
    font-size: 16px;
    margin-right: 30px;
  }

  .checkbox-sit {
    position: absolute;
    padding-left: 650px;
  }

</style>
