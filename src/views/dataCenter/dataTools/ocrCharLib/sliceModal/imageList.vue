<template>
  <div 
    class="picture-list scrollbar"
    v-infinite-scroll="loadMore" 
    infinite-scroll-distance="0" 
    infinite-scroll-disabled="loadDisabled"
    infinite-scroll-delay="300"
    infinite-scroll-immediate="false"
  >
    <div class="picture-list-title">原图</div>
    <div class="img-box" ref="imgBox" v-for="item in imageList" :key="item.id" @click="focusImage(item)">
      <div class="img-name text-ellipsis" :title="item.picName">{{item.picName}}</div>
      <img :id="'pic_' + item.id" :src="matchImgSrc(item)" :class="{ 'active-img': item.picUrl === currentImg.picUrl }"/>
    </div>
    <p v-if="loading" class="loading-text" ><i class="el-icon-loading"></i>&nbsp;加载中...</p>
    <div v-if="!loading && loadDisabled">
      <div v-if="imageList.length" style="text-align: center;margin-top: 15px">无更多数据</div>
      <a-empty class="empty-info" :image="simpleImage" description="暂无数据" v-else/>
    </div>
    <!-- 底部占位，可以让用户看到加载中 -->
    <div style="height: 30px;"></div>
  </div>
</template>

<script>
import { getPicList, getPicByPath } from "@/api/tempMake.js";
import { Empty } from 'ant-design-vue';
export default {
  data() {
    return {
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
      imageList: [], // 图片列表
      currentImg: {},
      pagination: {
        pageSize: 10,
        current: 1,
        total: 0,
      },
      loading: false,
    }
  },
  computed: {
    // 判定不再需要滚动加载的标识变量
    loadDisabled() {
      if (!this.pagination.total) return true
      return this.imageList.length && (this.imageList.length >= this.pagination.total)
    },
  },
  props: {
    tempId: {
      type: Number | String,
      default: ""
    }
  },
  methods: {
    /**
     * 分页加载更多图片
     */
    loadMore() {
      if (this.loading) return
      this.pagination.current++
      this.getPictureList()
    },
    // 选中图片
    focusImage(item) {
      this.$emit('focus', item)
    },
    // 获取图片列表
    getPictureList() {
      this.loading = true
      const { current, pageSize } = this.pagination
      getPicList({
        templateMakeInfoId: this.tempId,
        pageNo: current,
        limit: pageSize
      }).then(res => {
        if (res.code === 0) {
          this.pagination.total = res.data.total
          // 遍历去加载缩略图
          res.data.records.forEach(item => {
            getPicByPath(item.picUrl).then(res => {
              const url = window.URL.createObjectURL(res)
              this.$set(item, 'url', url)
            })
          })
          this.imageList = this.imageList.concat(res.data.records)
        }
      }).finally(() => {
        this.loading = false
      })
    },
    // 监听键盘按键
    handleKeyDown(event) {
      if (event.key === 'ArrowUp') {
        this.changeFocusImg(-1)
      } else if (event.key === 'ArrowDown') {
        this.changeFocusImg(1)
      }
    },
    matchImgSrc(item) {
      return item.url || require("@/assets/images/place.gif");
    },
  },
  created() {
    this.getPictureList()
    // 添加键盘事件监听
    document.addEventListener('keyup', this.handleKeyDown);
  },
  beforeDestroy() {
    // 移除键盘事件监听
    document.removeEventListener('keyup', this.handleKeyDown);
  }
}
</script>

<style lang="scss" scoped>
.picture-list {
  margin-top: 10px;
  width: 168px;
  height: 100%;
  overflow: auto;
  background-color: #fff;
  .picture-list-title {
    margin-top: 5px;
    text-align: center;
    // color: #444;
    font-weight: bold;
  }
  .img-box {
    position: relative;
    padding: 4px;
    cursor: pointer;
    & > img {
      // width: 160px;
      width: 100%;
      height: 84px;
    }
    .img-name {
      text-align: center;
      font-size: 12px;
      height: 20px;
      line-height: 20px;
      width: 100%;
    }
    .active-img {
      border: 2px solid #1890ff;
    }
  }
  .loading-text {
    text-align: center;
    height: 20px;
    margin-top: 10px;
  }
}
</style>