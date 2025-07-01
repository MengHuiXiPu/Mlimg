<template>
  <div>
    <i
      v-tooltip.right="tooltip"
      class="fa fa-x"
      :class="icon"
      :style="{ color: iconColor, fontSize: '22px' }"
      @click="click"
    ></i
    ><br />
    <a-button
      type="ghost"
      class="lineBtn"
      :disabled="!line.path"
      size="small"
      @click="autoAnnotating"
    >
      <span>提示</span><br />
      <span>标注</span>
    </a-button>
    <br />
  </div>
</template>

<script>
import axios from "axios";
import paper from "paper";
import tool from "../../mixins/toolBar/tool";
// import UndoAction from "../../libs/undo";

import { invertColor } from "../../libs/colors";
import { mapGetters, mapMutations } from "vuex";
import { getMarkPositions } from "../../libs/config";

export default {
  name: "LineTool",
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
  inject: ["modalInstance"],
  data() {
    return {
      icon: "fa-arrows-h",
      name: "Line",
      scaleFactor: 3,
      cursor: "copy",
      line: {
        completeDistance: 5,
        minDistance: 2,
        path: null,
        guidance: true,
        simplify: 1,
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
        CLOSED_Line: "Closed Line",
        DELETE_Line: "Delete Line",
      }),
      actionPoints: 0,
    };
  },
  methods: {
    ...mapMutations([
      "addUndo",
      "removeUndos",
      "setGroupLoading",
      "cancelLoadingItem",
    ]),
    // 开始自动标注，批量标注
    async autoAnnotating() {
      const parentInstance = this.$parent;
      // 获取待处理的图片列表
      const processPictureList = this.modalInstance.processPictureList;

      // const index = processPictureList.findIndex(
      //   (item) => item.id === parentInstance.image.id
      // );
      // 生成guid
      const generateGuid = () => {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };
      // 样例图id, 图片宽高，labelId，坐标点集合得入参，都是一致的。

      // 获取图片宽高(同一路径下都一样)
      const imageWidth = parentInstance.image.raster.width;
      const imageHeight = parentInstance.image.raster.height;
      const center = [imageWidth / 2, imageHeight / 2];

      // 获取labelId
      const labelIndex = parentInstance.current.category;
      const labelId = parentInstance.categories[labelIndex].id;

      // 获取坐标并转换，样例图片上标记点集合
      const drawingData = this.line.path._segments.map((item) => {
        return {
          x: Math.round(center[0] + item._point._x, 2),
          y: Math.round(center[1] + item._point._y, 2),
        };
      });
      // 样例图id
      const samplePictureId = parentInstance.image.id;
      // 设置loading
      this.setGroupLoading(processPictureList.map((item) => item.id));

      for (let i = 0; i < processPictureList.length; i++) {
        const target = processPictureList[i];
        // 很重要的标志位：是否在标注当前图
        const isCurrentView = target.id === samplePictureId;
        console.log(`发起请求 ${i}`);
        // loading开始
        // 生成guid
        const guid = generateGuid();
        await this.autoAnnotatingOne(
          samplePictureId,
          drawingData,
          target.id,
          labelId,
          guid,
          imageWidth,
          imageHeight,
          isCurrentView
        ); // 开始标注
        console.log(`请求 ${i} 完成`);
      }
      // 再刷新下图片列表
      this.modalInstance.$emit("on-fresh");
    },
    // 自动标注接口
    // 入参在上面的方法都已经获取得到。（具体含义也可以参考confluence的接口文档）
    autoAnnotatingOne(
      samplePictureId,
      drawingData,
      targetPictureId,
      labelId,
      guid,
      imageWidth,
      imageHeight,
      isCurrentView
    ) {
      return axios
        .post("/api/v1/datacenter/autoAnnotator/promptSeg", {
          samplePictureId: samplePictureId, // 样例图片id
          drawingData: drawingData, // 样例图片上标记点集合
          targetPictureId: targetPictureId, // 目标图片，即待标注图片id,
          labelId: labelId,
          guid: guid,
          imageWidth: imageWidth,
          imageHeight: imageHeight,
        })
        .then((res) => {
          // 停止loading
          this.cancelLoadingItem(targetPictureId);
          // 讲labels中的标注坐标转成markPositions结构，进行小图的标注绘制。
          const imageRecord = {
            markPositions: getMarkPositions(res.data.labels),
          };

          const parentInstance = this.$parent;

          // 更新小图标注
          parentInstance.render(
            targetPictureId,
            imageRecord,
            "pic_",
            "svg_",
            "_detail"
          );

          // 更新图片列表数据（markPositions）,保住预览图响应及时
          const obj = this.modalInstance.processPictureList.find(
            (item) => item.id === targetPictureId
          );
          if (obj && obj.markPositions) {
            obj.markPositions = imageRecord.markPositions;
          }

          // 以下三个步骤只需要在自动标注当前图时，才需要进行
          if (isCurrentView) {
            // 删除标注和画线
            this.deleteLine();
            // parentInstance.currentAnnotation.deleteAnnotation();

            // 重新获取当前图片信息及标注
            parentInstance.getData();
          }
        });
    },
    export() {
      return {
        guidance: this.line.guidance,
        completeDistance: this.line.completeDistance,
        minDistance: this.line.minDistance,
        blackOrWhite: this.color.blackOrWhite,
        auto: this.color.auto,
        radius: this.color.radius,
      };
    },
    setPreferences(pref) {
      this.line.guidance = pref.guidance || this.line.guidance;
      this.line.completeDistance =
        pref.completeDistance || this.line.completeDistance;
      this.line.minDistance = pref.minDistance || this.line.minDistance;
      this.color.blackOrWhite = pref.blackOrWhite || this.color.blackOrWhite;
      this.color.auto = pref.auto || this.color.auto;
      this.color.radius = pref.radius || this.color.radius;
    },
    /**
     * Creates a new selection line path
     */
    createLine() {
      if (this.color.auto) {
        this.color.circle = new paper.Path.Circle(
          new paper.Point(0, 0),
          this.color.radius
        );
      }
      this.line.path = new paper.Path(this.line.pathOptions);
    },
    /**
     * Frees current line
     */
    deleteLine() {
      if (this.line.path == null) return;

      this.line.path.remove();
      this.line.path = null;

      if (this.color.circle == null) return;
      this.color.circle.remove();
      this.color.circle = null;
    },
    autoStrokeColor(point) {
      if (this.color.circle == null) return;
      if (this.line.path == null) return;
      if (!this.color.auto) return;

      this.color.circle.position = point;
      let raster = this.$parent.image.raster;
      let color = raster.getAverageColor(this.color.circle);
      if (color) {
        this.line.pathOptions.strokeColor = invertColor(
          color.toCSS(true),
          this.color.blackOrWhite
        );
      }
    },
    // 鼠标点住移动
    onMouseDrag(event) {
      // debugger
      if (this.line.path == null) return;
      this.actionPoints++;
      this.autoStrokeColor(event.point);
      this.line.path.add(event.point);
      // this.autoComplete(30);
    },
    // 鼠标点下（落下）
    onMouseDown(event) {
      // debugger
      // let wasNull = false;
      if (this.line.path == null) {
        // wasNull = true;
        this.createLine();
      }

      // this.actionPoints = 1;
      // this.line.path.add(event.point);

      // if (this.autoComplete(3)) return;

      // if (this.line.guidance && wasNull) this.line.path.add(event.point);
    },
    // 鼠标抬起来
    // onMouseUp() {
    //   // debugger
    //   if (this.line.path == null) return;
    //   let action = new UndoAction({
    //     name: this.name,
    //     action: this.actionTypes.ADD_POINTS,
    //     func: this.undoPoints,
    //     args: {
    //       points: this.actionPoints
    //     }
    //   });

    //   this.addUndo(action);
    // },
    // onMouseMove(event) {
    //   if (this.line.path == null) return;
    //   if (this.line.path.segments.length === 0) return;
    //   this.autoStrokeColor(event.point);

    //   if (!this.line.guidance) return;
    //   this.removeLastPoint();
    //   this.line.path.add(event.point);
    // },
    // /**
    //  * Undo points
    //  */
    // undoPoints(args) {
    //   if (this.line.path == null) return;

    //   let points = args.points;
    //   let length = this.line.path.segments.length;

    //   if (this.line.guidance) {
    //     length -= 1;
    //   }

    //   this.line.path.removeSegments(length - points, length);
    // },
    /**
     * Completes line if point being added is close to first point（闭合形成多边形）
     * @returns {boolean} sucessfully closes object
     */
    autoComplete(minCompleteLength) {
      if (this.line.path == null) return false;
      if (this.line.path.segments.length < minCompleteLength) return false;

      let last = this.line.path.lastSegment.point;
      let first = this.line.path.firstSegment.point;

      let completeDistance = this.line.completeDistance;
      if (last.isClose(first, completeDistance)) {
        return this.complete();
      }

      return false;
    },
    /**
     * Closes current line and unites it with current annotaiton.
     * @returns {boolean} sucessfully closes object
     */
    complete() {
      if (this.line.path == null) return false;

      this.removeLastPoint();

      this.line.path.fillColor = "black";
      this.line.path.closePath();

      this.$parent.uniteCurrentAnnotation(this.line.path);

      this.line.path.remove();
      this.line.path = null;
      if (this.color.circle) {
        this.color.circle.remove();
        this.color.circle = null;
      }

      this.removeUndos(this.actionTypes.ADD_POINTS);
      this.$parent.save();
      return true;
    },
    removeLastPoint() {
      this.line.path.removeSegment(this.line.path.segments.length - 1);
    },
  },
  computed: {
    isDisabled() {
      return this.$parent.current.annotation === -1;
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
      this.line.pathOptions.strokeWidth = newScale * this.scaleFactor;
      if (this.line.path != null)
        this.line.path.strokeWidth = newScale * this.scaleFactor;
    },
    /**
     * Remove last point (point were mouse was) if enable guidane
     */
    "line.guidance"(guidance) {
      if (this.line.path == null) return;

      if (!guidance && this.line.path.length > 1) {
        this.removeLastPoint();
      }
    },
    "line.minDistance"(newDistance) {
      this.tool.minDistance = newDistance;
    },
    "line.pathOptions.strokeColor"(newColor) {
      if (this.line.path == null) return;

      this.line.path.strokeColor = newColor;
    },
    "color.auto"(value) {
      if (value && this.line.path) {
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
  },
};
</script>

<style lang="less" scoped >
.lineBtn {
  height: auto;
  &:disabled {
    color: white;
  }
  &:not(:disabled) {
    &:hover {
      color: #2ecc71;
      border-color: #2ecc71;
    }
    &:focus {
      color: #2ecc71;
      border-color: #2ecc71;
    }
  }
}
</style>