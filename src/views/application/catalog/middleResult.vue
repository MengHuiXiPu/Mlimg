<template>
  <div class="middleResult">
    <a-spin :spinning="loading">
      <h4>中间结果分析</h4>
      <div class="middleResult-content">
        <div class="middleResult-content-url">
          <a-breadcrumb>
            <a-breadcrumb-item>当前目录：</a-breadcrumb-item>
            <a-breadcrumb-item v-for="(item, index) in modelSrc" :key="item" v-show="index > 2">
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
              <img ref="img" :src="currentImage.url">
            </a-spin>
          </div>
          <a-empty v-else>
            <span slot="description">支持图片预览</span>
          </a-empty>
        </div>
      </div>
    </a-spin>
  </div>
</template>
<script>
import {
  middleResult
} from '@/api/appCenter'
import imgTest from '@/assets/img/1.jpg'
export default {
  name: "middleResult",
  beforeRouteEnter (to, from, next) {
    const { id } = to.query
    next(vm => {
      vm.loading = true
      vm.imageLoading = true
      vm.showEmpty = false
      vm.page = {
        pageNo: 1,
        pageSize: 20,
        searchItem: ''
      }
      vm.modelSrc = []
      vm.fileList = []
      vm.currentImage = {}
      vm.getModelSrc(id)
    })
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
        searchItem: ''
      }
    }
  },
  mounted () {
    const list = this.$refs.list
    list.onscroll = this.listScroll
  },
  methods: {
    selectedImage (record) {
      if (record.file_type === 3) return false
      if (record.selected) return false
      if (record.file_type === 1) {
        // 选中文件夹，请求接口
        this.page = {
          pageNo: 1,
          pageSize: 20,
          searchItem: ''
        }
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
        const params = {
          filePath: this.currentImage.file_path
        }
        this.currentImage.url = middleResult.getImage(params)
        this.imageLoading = true
        this.$nextTick(() => {
          this.$refs.img.onload = () => {
            this.imageLoading = false
          }
        })
      }
    },
    listScroll (e) {
      if (e.target.scrollTop + e.target.offsetHeight + 3 > e.target.scrollHeight && !this.showEmpty) {
        this.page.pageNo++
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
      this.page = {
        pageNo: 1,
        pageSize: 20,
        searchItem: ''
      }
      this.modelSrc.splice(index + 1, this.modelSrc.length)
      this.getFileList({
        filePath: '/' + this.modelSrc.join('/'),
        ...this.page
      })
    },
    async getFileList (params, page) {
      this.loading = true
      const res = await middleResult.getFileList(params)
      this.loading = false
      if (res.code !== 0) return false
      if (page) {
        if (this.fileList.length === res.data.itemTotal) {
          this.showEmpty = true
          return false
        }
        this.fileList.push(...res.data.itemList)
        this.page = {
          pageNo: params.pageNo,
          pageSize: 20,
          searchItem: params.searchItem
        }
      } else {
        this.fileList = res.data.itemList
        this.showEmpty = false
        this.page = {
          pageNo: 1,
          pageSize: 20,
          searchItem: ''
        }
      }
      this.modelRealSrc = params.filePath
      this.modelSrc = this.modelRealSrc.split('/')
      this.modelSrc.shift()
    },
    async getModelSrc (id) {
      const params = {
        taskId: id
      }
      this.loading = true
      const res = await middleResult.fetchRunningResultData(params)
      this.loading = false
      if (res.code !== 0) return false
      this.modelRealSrc = res.data.rootPath
      if (this.modelRealSrc) {
        this.modelSrc = this.modelRealSrc.split('/')
        this.modelSrc.shift()
      }
      this.fileList = res.data.itemList
    }
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