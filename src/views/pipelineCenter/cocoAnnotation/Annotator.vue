<template>
  <div style="display: block; height: 100%">
    <aside v-show="panels.show.left" class="left-panel shadow-lg">
      <div v-show="mode == 'segment'">
        <!-- <hr /> -->

        <SelectTool
          v-model="activeTool"
          :scale="image.scale"
          @setcursor="setCursor"
          ref="select"
        />
        <hr />

        <BBoxTool
          v-model="activeTool"
          :scale="image.scale"
          @setcursor="setCursor"
          ref="bbox"
        />
        <!-- <ScreenShotTool
          v-model="activeTool"
          :scale="image.scale"
          @setcursor="setCursor"
          ref="screenShot"
        /> -->

        <!-- <PolygonTool
          v-model="activeTool"
          :scale="image.scale"
          @setcursor="setCursor"
          ref="polygon"
        />

        <MagicWandTool
          v-model="activeTool"
          :width="image.raster.width"
          :height="image.raster.height"
          :image-data="image.data"
          @setcursor="setCursor"
          ref="magicwand"
        />

        <BrushTool
          v-model="activeTool"
          :scale="image.scale"
          @setcursor="setCursor"
          ref="brush"
        />
        <EraserTool
          v-model="activeTool"
          :scale="image.scale"
          @setcursor="setCursor"
          ref="eraser"
        />
        <LineTool
          v-model="activeTool"
          :scale="image.scale"
          @setcursor="setCursor"
          ref="line"
        /> -->

        <!-- <KeypointTool
          v-model="activeTool"
          @setcursor="setCursor"
          ref="keypoint"
        />
        <DEXTRTool
          v-model="activeTool"
          :scale="image.scale"
          @setcursor="setCursor"
          ref="dextr"
        /> -->
      </div>
      <hr />

      <!-- <AnnotateButton :annotate-url="dataset.annotate_url || ''" /> -->

      <div v-show="mode == 'segment'">
        <!-- <CopyAnnotationsButton
          :categories="categories"
          :image-id="image.id"
          :next="image.next"
          :previous="image.previous"
        /> -->
        <ShowAllButton />
        <HideAllButton />
      </div>
      <hr />
      <CenterButton />
      <!-- <UndoButton /> -->

      <!-- <hr /> -->

      <!-- <DownloadButton :image="image" />
      <SaveButton /> -->
      <!-- <ModeButton v-model="mode" /> -->
      <!-- <SettingsButton
        :metadata="image.metadata"
        :commands="commands"
        ref="settings"
      /> -->

      <!-- <hr /> -->
      <!-- <DeleteButton :image="image" /> -->
    </aside>
    <aside v-show="panels.show.right" class="right-panel shadow-lg">
      <!-- <hr /> -->
      <!-- <FileTitle
        :previousimage="image.previous"
        :nextimage="image.next"
        :filename="image.filename"
        ref="filetitle"
      /> -->
      <slot name="pictureAction"></slot>
      <slot name="bindOpGroup"></slot>
      <div v-if="categories.length > 5">
        <div style="padding: 0px 5px">
          <input
            v-model="search"
            class="search"
            placeholder="Category Search"
          />
        </div>
      </div>

      <div
        class="sidebar-section"
        :style="{ 'max-height': mode == 'label' ? '100%' : '57%' }"
      >
        <slot name="opGroupList"></slot>
        <p v-if="categories.length == 0" style="font-size: 12px; color: #4b5162;">
          No categories have been enabled for this image.
        </p>
        <div
          v-show="mode == 'segment'"
          style="overflow: auto; max-height: 100%"
        >
          <Category
            v-for="(category, index) in categories"
            :key="category.id + '-category'"
            :simplify="simplify"
            :categorysearch="search"
            :category="category"
            :all-categories="categories"
            :opacity="shapeOpacity"
            :hover="hover"
            :index="index"
            @click="onCategoryClick"
            @keypoints-complete="onKeypointsComplete"
            :current="current"
            :active-tool="activeTool"
            :scale="image.scale"
            ref="category"
            @click-annotation="onAnnotationClick"
          />
        </div>

        <div v-show="mode == 'label'" style="overflow: auto; max-height: 100%">
          <CLabel
            v-for="category in categories"
            v-model="image.categoryIds"
            :key="category.id + '-label'"
            :category="category"
            :search="search"
          />
        </div>
      </div>

      <div v-show="mode == 'segment'">
        <hr />
        <h6 class="sidebar-title text-center">{{ activeTool }}</h6>

        <div class="tool-section" style="max-height: 30%; color: lightgray">
          <div v-if="$refs.bbox != null">
            <BBoxPanel :bbox="$refs.bbox" />
          </div>
          <div v-if="$refs.screenShot != null">
            <BBoxPanel :bbox="$refs.screenShot" />
          </div>
          <div v-if="$refs.polygon != null">
            <PolygonPanel :polygon="$refs.polygon" />
          </div>

          <div v-if="$refs.line != null">
            <LinePanel :line="$refs.line" />
          </div>

          <div v-if="$refs.select != null">
            <SelectPanel :select="$refs.select" />
          </div>

          <div v-if="$refs.magicwand != null">
            <MagicWandPanel :magicwand="$refs.magicwand" />
          </div>

          <div v-if="$refs.brush != null">
            <BrushPanel :brush="$refs.brush" />
          </div>

          <div v-if="$refs.eraser != null">
            <EraserPanel :eraser="$refs.eraser" />
          </div>

          <div v-if="$refs.keypoint != null">
            <KeypointPanel
              :keypoint="$refs.keypoint"
              :current-annotation="currentAnnotation"
            />
          </div>
          <div v-if="$refs.dextr != null">
            <DEXTRPanel :dextr="$refs.dextr" />
          </div>
        </div>
      </div>
      <slot name="outputArgs"></slot>
    </aside>
    <slot name="pictureList"></slot>
    <div class="middle-panel" :style="{ cursor: cursor }">
      <v-touch @pinch="onpinch" @pinchstart="onpinchstart">
        <div id="frame" class="frame" @wheel="onwheel">
          <canvas class="canvas" id="editor" ref="image" resize />
        </div>
      </v-touch>
    </div>
    <div
      v-show="annotating.length > 0"
      class="fixed-bottom alert alert-warning alert-dismissible fade show"
    >
      <span>
        This image is being annotated by <b>{{ annotating.join(", ") }}</b
        >.
      </span>

      <button
        type="button"
        class="close"
        data-dismiss="alert"
        aria-label="Close"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  </div>
</template>

<script>
import paper from "paper";
import axios from "axios";

import RPA from "@/api/rpa";
import Operator from "@/api/operator";

import eventBus from "@/views/pipelineCenter/pipelineEditor/utils/eventBus";

import toastrs from "./mixins/toastrs";
import shortcuts from "./mixins/shortcuts";
import renderSvg from "./mixins/renderSvg";

import FileTitle from "./components/FileTitle";
import Category from "./components/Category";
import Label from "./components/Label";

// import Annotations from "./models/annotations";

import PolygonTool from "./components/tools/PolygonTool";
import LineTool from "./components/tools/LineTool";
import BBoxTool from "./components/tools/BBoxTool";
import ScreenShotTool from "./components/tools/screenShotTool";
import SelectTool from "./components/tools/SelectTool";
import MagicWandTool from "./components/tools/MagicWandTool";
import EraserTool from "./components/tools/EraserTool";
import BrushTool from "./components/tools/BrushTool";
import KeypointTool from "./components/tools/KeypointTool";
import DEXTRTool from "./components/tools/DEXTRTool";

import CopyAnnotationsButton from "./components/tools/CopyAnnotationsButton";
import CenterButton from "./components/tools/CenterButton";
import DownloadButton from "./components/tools/DownloadButton";
// import SaveButton from "./components/tools/SaveButton";
import SettingsButton from "./components/tools/SettingsButton";
import ModeButton from "./components/tools/ModeButton";
import DeleteButton from "./components/tools/DeleteButton";
import UndoButton from "./components/tools/UndoButton";
import ShowAllButton from "./components/tools/ShowAllButton";
import HideAllButton from "./components/tools/HideAllButton";
import AnnotateButton from "./components/tools/AnnotateButton";

import PolygonPanel from "./components/panels/PolygonPanel";
import LinePanel from "./components/panels/LinePanel";
import BBoxPanel from "./components/panels/BBoxPanel";
import SelectPanel from "./components/panels/SelectPanel";
import MagicWandPanel from "./components/panels/MagicWandPanel";
import BrushPanel from "./components/panels/BrushPanel";
import EraserPanel from "./components/panels/EraserPanel";
import KeypointPanel from "./components/panels/KeypointPanel";
import DEXTRPanel from "./components/panels/DEXTRPanel";

import { mapMutations } from "vuex";

import {
  preferences,
  paperjs_to_coco,
  convertToRectangle,
  getIntCenterPoint,
} from "./libs/config";
const modeMap = {
  segment: 3,
  label: 1,
};

export default {
  name: "rpaAnnotator",
  components: {
    FileTitle,
    CopyAnnotationsButton,
    Category,
    CLabel: Label,
    BBoxTool,
    ScreenShotTool,
    BBoxPanel,
    LineTool,
    PolygonTool,
    PolygonPanel,
    LinePanel,
    SelectTool,
    MagicWandTool,
    EraserTool,
    BrushTool,
    KeypointTool,
    DownloadButton,
    // SaveButton,
    SettingsButton,
    DeleteButton,
    CenterButton,
    SelectPanel,
    MagicWandPanel,
    BrushPanel,
    EraserPanel,
    ModeButton,
    UndoButton,
    HideAllButton,
    ShowAllButton,
    KeypointPanel,
    AnnotateButton,
    DEXTRTool,
    DEXTRPanel,
  },
  mixins: [toastrs, shortcuts, renderSvg],
  props: {
    // rpaModel中的focusid
    identifier: {
      type: [Number, String],
      required: true,
      default: null,
    },
    imageUrl: {
      type: String,
      default: () => "",
    },
    rpaId: {
      type: [Number, Boolean],
      default: null,
    },
    currentArgs: {
      type: Array,
      default: [],
    },
  },
  data() {
    return {
      activeTool: "Select",
      paper: null,
      shapeOpacity: 0.6,
      zoom: 0.2,
      cursor: "move",
      mode: "segment",
      simplify: 1,
      panels: {
        show: {
          left: true,
          right: true,
        },
      },
      current: {
        category: -1,
        annotation: -1,
        keypoint: -1,
      },
      hover: {
        category: -1,
        annotation: -1,
        keypoint: -1,
      },
      image: {
        raster: {},
        scale: 0,
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
      },
      text: {
        topLeft: null,
        topRight: null,
      },
      categories: [],
      dataset: {
        annotate_url: "",
      },
      loading: {
        image: true,
        data: true,
        loader: null,
      },
      search: "",
      annotating: [],
      pinching: {
        old_zoom: 1,
      },
      preferences,
      modeMap,
    };
  },
  methods: {
    ...mapMutations(["addProcess", "removeProcess", "resetUndo", "setDataset"]),
    async save(callback) {
      let process = "Saving";
      this.addProcess(process);
      // if (this.activeTool === "ScreenShot") {
      // const point = convertToRectangle(segmentation, this.activeTool);
      // RPA.saveScreenshot(this.rpaId, {
      //   operatorId: this.currentCategory.category.id,
      //   imageId: this.image.id,
      //   ...point,
      //   // point展开如下：
      //   // x1: int,
      //   // y1: int,
      //   // x2: int,
      //   // y2: int,
      // })
      //     .then(() => {
      //       //TODO: updateUser
      //       if (callback != null) callback(this.image.id);
      //     })
      //     .finally(() => this.removeProcess(process));
      // } else {
      let currentAnnotationInstance = this.currentAnnotation || this.getDefalutAnnotationInstance()
       const _segmentation = paperjs_to_coco(
        this.image.raster.width,
        this.image.raster.height,
        // this.currentAnnotation.annotation.paper_object
        currentAnnotationInstance.annotation.paper_object
      );
      console.log('segmentation', _segmentation);
      let segmentation = _segmentation.length > 1 ? [_segmentation[_segmentation.length -1]] : _segmentation
      const centerPoint = getIntCenterPoint(segmentation);
      // 对于point，也需要记录框的位置，以便反显
      const roiPoint = convertToRectangle(segmentation, "BBox");
      const screenShotPoint = convertToRectangle(segmentation, "ScreenShot");
      const roiValue = convertToRectangle(segmentation, "BBox");
      // eventBus.$emit('on-point', JSON.stringify(centerPoint))
      // eventBus.$emit('on-roi', JSON.stringify(roiValue))
      // eventBus.$emit('on-template', JSON.stringify(screenShotPoint))
      const res = await RPA.saveScreenshot(this.rpaId, {
        operatorId: this.currentCategory.category.id,
        imageId: this.image.id,
        ...screenShotPoint,
        // screenShotPoint展开如下：
        // x1: int,
        // y1: int,
        // x2: int,
        // y2: int,
      });
      const imgPath = res.data;
      const copy = this.currentArgs.concat();
      for (const item of copy) {
        
        // 对于锁定的算子，不做标注更新赋值
        let currentOp =  (this.categories[0]?.annotations || []).find(anno => anno.id === item.id) || {}
        item.imageId = currentOp.lockValue === true ? item.imageId : this.image.id;
        // 因为之前的代码currentArgs与categories不是一个引用，lock按钮绑定的是categories的数据，所以这里需要同步一下来保存
        item.lockValue = currentOp.lockValue
        if(currentOp.lockValue === true) continue

        if (item.labelingType === "point") {
          item.value = centerPoint;
          item.segmentation = roiPoint
        // } else if (item.id === this.currentAnnotation.annotation.id) {
        }else if(item.id === currentAnnotationInstance.annotation.id) {
          item.value = roiValue;
        } else if (item.labelingType === "template") {
          item.value = imgPath;
        }
        delete item.id;
        delete item.defaultValue;
      }
      RPA.opGroupInstanceUpdate(this.rpaId, this.currentCategory.category.id, {
        name: this.currentCategory.category.name,
        rpaLabelingDetail: {
          args: copy,
        },
      })
        .then(() => {
          //TODO: updateUser
          if (callback != null) callback(this.image.id);
          this.$message.success("标注赋值成功");
          this.$emit("save-args");
        })
        .finally(() => this.removeProcess(process));
      // }
    },
    clearArgs() {
      const copy = this.currentArgs.concat();
      for (const item of copy) {
        item.imageId = null;
        item.value = null;
        delete item.id;
      }
      console.log(copy);

      RPA.opGroupInstanceUpdate(this.rpaId, this.currentCategory.category.id, {
        name: this.currentCategory.category.name,
        rpaLabelingDetail: {
          args: copy,
        },
      }).then(() => {
        this.$message.success("清除标注成功");
        this.$emit("clear-args");
      });
    },
    deleteCategory(clickCategory = {}) {
      // 之前周凯文这么写的，这样在不点击展开的时候，直接删除会报错，先这样修复一下，后续整个都改重构
      let id = this.currentCategory?.category?.id || clickCategory.id
      Operator.deleteOperator(id).then(() => {
        this.$message.success("删除该标签成功");
        this.$emit("delete-category");
      });
    },
    onpinchstart(e) {
      e.preventDefault();
      if (!this.doneLoading) return;
      let view = this.paper.view;
      this.pinching.old_zoom = this.paper.view.zoom;
      return false;
    },
    onpinch(e) {
      e.preventDefault();
      if (!this.doneLoading) return;
      let view = this.paper.view;
      let viewPosition = view.viewToProject(
        new paper.Point(e.center.x, e.center.y)
      );
      let curr_zoom = e.scale * this.pinching.old_zoom;
      let beta = this.paper.view.zoom / curr_zoom;
      let pc = viewPosition.subtract(this.paper.view.center);
      let a = viewPosition
        .subtract(pc.multiply(beta))
        .subtract(this.paper.view.center);
      let transform = { zoom: curr_zoom, offset: a };
      if (transform.zoom < 10 && transform.zoom > 0.01) {
        this.image.scale = 1 / transform.zoom;
        this.paper.view.zoom = transform.zoom;
        this.paper.view.center = view.center.add(transform.offset);
      }
      return false;
    },
    onwheel(e) {
      e.preventDefault();
      if (!this.doneLoading) return;

      let view = this.paper.view;

      if (e.ctrlKey) {
        // Pan up and down
        let delta = new paper.Point(0, 0.5 * e.deltaY);
        this.paper.view.setCenter(view.center.add(delta));
      } else if (e.shiftKey) {
        // Pan left and right
        let delta = new paper.Point(0.5 * e.deltaY, 0);
        this.paper.view.setCenter(view.center.add(delta));
      } else {
        let viewPosition = view.viewToProject(
          new paper.Point(e.offsetX, e.offsetY)
        );

        let transform = this.changeZoom(e.deltaY, viewPosition);
        if (transform.zoom < 10 && transform.zoom > 0.01) {
          this.image.scale = 1 / transform.zoom;
          this.paper.view.zoom = transform.zoom;
          this.paper.view.center = view.center.add(transform.offset);
        }
      }

      return false;
    },
    fit() {
      let canvas = document.getElementById("editor");

      let parentX = this.image.raster.width;
      let parentY = this.image.raster.height;

      this.paper.view.zoom = Math.min(
        (canvas.width / parentX) * 0.95,
        (canvas.height / parentY) * 0.8
      );

      this.image.scale = 1 / this.paper.view.zoom;
      this.paper.view.setCenter(0, 0);
    },
    changeZoom(delta, p) {
      let oldZoom = this.paper.view.zoom;
      let c = this.paper.view.center;
      let factor = 1 + this.zoom;

      let zoom = delta < 0 ? oldZoom * factor : oldZoom / factor;
      let beta = oldZoom / zoom;
      let pc = p.subtract(c);
      let a = p.subtract(pc.multiply(beta)).subtract(c);

      return { zoom: zoom, offset: a };
    },

    initCanvas() {
      let process = "Initializing canvas";
      this.addProcess(process);
      this.loading.image = true;

      let canvas = document.getElementById("editor");
      this.paper.setup(canvas);
      this.paper.view.viewSize = [
        this.paper.view.size.width,
        window.innerHeight,
      ];
      this.paper.activate();

      this.image.raster = new paper.Raster(this.image.url);
      this.image.raster.onLoad = () => {
        let width = this.image.raster.width;
        let height = this.image.raster.height;

        this.image.raster.sendToBack();
        this.fit();
        this.image.ratio = (width * height) / 1000000;
        this.removeProcess(process);

        let tempCtx = document.createElement("canvas").getContext("2d");
        tempCtx.canvas.width = width;
        tempCtx.canvas.height = height;
        tempCtx.drawImage(this.image.raster.image, 0, 0);

        this.image.data = tempCtx.getImageData(0, 0, width, height);
        let fontSize = width * 0.025;

        let positionTopLeft = new paper.Point(
          -width / 2,
          -height / 2 - fontSize * 0.5
        );
        this.text.topLeft = new paper.PointText(positionTopLeft);
        this.text.topLeft.fontSize = fontSize;
        this.text.topLeft.fillColor = "white";
        this.text.topLeft.content = this.image.filename;

        // let positionTopRight = new paper.Point(
        //   width / 2,
        //   -height / 2 - fontSize * 0.4
        // );
        // this.text.topRight = new paper.PointText(positionTopRight);
        // this.text.topRight.justification = "right";
        // this.text.topRight.fontSize = fontSize;
        // this.text.topRight.fillColor = "white";
        // this.text.topRight.content = width + "x" + height;

        this.loading.image = false;
      };
    },
    setPreferences(preferences) {
      let refs = this.$refs;

      refs.bbox.setPreferences(preferences.bbox || preferences.polygon || {});
      refs.polygon.setPreferences(preferences.polygon || {});
      refs.line.setPreferences(preferences.line || {});
      refs.select.setPreferences(preferences.select || {});
      refs.magicwand.setPreferences(preferences.magicwand || {});
      refs.brush.setPreferences(preferences.brush || {});
      refs.eraser.setPreferences(preferences.eraser || {});
    },
    // 根据图片id获取相关数据。
    // 这个方法在rpa标注里应该不需要被使用，该注释掉
    getData(callback) {
      let process = "Loading annotation data";
      this.addProcess(process);
      this.loading.data = true;

      axios
        .get(
          `/api/v1/datacenter/dataListAnnotation/getByPicture/${this.image.id}`
        )
        .then((response) => {
          let data = response.data;

          this.loading.data = false;
          // Set image data
          this.image.metadata = data.image.metadata || {};
          this.image.filename = data.image.fileName;
          // this.image.next = data.image.next;
          // this.image.previous = data.image.previous;
          // this.image.categoryIds = data.image.category_ids || [];
          this.image.categoryIds = data.labels.map((item) => item.id) || [];

          this.annotating = data.image.annotating || [];

          // Set other data

          // 取宽高
          let width = this.image.raster.width;
          let height = this.image.raster.height;
          // 修改宽高，遍历数据结构中的每条记录
          data.labels.forEach((record) => {
            // 遍历每条记录的 annotations 数组
            record.annotations.forEach((annotation) => {
              // 修改每天记录的 width 和 height
              annotation.width = width;
              annotation.height = height;
              // 设置算子默认锁定状态
              // annotation.lockValue = annotation.lockValue || false
            });
          });

          this.dataset = data.dataset;
          this.categories = data.labels;

          // Update status

          this.setDataset(this.dataset);

          let preferences = this.preferences;
          this.setPreferences(preferences);

          if (this.text.topLeft != null) {
            this.text.topLeft.content = this.image.filename;
          }

          this.$nextTick(() => {
            // 展示标签
            this.showAll();
          });

          if (callback != null) callback();
        })
        .catch(() => {
          this.axiosReqestError(
            "Could not find requested image, Redirecting to previous page."
          );
          // this.$router.go(-1);
        })
        .finally(() => this.removeProcess(process));
    },
    onCategoryClick(indices) {
      this.current.annotation = indices.annotation;
      this.current.category = indices.category;
      if (!indices.hasOwnProperty("keypoint")) {
        indices.keypoint = -1;
      }
      if (indices.keypoint !== -1) {
        this.current.keypoint = indices.keypoint;
        let ann =
          this.currentCategory.category.annotations[this.current.annotation];
        let kpTool = this.$refs.keypoint;
        let selectTool = this.$refs.select;
        let category = this.$refs.category[this.current.category];
        let annotation = category.$refs.annotation[this.current.annotation];
        annotation.showKeypoints = true;
        let keypoints = annotation.keypoints;
        if (keypoints._labelled[indices.keypoint + 1]) {
          let indexLabel = String(this.current.keypoint + 1);
          let keypoint = keypoints._labelled[indexLabel];
          keypoint.selected = true;
          this.activeTool = selectTool;
          this.activeTool.click();
        } else {
          this.currentAnnotation.keypoint.next.label = String(
            indices.keypoint + 1
          );
          this.activeTool = kpTool;
          this.activeTool.click();
        }
      }
    },
    /**
     * 监听annotation click
     */
    onAnnotationClick(indices) {
      // this.current.annotation = indices.annotation;
      this.current.category = indices.category;
      const clickedAnnotation = this.currentCategory.category.annotations[
        indices.annotation
      ];
      if(clickedAnnotation?.imageId) { //聚焦到对应的图片
        this.$emit("focus-image", clickedAnnotation.imageId);
      }
    },
    onKeypointsComplete() {
      this.currentAnnotation.keypoint.next.label = -1;
      this.activeTool = this.$refs.select;
      this.activeTool.click();
    },
    // 获取category实例, 明明在rpa场景下，只有一个category，非要抄过来一坨又一坨的代码过来
    getCategory(index) {
      // if (index == null) return null;
      // if (index < 0) return null;

      let ref = this.$refs.category;
      if((index ==null || index < 0) && ref) {
        return ref[0]
      }
      // console.log(ref)
      if (ref == null) return null;
      if (ref.length < 1 || index >= ref.length) return null;

      return this.$refs.category[index];
    },
    // Current Annotation Operations
    uniteCurrentAnnotation(
      compound,
      simplify = true,
      undoable = true,
      isBBox = false
    ) {
      const annotationInstance = this.currentAnnotation || this.getDefalutAnnotationInstance()
      if(!annotationInstance) return
      // this.currentAnnotation.unite(compound, simplify, undoable, isBBox);
      annotationInstance.unite(compound, simplify, undoable, isBBox)
    },
    // 当用户没有点击annotation，此时也就没有currentAnnotation,而现在需求是不需要用户点击也能进行标注，之前的人的逻辑是用roi的手动click()选中，又不符合选中annotation关联图片的需求
    getDefalutAnnotationInstance() {
      if(!this.currentCategory) return null
      const annotaitonInstances = this.currentCategory.$refs.annotation || []
      return annotaitonInstances.find(
          item => item.annotation.labelingType === "roi"
      );
    },
    subtractCurrentAnnotation(compound, simplify = true, undoable = true) {
      if (this.currentCategory == null) return;
      this.currentAnnotation.subtract(compound, simplify, undoable);
    },

    selectLastEditorTool() {
      this.activeTool = localStorage.getItem("editorTool") || "Select";
    },

    setCursor(newCursor) {
      this.cursor = newCursor;
    },
    incrementCategory() {
      if (this.current.category >= this.categories.length - 1) {
        this.current.category = -1;
      } else {
        this.current.category += 1;
        if (this.currentKeypoint) {
          this.currentAnnotation.onAnnotationKeypointClick(
            this.current.keypoint
          );
        }
      }
    },
    decrementCategory() {
      if (this.current.category === -1) {
        this.current.category = this.categories.length - 1;
        let annotationCount = this.currentCategory.category.annotations.length;
        if (annotationCount > 0) {
          this.current.annotation = annotationCount - 1;
        }
      } else {
        this.current.category -= 1;
      }
    },
    incrementAnnotation() {
      let annotationCount = this.currentCategory.category.annotations.length;
      if (this.current.annotation === annotationCount - 1) {
        this.incrementCategory();
        this.current.annotation = -1;
      } else {
        this.current.annotation += 1;
        if (
          this.currentAnnotation != null &&
          this.currentAnnotation.showKeypoints
        ) {
          this.current.keypoint = 0;
          this.currentAnnotation.onAnnotationKeypointClick(
            this.current.keypoint
          );
        } else {
          this.current.keypoint = -1;
        }
      }
    },
    decrementAnnotation() {
      let annotationCount = this.currentCategory.category.annotations.length;
      if (this.current.annotation === -1) {
        this.current.annotation = annotationCount - 1;
      } else if (this.current.annotation === 0) {
        this.decrementCategory();
      } else {
        this.current.annotation -= 1;
        if (
          this.currentAnnotation != null &&
          this.currentAnnotation.showKeypoints
        ) {
          this.current.keypoint =
            this.currentAnnotation.keypointLabels.length - 1;
          this.currentAnnotation.onAnnotationKeypointClick(
            this.current.keypoint
          );
        } else {
          this.current.keypoint = -1;
        }
      }
    },
    incrementKeypoint() {
      let keypointCount = this.currentAnnotation.keypointLabels.length;
      if (this.current.keypoint === keypointCount - 1) {
        this.incrementAnnotation();
      } else {
        this.current.keypoint += 1;
      }
      if (this.currentKeypoint != null) {
        this.currentAnnotation.onAnnotationKeypointClick(this.current.keypoint);
        // this.currentAnnotation.$emit("keypoint-click", this.current.keypoint);
      }
    },
    decrementKeypoint() {
      if (this.current.keypoint === 0) {
        this.decrementAnnotation();
      } else {
        this.current.keypoint -= 1;
      }
      if (this.currentKeypoint != null) {
        this.currentAnnotation.onAnnotationKeypointClick(this.current.keypoint);
        // this.currentAnnotation.$emit("keypoint-click", this.current.keypoint);
      }
    },
    moveUp() {
      if (this.currentCategory != null) {
        if (this.currentAnnotation != null) {
          if (this.currentKeypoint != null) {
            this.decrementKeypoint();
          } else if (
            this.currentAnnotation.showKeypoints &&
            this.current.keypoint == -1
          ) {
            this.decrementKeypoint();
          } else {
            this.decrementAnnotation();
          }
        } else if (this.current.annotation == -1) {
          this.decrementAnnotation();
        } else {
          this.decrementCategory();
        }
      } else {
        this.decrementCategory();
      }
    },
    moveDown() {
      if (this.currentCategory != null) {
        if (this.currentAnnotation != null) {
          if (this.currentKeypoint != null) {
            this.incrementKeypoint();
          } else if (
            this.currentAnnotation.showKeypoints &&
            this.current.keypoint == -1
          ) {
            this.incrementKeypoint();
          } else {
            this.incrementAnnotation();
          }
        } else if (this.current.annotation == -1) {
          this.incrementAnnotation();
        } else {
          this.incrementCategory();
        }
      } else {
        this.incrementCategory();
      }
    },
    stepIn() {
      if (this.currentCategory != null) {
        if (!this.currentCategory.isVisible) {
          this.currentCategory.isVisible = true;
          this.current.annotation = 0;
          this.currentAnnotation.showKeypoints = false;
          this.current.keypoint = -1;
        } else if (
          !this.currentCategory.showAnnotations &&
          this.currentAnnotationLength > 0
        ) {
          this.currentCategory.showAnnotations = true;
          this.current.annotation = 0;
          this.currentAnnotation.showKeypoints = false;
          this.current.keypoint = -1;
        } else if (
          !this.currentAnnotation.showKeypoints &&
          this.currentAnnotation.keypointLabels.length > 0
        ) {
          this.currentAnnotation.showKeypoints = true;
          this.current.keypoint = 0;
          this.currentAnnotation.onAnnotationKeypointClick(
            this.current.keypoint
          );
        }
      }
    },
    stepOut() {
      if (this.currentCategory != null) {
        if (
          this.currentAnnotation != null &&
          this.currentAnnotation.showKeypoints
        ) {
          this.currentAnnotation.showKeypoints = false;
          this.current.keypoint = -1;
        } else if (this.currentCategory.showAnnotations) {
          this.currentCategory.showAnnotations = false;
          this.current.annotation = -1;
        } else if (this.currentCategory.isVisible) {
          this.currentCategory.isVisible = false;
        }
      }
    },
    scrollElement(element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },
    showAll() {
      if (this.$refs.category == null) return;

      this.$refs.category.forEach((category) => {
        category.isVisible = category.category.annotations.length > 0;
      });
    },
    hideAll() {
      if (this.$refs.category == null) return;

      this.$refs.category.forEach((category) => {
        category.isVisible = false;
        category.showAnnotations = false;
      });
    },
    findCategoryByName(categoryName) {
      let categoryComponent = this.$refs.category.find(
        (category) =>
          category.category.name.toLowerCase() === categoryName.toLowerCase()
      );
      if (!categoryComponent) return null;
      return categoryComponent.category;
    },
    addAnnotation(categoryName, segments, keypoints, isbbox = false) {
      segments = segments || [];
      keypoints = keypoints || [];

      if (keypoints.length == 0 && segments.length == 0) return;

      let category = this.findCategoryByName(categoryName);
      if (category == null) return;

      axios
        .post("/api/v1/datacenter/dataListAnnotation/create", {
          imageId: this.image.id,
          labelId: category.id,
          segmentation: segments,
          keypoints: keypoints,
          isbbox: isbbox,
        })
        .then((response) => {
          let annotation = response.data;
          category.annotations.push(annotation);
        });
      // Annotations.create({
      //   image_id: this.image.id,
      //   category_id: category.id,
      //   segmentation: segments,
      //   keypoints: keypoints,
      //   isbbox: isbbox,
      // }).then((response) => {
      //   let annotation = response.data;
      //   category.annotations.push(annotation);
      // });
    },

    updateAnnotationCategory(annotation, oldCategory, newCategoryName) {
      const newCategory = this.findCategoryByName(newCategoryName);
      if (!newCategory || !annotation) return;

      // dataListAnnotation/updateCategoryById/:annotationId
      axios
        .put(
          `/api/v1/datacenter/dataListAnnotation/updateCategoryById/${annotation.id}`,
          { category_id: newCategory.id }
        )
        .then((response) => {
          (response) => {
            let newAnnotation = {
              ...response.data,
              ...annotation,
              metadata: response.data.metadata,
              category_id: newCategory.id,
            };

            if (newAnnotation) {
              oldCategory.annotations = oldCategory.annotations.filter(
                (a) => a.id !== annotation.id
              );
              newCategory.annotations.push(newAnnotation);
            }
          };
        });

      // Annotations.update(annotation.id, { category_id: newCategory.id }).then(
      //   (response) => {
      //     let newAnnotation = {
      //       ...response.data,
      //       ...annotation,
      //       metadata: response.data.metadata,
      //       category_id: newCategory.id,
      //     };

      //     if (newAnnotation) {
      //       oldCategory.annotations = oldCategory.annotations.filter(
      //         (a) => a.id !== annotation.id
      //       );
      //       newCategory.annotations.push(newAnnotation);
      //     }
      //   }
      // );
    },

    removeFromAnnotatingList() {
      if (this.user == null) return;

      var index = this.annotating.indexOf(this.user.username);
      //Remove self from list
      if (index > -1) {
        this.annotating.splice(index, 1);
      }
    },
    nextImage() {
      if (this.image.next != null) this.$refs.filetitle.route(this.image.next);
    },
    previousImage() {
      if (this.image.previous != null)
        this.$refs.filetitle.route(this.image.previous);
    },
  },
  watch: {
    doneLoading(done) {
      if (done) {
        if (this.loading.loader) {
          this.loading.loader.hide();
        }
      }
    },
    currentCategory() {
      if (this.currentCategory != null) {
        if (
          this.currentAnnotation == null ||
          !this.currentCategory.showAnnotations
        ) {
          let element = this.currentCategory.$el;
          this.scrollElement(element);
        }
      }
    },
    currentAnnotation(newElement) {
      if (newElement != null) {
        if (newElement.showAnnotations) {
          let element = newElement.$el;
          this.scrollElement(element);
        }
      }
    },
    "current.category"(cc) {
      if (cc < -1) this.current.category = -1;
      let max = this.categories.length;
      if (cc > max) {
        this.current.category = -1;
      }
    },
    "current.annotation"(ca) {
      if (ca < -1) this.current.annotation = -1;
      if (this.currentCategory != null) {
        let max = this.currentAnnotationLength;
        if (ca > max) {
          this.current.annotations = -1;
        }
      }
    },
    "current.keypoint"(sk) {
      if (sk < -1) this.current.keypoint = -1;
      if (this.currentCategory != null) {
        let max = this.currentAnnotationLength;
        if (sk > max) {
          this.current.keypoint = -1;
        }
      }
    },
    annotating() {
      this.removeFromAnnotatingList();
    },
    user() {
      this.removeFromAnnotatingList();
    },
  },
  computed: {
    doneLoading() {
      // return !this.loading.image && !this.loading.data;
      return !this.loading.image
    },
    currentAnnotationLength() {
      if (this.currentCategory == null) return null;
      return this.currentCategory.category.annotations.length;
    },
    currentKeypointLength() {
      if (this.currentAnnotation == null) return null;
      return this.currentAnnotation.annotation.keypoints.length;
    },
    currentCategory() {
      return this.getCategory(this.current.category);
    },
    currentAnnotation() {
      if (this.currentCategory == null) {
        return null;
      }
      // console.log(this.current)
      return this.currentCategory.getAnnotation(this.current.annotation);
    },
    currentKeypoint() {
      if (this.currentCategory == null) {
        return null;
      }
      if (
        this.currentAnnotation == null ||
        this.currentAnnotation.keypointLabels.length === 0 ||
        !this.currentAnnotation.showKeypoints
      ) {
        return null;
      }
      if (this.current.keypoint == -1) {
        return null;
      }
      return {
        label: [String(this.current.keypoint + 1)],
        visibility: this.currentAnnotation.getKeypointVisibility(
          this.current.keypoint
        ),
      };
    },
    user() {
      return this.$store.getters["user/user"];
    },
  },
  // sockets: {
  //   annotating(data) {
  //     if (data.image_id !== this.image.id) return;

  //     if (data.active) {
  //       let found = this.annotating.indexOf(data.username);
  //       if (found < 0) {
  //         this.annotating.push(data.username);
  //       }
  //     } else {
  //       this.annotating.splice(this.annotating.indexOf(data.username), 1);
  //     }
  //   }
  // },

  mounted() {
    this.setDataset(null);

    // this.loading.loader = this.$loading.show({
    //   color: "white",
    //   // backgroundColor: "#4b5162",
    //   height: 150,
    //   opacity: 0.8,
    //   width: 150
    // });

    this.initCanvas();
    //
    // this.getData();
    // this.$socket.emit("annotating", { image_id: this.image.id, active: true });
  },
  created() {
    this.paper = new paper.PaperScope();

    this.image.id = parseInt(this.identifier);
    // this.image.url = "/api/image/" + this.image.id;
    this.image.url = this.imageUrl;
  },
};
</script>

<style scoped>
@import "./assets/tagsStyle.css";
@import "./assets/tooltip.css";

.alert {
  bottom: 0;
  width: 50%;
  display: block;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 0;
}

/* width */
::-webkit-scrollbar {
  width: 7px;
}

/* Track */
::-webkit-scrollbar-track {
  box-shadow: inset 0 0 5px grey;
  border-radius: 10px;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: white;
  border-radius: 10px;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #9feeb0;
}

.absolute {
  position: absolute;
  width: 100%;
  z-index: 100;
}
/* .carouselVertical {
  left: 50%;
  top: 50%;
  transform: translate(-50%,-50%);
} */
.prevArrow {
  top: 0px;
}
.nextArrow {
  bottom: 0px;
}

.left-panel {
  background-color: #a7cdff;
  width: 60px;
  padding-top: 40px;
  float: left;
  height: inherit;
  font-size: 16px;
  box-shadow: 5px 10px;
}

.right-panel {
  padding-top: 40px;
  background-color: #a7cdff;
  width: 250px;
  height: inherit;
  float: right;
  position: relative;
}

.middle-panel {
  display: block;
  width: inherit;
  height: inherit;
  background-color: rgba(218, 234, 255, 1);
  overflow: hidden;
  position: relative;
}

.frame {
  margin: 0;
  width: 100%;
  height: 100%;
}

.canvas {
  display: block;
  width: 100%;
  height: 100%;
}

#image {
  position: absolute;
}

.sidebar-section {
  width: 100%;
  padding-left: 5px;
  padding-right: 5px;
  overflow: auto;
}

.sidebar-title {
  color: white;
}

/* Tool section */
.tool-section {
  margin: 5px;
  border-radius: 5px;
  /* background-color: #383c4a; */
  padding: 0 5px 5px 5px;
  overflow: auto;
}

/* Categories/Annotations section */
.meta-input {
  padding: 3px;
  background-color: inherit;
  width: 100%;
  height: 100%;
  border: none;
}

.meta-item {
  background-color: inherit;
  height: 30px;
  border: none;
}

.status-icon {
  font-size: 150px;
  color: white;
  position: absolute;
  left: calc(50% - 75px);
  top: calc(50% - 75px);
}

.search {
  width: 100%;
  height: 18px;
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  text-align: center;
  border-radius: 4px;
}
</style>
