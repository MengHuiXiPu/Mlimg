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
      type="brush"
      :categoriesList="getCategoriesList"
      @on-confirm="handleConfirm"
      @on-cancel="removeSelection"
    />
  </div>
</template>

<script>
import paper from "paper";
import ModalTool from "./modalTool.vue";
import tool from "../../mixins/toolBar/tool";
import JQuery from "jquery";

let $ = JQuery;

export default {
  name: "BrushTool",
  mixins: [tool],
  props: {
    scale: {
      type: Number,
      default: 1,
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
      icon: "fa-paint-brush",
      name: "Brush",
      text: this.$t("dataCenter.brushTool"),
      cursor: "none",
      scaleFactor: 3,
      brush: {
        path: null,
        pathOptions: {
          strokeColor: "#00ff00",
          strokeWidth: 1,
          radius: 30,
        },
      },
      selection: null,
      isModalOpen: false,
      showMessage: true,
    };
  },
  methods: {
    async handleConfirm(value) {
      const categoryInstance = this.$parent.categoriesInstance;
      await categoryInstance.createAnnotation(() => {
        // 放在下一帧  否则获取不到标注
        requestAnimationFrame(() => {
          // save后更新对应缩略图
          this.$parent.save((imgid, mode, parentInstance)=>{
            // 更新对应的缩略图
            parentInstance.getImg(imgid)
          });
        })
      }, value);
      this.merge();
      this.removeSelection();
      // this.complete();
    },
    removeBrush() {
      this.isModalOpen = false;
      if (this.brush.path != null) {
        this.brush.path.remove();
        this.brush.path = null;
      }
    },
    removeSelection() {
      if (this.selection != null) {
        this.selection.remove();
        this.selection = null;
      }
    },
    moveBrush(point) {
      if (this.brush.path == null) this.createBrush();

      this.brush.path.bringToFront();
      this.brush.path.position = point;
    },
    createBrush(center) {
      center = center || new paper.Point(0, 0);

      this.brush.path = new paper.Path.Circle({
        strokeColor: this.brush.pathOptions.strokeColor,
        strokeWidth: this.brush.pathOptions.strokeWidth,
        radius: this.brush.pathOptions.radius,
        center: center,
      });
    },
    createSelection() {
      this.selection = new paper.Path({
        strokeColor: this.brush.pathOptions.strokeColor,
        strokeWidth: this.brush.pathOptions.strokeWidth,
      });
    },
    onMouseMove(event) {
      if (this.isModalOpen) {
        return;
      }
      this.removeBrush();
      this.moveBrush(event.point);
    },
    onMouseDown(event) {
      this.showMessage = true;
      if (this.isInImage(this.$parent.imagePosition, event.point)) {
        if (this.isModalOpen) {
          return;
        }
        this.createSelection();
        this.draw();
      }else{
        if (this.showMessage) {
          this.$message.warning("请在图片内进行标注点选择");
          this.showMessage = false;
        }
      }
    },
    onMouseUp(event) {
      if (this.isModalOpen) {
        return;
      }
      const defaultCategory = this.$parent.defaultCategory;
      if (defaultCategory) {
        this.handleConfirm(defaultCategory);
      } else {
        // 第二次鼠标按下时，即是要弹窗选择标签。
        if (this.isInImage(this.$parent.imagePosition, event.point)) {
          this.$refs.toolModal.show();
        }else {
          this.removeSelection()
        }
        
      }
      // this.merge();
      // this.removeSelection();
    },
    onMouseDrag(event) {
      if (this.isInImage(this.$parent.imagePosition, event.point)) {
        if (this.isModalOpen) {
          return;
        }
        this.moveBrush(event.point);
        this.draw();
      }else{
        if (this.showMessage) {
          this.$message.warning("请在图片内进行标注点选择");
          this.showMessage = false;
        }
      }
    },

    /**
     * Unites current brush with selection
     */
    draw() {
      let newSelection = this.selection.unite(this.brush.path);

      this.selection.remove();
      this.selection = newSelection;
    },
    /**
     * Unites current selection with selected annotation
     */
    merge() {
      this.$parent.uniteCurrentAnnotation(this.selection);
    },
    decreaseRadius() {
      if (!this.isActive) return;
      this.brush.pathOptions.radius -= 2;
    },
    increaseRadius() {
      if (!this.isActive) return;
      this.brush.pathOptions.radius += 2;
    },
    export() {
      return {
        strokeColor: this.brush.pathOptions.strokeColor,
        radius: this.brush.pathOptions.radius,
      };
    },
    setPreferences(pref) {
      this.brush.pathOptions.strokeColor =
        pref.strokeColor || this.brush.pathOptions.strokeColor;
      this.brush.pathOptions.radius =
        pref.radius || this.brush.pathOptions.radius;
    },
    isInImage(imagePosition, point) {
      // 判断落点是否在图片区域内
      return (
          point.x >= (imagePosition.topLeft.x + this.brush.pathOptions.radius) &&
          point.x <= (imagePosition.topRight.x - this.brush.pathOptions.radius) &&
          point.y >= (imagePosition.topLeft.y + this.brush.pathOptions.radius) &&
          point.y <= (imagePosition.bottomLeft.y - this.brush.pathOptions.radius)
      );
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
    "brush.pathOptions.radius"() {
      if (this.brush.path == null) return;

      let position = this.brush.path.position;
      this.brush.path.remove();
      this.createBrush(position);
    },
    "brush.pathOptions.strokeColor"(newColor) {
      if (this.brush.path == null) return;

      this.brush.path.strokeColor = newColor;
    },
    isActive(active) {
      if (this.brush.path != null) {
        this.brush.path.visible = active;
      }

      if (active) {
        this.tool.activate();
        localStorage.setItem("editorTool", this.name);
      }else{
        this.removeBrush();
      }
    },
    /**
     * Change width of stroke based on zoom of image
     */
    scale(newScale) {
      this.brush.pathOptions.strokeWidth = newScale * this.scaleFactor;
      if (this.brush.path != null)
        this.brush.path.strokeWidth = newScale * this.scaleFactor;
    },
  },
  mounted() {
    $("#brush_modal").on("show.bs.modal", () => {
      this.isModalOpen = true;
    });
    $("#brush_modal").on("hidden.bs.modal", () => {
      this.isModalOpen = false;
    });
    // 有标注算法选择框时也禁用
    // $("#modelSelect").on("show.bs.modal", () => {
    //   this.isModalOpen = true;
    // });
    // $("#modelSelect").on("hidden.bs.modal", () => {
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
