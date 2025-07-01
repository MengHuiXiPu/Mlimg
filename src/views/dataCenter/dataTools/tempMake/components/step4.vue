<template>
  <div class="step4-wrapper">
    <!-- <a-spin :spinning="spinning"> -->
    <div class="left-wrapper">
      <div class="left-content scrollbar">
        <div class="img-list" v-if="maskImages.length">
          <div class="img-list-item" v-for="image in maskImages" :key="image.id">
            <div class="img-list-item-name" :title="image.name">{{ image.name }}</div>
            <el-image style="width: 150px; height: 150px" :src="imgSrc(image)"  fit="contain"  :preview-src-list="previewImageUrlList">
              <div slot="placeholder" class="image-slot">
                加载中<span class="dot">...</span>
              </div>
            </el-image>
          </div>
        </div>
        <a-empty style="line-height: 30;" :image="simpleImage" description="暂无Mask图片，请点击右侧按钮生成" v-else></a-empty>
      </div>
      <div class="right-panel">
        <a-button type="primary" size="medium" @click="callGenerateMaskImage">生成 mask 图</a-button>
        <div style="margin-top: 20px;">
          最新生成时间
          <span>{{ generateTime|moment }}</span>
        </div>
      </div>
    </div>
    <!-- </a-spin> -->
  </div>
  
</template>

<script>
import { Empty } from 'ant-design-vue';
import { generateMask, getTempDeteil, getPicByPath } from "@/api/tempMake.js";
export default {
  name: 'step4',
  data() {
    return {
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
      spinning: true,
      maskImages: [], //mask 图片列表
      generateTime: '',
    }
  },
  props: {
    tempData: {
      type: Object,
      default: () => ({})
    },
  },
  computed: {
    // 预览图片url列表
    previewImageUrlList() {
      return this.maskImages.map(item => {
        return item.url
      })
    }
  },
  methods: {
    /**
     * @public
     */
    nextStep() {
      return new Promise((resolve, reject) => {
        if (!this.maskImages.length) {
          this.$message.error('未生成Mask图，无法进入下一步')
          reject()
        } else {
          resolve()
        }
      })
    },
    imgSrc(item) {
      return item.url || require("@/assets/images/place.gif");
    },
    // 点击生成 mask 图
    async callGenerateMaskImage() {
      if (this.maskImages.length) { //已存在要二次确认
        this.$confirmEle(`该操作会重新生成 mask图，请确认`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }).then(() => {
          this.generateMaskImage()
        }).catch(() => {
        });
      } else {
        this.generateMaskImage()
      }
    },
    // 调用算法生成 mask 图
    generateMaskImage() {
      const loading = this.$GLoading("生成Mask图中")
      generateMask({
        templateMakeInfoId: this.tempData.id,
      }).then(res => {
        if (res.code === 0) {
          this.loadMaskImages()
        }
      }).finally(() => {
        loading.close()
      })
    },
    loadMaskImages() {
      getTempDeteil(this.tempData.id, {
        needFrontendConfigs: false,
      }).then(res => {
        if (res.code === 0) {
          this.maskImages = res.data.masks || []
          // mock 出 20 张mask 图
          // for (let i = 0; i < 20; i++) {
          //   this.maskImages.push(res.data.masks[0])
          // }
          // 后端没返回更新时间
          this.generateTime = (res.data.masks || [])[0]?.createTime
          // 循环加载图片 url
          this.maskImages.forEach(item => {
            // 后端没有返回图片名称，从 path 中截取最后一段作为名称
            // 使用 '/' 分割路径
            const parts = (item?.path || '').split('/');
            // 获取最后一个部分，即文件名
            const fileName = parts[parts.length - 1];
            item.name = fileName
            getPicByPath(item.path).then(imgRes => {
              const url = window.URL.createObjectURL(imgRes)
              this.$set(item, 'url', url)
            })
          })
        }
      })
    }
  },
  activated() {
    // console.log(this.tempData)
    this.loadMaskImages()
  }
}
</script>

<style lang="less" scoped>
.step4-wrapper {
  height: 100%;
  width: 100%;
}
.left-wrapper {
  height: 95%;
  width: 100%;
  display: flex;
  flex-direction: row;
  .left-content {
    // flex: 1;
    width: calc(100% - 280px);
    // height: calc(100vh - 80px);
    height: calc(100vh - 90px);
    padding: 20px 0px 20px 50px;
    overflow: auto;
    .img-list {
      &-item {
        display: inline-block;
        height: 170px;
        margin: 15px;
        &-name {
          text-align: center;
          width: 150px;
          // 超出显示省略号
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
  .right-panel {
    width: 280px;
    height: 100%;
    padding: 20px 15px;
    overflow: auto;
    border-left: 1px solid #e8e8e8;
    // border-top: 1px solid #e8e8e8;
  }
}
</style>