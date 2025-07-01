<template>
  <div class="image-preview-billing">
    <a-spin :spinning="listLoad" wrapperClassName="loading" tip="正在加载...">
      <div class="toa-left-list">
        <div class="file-make">
          <span class="middleResult" @click="toMiddleResult" title="查看中间结果">
            查看中间结果
          </span>
          <span class="quit" @click="closePreview" title="退出">
            <a-icon type="close" />
          </span>
        </div>
      </div>
      <div class="image-preview-billing-content">
        <div class="billingInfo">
          <p>图片名称：{{ currentImage.name }}</p>
          <p>预测类别：{{ String(currentImage.kdCode) }}</p>
          <p>置信度：{{ String(currentImage.quota) }}</p>
        </div>
        <div class="prevArrow" @click="prevImage">
          <a-icon type="left-circle" />
        </div>
        <div class="nextArrow" @click="nextImage">
          <a-icon type="right-circle" />
        </div>
        <div class="img-list">
          <div
            class="img-item"
            :style="{
              cursor: 'grab'
            }"
            :ref="'image-' + pictureId.id"
            v-for="pictureId in previewImgList"
            :key="pictureId.id"
            v-show="pictureId.id === previewImage"
            @mouseenter="mouseEnterImage"
            @mouseleave="mouseLeaveImage"
            @mousedown="mouseDownImage">
            <img :ref="'img_' + pictureId.id" :src="pictureId.url" draggable="false" />
          </div>
        </div>
        <div class="currentImageNumber">
          <span>{{ currentImageIndex + '/' + (pagination.total || previewImgList.length)}}</span>
        </div>
        <div class="codeInfo">
          <pre>{{ currentImage.codeInfo }}</pre>
        </div>
      </div>
      <div class="tool-list">
        <span class="rotate" @click="rotateImg" title="旋转">
          <a-icon type="sync" />
        </span>
      </div>
    </a-spin>
  </div>
</template>

<script>
import { billing } from '@/api/appCenter'
import debounce from 'lodash.debounce'
export default {
  name: 'ImgPreview',
  data () {
    return {
      listLoad: false,
      previewImgList: [],
      previewImage: null,
      previewZoomType: {
        scale: 1,
        rotate: 0,
        moveType: false
      }
    }
  },
  props: {
    data: {
      type: Array,
      default: null,
      required: false
    },
    default: {
      type: Number,
      default: 0,
      required: false
    },
    menuData: {
      type: Object,
      default: null,
      required: false
    },
    detailData: {
      type: Object,
      default: () => {},
      required: false
    },
    getImageFun: {
      type: Function,
      default: null
    },
    pagination: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    currentImage () {
      let image = {
        id: 1,
        name: 'img.jpg'
      }
      if (this.previewImgList.length > 0 && this.previewImage) {
        image = this.previewImgList.filter(picture => picture.id === this.previewImage)[0]
        const code = JSON.stringify(JSON.parse(image.middleResultJson), null, 4)
        image.codeInfo = code
      }
      return JSON.parse(JSON.stringify(image))
    },
    currentImageIndex () {
      let current = 0
      this.data.forEach((item, index) => {
        if (item.id === this.previewImage) current = index
      })
      return current + 1 + this.pagination.pageSize * (this.pagination.current - 1)
    }
  },
  beforeDestroy () {
    document.removeEventListener('DOMMouseScroll', this.mouseWheel, {
      capture: true,
      passive: false
    })
    window.removeEventListener('mousewheel', this.mouseWheel, {
      capture: true,
      passive: false
    })
  },
  mounted () {
    if (this.data) {
      this.previewImgList = JSON.parse(JSON.stringify(this.data))
      this.previewImage = this.default
      this.previewImgList.forEach(item => {
        if (!item.url) {
          this.getImage(item)
        } else if (item.id === this.previewImage) {
          this.$nextTick(() => {
            this.activeArea()
          })
        }
      })
    }
  },
  methods: {
    async getImage (item) {
      this.listLoad = true
      const res = await billing.getBillingImage(item.id)
      this.listLoad = false
      item.url = window.URL.createObjectURL(res)
      this.$nextTick(() => {
        this.activeArea()
        this.$forceUpdate()
      })
    },
    activeArea () {
      this.previewImgList.forEach(img => {
        if (img.id === this.previewImage) {
          const image = this.$refs['img_' + img.id][0]
          const _image = this.$refs['image-' + img.id][0]
          _image.style.transform = 'scale(1) rotate(0deg)'
        }
      })
    },
    prevImage () {
      this.previewImgList.some((item, index, arr) => {
        if (item.id === this.previewImage) {
          const _image = this.$refs['image-' + item.id][0]
          _image.style.transform = 'scale(1) rotate(0deg)'
          if (arr[index - 1]) {
            const { pageSize, current, total } = this.pagination
            if ((index) % pageSize === 0 && Math.ceil((index + (pageSize * (current - 1) - arr.length)) / pageSize) !== current) {
              this.listLoad = true
              this.$emit('page', 'prev', () => {
                this.listLoad = false
                this.previewImage = arr[index - 1].id
              })
            } else {
              this.previewImage = arr[index - 1].id
            }
          } else {
            this.listLoad = true
            this.$emit('page', 'prev', (res) => {
              if (res.length !== 0) {
                if (res[res.length - 1].url) return false
                this.getImage(res[res.length - 1]).then(() => {
                  this.listLoad = false
                  this.previewImgList.unshift(...res)
                  this.$nextTick(() => {
                    this.previewImage = res[res.length - 1].id
                  })
                })
              } else {
                this.listLoad = false
                // this.previewImage = arr[arr.length - 1].id
              }
            })
          }
          return true
        }
      })
      this.backUpData = []
      this.areaPositionList = []
      this.previewZoomType.scale = 1
      this.previewZoomType.rotate = 0
      this.activeArea()
    },
    nextImage () {
      this.previewImgList.some((item, index, arr) => {
        if (item.id === this.previewImage) {
          const _image = this.$refs['image-' + item.id][0]
          _image.style.transform = 'scale(1) rotate(0deg)'
          if (arr[index + 1]) {
            const { pageSize, current, total } = this.pagination
            if ((index + 1) % pageSize === 0 && Math.ceil((index + 2 + (pageSize * (current - 1) - arr.length)) / pageSize) !== current) {
              this.listLoad = true
              this.$emit('page', 'next', () => {
                this.listLoad = false
                this.previewImage = arr[index + 1].id
              })
            } else {
              this.previewImage = arr[index + 1].id
            }
            this.$nextTick(() => {
              if (!this.currentImage.url) {
                this.getImage(arr[index + 1])
              }
            })
          } else {
            this.listLoad = true
            this.$emit('page', 'next', (res) => {
              if (res.length !== 0) {
                if (res[0].url) return false
                this.getImage(res[0]).then(() => {
                  this.listLoad = false
                  this.previewImgList.push(...res)
                  this.$nextTick(() => {
                    this.previewImage = res[0].id
                  })
                })
              } else {
                this.listLoad = false
                // this.previewImage = arr[0].id
              }
            })
          }
          return true
        }
      })
      this.areaPositionList = []
      this.backUpData = []
      this.previewZoomType.scale = 1
      this.previewZoomType.rotate = 0
      this.activeArea()
    },
    closePreview (image) {
      this.previewImage = null
      this.previewZoomType.scale = 1
      this.previewZoomType.rotate = 0
      this.$emit('close', image)
    },
    mouseEnterImage () {
      if (document.addEventListener) { // 兼容Firefox
        document.addEventListener('DOMMouseScroll', this.mouseWheel, {
          capture: true,
          passive: false
        })
      }
      window.addEventListener('mousewheel', this.mouseWheel, {
        capture: true,
        passive: false
      })
    },
    mouseLeaveImage (e) {
      e = e || window.event
      if (document.addEventListener) { // 兼容Firefox
        document.removeEventListener('DOMMouseScroll', this.mouseWheel, {
          capture: true,
          passive: false
        })
      }
      window.removeEventListener('mousewheel', this.mouseWheel, {
        capture: true,
        passive: false
      })
      // this.mouseUpImage()
    },
    mouseWheel (e) {
      if (event.ctrlKey === true || event.metaKey) {
        // 当鼠标在图片上是禁用浏览器默认事件（浏览器缩放）
        event.preventDefault()
        e = e || window.event
        let transformObj = null
        // 解决Firfox不兼容e.path属性
        const path = e.path || (event.composedPath && event.composedPath())
        path.some(node => {
          if (node.className === 'img-item') {
            transformObj = node
            return true
          }
        })
        if (!transformObj) return false
        // 图片缩放速度
        const speed = 0.05
        // zoom值在火狐中无效，这里改用transforms:scale
        if (e.wheelDelta) { // IE/Opera/Chrome
          if (e.wheelDelta > 0) {
            this.previewZoomType.scale = this.previewZoomType.scale + speed
          } else {
            this.previewZoomType.scale = this.previewZoomType.scale - speed
          }
        } else if (e.detail) { // Firefox
          if (e.detail > 0) {
            this.previewZoomType.scale = this.previewZoomType.scale - speed
          } else {
            this.previewZoomType.scale = this.previewZoomType.scale + speed
          }
        }
        const cssArray = transformObj.style.transform.split(' ')
        cssArray[0] = `scale(${this.previewZoomType.scale})`
        transformObj.style.transform = cssArray.join(' ')
      }
    },
    mouseDownImage (e) {
      e = e || window.event
      let transformObj = e.target
      transformObj.onmousemove = () => {
        this.mouseMoveImage()
      }
      transformObj.onmouseup = () => {
        this.mouseUpImage()
      }
      this.previewZoomType.moveType = true
    },
    mouseMoveImage (e) {
      // 绘制标注时，当前函数不执行
      e = e || window.event
      if (!this.previewZoomType.moveType) return false
      let transformObj = e.target
      const style = window.getComputedStyle(transformObj.parentNode)
      const top = style.top
      const left = style.left
      const image = this.$refs['img_' + this.previewImage][0]
      const _image = this.$refs['image-' + this.previewImage][0]
      const scaleX = image.naturalWidth / _image.offsetWidth
      const scaleY = image.naturalHeight / _image.offsetHeight
      // e.movementX：mousemove函数每次执行鼠标移动的距离
      transformObj.parentNode.style.top = Number(top.substring(0, top.indexOf('px'))) + e.movementY / scaleY + 'px'
      transformObj.parentNode.style.left = Number(left.substring(0, left.indexOf('px'))) + e.movementX / scaleX + 'px'
    },
    mouseUpImage (e) {
      this.previewZoomType.moveType = false
    },
    rotateImg () {
      const _image = this.$refs['image-' + this.previewImage][0]
      const cssArray = _image.style.transform.split(' ')
      this.$set(this.previewZoomType, 'rotate', this.previewZoomType.rotate === 270 ? 0 : this.previewZoomType.rotate + 90)
      if (!cssArray[0]) cssArray[0] = 'scale(1)'
      cssArray[1] = `rotate(${this.previewZoomType.rotate}deg)`
      _image.style.transform = cssArray.join(' ')
    },
    toMiddleResult () {
      this.closePreview({ image: this.currentImage.name })
    }
  }
}
</script>

<style lang="less" scoped>
@import url('./style.less');
</style>