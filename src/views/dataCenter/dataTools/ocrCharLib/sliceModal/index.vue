<template>
  <a-modal
    :visible="visible"
    :footer="null"
    wrapClassName="fullscreen-modal"
    :mask="false"
    :keyboard="false"
    :destroyOnClose="true"
    :closable="false"
    @cancel="doCloseModal"
  >
    <div class="slice-img-wrapper">
      <div class="top-header space-between">
        <!-- 占位  使得banner-text居中 -->
        <span></span>
        <span class="banner-text">请使用截图工具，完成字符库的截取</span>
        <a-button type="primary" @click="doCloseModal" size="medium" class="close-btn">退出截图工具</a-button>
      </div>
      <div class="main-box">
        <div class="canvas-wrapper" >
          <div class="canvas-header-area space-between">
            <span class="position-text">光标位置: X：{{  pointTips.x }} &nbsp;Y：{{ pointTips.y }}</span>
            <span :title="currentImg.picName" class="pic-name-text text-ellipsis">{{ currentImg.picName }}</span>
            <span>图片像素：{{ currentImg.width }}*{{ currentImg.height }}</span>
          </div>
          <div ref="divRef" id="divRef"></div>
          <div class="canvas-footer-area">
            <span>操作工具</span>
            <i class="fa-hand-pointer-o fa fa-x toolbar-icon" :class="{'toolbar-icon-active': activeTool==='s'}" @click="setActiveTool('s')">&nbsp;(S)选择工具</i>
            <span class="toolbar-icon" :class="{'toolbar-icon-active': activeTool==='t'}" @click="setActiveTool('t')"><a-icon type="column-width" />&nbsp;(T)测距</span>
            <span class="toolbar-icon" @click="setActiveTool('c')"><i class="el-icon-aim" />&nbsp;(C)视口居中</span>
          </div>
        </div>
        <!-- 图片列表 -->
        <imageList :tempId="tempId" @focus="focusImage" class="picture-list scrollbar"/>
        <!-- 配置面板 -->
        <div class="config-panel">
            <header class="right-header">操作区</header>
            <div class="right-content">
            </div>

        </div>
      </div>
    </div>
  </a-modal>
</template>

<script>
/**
 * @description 截取字符图作业页面
 */
import { watch } from "vue";
import { getPicList, getPicByPath } from "@/api/tempMake.js";
import { App, Text, Line, Image, ImageEvent, PointerEvent, ZoomEvent } from 'leafer-ui';
import imageList from './imageList.vue'
import '@leafer-in/editor';
import '@leafer-in/view' // 导入视口插件
import '@leafer-in/viewport' // 导入视口插件
import '@leafer-in/find';

let app = null;
let imageEle = null; //当前画布的图片元素
export default {
  name: 'sliceModal',
  components: {
    imageList,
  },
  data() {
    return {
      activeTool: 't',  //s: 选择工具  t: 测距工具  c: 适应画布
      // 当前画布上的图片
      currentImg: {
        width: 0,
        height: 0,
        name: '',
      },
      pointTips: {
        x: 0, // 当前鼠标位置咋图片上的 x 坐标
        y: 0, // 当前鼠标位置咋图片上的 y 坐标
      },
      zoomValue: 1, //画布的缩放比例，用于视觉上显示固定的测距线的宽度
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    tempId: {
      type: Number | String,
      default: ""
    }
  },
  methods: {
    setActiveTool(tool) {
      if (tool === 't') {
        app.config.move.drag = false;
        this.activeTool = tool;
      }
      if (tool === 's') {
        app.config.move.drag = true;
        this.activeTool = tool;
      }
      if (tool === 'c') {
        app.tree.zoom('fit', 50, null, true)
      }
    },
    // 关闭 modal 直接退出
    async doCloseModal() {
      this.$emit('update:visible', false)
      // this.$emit('success')
    },
    // 选中图片
    focusImage(item) {
      if (item?.picUrl === this.currentImg?.picUrl) return
      // 清除画布上的旧图
      this.clearCanvas()
      this.currentImg = item;
      // 将 focus 图片添加到画布
      imageEle = new Image({
        url: item.url,
        draggable: false,
        editable: false,
      })
      imageEle.once(ImageEvent.LOADED, (e) => {
        const imgWidth = e.image.width
        const imgHeight = e.image.height
        this.currentImg.width = imgWidth
        this.currentImg.height = imgHeight
        // console.log('image loaded', this.currentImg)
        // 缩放适应画布
        requestAnimationFrame(() => {
          app.tree.zoom('fit', 50, null, true)
          // 不知道为何，toolbar 中监听不到 手动调用app.tree.zoom()的缩放事件的,只能监听到鼠标滚轮触发的 zoom 事件，所以这里手动触发
          app.tree.emit(ZoomEvent.ZOOM)
        })
      })
      app.tree.add(imageEle)
    },
    // 初始化画布
    initLeafer() {
      app = new App({
        view: 'divRef',
        fill: '#F2F2F2', // 背景色
        zoom: { min: 0.02, max: 256 },
        move: {
          drag: false
        },
        // ground: { type: 'viewport' },
        editor: {
          resizeable: true, //调整大小
          skewable: true, // 倾斜
          rotateable: true, // 允许旋转
          circle: { width: 16, height: 16 },
        },
        tree: { type: 'design' }, // 添加 tree 层
        sky: {}  // 添加 sky 层
      });
      this.positionObserver()
      app.tree.on(ZoomEvent.ZOOM, (event) => {
        // console.log('zoom', event)
        this.zoomValue = Math.round(app.tree.scale * 100) / 100
      })
    },
    /**
     * 清除画布之前的图片
     */
    clearCanvas() {
      const images = app.find('Image') || []
      images.forEach(image => {
        image.destroy()
      });
    },
    // 监听鼠标移动事件
    positionObserver() {
      // 监听鼠标移动事件
      const throttledMouseMove = (event) => {
        if (!imageEle) return
        // 获取相对于图片的坐标
        const imagePoint = imageEle.getBoxPoint(event)
        this.pointTips.x = imagePoint.x.toFixed();
        this.pointTips.y = imagePoint.y.toFixed();
      }
      app.on(PointerEvent.MOVE, throttledMouseMove)
    },

    // 监听键盘按键
    handleKeyDown(event) {
      if (["s", "c", "t"].includes(event.key)) {
        this.setActiveTool(event.key)
      }
    },
  },
  beforeDestroy() {
    // 移除键盘事件监听
    document.removeEventListener('keyup', this.handleKeyDown);
    // 清除画布
    app.destroy()
    app = null
    imageEle = null
  },
  created() {

  },
  mounted() {
    // 添加键盘事件监听
    document.addEventListener('keyup', this.handleKeyDown);
    this.$nextTick(() => {
      this.initLeafer()
    })
  },
  setup(props) {
    return {
      // visible,
    };
  }
}
</script>

<style lang="less" scoped>
@top-header-height: 40px;
@canvas-header-height: 30px; // 画布头部信息显示区域高度
@canvas-footer-height: 30px;
@bg-color: #daeaff;
@active-color: #00f;
.slice-img-wrapper {
  height: 100%;
  width: 100%;
  background: #f2f2f2;
  .top-header {
    height: @top-header-height;
    line-height: @top-header-height;
    padding: 0 20px;
    background-color: #d7edf7;
    width: 100%;
    color: #e6a23c;
  }
  .main-box {
    height: calc(100vh - @top-header-height - 10px);
    display: flex;
    flex-direction: row;
    .canvas-wrapper {
      flex: 1;
      height: 100%;
      margin: 0 15px;
      // background-color: #f2f2f2;
      .canvas-header-area {
        height: @canvas-header-height;
        line-height: @canvas-header-height;
        .position-text {
          display: inline-block;
          // width: 200px;
        }
        .pic-name-text {
          display: inline-block;
          max-width: 50%;
        }
      }
      #divRef {
        height: calc(100% - @top-header-height - @canvas-footer-height + 10px);
        background-color: #f2f2f2;
      }
      .canvas-footer-area {
        height: @canvas-footer-height;
        line-height: @canvas-footer-height;
        background-color: @bg-color;
        padding: 0 50px;
        font-size: 15px;
        .toolbar-icon {
          margin: 0 15px;
          height: 30px;
          line-height: 30px;
          cursor: pointer;
          // font-size: 14px;
        }
        .toolbar-icon-active {
          color: @active-color;
        }
      }
    }
    .config-panel {
      margin-top: 10px;
      width: 300px;
      height: calc(100vh - 60px);
      border-top: 1px solid #f2f2f2;
      border-left: 1px solid #f2f2f2;
      background-color: #fff;
      padding-left: 10px;
      .right-header {
        height: 40px;
        text-align: center;
        line-height: 40px;
        font-weight: 600;
      }
      .right-content {
        background-color: #d7edf7;
        height: calc(100% - 40px);
        overflow: auto;
        padding: 15px 10px;
        .label-header {
          display: block;
          color: #333;
          font-size: 14px;
          font-weight: 700;
          margin: 10px 0;
        }
      }
    }
  }

  /deep/ .anticon {
    vertical-align: 0.125em;
  }
}
// /deep/ .ant-modal-close-x {
//   height: 40px;
//   line-height: 40px;
//   color: @active-color;
// }
/deep/ .fullscreen-modal .ant-modal {
  width: 100% !important;
  height: 100vh;
  top: 0;
  padding: 0;
}
/deep/ .fullscreen-modal .ant-modal-body {
  height: 100vh;
  padding: 0 5px 5px;
  // background-color: @bg-color-g;
}
</style>