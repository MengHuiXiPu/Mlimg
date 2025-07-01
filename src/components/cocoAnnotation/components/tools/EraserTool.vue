<template>
  <div class="mb-8" :style="{ color: iconColor }" @click="click">
    <svg-icon class="icon" type="eraser" />
    <span class="text-desc">(Y){{ $t("dataCenter.eraser") }}</span>
  </div>
</template>

<script>
import paper from "paper";
import tool from "../../mixins/toolBar/tool";
import { preferences } from "../../libs/config";

export default {
  name: "EraserTool",
  mixins: [tool],
  props: {
    scale: {
      type: Number,
      default: 1,
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
      icon: "fa-eraser",
      name: "Eraser",
      text: this.$t("dataCenter.eraserTool"),
      cursor: "none",
      scaleFactor: 3,
      eraserRadius: preferences.eraser.radius,
      eraser: {
        brush: null,
        minimumArea: 10,
        pathOptions: {
          strokeColor: "white",
          strokeWidth: 1,
          radius: preferences.eraser.radius,
        },
      },
    };
  },
  methods: {
    removeBrush() {
      if (this.eraser.brush != null) {
        this.eraser.brush.remove();
        this.eraser.brush = null;
      }
    },
    moveBrush(point) {
      if (this.eraser.brush == null) this.createBrush();

      this.eraser.brush.bringToFront();
      this.eraser.brush.position = point;
    },
    createBrush(center) {
      center = center || new paper.Point(0, 0);

      this.eraser.brush = new paper.Path.Circle({
        strokeColor: this.eraser.pathOptions.strokeColor,
        strokeWidth: this.eraser.pathOptions.strokeWidth,
        radius: this.eraser.pathOptions.radius,
        center,
      });
    },
    onMouseMove(event) {
      this.removeBrush();
      this.moveBrush(event.point);
    },
    onMouseDrag(event) {
      this.moveBrush(event.point);
      this.erase();
    },
    onMouseDown() {
      this.$parent.getCurrentAnnotation().createUndoAction("Subtract");
      this.erase();
    },
    onMouseUp() {
      this.$parent.getCurrentAnnotation().simplifyPath();
    },
    erase() {
      // Undo action, will be handled on mouse down
      // Simplify, will be handled on mouse up
      this.$parent
        .getCurrentAnnotation()
        .subtract(this.eraser.brush, false, false);
    },
    decreaseRadius() {
      if (!this.isActive) return;
      this.eraserRadius = this.eraserRadius - 2 < 0 ? 0 : this.eraserRadius - 2;
      this.setEraserRadius();
    },
    increaseRadius() {
      if (!this.isActive) return;
      this.eraserRadius += 2;
      this.setEraserRadius();
    },
    export() {
      return {
        strokeColor: this.eraser.pathOptions.strokeColor,
        radius: this.eraser.pathOptions.radius,
      };
    },
    setPreferences(pref) {
      this.eraser.pathOptions.strokeColor =
        pref.strokeColor || this.eraser.pathOptions.strokeColor;
    },
    setEraserRadius() {
      this.eraser.pathOptions.radius = this.eraserRadius * this.scale;
    },
    resetEraserRadius(pref) {
      this.eraserRadius = pref ? pref.radius : preferences.eraser.radius;
      this.setEraserRadius();
    },
  },
  computed: {
    isDisabled() {
      // return this.$parent.current.annotation == -1;
      return this.$parent.current.annotation == -1 || this.disabled;
    },
  },
  watch: {
    "eraser.pathOptions.radius"() {
      if (this.eraser.brush == null) return;

      let position = this.eraser.brush.position;
      this.eraser.brush.remove();
      this.createBrush(position);
    },
    "eraser.pathOptions.strokeColor"(newColor) {
      if (this.eraser.brush == null) return;

      this.eraser.brush.strokeColor = newColor;
    },
    isActive(active) {
      if (this.eraser.brush != null) {
        this.eraser.brush.visible = active;
      }

      if (active) {
        this.tool.activate();
        localStorage.setItem("editorTool", this.name);
        // 切换快捷键重置
        this.resetEraserRadius();
      } else {
        this.removeBrush();
      }
    },
    /**
     * Change width of stroke based on zoom of image
     */
    scale(newScale) {
      this.eraser.pathOptions.strokeWidth = newScale * this.scaleFactor;
      if (this.eraser.brush !== null) {
        this.eraser.brush.strokeWidth = newScale * this.scaleFactor;
        this.setEraserRadius();
      }
    },
  },
};
</script>

<style scoped>
.mb-8 {
  margin-bottom: 8px;
  cursor: pointer;
}
.icon {
  font-size: 20px;
  position: relative;
  top: 3px;
}
.text-desc {
  margin-left: 8px;
  font-size: 9px;
}
</style>
