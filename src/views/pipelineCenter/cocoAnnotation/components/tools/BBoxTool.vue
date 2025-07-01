<template>
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
</template>

<script>
import paper from "paper";
import tool from "../../mixins/toolBar/tool";
// import UndoAction from "../../libs/undo";

import eventBus from "@/views/pipelineCenter/pipelineEditor/utils/eventBus";
import { invertColor } from "../../libs/colors";
import { BBox } from "../../libs/bbox";
import { mapMutations } from "vuex";

export default {
  name: "BBoxTool",
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
  },
  data() {
    return {
      icon: "fa-object-group",
      name: "BBox",
      scaleFactor: 3,
      cursor: "copy",
      bbox: null,
      polygon: {
        path: null,
        guidance: true,
        pathOptions: {
          strokeColor: "black",
          strokeWidth: 1,
        },
      },
      color: {
        blackOrWhite: true,
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
    };
  },
  methods: {
    ...mapMutations(["addUndo", "removeUndos"]),
    export() {
      return {
        completeDistance: this.polygon.completeDistance,
        minDistance: this.polygon.minDistance,
        blackOrWhite: this.color.blackOrWhite,
        auto: this.color.auto,
        radius: this.color.radius,
      };
    },
    setPreferences(pref) {
      this.color.blackOrWhite = pref.blackOrWhite || this.color.blackOrWhite;
      this.color.auto = pref.auto || this.color.auto;
      this.color.radius = pref.radius || this.color.radius;
    },
    createBBox(event) {
      this.polygon.path = new paper.Path(this.polygon.pathOptions);
      this.bbox = new BBox(event.point);
      this.bbox.getPoints().forEach((point) => this.polygon.path.add(point));
    },

    modifyBBox(event) {
      this.polygon.path = new paper.Path(this.polygon.pathOptions);
      this.bbox.modifyPoint(event.point);
      this.bbox.getPoints().forEach((point) => this.polygon.path.add(point));
    },
    /**
     * Frees current bbox
     */
    deleteBbox() {
      if (this.polygon.path == null) return;

      this.polygon.path.remove();
      this.polygon.path = null;

      if (this.color.circle == null) return;
      this.color.circle.remove();
      this.color.circle = null;
    },
    autoStrokeColor(point) {
      if (this.color.circle == null) return;
      if (this.polygon.path == null) return;
      if (!this.color.auto) return;

      this.color.circle.position = point;
      let raster = this.$parent.image.raster;
      let color = raster.getAverageColor(this.color.circle);
      if (color) {
        this.polygon.pathOptions.strokeColor = invertColor(
          color.toCSS(true),
          this.color.blackOrWhite
        );
      }
    },
    checkAnnotationExist() {
      const currentAnnotation = this.$parent.currentAnnotation;
      // 这两个判断，当前的annotation是否有标注框。
      // 二者有其一，就表示该标注不是空标注。
      // 如果不是空标注，在bbox操作的前就会新建标注，否则，就在空标注之上进行操作。
      const hasSegmentation =
        !!currentAnnotation.annotation.segmentation.length;
      const hasPaperObject =
        !!currentAnnotation.annotation.paper_object &&
        !!currentAnnotation.annotation.paper_object.length;
      return !!currentAnnotation && (hasSegmentation || hasPaperObject);
    },
    onMouseDown(event) {
      // if (this.polygon.path == null && this.checkAnnotationExist()) {
      //   // this.$parent.currentCategory.createAnnotation();
      // }
      if (this.polygon.path == null) {
        // 先建立bbox，之后鼠标move的过程还有modify box。
        this.createBBox(event);
        return;
      }
      this.removeLastBBox();
      this.modifyBBox(event);
      // 第二次鼠标按下时，即是要完成bbox的绘制。
      if (this.completeBBox()) return;
    },
    onMouseMove(event) {
      if (this.polygon.path == null) return;
      if (this.polygon.path.segments.length === 0) return;
      this.autoStrokeColor(event.point);

      this.removeLastBBox();
      this.modifyBBox(event);
    },
    /**
     * Undo points
     */
    undoPoints(args) {
      if (this.polygon.path == null) return;

      let points = args.points;
      let length = this.polygon.path.segments.length;

      this.polygon.path.removeSegments(length - points, length);
    },
    /**
     * Closes current polygon and unites it with current annotaiton.
     * @returns {boolean} sucessfully closes object
     */
    completeBBox() {
      if (this.polygon.path == null) return false;

      this.polygon.path.fillColor = "black";
      this.polygon.path.closePath();

      // 很重要的一步：标注融合，将当前画的path和当前的annotation进行合并。
      this.$parent.uniteCurrentAnnotation(this.polygon.path, true, true, true);

      this.polygon.path.remove();
      this.polygon.path = null;
      if (this.color.circle) {
        this.color.circle.remove();
        this.color.circle = null;
      }

      this.removeUndos(this.actionTypes.ADD_POINTS);
      // 标注只要形成就保存
      this.$parent.save();

      return true;
    },
    removeLastBBox() {
      this.polygon.path.removeSegments();
    },
  },
  computed: {
    isDisabled() {
      const currentAnnotation = this.$parent.currentAnnotation;
      console.log(currentAnnotation);
      // 当没有选中标注的时候或者当前annotation已经有了bbox画框的时候，需要disabled
      return (
        //this.$parent.current.annotation === -1 ||
        (currentAnnotation &&
          !!currentAnnotation.annotation.segmentation.length)
      );
      // return this.$parent.current.annotation === -1
      // return this.$parent.current.annotation === -1 && this.$parent.currentAnnotation.annotation.labelingType === 'roi'
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
    "polygon.pathOptions.strokeColor"(newColor) {
      if (this.polygon.path == null) return;

      this.polygon.path.strokeColor = newColor;
    },
    "color.auto"(value) {
      if (value && this.polygon.path) {
        this.color.circle = new paper.Path.Rectangle(
          new paper.Point(0, 0),
          new paper.Size(10, 10)
        );
      }
      if (!value && this.color.circle) {
        this.color.circle.remove();
        this.color.circle = null;
      }
    },
  },
  created() {},
  mounted() {},
};
</script>

<style scoped>
.mb-8 {
  margin-bottom: 8px;
}
</style>
