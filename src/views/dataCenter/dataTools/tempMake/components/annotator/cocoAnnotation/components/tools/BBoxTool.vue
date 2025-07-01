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
      type="bBox"
      :categoriesList="getCategoriesList"
      @on-confirm="handleConfirm"
      @on-cancel="deleteBbox"
    />
  </div>
</template>

<script>
import paper from "paper";
import ModalTool from "./modalTool.vue";
import tool from "../../mixins/toolBar/tool";
import { invertColor } from "../../libs/colors";
import { BBox } from "../../libs/bbox";
import { mapMutations } from "vuex";
import JQuery from "jquery";

let $ = JQuery;
export default {
  name: "BBoxTool",
  mixins: [tool],
  components: {
    ModalTool,
  },
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
  data() {
    return {
      icon: "fa-object-group",
      name: "BBox",
      text: this.$t("dataCenter.bboxTool"),
      scaleFactor: 3,
      cursor: "copy",
      bbox: null,
      // 多边形
      polygon: {
        path: null,
        guidance: true,
        pathOptions: {
          strokeColor: "#00ff00",
          strokeWidth: 3,
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
      isModalOpen: false,
    };
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
  methods: {
    ...mapMutations(["addUndo", "removeUndos"]),
    async handleConfirm(value) {
      const categoryInstance = this.$parent.categoriesInstance;
      // 创建空标注, 标注创建成功后,再完成bbox绘制.
      await categoryInstance.createAnnotation(
        () => {
          setTimeout(() => {
            this.completeBBox();
          }, 100);
        },
        value,
        "bbox"
      );
    },
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
      this.isModalOpen = false;

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
    // 判断落点是否在图片区域内
    isInImage(imagePosition, point) {
      return (
        point.x >= imagePosition.topLeft.x &&
        point.x <= imagePosition.topRight.x &&
        point.y >= imagePosition.topLeft.y &&
        point.y <= imagePosition.bottomLeft.y
      );
    },
    onMouseDown(event) {
      if (this.isModalOpen) {
        return;
      }
      // 先注释掉,不需要先判断是否有标注存在
      // if (this.polygon.path == null && this.checkAnnotationExist()) {
      //   this.$parent.currentCategory.createAnnotation();
      // }
      if (this.polygon.path == null) {
        // 先建立bbox，之后鼠标move的过程还有modify box。
        if (this.isInImage(this.$parent.imagePosition, event.point)) {
          this.createBBox(event);
        } else {
          this.$message.warning("请在图片内进行标注点选择");
        }
        return;
      }
      this.removeLastBBox();
      this.modifyBBox(event);

      const defaultCategory = this.$parent.defaultCategory;
      if (defaultCategory) {
        this.handleConfirm(defaultCategory);
      } else {
        // 第二次鼠标按下时，即是要弹窗选择标签。
        if (this.isInImage(this.$parent.imagePosition, event.point)) {
          this.$refs.toolModal.show();
        } else this.$message.warning("请在图片内进行标注点选择");
      }
      // 第二次鼠标按下时，即是要完成bbox的绘制。
      // if (this.completeBBox()) return;
    },
    onMouseMove(event) {
      if (this.isModalOpen) {
        return;
      }
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

      // this.polygon.path.fillColor = "black";
      this.polygon.path.closePath();
      // 很重要的一步：标注融合，将当前画的path和当前的annotation进行合并。
      this.$parent.uniteCurrentAnnotation(this.polygon.path, true, true, true);
      // 形成标注融合坐标点之前，禁止鼠标移动引起的不必要操作
      this.isModalOpen = false;
      this.polygon.path.remove();
      this.polygon.path = null;
      if (this.color.circle) {
        this.color.circle.remove();
        this.color.circle = null;
      }
      this.removeUndos(this.actionTypes.ADD_POINTS);
      // save后更新对应缩略图
      this.$parent.save((imgid, mode, parentInstance) => {
        // 更新对应的缩略图
        parentInstance.getImg(imgid);
      });
      return true;
    },
    removeLastBBox() {
      this.polygon.path.removeSegments();
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
  mounted() {
    $("#bBox_modal").on("show.bs.modal", () => {
      this.isModalOpen = true;
    });
  },
};
</script>

<style>
.mb-8 {
  margin-bottom: 8px;
}
.ant-message {
  z-index: 9999 !important;
}
</style>
