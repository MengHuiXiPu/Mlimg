/**
 * 因为el-image监听src，对于blob格式的的图片，会出现偶尔加载不出来的情况
 */
import ElImageViewer from "element-ui/packages/image/src/image-viewer";
export default {
  name: 'image-viewer',
  data() {
    return {
      showViewer: false,
    }
  },
  components: {
    ElImageViewer,
  },
  props: {
    // 图片地址
    src: {
      default: ""
    },
    // 初始预览缩影
    initialIndex: {
      type: Number,
      default: 0
    },
    // 预览图片列表
    urlList: {
      type: Array,
      default: () => ([])
    },
    height: {
      type: String,
      default: '100px'
    },
    width: {
      type: String,
      default: '100px'
    },
    // 同原始object-fit
    objectFit: {
      type: String,
      default: 'fill'
    },
    appendToBody: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    defaultImg() {
      return require("@/assets/images/place.gif");
    },
  },
  methods: {
    onClickImg(event, src) {
      if (!src) return
      this.showViewer = true
    },
    onClosePreviewer() {
      this.showViewer = false
    },
    // 图片加载失败的处理
    loadImgError(e) {
      try {
        e.target.src = require("@/assets/images/place.gif")
      } catch (e) {
        console.error(e)
      }

    }
  },
  render(h) {
    return (
      <div class="el-image">
        <img
          style={{ cursor: "pointer", "object-fit": this.objectFit }}
          src={this.src}
          width={this.width}
          height={this.height}
          {...{ attrs: this.$attrs }}
          onClick={event => this.onClickImg(event, this.src)}
          onError={this.loadImgError}
        ></img>
        {
          this.showViewer ?
            <el-image-viewer
              initialIndex={this.initialIndex}
              props={{
                // 这里的onClose是以属性传入，否则会被当成事件 无法被执行
                onClose: this.onClosePreviewer,
                appendToBody: this.appendToBody,
              }}
              urlList={this.urlList}
              {...{ attrs: this.$attrs }}
            /> : null
        }
      </div>
    )

  }
}