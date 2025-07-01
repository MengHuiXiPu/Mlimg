
import { generateId } from "../../../util.js";
import selectCategory from "../selectCategory.vue";
export default {
  components: {
    selectCategory,
  },
  data() {
    return {
      isDragging: false, // 是否正在拖拽
      dragStartPoint: null, // 拖拽开始的点
      mousePoint: { //转换过的相对于图片的坐标
        x: 0,
        y: 0
      }
      // startX: 0,
      // startY: 0,
    }
  },
  computed: {
    // 抓手工具是否激活
    isSelectToolActive() {
      return this.activeTool === 'select'
    },
    // bbox工具是否激活
    isRectToolActive() {
      return this.activeTool === 'bbox'
    },
  },
  methods: {
    /**
     * 处理拖动
     */
    setupActionHandler() {
      const canvas = document.getElementById("canvas");
      let rectPath = null;    
      let startPoint = null;  //bbox第一次点击坐标点
      // 监听鼠标按下事件
      this.paper.view.onMouseDown = (event) => {
        // 当抓手工具时
        if(this.isSelectToolActive) {
          canvas.style.cursor = 'grabbing';
        // 检查鼠标是否点击在图像上
        // if (this.image.raster.bounds.contains(event.point)) {
          this.isDragging = true;
          this.dragStartPoint = event.point
        // }
        }
        // 当bbox时
        if (this.isRectToolActive) {
          if (!startPoint) {
            if(!this._isPointInsideImage(event.point)) return
            // 第一次点击，设置起始点
            startPoint = event.point;
            rectPath = new this.paper.Path.Rectangle({
              from: startPoint,
              to: startPoint,
              strokeColor: 'black',
              strokeWidth: 1,
              fillColor: new this.paper.Color(0, 1, 1, 0.6) // 半透明填充颜色
            });
          } else {
            // 第二次点击，完成矩形框的绘制
            const bounds = rectPath.bounds;
            const _startPoint = startPoint.subtract(this.image.raster.bounds.topLeft)
            const rectCoordinates = {
              x: Math.round(_startPoint.x),
              y: Math.round(_startPoint.y),
              width: Math.round(bounds.width),
              height: Math.round(bounds.height),
            };
            // console.log('Rectangle Coordinates:', rectCoordinates);
            const rect = [rectCoordinates.x, rectCoordinates.y, rectCoordinates.width, rectCoordinates.height]

            startPoint = null; // 先重置起始点，否则move里仍会执行（此时已经渲染出modal了） 会影响交互
            this.$refs.refSelectCategory.invoke().then(res => {
              // 将标注上报
              this.setAnnotations("Add", {
                id: generateId(rect),
                segment: rect,
                visible: true,
                parameterName: res.name
              })
              // 向rectpath添加自定义属性
              rectPath.data.id = generateId(rect)
              // 将矩形添加到 shapesGroup 中
              this.shapesGroup.addChild(rectPath);
            }).catch(() => {  //未指定标注参数，要移除标注框
              rectPath.remove()
            })
            .finally(() => {
              rectPath = null;
              startPoint = null; // 重置起始点
            })

          }
        }
      };

      this.paper.view.onMouseMove = (event) => {
        // this.mousePoint = event.point
        let imageBounds = this.image.raster.bounds;
        // 计算图像左上角在画布上的坐标
        this.mousePoint = event.point.subtract(imageBounds.topLeft);
        
        if (this.isRectToolActive && startPoint && rectPath) {
          const endPoint = this._getConstrainedPoint(event.point);
          rectPath.remove();
          // 根据当前鼠标位置更新矩形的大小
          rectPath.remove(); // 移除之前的矩形
          rectPath = new this.paper.Path.Rectangle({
            from: startPoint,
            to: endPoint,   // 结束点不使用event.point,而是在图片内使用，不在的话，则使用最大边缘点
            strokeColor: 'black',
            strokeWidth: 1,
            fillColor: new this.paper.Color(1, 0, 0, 0.3) // 半透明填充颜色
          });
        }
      };
      // 监听鼠标移动事件
      this.paper.view.onMouseDrag = (event) => {
        // console.log('drapdrag', this.isDragging)
        if (this.isSelectToolActive && this.isDragging) {
          // 计算拖拽的偏移量
          const delta = event.point.subtract(this.dragStartPoint);
          // 应用增量移动视图
          this.paper.view.translate(delta);
          // 更新 dragStartPoint
          // this.dragStartPoint = event.point;
        }
      };

      // 监听鼠标释放事件
      this.paper.view.onMouseUp = () => {
        this.isDragging = false;
        if(this.isSelectToolActive) {
          canvas.style.cursor = 'grab';
        }
      };
    },
    onMouseEnter() {
      if (this.isSelectToolActive) {
        const canvas = document.getElementById("canvas");
        canvas.style.cursor = 'grab';
      }
    },
    onMouseLeave() {
      const canvas = document.getElementById("canvas");
      canvas.style.cursor = 'default';
    },
    // 判断鼠标位置是否在图片内
    _isPointInsideImage(point) {
      const bounds = this.image.raster.bounds;
      return bounds.contains(point);
    },
    // 限制Point在图片内，在？取event.point，不在？取bounds
    _getConstrainedPoint(point) {
      const bounds = this.image.raster.bounds;
      const x = Math.max(bounds.x, Math.min(point.x, bounds.x + bounds.width));
      const y = Math.max(bounds.y, Math.min(point.y, bounds.y + bounds.height));
      return new this.paper.Point(x, y);
    },
  },
}