<template>
  <div>
    <div id="frame" class="frame" @wheel="onwheel">
      <header>
        {{  `X： ${Math.round(mousePoint.x) } &nbsp;&nbsp;Y：${Math.round(mousePoint.y)}`  }}
      </header>
      <canvas class="canvas" id="canvas" ref="imageCanvas" resize 
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
      />
      <!-- 标注合成后指定标注参数名称的选择modal -->
      <select-category ref="refSelectCategory"></select-category>
    </div>
  </div>
</template>

<script>
import { getPicture } from "@/api/modelManage";
import paper from "paper";
import { useState } from "../hooks/state.js"
import { getSourcePicById } from "@/api/runtorun.js"
import  EventBus  from "@/utils/bus.js";
import ActionMixin from "./tools/action.mixin.js";
import { generateId } from "../../util.js";
// import BboxMixin from './tools/Bbox.mixin.js'
export default {
  mixins:[ActionMixin],
  data() {
    return {
      paper: null,  //paerjs实例
      image: {
        raster: {},
        scale: 1,
        metadata: {},
        ratio: 0,
        rotate: 0,
        id: null,
        url: "",
        dataset: 0,
        previous: null,
        next: null,
        filename: "",
        categoryIds: [],
        data: null,
        // 记录初始图片位置和缩放，后面移动/缩放graph后一键还原时使用
        initialPosition:  null, 
        initialZoom: null,
      },
      // zoom: 0.2,
      // shapesGroup: null,
    }
  },
  methods: {
    // 重置graph位置和缩放比例
    resetView() {
      if(!this.paper?.view) return
      this.paper.view.center = this.image.initialPosition;
      this.paper.view.zoom = this.image.initialZoom;
    },
    removeViewListener() {
      if(this.paper.view) {
        this.paper.view.off('mousedown');
        this.paper.view.off('mousedrag');
        this.paper.view.off('mouseup');
        this.paper.view.off('mousemove');
      }
    },
    initCanvas() {
      this.removeViewListener()
      let canvas = document.getElementById("canvas");
      // 初始化 Paper.js 使用指定的 canvas 元素
      this.paper.setup(canvas);

      // 创建一个 Raster 对象来加载图像
      this.image.raster = new this.paper.Raster(this.image.url);

      // 确保图像加载完成后再进行处理
      this.image.raster.onLoad = () => {
         // 获取 canvas 的尺寸
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // 获取图像的尺寸
        const imageWidth = this.image.raster.size.width;
        const imageHeight = this.image.raster.size.height;

        // 计算适合 canvas 的缩放比例
        const scaleX = canvasWidth / imageWidth;
        const scaleY = canvasHeight / imageHeight;
        const scale = Math.min(scaleX, scaleY); // 保持图像纵横比
        // 更新缩放比例
        // this.image.scale = scale; //不使用缩放，使用固定值1
        // 应用缩放
        // this.image.raster.scale(scale);

        // 将图像居中
        this.image.raster.position = this.paper.view.center;
        // scale < 1时，说明存在宽或高超出canvas，即图大，zoom应set小，即缩图
        this.paper.view.zoom = scale * 0.8;
        // 记录初始位置和缩放
        this.image.initialPosition = this.paper.view.center.clone();
        this.image.initialZoom = this.paper.view.zoom;
        // 初始化图形组
        this.shapesGroup = Object.freeze(new this.paper.Group()); // 新增图形组
        // this.createRectangle([ 564, 215, 974, 641 ])
          // this.createCircle([564, 215]); // 示例坐标 [x, y]
      };
      // 注册view的事件监听来处理抓手，bbox等工具的交互（拖拽，划区域等）
      this.setupActionHandler()
    },

    onwheel(e) {
      e.preventDefault();
      // if (!this.doneLoading) return;
      let View = this.paper.view;
      if (e.ctrlKey) {
        // Pan up and down
        let delta = new paper.Point(0, 0.5 * e.deltaY);
        View.setCenter(View.center.add(delta));
      } else if (e.shiftKey) {
        // Pan left and right
        let delta = new paper.Point(0.5 * e.deltaY, 0);
        View.setCenter(View.center.add(delta));
      } else {
        const zoomFactor = 1.1;
        if (e.deltaY < 0) {
          // 放大
          View.zoom *= zoomFactor;
        } else {
          // 缩小
          View.zoom /= zoomFactor;
        }
        // 保持图像在画布中央
        const canvasCenter = View.bounds.center;
        const delta = View.center.subtract(canvasCenter);
        View.center = View.center.subtract(delta);
      }
      return false;
    },
    /**
     * @public 加载大图, 并查询对应图片的推理结果
     * @param {*} focusId 
     */
    async loadImage(focusId) {
      if(!focusId) { //清空画布
        this.paper?.project && this.paper.project.clear();
        return
      }
      this.setGroupLoading(focusId)
      try {
        const { id, dataType,dlId } = this.configData
        // 本地上传图片 or  //数据集图片
        let res = dataType === 0 ? await getSourcePicById(focusId) : await getPicture(focusId)
        this.image.url = window.URL.createObjectURL(res)
        this.initCanvas()
        // 创建canvas后再查询推理结果，因为推理结果可能要在canvas上绘图
        await this.queryOutputs({
          configId: id,
          dataType,
          dlId,
          pictureId: focusId,
          page: 1,
          size: 100000
        })
        this.setGroupLoading([])
      }catch(e) {
        console.error(e)
        this.setGroupLoading([])
      }
      
    },
    /**
     * @public 根据坐标及w,h创建rect
     * @param {*} rect 
     */
    createRectangle(rect = []) {
      if(rect.length && rect.length !== 4) return this.$message.warning("rect数据不合法")
      const [x, y, width, height] = rect;
      const scale = this.image.scale
      // 计算相对于 canvas 的坐标
      // let canvasX = (x * scale) + (this.paper.view.center.x - (this.image.raster.size.width * scale / 2));
      // let canvasY = (y * scale) + (this.paper.view.center.y - (this.image.raster.size.height * scale / 2));
      // 还需要考虑画布view被移动的情况（滚轮事件中会使用setCenter），改为以下写法
      const canvasX = (x * scale) + (this.image.raster.bounds.topLeft.x);
      const canvasY = (y * scale) + (this.image.raster.bounds.topLeft.y);
      let rectangle = new paper.Path.Rectangle({
        point: [canvasX, canvasY],
        size: [width * scale, height *scale],
        // size: [width , height],
        fillColor:  new this.paper.Color(0, 1, 1, 0.6), // rgba(0, 255, 255, 0.6) // 内部填充红色
        strokeColor: 'white', // 边框颜色为白色
        strokeWidth: 0, // 边框宽度为0像素
        // 用作path的标识
        data: {id: generateId(rect)}
      });
      this.shapesGroup.addChild(rectangle);
      this.paper.view.draw();
    },
    /**
     * @public 根据坐标创建Point
     * @param {*} coord 
     */
    createCircle(coord = []) {
      if(coord.length && coord.length !== 2) return this.$message.warning("point数据不合法")
      const [x, y] = coord;
      const scale = this.image.scale
      // 计算相对于 canvas 的坐标
      // const canvasX = (x * scale) + (this.paper.view.center.x - (this.image.raster.size.width * scale / 2));
      // const canvasY = (y * scale) + (this.paper.view.center.y - (this.image.raster.size.height * scale / 2));
      const canvasX = (x * scale) + (this.image.raster.bounds.topLeft.x);
      const canvasY = (y * scale) + (this.image.raster.bounds.topLeft.y);
      let circle = new paper.Path.Circle({
        center: [canvasX, canvasY],
        radius: 5, // 设定圆点的半径
        fillColor: 'red' // 设定圆点的填充颜色
      });
      this.shapesGroup.addChild(circle);
      this.paper.view.draw();
    },
    /**
     * 清除 shapesGroup 中的所有图形
     */
    clearShapes() {
      // 清除 shapesGroup 中的所有图形
      if (this.shapesGroup) {
        this.shapesGroup.removeChildren();
        this.paper.view.draw();
      }
    }
  },
  setup(props, {} ) {
    const { configData, setConfigData, setGroupLoading, queryOutputs, activeTool, annotations,setAnnotations, shapesGroup } = useState()
    return {
      configData,
      setConfigData,
      setGroupLoading,
      queryOutputs,
      activeTool,

      shapesGroup,
      annotations,
      setAnnotations,
    }
  },
  created () {
    this.paper = new paper.PaperScope();
    EventBus.$on("r2rReloadImage", this.loadImage)
    EventBus.$on("r2rCreateRect", this.createRectangle)
    EventBus.$on("r2rCreateCircle", this.createCircle)
    EventBus.$on("r2rClearShapes", this.clearShapes)
    EventBus.$on("r2rCenterView", this.resetView)
    // EventBus.$on("r2rToggleViewPath", this.toggleViewPath)
    // this.r2rCenterView()
  },
  beforeDestroy() {
    EventBus.$off("r2rReloadImage")
    EventBus.$off("r2rCreateRect")
    EventBus.$off("r2rCreateCircle")
    EventBus.$off("r2rClearShapes")
    EventBus.$off("r2rCenterView")
    // EventBus.$off("r2rToggleViewPath")
    this.removeViewListener()
  },
  beforeMount() {

  }
}
</script>

<style lang="less" scoped>
.frame{ 
  width: 100%;
  height: 100%;
  header {
    height: 36px;
    line-height: 36px;
    background-color: #bedcff;
    border-bottom: 1px solid #f2f2f2;
    border-radius: 8px 8px 0 0;
    padding: 0 15px;
  }
  #canvas {
    width: 100%;
    height: calc(100% - 46px);
    background-color: #bedcff;
    border-radius: 0 0 8px 8px;
  }
}
</style>