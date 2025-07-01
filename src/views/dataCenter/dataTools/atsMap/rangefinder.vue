<template>
  <a-modal
    :visible="visible"
    :footer="null"
    wrapClassName="fullscreen-modal"
    :mask="false"
    :keyboard="false"
    :destroyOnClose="true"
    :closable="true"
    @cancel="doCloseModal"
  >
  <div class="finder-wrapper">
    <div class="top-header">

    </div>
    <div class="main-box">
      <div class="finder-container" >
        <div class="canvas-header-area">
          <span>光标位置: X：{{  pointTips.x }} &nbsp;Y：{{ pointTips.y }}&nbsp; 距离：{{ pointTips.distance }}</span>
          <span :title="currentImg.picName">图片名称：{{ currentImg.picName }}</span>
          <span>图片像素：{{ currentImg.width }}*{{ currentImg.height }}</span>
        </div>
        <div ref="divRef" id="divRef"></div>
        <div class="canvas-footer-area">
          <!-- 上一张 下一张按钮 -->
           <div class="router-panel">
              <a class="common-link" @click="changeFocusImg(-1)">上一张<a-icon type="caret-left" /></a>
              <a class="common-link" style="margin-left: 20px;" @click="changeFocusImg(1)"><a-icon type="caret-right" />下一张</a>
           </div>
           <div class="toolbar-panel">
            <span>操作工具</span>
            <i class="fa-hand-pointer-o fa fa-x toolbar-icon" :class="{'toolbar-icon-active': activeTool==='s'}" @click="setActiveTool('s')">&nbsp;(S)选择工具</i>
            <span class="toolbar-icon" :class="{'toolbar-icon-active': activeTool==='t'}" @click="setActiveTool('t')"><a-icon type="column-width" />&nbsp;(T)测距</span>
            <span class="toolbar-icon" @click="setActiveTool('c')"><i class="el-icon-aim" />&nbsp;(C)视口居中</span>
           </div>
        </div>
      </div>
      <transition name="rightBox-fade">
        <div class="picture-list scrollbar">
          <div class="img-box" ref="imgBox" v-for="item in imageList" :key="item.id" @click="focusImage($event, item)">
            <div class="img-name" :title="item.picName">{{item.picName}}</div>
            <img :id="'pic_' + item.id" :src="imgSrc(item)" :class="{ 'active-img': item.picUrl === currentImg.picUrl }"/>
          </div>
        </div>
      </transition>
    </div>
    
    </div>
  </a-modal>
</template>

<script>
import { watch } from "vue";
import { App, Text, Line, Image, ImageEvent, PointerEvent, ZoomEvent } from 'leafer-ui';
import '@leafer-in/editor';
import '@leafer-in/view' // 导入视口插件
import '@leafer-in/viewport' // 导入视口插件
import '@leafer-in/find';

let app = null;
let imageEle = null; //当前画布的图片元素
export default {
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
        distance: 0,
      },
      zoomValue: 1, //画布的缩放比例，用于视觉上显示固定的测距线的宽度
    }
  },
  props: {
    imageList: {
      type: Array,
      default: () => {
        return []
      }
    },
    visible: {
      type: Boolean,
      default: false
    },
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
    imgSrc(item) {
      return item.url || require("@/assets/images/place.gif");
    },
    // 关闭 modal 直接退出
    async doCloseModal() {
      this.$emit('update:visible', false)
      // this.$emit('success')
    },
    // 切换图片
    changeFocusImg(index) {
      // 获取当前图片的索引
      const cindex = this.imageList.findIndex(item => item.picUrl === this.currentImg.picUrl);
      const targetIndex = cindex + index
      if (this.imageList[targetIndex]) {
        this.focusImage({}, this.imageList[targetIndex]);
      }
    },
    // 选中图片
    focusImage(event, item) {
      if (item?.picUrl === this.currentImg?.picUrl) return
      // 将之前的图从画布上移除
      const images = app.find('Image') || []
      images.forEach(image => {
        image.destroy()
      });
      // 清除画布上的线
      this.clearCanvasLine()
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
      this.registerCreateLineObserver()
      app.tree.on(ZoomEvent.ZOOM, (event) => {
        // console.log('zoom', event)
        this.zoomValue = Math.round(app.tree.scale * 100) / 100
      })
    },
    /**
     * 清除画布上的线和 text
     */
    clearCanvasLine() {
      // 移除画布上上次测距添加上去的线和 text
      const lineList = app.find('Line') || []
      const textList = app.find('Text') || []
      lineList.forEach(line => {
        line.destroy()
      });
      textList.forEach(text => {
        text.destroy()
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
    /**
     * @description 注册创建测距line 的事件监听，添加到画布上, 并读取距离信息
     */
    registerCreateLineObserver() {
      let startPoint = null; // 鼠标开始位置
      let currentLine = null; // 测量线实例
      let isMeasuring = false; // 是否正在测量
      // 监听鼠标按下
      app.on(PointerEvent.DOWN, (event) => {
        if (!imageEle || this.activeTool !== 't') return
        if (!isMeasuring) {  //发起一次划线测距
          // 鼠标在图上的坐标
          const localPos = imageEle.getBoxPoint(event)
          startPoint = { x: localPos.x, y: localPos.y };
          isMeasuring = true;
          // 移除画布上上次测距添加上去的线和 text
          this.clearCanvasLine()
        } else { //结束一次划线测距
          isMeasuring = false;
          if (currentLine) {
            // 将上次生成的测距线在图上移除
            // app.tree.remove(currentLine);
            // if (currentLine.text) {
            //   app.tree.remove(currentLine.text);
            // }
            currentLine = null;
            startPoint = null;
          }
        }
      });
      app.on(PointerEvent.MOVE, (event) => {
        if (isMeasuring && startPoint && this.activeTool === 't') {
          // 鼠标在图上的坐标
          const localPos = imageEle.getBoxPoint(event)
          const endPoint = { x: localPos.x, y: localPos.y };
          drawLine(startPoint, endPoint);
        }
      });
      const drawLine = (start, end) => {
        const strokeWidth = Math.ceil(3 / this.zoomValue);
        const textFontSize = Math.ceil(20 / this.zoomValue);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (!currentLine) {
          currentLine = new Line({
            points: [start.x, start.y, end.x, end.y],
            stroke: '#32cd79',
            strokeWidth,
            // editable: true,
          });
          app.tree.add(currentLine);
        } else {
          currentLine.points = [start.x, start.y, end.x, end.y];
        }

        const text = `${length.toFixed(2)}px`;
        if (!currentLine.text) {
          currentLine.text = new Text({
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2,
            text: text,
            fill: 'red',
            fontSize: textFontSize,
          });
          app.tree.add(currentLine.text);
        } else {
          currentLine.text.text = text;
          currentLine.text.x = (start.x + end.x) / 2;
          currentLine.text.y = (start.y + end.y) / 2;
        }
        this.pointTips.distance = length.toFixed(2)
      }
    },
    // 监听键盘按键
    handleKeyDown(event) {
      // console.log(event.key)
      if (event.key === 'ArrowUp') {
        this.changeFocusImg(-1)
      } else if (event.key === 'ArrowDown') {
        this.changeFocusImg(1)
      } else if (["s", "c", "t"].includes(event.key)) {
        this.setActiveTool(event.key)
      }
    },
  },
  beforeDestroy() {
    // 移除键盘事件监听
    document.removeEventListener('keyup', this.handleKeyDown);
    // 清除画布
    app.remove()
    app = null
    imageEle = null
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
@canvas-footer-height: 100px;
@bg-color: #daeaff;
@active-color: #00f;
.finder-wrapper {
  height: 99%;
  width: 100%;
  .top-header {
    height: @top-header-height;
    width: 100%;
  }
  .main-box {
    height: calc(100% - 30px);
    display: flex;
    flex-direction: row;
    .finder-container {
      width: calc(100% - 170px);
      height: calc(100vh - @top-header-height - 10px);
      margin: 0 15px;
      // background-color: #f2f2f2;
      .canvas-header-area {
        height: @canvas-header-height;
        line-height: @canvas-header-height;
        display: flex;
        justify-content: space-between;
      }
      #divRef {
        height: calc(100% - @top-header-height - @canvas-footer-height + 10px);
        background-color: #f2f2f2;
      }
      .canvas-footer-area {
        height: @canvas-footer-height;

        .router-panel {
          text-align: center;
          margin-top: 10px;
          /deep/ .anticon {
            font-size: 20px;
            vertical-align: 0;
          }
        }
        .toolbar-panel {
          margin-top: 30px;
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
    }
  }
  .picture-list {
    width: 168px;
    height: 100%;
    overflow: auto;
    background-color: #f2f2f2;
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
        // 超出显示省略号
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        // width: 150px;
        width: 100%;
      }
      .active-img {
        border: 2px solid #1890ff;
      }
    }
  }
  /deep/ .anticon {
    vertical-align: 0.125em;
  }
}
/deep/ .ant-modal-close-x {
  height: 40px;
  line-height: 40px;
  color: @active-color;
}
</style>