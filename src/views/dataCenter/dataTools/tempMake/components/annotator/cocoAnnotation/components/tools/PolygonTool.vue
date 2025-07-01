<template>
  <div>
    <div class="mb-8">
      <i
        v-tooltip.right="tooltip"
        class="fa fa-x"
        :class="icon"
        :style="{ color: iconColor, fontSize: '22px' }"
        @click="click"
      ></i
      ><br />
    </div>
    <modal-tool
      ref="toolModal"
      type="polygon"
      :categoriesList="getCategoriesList"
      @on-confirm="handleConfirm"
      @on-cancel="deletePolygon"
    />
  </div>
</template>

<script>
import paper from "paper";
import ModalTool from "./modalTool.vue";

import tool from "../../mixins/toolBar/tool";
import UndoAction from "../../libs/undo";

import { invertColor } from "../../libs/colors";
import { mapMutations } from "vuex";
import JQuery from "jquery";

import shortcuts from "../../mixins/shortcuts";

let $ = JQuery;
export default {
  name: "PolygonTool",
  mixins: [tool],
  props: {
    scale: {
      type: Number,
      default: 1,
    },
    settings: {
      type: [Object, null],
      default: null,
    },
    allCategories: {
      type: Array,
      default: () => [],
    },
    commands: {
      type: Array,
      default: () => {
        return [];
      },
    },
  },
  components: {
    ModalTool,
  },
  data() {
    return {
      icon: "fa-pencil",
      name: "Polygon",
      text: this.$t("dataCenter.polygonTool"),
      scaleFactor: 3,
      cursor: "copy",
      polygon: {
        completeDistance: 5,
        minDistance: 2,
        path: null,
        guidance: true,
        simplify: 1,
        pathOptions: {
          strokeColor: "#00ff00",
          strokeWidth: 3,
        },
      },
      color: {
        blackOrWhite: false,
        auto: true,
        radius: 10,
        circle: null,
      },
      actionTypes: Object.freeze({
        ADD_POINTS: "Added Points",
        CLOSED_POLYGON: "Closed Polygon",
        DELETE_POLYGON: "Delete Polygon",
      }),
      actionPoints: 0,
      isModalOpen: false,
      pointCircle: [],
      startBlackPointCircle: null,
    };
  },
  methods: {
    ...mapMutations(["addUndo", "removeUndos"]),
    async handleConfirm(value) {
      const categoryInstance = this.$parent.categoriesInstance;
      await categoryInstance.createAnnotation(() => {
        setTimeout(() => {
          this.complete();
        }, 100);
      }, value);
    },
    export() {
      return {
        guidance: this.polygon.guidance,
        completeDistance: this.polygon.completeDistance,
        minDistance: this.polygon.minDistance,
        blackOrWhite: this.color.blackOrWhite,
        auto: this.color.auto,
        radius: this.color.radius,
      };
    },
    setPreferences(pref, scale = 1) {
      this.polygon.guidance = pref.guidance || this.polygon.guidance;
      this.polygon.completeDistance = this.polygon.completeDistance;
      this.polygon.minDistance = pref.minDistance || this.polygon.minDistance;
      this.color.blackOrWhite = pref.blackOrWhite || this.color.blackOrWhite;
      this.color.auto = pref.auto || this.color.auto;
      this.color.radius = (pref.radius || this.color.radius) * scale;
    },
    /**
     * Creates a new selection polygon path
     */
    createPolygon() {
      if (this.color.auto) {
        this.color.circle = new paper.Path.Circle(
          new paper.Point(0, 0),
          this.color.radius
        );
      }
      this.polygon.path = new paper.Path(this.polygon.pathOptions);
    },
    /**
     * Frees current polygon
     */
    deletePolygon() {
      this.isModalOpen = false;

      if (this.polygon.path == null) return;

      this.polygon.path.remove();
      this.polygon.path = null;

      if (this.color.circle == null) return;
      this.color.circle.remove();
      this.color.circle = null;
      this.deleteAllPoint();
    },
    deleteAllPoint() {
      // 删除起始点和终止点的圆点
      if (this.pointCircle.length) {
        this.pointCircle.forEach((item) => {
          if (!item) return;
          item.remove();
          item = null;
        });
        this.pointCircle = [];
      }
      this.removeStartPointCircle();
    },
    autoStrokeColor(point) {
      if (this.color.circle == null) return;
      if (this.polygon.path == null) return;
      if (!this.color.auto) return;

      this.color.circle.position = point;
      let raster = this.$parent.image.raster;
      let color = raster.getAverageColor(this.color.circle);
      // console.log(raster, color);
      // if (color) {
      //   // this.polygon.pathOptions.strokeColor = invertColor(
      //   //   color.toCSS(true),
      //   //   this.color.blackOrWhite
      //   // );
      //   this.polygon.pathOptions.strokeColor = '#00ff00'
      //   this.polygon.pathOptions.strokeWidth = 3
      //   console.log(this.polygon.pathOptions);
      // }
    },
    isInImage(imagePosition, point) {
      // 判断落点是否在图片区域内
      return (
        point.x >= imagePosition.topLeft.x &&
        point.x <= imagePosition.topRight.x &&
        point.y >= imagePosition.topLeft.y &&
        point.y <= imagePosition.bottomLeft.y
      );
    },
    onMouseDrag(event) {
      if (this.isModalOpen) {
        return;
      }
      if (this.polygon.path == null) return;
      if (!this.isInImage(this.$parent.imagePosition, event.point)) {
        this.$message.warning("请在图片内进行标注点选择");
        return;
      }
      if (this.pointCircle.length == 1) return;
      this.actionPoints++;
      this.autoStrokeColor(event.point);
      this.polygon.path.add(event.point);
      this.autoComplete(this.polygon.completeDistance);
    },
    onMouseDown(event) {
      if (this.isModalOpen) {
        return;
      }
      if (!this.isInImage(this.$parent.imagePosition, event.point)) {
        this.$message.warning("请在图片内进行标注点选择");
        return;
      }

      let wasNull = false;
      if (this.polygon.path == null) {
        wasNull = true;
        this.createPolygon();
      }

      this.actionPoints = 1;
      const startPointCircle = new paper.Path.Circle(
        event.point,
        this.color.radius
      );
      startPointCircle.fillColor = "#00ff00";
      // 在白色点图层下方
      if (this.startBlackPointCircle) {
        startPointCircle.insertBelow(this.startBlackPointCircle);
      }
      if (this.pointCircle.length == 0) {
        this.pointCircle.push(startPointCircle);
        this.polygon.path.add(event.point);
      } else {
        let distance = this.calculateDistance(
          this.pointCircle[0].position,
          event.point
        );
        if (distance > this.polygon.completeDistance) {
          this.pointCircle.push(startPointCircle);
          this.polygon.path.add(event.point);
        } else startPointCircle.remove();
      }
      if (this.autoComplete(this.polygon.completeDistance)) return;

      if (this.polygon.guidance && wasNull) this.polygon.path.add(event.point);
    },
    // 与第一个坐标点汇合时
    showStartPointCircle(point) {
      if (!this.startBlackPointCircle) {
        // 创建一个圆点并存储引用
        this.startBlackPointCircle = new paper.Path.Circle(point, this.color.radius  * 1.3);
        this.startBlackPointCircle.fillColor = "white";
        this.startBlackPointCircle.strokeColor = "#00ff00";

        this.startBlackPointCircle.bringToFront();
      }
    },

    removeStartPointCircle() {
      // 如果起始点圆存在，则删除它
      if (this.startBlackPointCircle) {
        this.startBlackPointCircle.remove();
        this.startBlackPointCircle = null;
      }
    },
    onMouseUp() {
      if (this.isModalOpen) {
        return;
      }
      if (this.polygon.path == null) return;
      let action = new UndoAction({
        name: this.name,
        action: this.actionTypes.ADD_POINTS,
        func: this.undoPoints,
        args: {
          points: this.actionPoints,
        },
      });

      this.addUndo(action);
    },
    onMouseMove(event) {
      if (this.isModalOpen) {
        return;
      }
      if (this.polygon.path == null) return;
      if (this.polygon.path.segments.length === 0) return;
      this.autoStrokeColor(event.point);

      if (!this.polygon.guidance) return;
      this.removeLastPoint();
      this.polygon.path.add(event.point);

      // 获取当前点和起始点
      let currentPoint = event.point;
      let startPoint = this.pointCircle[0].position;

      // 计算当前点到起始点的距离
      let distance = this.calculateDistance(startPoint, currentPoint);
      // 如果距离小于一定值，创建一个大的白色圆点
      if (distance <= this.polygon.completeDistance) {
        if (this.pointCircle.length !== 1)
          this.showStartPointCircle(startPoint);
      } else {
        // 如果距离大于一定值，删除起始点圆
        this.removeStartPointCircle();
      }
    },
    calculateDistance(point1, point2) {
      let dx = point2.x - point1.x;
      let dy = point2.y - point1.y;
      return Math.sqrt(dx * dx + dy * dy);
    },
    /**
     * Undo points
     */
    undoPoints(args) {
      if (this.polygon.path == null) return;

      let points = args.points;
      let length = this.polygon.path.segments.length;

      if (this.polygon.guidance) {
        length -= 1;
      }

      this.polygon.path.removeSegments(length - points, length);
    },
    /**
     * Completes polygon if point being added is close to first point（闭合形成多边形）
     * @returns {boolean} sucessfully closes object
     */
    autoComplete(minCompleteLength) {
      if (this.polygon.path == null) return false;
      if (this.polygon.path.segments.length < minCompleteLength) return false;

      let last = this.polygon.path.lastSegment.point;
      let first = this.polygon.path.firstSegment.point;

      let completeDistance = this.polygon.completeDistance;
      if (last.isClose(first, completeDistance)) {
        const defaultCategory = this.$parent.defaultCategory;
        if (defaultCategory) {
          this.handleConfirm(defaultCategory);
        } else {
          // 第二次鼠标按下时，即是要弹窗选择标签。
          this.$refs.toolModal.show();
        }
        return true;
      }

      return false;
    },
    /**
     * Closes current polygon and unites it with current annotaiton.
     * @returns {boolean} sucessfully closes object
     */
    complete() {
      if (this.polygon.path == null) return false;
      this.removeLastPoint();

      this.polygon.path.fillColor = "#00ff00";
      this.polygon.path.closePath();

      this.$parent.uniteCurrentAnnotation(this.polygon.path);

      // 形成标注融合坐标点之前，禁止鼠标移动引起的不必要操作
      this.isModalOpen = false;

      this.polygon.path.remove();
      this.polygon.path = null;
      if (this.color.circle) {
        this.color.circle.remove();
        this.color.circle = null;
      }
      this.removeUndos(this.actionTypes.ADD_POINTS);
      this.deleteAllPoint();
      this.$parent.save((imgid, mode, parentInstance)=>{
        // 更新对应的缩略图
        parentInstance.getImg(imgid)
      });
      return true;
    },
    removeLastPoint() {
      this.polygon.path.removeSegment(this.polygon.path.segments.length - 1);
    },
  },
  computed: {
    getCategoriesList() {
      // 获取所有的Categories并将其转为select option可用的数据结构.
      return this.allCategories.map((category) => ({
        value: category.id,
        text: category.name,
      }));
    },
  },
  watch: {
    isActive(active) {
      if (active) {
        this.tool.activate();
        localStorage.setItem("editorTool", this.name);
      }
    },
    /**
     * Change width of stroke based on zoom of image
     */
    scale(newScale) {
      this.polygon.pathOptions.strokeWidth = newScale * this.scaleFactor;
      if (this.polygon.path != null)
        this.polygon.path.strokeWidth = newScale * this.scaleFactor;
    },
    /**
     * Remove last point (point were mouse was) if enable guidane
     */
    "polygon.guidance"(guidance) {
      if (this.polygon.path == null) return;

      if (!guidance && this.polygon.path.length > 1) {
        this.removeLastPoint();
      }
    },
    "polygon.minDistance"(newDistance) {
      this.tool.minDistance = newDistance;
    },
    "polygon.pathOptions.strokeColor"(newColor) {
      if (this.polygon.path == null) return;

      this.polygon.path.strokeColor = newColor;
    },
    "color.auto"(value) {
      if (value && this.polygon.path) {
        this.color.circle = new paper.Path.Circle(
          new paper.Point(0, 0),
          this.color.radius
        );
      }
      if (!value && this.color.circle) {
        this.color.circle.remove();
        this.color.circle = null;
      }
    },
  },
  created() {},
  mounted() {
    this.tool.minDistance = this.minDistance;
    $("#polygon_modal").on("show.bs.modal", () => {
      this.isModalOpen = true;
    });
    // $("#polygon_modal").on("hidden.bs.modal", () => {
    //   this.isModalOpen = false;
    // });
  },
};
</script>

<style scoped>
.mb-8 {
  margin-bottom: 8px;
}
</style>
