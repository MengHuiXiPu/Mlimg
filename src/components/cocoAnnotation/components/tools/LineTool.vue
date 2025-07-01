<template>
  <div class="mb-8">
    <!-- <i
      v-tooltip.right="tooltip"
      class="fa fa-x"
      :class="icon"
      :style="{ color: iconColor, fontSize: '22px' }"
      @click="click"
    /> -->
    <!-- 使用提示标注的nacos控制字段 -->
    <a-button type="primary" class="lineBtn" size="small" @click="btnTrigger" v-if="$attrs['show-prompt-tool']" :disabled="$parent.mode !='segment'">
      <!-- <span>提示</span><br />
      <span>标注</span> -->
      <span>智能</span><br />
      <span>标注</span>
    </a-button>
    <br />

    <!-- <modal-tool
      ref="toolModal"
      type="line"
      :categoriesList="getCategoriesList"
      @on-confirm="promptAnnotating"
      @on-cancel="deleteLine"
    /> -->
  </div>
</template>

<script>
import axios from "axios";
import paper from "paper";
import ModalTool from "./modalTool.vue";
import tool from "../../mixins/toolBar/tool";
// import UndoAction from "../../libs/undo";

// import { invertColor } from "../../libs/colors";
import { mapMutations, mapState } from "vuex";
import { getPictureFileIds, getPicture } from "@/api/modelManage";
import { fetchDataConcurrently } from "@/components/cocoAnnotation/libs/config";

import {
  getPictureIdPageList,
  getSingleDataListDetailById,
} from "@/api/dataCenter";
import JQuery from "jquery";

let $ = JQuery;

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
    allCategories: {
      type: Array,
      default: () => [],
    },
    annotationLabelArea: {
      type: String,
      default: "foreground",
    },
    annotationOption: {
      type: String,
      default: "replace",
    },
  },
  components: {
    ModalTool,
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
        path: [],
        guidance: true,
        simplify: 1,
        pathOptions: {
          strokeColor: "#00ff00",
          strokeWidth: 2,
        },
      },
      // 临时存放path
      path: null,
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
      currentJustOnce: true,
      idList: [],
      isModalOpen: false,
      // 标注过程中，每次轮询查到的完成标注的图片id，每次轮询要update，启动标注任务要清空
      finishedPicturesIds: [],
      // taskId: "",
    };
  },
  // async mounted() {
  //   // 获取数据集详情，主要是获取自动标注任务状态，根据状态，来判断是否继续轮询。
  //   const datasetDetail = await getSingleDataListDetailById(
  //     this.$parent.dataset.id
  //   );
  //   if (datasetDetail.data.autoMarkTaskStatus === 1) {
  //     axios
  //       .get(`/api/v1/datacenter/dataListAutoMarkTaskInfo/${this.taskId}`)
  //       .then((res) => {
  //         const info = res.data;
  //         // taskType：1，提示标注; taskType：2，自动标注
  //         if (info.taskType === 1) {
  //           this.handleResult();
  //         }
  //         return;
  //       });
  //   }
  // },
  methods: {
    ...mapMutations([
      "addUndo",
      "removeUndos",
      "setGroupLoading",
      "cancelLoadingItem",
      "setTaskId",
      "modifyGroupLoading",
      "clearLoading",
    ]),
    btnTrigger() {
      this.$parent.isShow = !this.$parent.isShow;
      // 隐藏智能标注后重置当前操作
      if (!this.$parent.isShow) {
        this.$emit("update", "");
      }
    },
    // 开始提示标注，批量标注
    async promptAnnotating(type) {
      try{
        this.$parent.save();
        const parentInstance = this.$parent;
        let targetPictureIds = [];
        let globalLoading = this.$GLoading('启动中...');
        if (type == "cur") {
          targetPictureIds.push(this.$parent.image.id);
        } else if (type == "all") {
          if(this.modalInstance.annotateTargetIds ) {
            targetPictureIds = this.modalInstance.annotateTargetIds
          }else { //去接口查询
            // 获取待处理的图片列表id
            const params = this.modalInstance.datasetId + "_" + this.modalInstance.selectMenu;
            const idsRes = await getPictureFileIds(params, 2); //获取图片列表id
            targetPictureIds = idsRes.data;
          }
        }
        // 获取图片宽高(同一路径下都一样)
        const imageWidth = parentInstance.image.raster.width;
        const imageHeight = parentInstance.image.raster.height;
        const center = [imageWidth / 2, imageHeight / 2];

        let drawingData = [], promptMask = [], mode = "full"
        if(this.line?.path?.length) {  //用户做了画线，然后开始的标注任务
          // 获取坐标并转换，样例图片上标记点集合
          drawingData = this.line.path.map((path) => {
            return {
              path: path._segments.map((item) => {
                return {
                  x: Math.round(center[0] + item._point._x, 2),
                  y: Math.round(center[1] + item._point._y, 2),
                };
              }),
              label: path.label,
            };
          });
        }else { //未划线，直接开始标注，用markTaskId查询promptMask，用作本次标注
          const markTaskId = parentInstance.markTaskId || parentInstance.$attrs.markTaskId
          if(!markTaskId) {
            globalLoading.close()
            return this.$message.warning('请给出画线提示')
          }
          const prevMaskTaskInfo = await axios.get(`/api/v1/datacenter/dataListAutoMarkTaskInfo/${markTaskId}`)
          promptMask  = prevMaskTaskInfo?.data?.promptMask
          if(!promptMask || !promptMask.length) {
            globalLoading.close()
            return this.$message.warning('请给出提示标注')
          }
          mode = "segment_only"
        }
      // 样例图id
      const samplePictureId = parentInstance.image.id;
      
        this.$parent.annotatingInfo = false  //清空标注进度信息
        // 发起标注任务
        axios.post(`/api/v1/datacenter/autoAnnotator/promptSegV2`, {
          mode,
          dlId: parentInstance.dataset.id,
          targetPictureIds: targetPictureIds,
          samplePictureId: samplePictureId, // 样例图片id
          drawingData: drawingData, // 样例图片上标记点集合
          // labelId: labelId, // 标签id
          preservePrevAnnos:
            parentInstance.selectedAnnotationOption !== "replace", // 是否保留原有标注
          promptModel: parentInstance.selectPromptModel,
          segmentModel: parentInstance.selectSegmentModel,
          promptMask
        })
        .then((res) => {
          if (res.code == -1) {
            // return this.$message.warning(res.msg);
            return
          }
          if (res.data?.status === 1) {
            if (type == "cur") {
              this.modifyGroupLoading([this.$parent.image.id]);
            } else if (type == "all") {
              // 设置全部loading
              this.modifyGroupLoading(
                this.modalInstance.processPictureList.map((item) => item.id)
              );
            }

            this.setTaskId(res.data.id);
            this.$parent.markTaskId = res.data.id
            // this.taskId = res.data.id;
            this.idList = []
            this.finishedPicturesIds = []
            this.handleResult({ annotateType: type });
          }
        })
        .finally(() => {globalLoading.close()});
      }catch(e) {
        globalLoading.close()
      }
    },
    async handleResult({ annotateType }) {
      this.timer && clearTimeout(this.timer)
       // 获取数据集详情，主要是获取自动标注任务状态，根据状态，来判断是否继续轮询。
      //  此接口响应结果来确定是否标注完成
      const datasetDetail = await getSingleDataListDetailById(
        this.$parent.dataset.id
      );
      // 查询进度信息以及哪些图片正在标注，哪些已经标注完成
      const processData = await axios.get(`/api/v1/datacenter/dataListAutoMarkTaskInfo/${this.taskId || datasetDetail?.data?.markTaskId}`)
      // 正在标注中的图片id，非正在标注的既是标注完成的
      const pendingPictureIds = processData?.data?.pendingPictureIds || []
      const targetPictureIds = processData?.data?.targetPictureIds || []
      // diff出完成标注的图片ids
      const finishedPicturesIds = targetPictureIds.filter(targetId => !pendingPictureIds.includes(targetId))
      // 更新标注完成的缩略图
      finishedPicturesIds.forEach((ele, index) => {
        if (!this.idList.includes(ele)) {
            getPicture(ele, "thumbnail_with_bbox").then((res) => {
              const url = window.URL.createObjectURL(res);
              // this.$set(this.modalInstance.pictureLoadList[index], "url", url);
              this.modalInstance.pictureLoadList.forEach((item) => {
                if (item.id === ele) {
                  this.$set(item, "url", url);
                }
              });
              this.$set(this.modalInstance.pictureLoadMap, ele, url);
              this.idList.push(ele);
          })
        }
      });
      this.modifyGroupLoading(pendingPictureIds);
      // 需要注意的是currentImageId是随时都可能变的(用户会在标注期间切换focus图片)，所以不能为了避免重复调用getData方法来用之前的currentJustOnce标志位变量来控制
      const currentImageId = this.$parent.image.id;
      // 当前focus的图片是否已标注完成
      const hasCurrentResult = finishedPicturesIds.includes(currentImageId);
      const hasPrevResult = this.finishedPicturesIds.includes(currentImageId)
      // 标注任务是否停止(完成或中断)
      const isTaskFinish = datasetDetail.data.autoMarkTaskStatus !== 1
      if ((isTaskFinish || hasCurrentResult) && !hasPrevResult) {  //表示当前图片标注已完成
        // 删除画线
        // this.deleteLine();
        // 清除compoundPath
        this.$parent.clearAnnotationComPath()
        console.log('发起查询这张图片标注信息：', currentImageId)
        // 重新获取当前图片信息及标注
        this.$parent.getData((annotatorInstance, data)=>{
          if(annotateType!=='cur') {  //非单张标注
            return
          }
          // 获取标注数量
          const _totalAnnotations = data.labels.reduce((acc,cur) =>{
            acc.push(...cur.annotations)
            return acc
          }, [])
          if(!_totalAnnotations.length) {
            this.$message.warning('未生成标注信息')
          }
        });
      }
      // 更新记录本次轮训后完成标注的图片ids
      this.finishedPicturesIds = finishedPicturesIds
      // autoMarkTaskStatus: 1 进行中  2 已完成  3错误
      if (datasetDetail.data.autoMarkTaskStatus !== 1) {
        // this.currentJustOnce = true;
        // 关掉所有loading
        this.clearLoading();
        // 删除画线
        // this.deleteLine();
        if (this.timer) {
          clearTimeout(this.timer);
        }

        this.setTaskId("");
        this.idList = [];
        this.$parent.annotatingInfo = `${datasetDetail.data?.autoMarkTaskStatusMessage}`
        // return 不再轮训
        return;
      }else { // 标注中...
        this.$parent.annotatingInfo = `${datasetDetail.data?.autoMarkTaskStatusMessage}，已完成标注：${processData?.data?.finished}/${processData?.data?.total}`
      }
      // 轮询
      this.timer = setTimeout(() => {
        this.handleResult(...arguments);
      }, 2000);
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
      this.line.completeDistance = this.line.completeDistance;
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
      this.path = new paper.Path(this.line.pathOptions);
      this.path.label = this.$parent.selectedAnnotationLabelArea;
    },
    /**
     * Frees current line
     */
    deleteLine() {
      if (this.line.path == [] || !Array.isArray(this.line.path)) return;

      this.line.path.forEach((path) => {
        path.remove();
      });
      this.line.path = [];

      if (this.color.circle == null) return;
      this.color.circle.remove();
      this.color.circle = null;
    },
    autoStrokeColor(point) {
      if (this.color.circle == null) return;
      if (this.line.path == []) return;
      if (!this.color.auto) return;

      this.color.circle.position = point;
      let raster = this.$parent.image.raster;
      // let color = raster.getAverageColor(this.color.circle);
      // if (color) {
      //   this.line.pathOptions.strokeColor = invertColor(
      //     color.toCSS(true),
      //     this.color.blackOrWhite
      //   );
      // }
    },
    // 鼠标点住移动
    onMouseDrag(event) {
      if (this.isModalOpen) {
        return;
      }
      if (this.isInImage(this.$parent.imagePosition, event.point)) {
        // debugger
        if (this.line.path == [] || !this.path) return;
        this.actionPoints++;
        this.autoStrokeColor(event.point);
        this.path.add(event.point);
      } 
      // this.autoComplete(30);
    },
    // 鼠标点下（落下）
    onMouseDown(event) {
      // debugger
      // let wasNull = false;
      if (this.isInImage(this.$parent.imagePosition, event.point)) {
        if (this.line.path == null) return;
        if (this.$parent.selectedAnnotationLabelArea == "foreground") {
          this.line.pathOptions.strokeColor = "#00FF00";
        } else {
          this.line.pathOptions.strokeColor = "#811776";
        }
        this.createLine();
      } else {
        this.removeLastPoint();
        // this.createLine();
        this.$message.warning("请在图片内进行标注点选择");
      }
      // wasNull = true;
      // this.actionPoints = 1;
      // this.line.path.add(event.point);

      // if (this.autoComplete(3)) return;

      // if (this.line.guidance && wasNull) this.line.path.add(event.point);
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
    // 鼠标抬起来
    onMouseUp(event) {
      if (this.isInImage(this.$parent.imagePosition, event.point)) {
        // this.$refs.toolModal.show();
        // this.line.path.push(this.path);
        // this.path = null;
      } else {
        this.removeLastPoint();
        // this.line.path.push(this.path);
        this.$message.warning("请在图片内进行标注点选择");
      }
      if(this.path != null){
        this.line.path.push(this.path);
        this.path = null;
      }
      // debugger
      // if (this.line.path == null) return;
      // let action = new UndoAction({
      //   name: this.name,
      //   action: this.actionTypes.ADD_POINTS,
      //   func: this.undoPoints,
      //   args: {
      //     points: this.actionPoints,
      //   },
      // });

      // this.addUndo(action);
    },
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
      if (this.line.path == []) return false;

      this.removeLastPoint();

      this.line.path.fillColor = "#00FF00";
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
      // this.line.path.removeSegment(this.line.path.segments.length - 1);
      if(this.line?.path && typeof(this.line.path.removeSegment)=='function') {
        this.line.path.removeSegment(this.line?.path?.segments?.length - 1);
      }
    },
    /**
     * @public
     */
    removeTimer() {
      this.timer && clearTimeout(this.timer);
    }
  },
  computed: {
    // isDisabled() {
    //   return this.$parent.current.annotation === -1;
    // },
    ...mapState({
      taskId: (state) => state.annotator.taskId,
    }),
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
      if (this.path == null) return;
      this.path.strokeColor = newColor;
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
    "modalInstance.hasAutoTask": {
      handler(val) {
        if (val) {
          axios
            .get(`/api/v1/datacenter/dataListAutoMarkTaskInfo/${this.taskId}`)
            .then((res) => {
              const info = res.data;
              const annotateTarget = info.targetPictureIds.length > 1 ? 'all': 'cur';
              // taskType：1，提示标注; taskType：2，自动标注
              // taskType：2，提示标注; taskType：1，自动标注
              if (info.taskType === 2) {
                this.handleResult({ annotateType: annotateTarget });
                this.$parent.setAnnotatingConfig(info)
              }
              return;
            });
        }
      },
      immediate: true
    },
    // 你这样写能有用？自己心里安慰呢
    "modalInstance.isShow": {
      handler(val) {
        // 当窗口被关闭时，停掉轮询
        if (!val) {
          console.log("isShow:" + val);
          this.timer && clearTimeout(this.timer);
        }
      }
    },
  },
};
</script>

<style lang="less" scoped>
.lineBtn {
  height: auto;
  color: #fff;
  padding: 5px 18px;
}
.mb-8 {
  margin-bottom: 8px;
}
</style>
