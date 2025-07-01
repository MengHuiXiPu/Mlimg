<template>
  <div class="middleResult">
    <a-spin :spinning="loading">
      <h4>中间结果分析</h4>
      <div class="middleResult-content">
        <div class="middleResult-content-url">
          <a-breadcrumb>
            <a-breadcrumb-item>当前目录：</a-breadcrumb-item>
            <a-breadcrumb-item v-for="(item, index) in modelSrc" :key="item" v-show="index > 3">
              <span class="srcName" @click="loadSrc(item, index)">{{ item }}</span>
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="middleResult-content-left">
          <div class="middleResult-content-left-search">
            <a-input-search v-model="page.searchItem" placeholder="请输入名称" @search="searchData" />
          </div>
          <div class="middleResult-content-left-content" ref="list">
            <ul>
              <li
                @click="selectedImage(item)"
                v-for="(item, index) in fileList"
                :key="index"
                :title="item.file_name"
                :class="[item.selected && 'selected']"
                :style="{
                  cursor: item.file_type === 3 ? 'no-drop' : 'pointer'
                }">
                <span class="li-icon" v-if="item.file_type === 1"><i class="icon-ai-wenjianjia"></i></span>
                <span class="li-icon" v-if="item.file_type === 2"><i class="icon-ai-tupian"></i></span>
                <span class="li-icon" v-if="item.file_type === 3"><i class="icon-ai-wenjian"></i></span>
                <span>{{ item.file_name }}</span>
              </li>
              <li v-if="showEmpty" style="text-align: center;color: #ccc"><span>没有更多了</span></li>
            </ul>
          </div>
        </div>
        <div class="middleResult-content-right">
          <div v-if="currentImage.file_path" class="middleResult-content-right-image">
            <a-spin :spinning="imageLoading">
              <img ref="img" :src="currentImage.url" @click="showImagePreview = true">
            </a-spin>
          </div>
          <a-empty v-else>
            <span slot="description">支持图片预览</span>
          </a-empty>
        </div>
      </div>
    </a-spin>
    <ImagePreview
      v-if="showImagePreview"
      :data="sampleTableImageList"
      :default="currentImage.file_path"
      :detailData="{ dlTagType: '分类' }"
      :getImageFun="getPicture"
      :pagination="page"
      @close="closePreview"
      @page="imagePreviewPageChange"/>
  </div>
</template>
<script>
import {
  middleResult,
  billing
} from '@/api/appCenter'
import ImagePreview from '../opCode/imagePreview'
import imgTest from '@/assets/img/1.jpg'
export default {
  name: "middleResult",
  beforeRouteEnter (to, from, next) {
    const { id, type, image } = to.query
    next(vm => {
      vm.loading = true
      vm.imageLoading = true
      vm.showEmpty = false
      vm.activePage()
      vm.modelSrc = []
      vm.fileList = []
      vm.currentImage = {}
      vm.getFileList({
        filePath: image ? id + '/' + image : id,
        ...vm.page
      })
    })
  },
  components: {
    ImagePreview
  },
  data () {
    return {
      loading: false,
      imageLoading: false,
      showEmpty: false,
      modelRealSrc: '',
      modelSrc: [],
      fileList: [],
      currentImage: {},
      page: {
        pageNo: 1,
        pageSize: 20,
        searchItem: '',
        current: 1,
        total: 0,
      },
      showImagePreview: false,
      sampleTableImageList: false
    }
  },
  mounted () {
    const list = this.$refs.list
    list.onscroll = this.listScroll
  },
  methods: {
    activePage () {
      this.page = {
        pageNo: 1,
        pageSize: 20,
        searchItem: '',
        current: 1,
        total: 0,
      }
    },
    async selectedImage (record) {
      if (record.file_type === 3) return false
      if (record.selected) return false
      if (record.file_type === 1) {
        // 选中文件夹，请求接口
        this.activePage()
        this.getFileList({
          filePath: record.file_path,
          ...this.page
        })
      } else {
        // 选中图片，加载图片
        this.fileList.forEach(item => {
          item.selected = false
        })
        record.selected = true
        this.currentImage = JSON.parse(JSON.stringify(record))
        this.imageLoading = true
        const res = await this.getPicture(this.currentImage.file_path)
        this.$set(this.currentImage, 'url', window.URL.createObjectURL(res))
        this.$refs.img.onload = () => {
          this.imageLoading = false
        }
      }
    },
    async getPicture (id) {
      return await billing.middleResult.getImage({ filePath: id })
    },
    listScroll (e) {
      if (e.target.scrollTop + e.target.offsetHeight + 3 > e.target.scrollHeight && !this.showEmpty) {
        this.$set(this.page, 'current', this.page.current + 1)
        this.getFileList({
          filePath: this.modelRealSrc,
          ...this.page
        }, 'page')
      }
    },
    searchData () {
      this.getFileList({
        filePath: this.modelRealSrc,
        ...this.page
      })
    },
    loadSrc (item, index) {
      this.activePage()
      this.modelSrc.splice(index + 1, this.modelSrc.length)
      this.getFileList({
        filePath: '/' + this.modelSrc.join('/'),
        ...this.page
      })
    },
    async getFileList (params = {}, page, callback) {
      const { pageNo, current, searchItem, total, pageSize, filePath } = params
      this.loading = true
      const _params = {
        pageNo: current,
        pageSize,
        searchItem,
        filePath
      }
      const res = await billing.middleResult.getFileList(_params)
      this.loading = false
      if (res.code !== 0) return false
      if (page) {
        if (this.fileList.length === res.data.itemTotal) {
          this.showEmpty = true
          return false
        }
        this.fileList.push(...res.data.itemList)
        // this.$set(this.page, 'searchItem', searchItem)
      } else {
        this.fileList = res.data.itemList
        this.showEmpty = false
        this.activePage()
      }
        this.$set(this.page, 'searchItem', searchItem)
      this.page.total = res.data.itemTotal
      if (this.fileList.length > 0 && this.fileList[0].file_type === 2) this.selectedImage(this.fileList[0])
      this.sampleTableImageList = this.fileList.filter(item => item.file_type === 2).map(item => {
        return {
          id: item.file_path,
          name: item.file_name,
          url: '',
          markPositions: [],
          existPicMark: false
        }
      })
      if (callback) callback(true)
      this.modelRealSrc = params.filePath
      this.modelSrc = this.modelRealSrc.split('/')
      this.modelSrc.shift()
    },
    closePreview () {
      this.showImagePreview = false
    },
    async imagePreviewPageChange (data, callback) {
      if (data === 'prev') {
        if (this.page.current === 1) {
          return callback(false)
        }
        this.$set(this.page, 'current', this.page.current - 1)
      } else {
        if (this.page.current === Math.ceil(this.page.total / this.page.pageSize)) {
          return callback(false)
        }
        this.$set(this.page, 'current', this.page.current + 1)
      }
      // this.loadImagePage.current++
      await this.getFileList({
        filePath: '/' + this.modelSrc.join('/'),
        ...this.page
      }, 'page', callback)
    },
  }
}
</script>
<style lang="less" scoped>
.middleResult{
  height: 100%;
  /deep/ .ant-spin-nested-loading, /deep/ .ant-spin-container{
    width: 100%;
    height: 100%;
  }
  h4{
    padding: 16px 0 4px 20px;
    font-size: 16px;
    line-height: 22px;
    font-weight: 600;
  }
  &-content{
    overflow: hidden;
    height: calc(100% - 65px);
    &-url{
      margin-bottom: 15px;
      /deep/ .srcName{
        cursor: pointer;
        &:hover{
          color: #5d81f9;
        }
      }
    }
    &-left{
      width: 20%;
      height: 100%;
      float: left;
      border: 1px solid #ccc;
      height: calc(100% - 36px);
      padding: 5px 10px;
      &-search{
        border-bottom: 1px solid #ccc;
        padding-bottom: 5px;
      }
      &-content{
        max-height: calc(100% - 40px);
        overflow-y: auto;
        ul{
          list-style: none;
          li{
            line-height: 32px;
            cursor: pointer;
            border-radius: 5px;
            padding-left: 3px;
            text-overflow: ellipsis;
            overflow: hidden;
            .li-icon{
              font-weight: bold;
              margin-right: 8px;
            }
            &:hover, &.selected{
              color: #5d81f9;
            }
          }
        }
      }
    }
    &-right{
      float: left;
      width: 80%;
      height: calc(100% - 36px);
      padding: 0 5px;
      &-image{
        height: 100%;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #f1f1f1;
        /deep/ .ant-spin-nested-loading{
          width: 100%;
          height: 100%;
        }
        img{
          width: 100%;
          height: auto;
          max-width: 100%;
          max-height: 100%;
        }
      }
    }
  }
}
</style>