<template>
  <div style="display: block; height: 100%">
    <!-- 其他类型的数据集，仅支持查看，这里给出提示文本 -->
    <el-alert
      title="未知类型的数据集，只支持查看，请先设置数据集类型"
      type="warning"
      center
      show-icon
      v-if="mode === 'unknown'"
      close-text="关闭页面"
      @close="closeModal"
    ></el-alert>
    <aside v-show="panels.show.left" class="left-panel shadow-lg">
      <div>
        <LineTool
          class="line-tool"
          v-model="activeTool"
          :scale="image.scale"
          :all-categories="categories"
          :commands="commands"
          @setcursor="setCursor"
          ref="line"
          :show-prompt-tool="toolbarConfigs.showPromptTool"
          v-if="!noDatasetMode && mode === 'segment'"
        />
        <div class="canvas-operate">
          <span>{{ $t("dataCenter.canvasOperation") }}</span>
          <div class="btn-list">
            <CenterButton />
            <UndoButton />
            <RedoButton />
          </div>
        </div>
        <div class="annotation-operate">
          <span>{{ $t("dataCenter.annotationTool") }}</span>
          <div class="btn-list">
            <SelectTool
              v-model="activeTool"
              :scale="image.scale"
              :commands="commands"
              @setcursor="setCursor"
              @click="onCategoryClick"
              ref="select"
            />
            <BBoxTool
              v-model="activeTool"
              :scale="image.scale"
              :all-categories="categories"
              :commands="commands"
              @setcursor="setCursor"
              ref="bbox"
              v-if="mode === 'detect'"
              :disabled="!noDatasetMode && mode === 'label'"
            />
            <MagicWandTool
              v-model="activeTool"
              :width="image.raster.width"
              :height="image.raster.height"
              :image-data="image.data"
              @setcursor="setCursor"
              v-if="mode === 'segment'"
              ref="magicwand"
            />
            <PolygonTool
              v-model="activeTool"
              :scale="image.scale"
              :all-categories="categories"
              :commands="commands"
              @setcursor="setCursor"
              ref="polygon"
              v-if="mode === 'segment'"
              :disabled="!noDatasetMode && mode !== 'segment'"
            />
            <EraserTool
              v-model="activeTool"
              :scale="image.scale"
              :commands="commands"
              @setcursor="setCursor"
              ref="eraser"
              v-if="mode === 'segment'"
              :disabled="!noDatasetMode && mode !== 'segment'"
            />
            <BrushTool
              v-model="activeTool"
              :scale="image.scale"
              :all-categories="categories"
              :commands="commands"
              @setcursor="setCursor"
              ref="brush"
              v-if="mode === 'segment'"
              :disabled="!noDatasetMode && mode !== 'segment'"
            />
          </div>
        </div>
        <div class="image-operate">
          <span>{{ $t("dataCenter.imageManipulation") }}</span>
          <div class="btn-list">
            <SaveButton ref="refSaveBtn" />
            <AutoAnnotateTool
              ref="autoAnnotate"
              v-if="toolbarConfigs.showAutoAnnotateTool"
            />
            <!-- 自动标注和提示标注都不可见时，也隐藏停止标注 -->
            <StopTaskTool
              ref="stopTask"
              v-if="
                toolbarConfigs.showAutoAnnotateTool ||
                toolbarConfigs.showPromptTool
              "
            />
            <!-- 清除标注 -->
            <delete-annotation
              @handleDelete="handleDeleteAnnotations"
              v-show="
                noDatasetMode || ['segment', 'detect', 'label'].includes(mode)
              "
            ></delete-annotation>
            <DeleteButton
              :image="image"
              :isDisabled="isDisabled"
              v-if="!noDatasetMode"
            />
          </div>
        </div>
        <!-- <DownloadButton :image="image" /> -->
        <!-- <ModeButton v-model="mode" ref="modeBtn" /> -->
      </div>
      <SettingsButton
        v-show="false"
        :metadata="image.metadata"
        :commands="commands"
        ref="settings"
      />
      <!-- 快捷键说明 -->
      <showtcuts-instruction></showtcuts-instruction>
    </aside>
    <aside
      v-show="panels.show.right"
      class="right-panel shadow-lg annote-configuration"
      style="z-index: 2000; background: #daeaff"
    >
      <div
        class="right-panel-header picture-info"
        v-if="!noDatasetMode"
        style="padding-top: 0"
      >
        <div class="logoTitle" style="margin: 4px 0">
          <span class="name-style" :title="datasetName">
            {{ datasetName }}
          </span>
          <a-icon type="close" class="close-confirm" @click="closeModal" />
        </div>
        <h3>图片信息</h3>
        <!-- <a-icon type="close" class="close-confirm" @click="closeModal" /> -->
        <dl>
          <dt>图片名称：</dt>
          <dd :title="image.filename">{{ image.filename || "--" }}</dd>
          <dt>图片状态：</dt>
          <dd>{{ image.annotated ? "已标注" : "未标注" }}</dd>
          <dt>最后标注人：</dt>
          <dd title="短内容">{{ image.updateBy }}</dd>
          <dt>更新时间：</dt>
          <dd title="短内容">{{ image.updateTime }}</dd>
        </dl>
      </div>
      <div class="right-panel-header annotate-setting" v-if="!noDatasetMode">
        <h3>标注设置</h3>
        <div class="list-item">
          <span class="list-item-title">图片列表显示</span>
          <a-radio-group
            :options="displayOptions"
            :disabled="noDatasetMode"
            v-model="displayValue"
            @change="onDisplayChange"
          />
        </div>
        <div class="list-item">
          <span class="list-item-title"
            >标注自动保存
            <el-tooltip placement="top">
              <div slot="content">
                开启自动保存：切换为下一张图片，将自动保存标注信息<br />关闭自动保存：需要手动点击保存按钮后，标注信息才会被保存
              </div>
              <a-icon type="question-circle" style="vertical-align: 2px" />
            </el-tooltip>
          </span>
          <a-radio-group
            :options="autoSaveOptions"
            :disabled="noDatasetMode"
            v-model="autoSaveFlag"
          />
        </div>
        <div class="slider">
          <span class="aplha-des">{{
            $t("dataCenter.labelTransparency")
          }}</span>
          <div class="alpha-val" ref="tooltipContainer">
            <a-slider
              ref="slider"
              :min="0"
              :max="1"
              :step="0.1"
              v-model="shapeOpacity"
              @change="onSlideChange"
              :getTooltipPopupContainer="getEle"
            />
          </div>
        </div>
      </div>
      <div
        class="sidebar-section right-panel-header scrollbar"
        :style="{
          height:
            mode == 'label'
              ? 'calc(100% - 276px)'
              : `calc(100% - ${
                  noDatasetMode ? '130px' : '280px'
                } - ${settingHeight}px)`,
        }"
      >
        <Category
          :mode="mode"
          :categorysearch="search"
          :all-categories="categories"
          :current="current"
          :active-tool="activeTool"
          :scale="image.scale"
          :simplify="simplify"
          :opacity="shapeOpacity"
          :isShowAllAnnotations="isShowAllAnnotations"
          :imageId="image.id"
          @checked="
            (id) => {
              defaultCategory = id;
            }
          "
          @click="onCategoryClick"
          @on-mode="onModeChange"
          @on-update="getData"
          @update-image="onUpdateImage"
          ref="categories"
        />
      </div>
      <!-- <div class="batch-confirm right-panel-header" v-if="!noDatasetMode">
        <h3>数据规则设置</h3>
        <a-button type="primary" @click="batchConfirm('annotated')" style="width: 100%">
          已存在标注的图片
        </a-button>
        <div class="slider">
          <a-slider style="width: calc(100% - 90px); margin-left: 8px" v-model="inputValue" :min="0" :max="1"
            :step="0.05" />
          <a-input-number v-model="inputValue" :min="0" :max="1" :step="0.05" style="margin-left: 16px" />
        </div>
        <a-button :disabled="inputValue === 0" style="width: 100%" @click="batchConfirm('threshold')">
          {{ `阈值大于${inputValue}的图片` }}
        </a-button>
      </div> -->
    </aside>
    <slot name="pictureList"></slot>
    <slot name="topPreview"></slot>
    <slot name="rigthPreview"></slot>
    <!-- 数据集标注上方区域 -->
    <div class="top-panel" :class="isShow ? '' : 'none'">
      <div class="main-select-content">
        <el-select
          v-model="selectModel"
          placeholder="请选择标注模式"
          class="selectModel"
          size="mini"
          style="width: 100px"
        >
          <!-- 仅分割时可用提示标注 -->
          <el-option
            value="prompt"
            label="提示标注"
            v-if="datasetDetail.dlTagType === '分割'"
          ></el-option>
          <!-- <el-option value="auto" label="自动标注"> </el-option> -->
        </el-select>
        <!-- 提示标注-选择提示模型 -->
        <el-select
          v-model="selectSegmentModel"
          placeholder="请选择标注模型"
          class="selectModel"
          clearable
          size="mini"
          v-show="selectModel === 'prompt'"
          style="width: 140px"
        >
          <el-option
            v-for="(item, index) in promptModelList.segmentModels"
            :key="index"
            :value="item"
            :label="item"
          ></el-option>
        </el-select>
        <!-- 智能标注模型选择 -->
        <load-select
          class="selectModel"
          size="mini"
          placeholder="请选择模型"
          v-show="selectModel === 'auto'"
          v-model="autoModelSelectConfig.selectedModelId"
          :valueObj.sync="autoModelSelectConfig.selectedModel"
          :data="autoModelSelectConfig.modelList"
          :dictComposeLabel="'imageTagType'"
          :dictLabel="'modelName'"
          :page="autoModelSelectConfig.pageNo"
          :hasMore="autoModelSelectConfig.hasMore"
          :request="getAutoModelData"
          ref="refSelectAutoModel"
        ></load-select>
        <div class="radio-list label-list" v-show="selectModel === 'prompt'">
          <el-tooltip :content="$t('dataCenter.targetTipLine')">
            <div
              class="fore"
              :class="{
                active:
                  activeTool === 'Line' &&
                  selectedAnnotationLabelArea === 'foreground',
              }"
              @click="handleOptionChange('foreground', 2)"
            >
              <svg-icon class="line-icon" type="target_tip" />
            </div>
          </el-tooltip>
          <el-tooltip :content="$t('dataCenter.backgroundTipLine')">
            <div
              class="back"
              :class="{
                active:
                  activeTool === 'Line' &&
                  selectedAnnotationLabelArea === 'background',
              }"
              @click="handleOptionChange('background', 2)"
            >
              <svg-icon class="line-icon" type="background_tip" />
            </div>
          </el-tooltip>
        </div>
        <el-tooltip content="清除画线" v-show="selectModel === 'prompt'">
          <i
            class="icon-tool el-icon-remove-outline remove-line-btn"
            @click="removeLine"
          ></i>
        </el-tooltip>
        <el-tooltip content="MASK 信息" v-show="selectModel === 'prompt'">
          <i class="icon-tool el-icon-help" @click="showMaskPreviewer"></i>
        </el-tooltip>
        <!-- 提示/自动标注均需要设置 -->
        <div class="radio-list res">
          <span class="res-desc">{{ $t("dataCenter.annotatedResults") }}</span>
          <div>
            <div class="res-redio">
              <input
                type="radio"
                name="annotationForm"
                id="replace"
                :checked="selectedAnnotationOption === 'replace'"
                @click="handleOptionChange('replace', 1)"
              />
              <label for="replace">替代</label>
            </div>
            <div class="res-redio">
              <input
                type="radio"
                name="annotationForm"
                id="overlay"
                :checked="selectedAnnotationOption === 'overlay'"
                @click="handleOptionChange('overlay', 1)"
              />
              <label for="overlay">叠加</label>
            </div>
          </div>
        </div>
        <div class="divider"></div>
        <el-tooltip content="标注当前">
          <span
            class="iconfont icon-tool icon-start"
            @click="startAnnotating('cur')"
            style="font-size: 25px"
            >&#xe615;
          </span>
        </el-tooltip>
        <el-tooltip content="标注所有">
          <span
            class="iconfont icon-tool icon-restart"
            @click="startAnnotating('all')"
            >&#xe64b;</span
          >
        </el-tooltip>
        <el-tooltip content="停止标注任务">
          <span
            class="iconfont icon-tool icon-terminate"
            @click="handleStopTask"
            >&#xe60e;</span
          >
        </el-tooltip>
      </div>
      <span class="annotate-process-info" v-show="annotatingInfo">{{
        annotatingInfo
      }}</span>
    </div>
    <div class="middle-panel" :style="{ cursor: cursor }">
      <v-touch @pinch="onpinch" @pinchstart="onpinchstart" style="height: 100%">
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
        >.</span
      >
      <button
        type="button"
        class="close"
        data-dismiss="alert"
        aria-label="Close"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <!-- mask图 -->
    <a-modal
      title="SAM mask"
      v-model="showSamMaskModal"
      :destroyOnClose="true"
      :afterClose="
        () => {
          samMaskPictureUrl = null;
        }
      "
      @ok="showSamMaskModal = false"
      :footer="null"
    >
      <a-spin v-show="!samMaskPictureUrl" />
      <el-image
        :src="samMaskPictureUrl"
        fit="contain"
        v-if="!!samMaskPictureUrl"
      >
      </el-image>
    </a-modal>
  </div>
</template>

<script>
import paper from "paper";
import axios from "axios";

import toastrs from "./mixins/toastrs";
import shortcuts from "./mixins/shortcuts";
import renderSvg from "./mixins/renderSvg";

import FileTitle from "./components/FileTitle";
import Category from "./components/Category";

import PolygonTool from "./components/tools/PolygonTool";
import LineTool from "./components/tools/LineTool";
import AutoAnnotateTool from "./components/tools/autoAnnotateTool.vue";
import StopTaskTool from "./components/tools/stopTaskTool";
import BBoxTool from "./components/tools/BBoxTool";
import SelectTool from "./components/tools/SelectTool";
import MagicWandTool from "./components/tools/MagicWandTool";
import EraserTool from "./components/tools/EraserTool";
import BrushTool from "./components/tools/BrushTool";
import KeypointTool from "./components/tools/KeypointTool";
import DEXTRTool from "./components/tools/DEXTRTool";

import CopyAnnotationsButton from "./components/tools/CopyAnnotationsButton";
import CenterButton from "./components/tools/CenterButton";
import DownloadButton from "./components/tools/DownloadButton";
import SaveButton from "./components/tools/SaveButton";
import SettingsButton from "./components/tools/SettingsButton";
import ModeButton from "./components/tools/ModeButton";
import DeleteButton from "./components/tools/DeleteButton";
import UndoButton from "./components/tools/UndoButton";
import RedoButton from "./components/tools/RedoButton";
import ShowAllButton from "./components/tools/ShowAllButton";
import HideAllButton from "./components/tools/HideAllButton";
import AnnotateButton from "./components/tools/AnnotateButton";

import PolygonPanel from "./components/panels/PolygonPanel";
import LinePanel from "./components/panels/LinePanel";
import BBoxPanel from "./components/panels/BBoxPanel";
import MagicWandPanel from "./components/panels/MagicWandPanel";
import BrushPanel from "./components/panels/BrushPanel";
import EraserPanel from "./components/panels/EraserPanel";
import KeypointPanel from "./components/panels/KeypointPanel";
import DEXTRPanel from "./components/panels/DEXTRPanel";
import DeleteAnnotation from "./components/tools/DeleteAnnotation.vue";
import loadSelect from "@/components/LoadSelect/index.vue";
import showtcutsInstruction from "./components/tools/showtcutsInstruction.vue";

import { mapMutations, mapState } from "vuex";
import {
  getaPromptModel,
  deleteByImageId,
  deleteByDatasetId,
  getSamMaskPicture,
} from "@/api/dataCenter.js";

import { preferences, paperjs_to_coco } from "./libs/config";
import { getModelTableList } from "@/api/modelManage";
const modeMap = {
  segment: 3,
  label: 1,
  detect: 2, //目标检测
};

export default {
  name: "Annotator",
  components: {
    FileTitle,
    CopyAnnotationsButton,
    Category,
    BBoxTool,
    BBoxPanel,
    LineTool,
    AutoAnnotateTool,
    StopTaskTool,
    PolygonTool,
    PolygonPanel,
    LinePanel,
    SelectTool,
    MagicWandTool,
    EraserTool,
    BrushTool,
    KeypointTool,
    DownloadButton,
    SaveButton,
    SettingsButton,
    DeleteButton,
    CenterButton,
    MagicWandPanel,
    BrushPanel,
    EraserPanel,
    ModeButton,
    UndoButton,
    RedoButton,
    HideAllButton,
    ShowAllButton,
    KeypointPanel,
    AnnotateButton,
    DEXTRTool,
    DEXTRPanel,
    DeleteAnnotation,
    loadSelect,
    showtcutsInstruction,
  },
  mixins: [toastrs, shortcuts, renderSvg],
  props: {
    identifier: {
      type: [Number, String],
      required: true,
      default: null,
    },
    imageUrl: {
      type: String,
      default: () => "",
    },
    datasetName: {
      type: String,
      default: () => "--",
    },
    checkBoxVal: {
      type: Array,
      default: () => ["hasdone", "hasNotDo"],
    },
    createBy: {
      type: String,
      default: () => "admin",
    },
    // 工具栏配置
    toolbarConfigs: {
      type: Object,
      default: () => ({
        showPromptTool: true, // 是否展示提示标注工具
        showAutoAnnotateTool: true, // 是否展示自动标注工具
      }),
    },
    // 数据集ID
    datasetId: {
      type: [Number, String],
      default: null,
    },
    getImg: {
      type: Function,
      default: () => () => {},
    },
    // 非数据集模式(该模式下，支持对单张图片进行标注)
    nonDatasetSchema: {
      type: Object,
      default: () => ({}),
    },
    // 根据数据集类型确定，取值范围 segment，label，detect, unknown，对应分割，分类，目标检测，其他
    mode: {
      type: String,
      default: "",
    },
    // 数据集详情数据
    datasetDetail: {
      type: Object,
      default: () => ({}),
    },
  },
  inject: ["modalInstance"],
  provide() {
    return {
      noDatasetMode: this.noDatasetMode,
    };
  },
  data() {
    return {
      activeTool: "Select",
      paper: null,
      zoom: 0.2,
      cursor: "move",
      // mode: "segment",  //改为由props传入
      simplify: 1,
      panels: {
        show: {
          left: true,
          right: true,
        },
      },
      // 预览部分图片地址
      // previewImageUrl: "",
      // 清除的path路径
      // clearPath: [],
      isShow: false,
      showSamMaskModal: false, //sam mask标注图片预览框
      samMaskPictureUrl: "",
      // 选择提示标注/自动标注  取值prompt/auto
      selectModel: "prompt",
      selectPromptModel: "Segment Anything ViT-H", //提示标注- 选择的提示模型
      selectSegmentModel: "", //提示标注- 选择的标注模型
      promptModelList: {},
      // 选择的配置项
      selectedAnnotationOption: "replace",
      // 前景背景
      selectedAnnotationLabelArea: "foreground",
      // 自动标注 模型选择组件的配置项
      autoModelSelectConfig: {
        selectedModelId: "",
        selectedModel: {},
        pageNo: 1,
        modelList: [],
        hasMore: true,
      },

      current: {
        // 当前标注的对象类别ID和index
        category: -1,
        annotation: -1, // index
        keypoint: -1,
      },
      // 当前具体标注对象
      currentAnnotation: null,
      // 当前的类别
      currentCategory: null,
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
        annotated: false, //是否已标注
        updateBy: null,
        updateTime: null,
      },
      // 图片在画布中是左上，右上、左下、右下位置。
      imagePosition: {
        topLeft: null,
        topRight: null,
        bottomLeft: null,
        bottomRight: null,
      },
      text: {
        topLeft: null,
        topRight: null,
      },
      categories: [],
      defaultCategory: null,
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
      inputValue: 0,
      settingHeight: 0,
      plainOptions: [
        { label: "显示已标注图片", value: "hasdone" },
        { label: "显示未标注图片", value: "hasNotDo" },
      ],
      displayOptions: [
        { label: "显示", value: true },
        { label: "隐藏", value: false },
      ],
      displayValue: true, //是否显示右侧图片列表
      autoSaveFlag: true, //切换图片自动保存图片上的标注内容
      autoSaveOptions: [
        { label: "开启", value: true },
        { label: "关闭", value: false },
      ],
      // 个人理解为： 每做一次标注，都会产生一个markTaskId, 利用该id可以获取标注进度，可停止标注任务，在提示标注中可用于获取mask图，可用于无画线进行标注
      // 与taskId是一样的，但是taskId之前的人用的有点乱，且会被前端清空。这里单独出来，只在提示标注后更新，并不做清空
      markTaskId: null,
      annotatingInfo: null, //提示/自动标注过程中的一些提示信息，根据接口返回的状态以及标注进度设定
      // checkBoxVal: ["hasdone", "hasNotDo"],
      annotationLoaded: false, //标注数据是否加载回来并已绘制在画布上
      isShowAllAnnotations: false,
    };
  },
  methods: {
    ...mapMutations([
      "addProcess",
      "removeProcess",
      "resetUndo",
      "setDataset",
      "cancelLoadingItem",
      "modifyGroupLoading",
      "clearLoading",
    ]),
    reload(identifier, imageUrl, options = {}) {
      // this.identifier = identifier;
      this.imageUrl = imageUrl;
      this.image.id = parseInt(identifier);
      this.image.url = this.imageUrl;
      this.categories = [];
      this.setDataset(null);
      this.initCanvas();
      this.getData();
    },
    // 提示标注时 清除已画的线
    removeLine() {
      this.$refs.line?.deleteLine();
    },
    closeModal() {
      this.$emit("close-modal");
    },
    // 对slot的图片列表做显隐操作
    onCheckBoxChange(val) {
      this.$emit("show-pageList", val);
    },
    // 切换显示  隐藏右边图片列表
    onDisplayChange() {
      const res = this.displayValue ? ["hasNotDo"] : [];
      this.$emit("show-pageList", res);
    },
    batchConfirm(method) {
      this.$emit("batch-confirm", method, this.inputValue);
    },
    // 暂时屏蔽掉模式切换
    onModeChange(val) {
      // if (this.mode !== val) {
      //   this.$refs.modeBtn.click();
      //   this.$refs.select.click();
      //   // this.$nextTick(() => {
      //   //   this.settingHeight = this.$refs.setting.offsetHeight;
      //   // });
      // }
    },
    // 分类类型判断图片是否已有标签
    checkSelectedCategry() {
      for (let i = 0; i < this.categories.length; i++) {
        const label = this.categories[i];
        for (let j = 0; j < label.annotations.length; j++) {
          const annotation = label.annotations[j];
          if (annotation.mode === 1) {
            return {
              flag: true,
              id: annotation.id,
              item: annotation,
            };
          }
        }
      }
      return {
        flag: false,
        id: null,
        item: null,
      };
    },
    // 分类类型更新图片标签
    updateLabelSelected(imageId) {
      const { flag, id } = this.checkSelectedCategry();
      let resultPromise;
      const obj = this.selectedLabelArr.find(
        (item) => item.imageId === imageId
      );
      let selectedLabelId = obj?.labelId || -1;
      if (flag && selectedLabelId > -1) {
        resultPromise = axios.put(
          `/api/v1/datacenter/dataListAnnotation/updateLabelById/${id}`,
          { labelId: selectedLabelId }
        );
      } else if (selectedLabelId > -1) {
        resultPromise = axios.post(
          "/api/v1/datacenter/dataListAnnotation/create",
          {
            imageId,
            labelId: selectedLabelId,
            mode: 1,
          }
        );
      }
      resultPromise &&
        resultPromise.then((res) => {
          if (Number(res.code) === 0) {
            this.$message.success("保存成功");
          }
        });
    },
    // 保存新增的多边形标注
    handleAnnotationsSave() {
      const promiseArr = this.tempAnnotationSavedDataArr.map((item) => {
        const { imageId, labelId, mode } = item;
        return axios.post("/api/v1/datacenter/dataListAnnotation/create", {
          imageId,
          labelId,
          mode,
        });
      });
      return new Promise((resolve) => {
        Promise.all(promiseArr).then((resultArr) => {
          const res = resultArr.map((item, i) => {
            let { data } = item;
            data.annotationId = this.tempAnnotationSavedDataArr[i]?.annotationId;
            return data;
          });
          resolve(res);
        });
      });
    },
    async save(callback, finalCallback) {
      if (this.noDatasetMode) {
        //在数据管理中使用时
        let categoryData = this.$refs.categories.export();
        // 按照之前的代码逻辑，categoryData.annotations是所有标签下的标注信息汇总，而不是一个标签下的，每次都会全量保存
        categoryData.annotations.forEach((item) => {
          item.mode = item._mode || 3;
          item.segmentation =
            item.mode === 3
              ? paperjs_to_coco(
                  this.image.raster.width,
                  this.image.raster.height,
                  item.compoundPath
                )
              : item.segmentation;
          // item.segmentation = paperjs_to_coco(
          //         this.image.raster.width,
          //         this.image.raster.height,
          //         item.compoundPath
          //       )
          item.datasetId = this.dataset.id;
          item.imageId = this.image.id;
          item.width = this.image.raster.width;
          item.height = this.image.raster.height;
          delete item.compoundPath;
          delete item.isbbox;
          delete item.sessions;
        });
        const annotations = Array.prototype.concat.call(
          [],
          ...categoryData.annotations
        );
        this.modalInstance.updateAnnotations({ annotations });
        return;
      }
      // 以下为数据集标注(原始功能逻辑)
      let process = "Saving";
      this.addProcess(process);
      let refs = this.$refs;

      let data = {};
      // 读取并记录image.id, 因为在handleFocus中 为了速度，两个异步同时执行，会有focusId被修改->this.image.id变更，从而callback执行时，传入的id是新的focusid的问题
      const _imageId = this.image.id || this.identifier;
      if (!_imageId) return;
      if (this.mode === "label") {
        this.updateLabelSelected(_imageId);
        return;
      }
      if (refs.categories != null) {
        let categoryData = refs.categories.export();
        const realAnnotationsData = await this.handleAnnotationsSave();
        categoryData.annotations.forEach((item) => {
          const realData = realAnnotationsData.find(
            (realItem) => realItem.annotationId === item.id
          );

          item.mode = item._mode || 3;
          if (realData) {
            item.id = realData.id;
            item.mode = realData.mode;
          }
          item.segmentation =
            item.mode === 3 || item.mode === 2
              ? paperjs_to_coco(
                  this.image.raster.width,
                  this.image.raster.height,
                  item.compoundPath
                )
              : item.segmentation;
          item.datasetId = this.dataset.id;
          item.imageId = _imageId;
          item.width = this.image.raster.width;
          item.height = this.image.raster.height;
          delete item.compoundPath;
          delete item.isbbox;
          delete item.sessions;
        });
        data.annotations = Array.prototype.concat.call(
          [],
          ...categoryData.annotations
        );
      }
      axios
        .put(
          `/api/v1/datacenter/dataListAnnotation/updateByPicture/${_imageId}`,
          data
        )
        .then(() => {
          //TODO: updateUser
          // if (callback != null) callback(this.image.id, this.mode);
          // 增加this
          if (callback != null) callback(_imageId, this.mode, this);
        })
        .finally(() => {
          if (finalCallback != null) finalCallback();
          // this.cancelLoadingItem(this.image.id);
          this.removeProcess(process);
          this.resetUndo();
          this.$store.dispatch("doClearTempAnnotationSavedDataArr");
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
    moveCanvas(type) {
      let currentAnnotation = this.getCurrentAnnotation()?.getCompoundPath();
      if (currentAnnotation) {
        let x = 0;
        let y = 0;
        const pixel = 1;
        if (type === "up") {
          y = pixel;
        } else if (type === "down") {
          y = -pixel;
        } else if (type === "left") {
          x = pixel;
        } else if (type === "right") {
          x = -pixel;
        }
        let delta = new paper.Point(x, y);
        let segments = currentAnnotation.children[0].segments;
        segments.forEach((segment) => {
          let p = segment.point;
          segment.point = new paper.Point(p.x - delta.x, p.y - delta.y);
        });
      }
    },
    onwheel(e) {
      e.preventDefault();
      if (!this.doneLoading) return;

      let view = this.paper.view;
      if (e.altKey) {
        // Pan up and down
        let delta = new paper.Point(0, 0.5 * e.deltaY);
        this.paper.view.setCenter(view.center.add(delta));
      } else if (e.shiftKey) {
        // Pan left and right
        let delta = new paper.Point(0.5 * e.deltaY, 0);
        this.paper.view.setCenter(view.center.add(delta));
      } else if (e.ctrlKey) {
        //缩放
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
        (canvas.width / parentX) * 0.8,
        (canvas.height / parentY) * 0.8
      );

      this.image.scale = 1 / this.paper.view.zoom;
      try {
        //偶现paperjs底层报错  Cannot read properties of null (reading '_transformBounds')
        this.paper.view.setCenter(0, 4);
      } catch (error) {
        //延时再执行一次
        console.error(error);
        // 延时fit，保证图位置正确
        requestAnimationFrame(() => {
          this.paper.view.setCenter(0, 4);
        });
      }
      // 设置标注工具配置值
      this.setPreferences(this.preferences || {});
    },
    nextFunc() {
      this.modalInstance.nextPhoto();
    },
    preFunc() {
      this.modalInstance.prePhoto();
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
    // 重置画布尺寸
    resetCanvasSize() {
      const width = this.paper.view.viewSize.width;
      const height = document.querySelector("#annotator").offsetHeight;
      this.paper.view.viewSize = new this.paper.Size(width, height);
      this.fit();
    },
    initCanvas() {
      let process = "Initializing canvas";
      this.addProcess(process);
      this.loading.image = true;

      let canvas = document.getElementById("editor");
      this.paper.setup(canvas);
      const canvasHeight = document.querySelector("#annotator").offsetHeight;
      this.paper.view.viewSize = [this.paper.view.size.width, canvasHeight];
      this.paper.activate();
      // canvas.addEventListener('mouseenter', (event) =>{
      //   let center_delta = new paper.Point(1, 0);
      //   let new_center = this.paper.view.center.add(center_delta);
      //   this.paper.view.setCenter(new_center);
      //   this.$nextTick(() => {
      //     let center_delta = new paper.Point(-1, 0);
      //     let new_center = this.paper.view.center.add(center_delta);
      //     this.paper.view.setCenter(new_center);
      //   });
      // });
      this.image.raster = new paper.Raster(this.image.url);
      this.image.raster.onLoad = () => {
        let width = this.image.raster.width;
        let height = this.image.raster.height;

        this.image.raster.bringToFront();
        this.fit();
        this.image.ratio = (width * height) / 1000000;
        this.removeProcess(process);

        // 创建显示的字体
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
        this.imagePosition.topLeft = new paper.Point(-width / 2, -height / 2);
        this.imagePosition.topRight = new paper.Point(width / 2, -height / 2);
        this.imagePosition.bottomLeft = new paper.Point(-width / 2, height / 2);
        this.imagePosition.bottomRight = new paper.Point(width / 2, height / 2);
        this.text.topLeft = new paper.PointText(positionTopLeft);
        this.text.topLeft.fontSize = fontSize;
        this.text.topLeft.fillColor = "white";
        this.text.topLeft.content = `(${width}x${height}) ${this.image.filename}`;
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
        // fix bug 点击带有标注的图进入标注框，第一次切换图片存在canvas渲染图与focus图不一致问题
        canvas.onmouseenter = (event) => {
          requestAnimationFrame(() => {
            if (!this.paper.view) return;
            let center_delta = new paper.Point(0, 0);
            let new_center = this.paper.view.center.add(center_delta);
            this.paper.view.setCenter(new_center);
          });
        };
      };
    },
    setPreferences(preferences) {
      let refs = this.$refs;

      refs.bbox?.setPreferences(preferences.bbox || preferences.polygon || {});
      refs.polygon?.setPreferences(
        preferences.polygon || {},
        this.image?.scale || 1
      );
      refs.line && refs.line.setPreferences(preferences.line || {});
      refs.select?.setPreferences(preferences.select || {});
      // refs.magicwand.setPreferences(preferences.magicwand || {});
      refs.brush?.setPreferences(preferences.brush || {});
      refs.eraser?.setPreferences(preferences.eraser || {});
    },
    setDefaultSelectedAnnotation(list) {
      const data = list.flatMap((item) => item.annotations);
      const checkAnnotations = this.current.annotation < 0 && data.length;
      this.current = {
        annotation: checkAnnotations ? 0 : -1,
        category: checkAnnotations ? 0 : -1,
      };
    },
    // 根据图片id获取相关数据。
    async getData(callback, options = {}) {
      // 设置标注是否加载的标志位，标注查询回来且已绘制在画布上后，切换图片时才能调用 save 自动保存标注，否则会在快速切换图片时，因为标注还未绘制在图片上，调用保存导致清空已有标注的情况
      this.annotationLoaded = false;
      let process = "Loading annotation data";
      this.addProcess(process);
      this.loading.data = true;
      try {
        const { queryAnnotationDataRequest } = this.nonDatasetSchema;
        let data = null;
        if (queryAnnotationDataRequest) {
          let response = await queryAnnotationDataRequest(this.identifier);
          // 处理无标注数据时的情况
          data = response.data.annotationDetail;
          this.modalInstance.annotationData = data;
        } else {
          //数据集里使用时(原本功能)
          let response = await axios.get(
            `/api/v1/datacenter/dataListAnnotation/getByPicture/${this.image.id}`
          );
          data = response.data;
        }
        this.loading.data = false;
        // 在疯狂点击切换图片时，标注信息接口响应回来时，focus图片可能已经换了，当响应的图片不是focus图片时，不去渲染标注
        if (this.image.id != data.image.id) return;
        // Set image data
        this.image.metadata = data.image.metadata || {};
        this.image.filename = data.image.fileName;
        this.image.annotated = data.image.annotated; //图片状态：已标注/未标注
        this.image.updateBy = data.image.updateBy;
        this.image.updateTime = data.image.updateTime;
        // 最后标注人 更新时间
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
        let checkLabelIdExists = false;
        data.labels.forEach((record) => {
          // 分割，检测数据集时，过滤掉annotations存在，但是segmation却不存在的数据
          if (["segment", "detect"].includes(this.mode)) {
            record.annotations = (record.annotations || []).filter(
              (item) => item.segmentation && item.segmentation.length
            );
          }
          // 遍历每条记录的 annotations 数组
          record.annotations.forEach((annotation) => {
            // 有全局标签和是自动标注标注出来的
            if (
              this.$refs.categories?.LabelCountStat?.length &&
              annotation.annoSource === 3
            ) {
              for (const label in this.$refs.categories?.LabelCountStat) {
                if (label.id !== annotation.labelId)
                  this.$message.warning("自动标注和全局标签不一致");
              }
            }
            // 修改每天记录的 width 和 height
            annotation.width = width;
            annotation.height = height;
            const { mode, imageId, labelId } = annotation;
            if (mode === 1) {
              checkLabelIdExists = true;
              this.$store.dispatch("doSetSelectedLabelId", {
                imageId,
                labelId,
              });
            }
          });
        });

        !checkLabelIdExists &&
          this.$store.dispatch("doDelLabelId", this.image.id);

        this.dataset = data.dataset;
        this.categories = data.labels;
        this.setDefaultSelectedAnnotation(this.categories);
        // Update status
        this.setDataset(this.dataset);

        let preferences = this.preferences;
        this.setPreferences(preferences);

        if (this.text.topLeft != null) {
          this.text.topLeft.content = this.image.filename;
        }
        this.$nextTick(() => {
          // 展示标注
          this.showAll();
          requestAnimationFrame(() => {
            this.annotationLoaded = true;
          });
        });

        if (callback != null) callback(this, data);
      } catch (e) {
        console.log("加载 渲染图片的标注信息时异常：", e);
      }
      // .catch(() => {
      // this.axiosReqestError(
      //   "Could not find requested image, Redirecting to previous page."
      // );
      // this.$router.go(-1);
      // });
      // .finally(() => this.removeProcess(process));
    },
    onCategoryClick(indices) {
      this.current.annotation = indices.annotation;
      this.current.category = indices.category;
      // if (!indices.hasOwnProperty("keypoint")) {
      //   indices.keypoint = -1;
      // }
      // if (indices.keypoint !== -1) {
      //   this.current.keypoint = indices.keypoint;
      //   let ann =
      //     this.currentCategory.category.annotations[this.current.annotation];
      //   let kpTool = this.$refs.keypoint;
      //   let selectTool = this.$refs.select;
      //   let category = this.$refs.category[this.current.category];
      //   let annotation = category.$refs.annotation[this.current.annotation];
      //   annotation.showKeypoints = true;
      //   let keypoints = annotation.keypoints;
      //   if (keypoints._labelled[indices.keypoint + 1]) {
      //     let indexLabel = String(this.current.keypoint + 1);
      //     let keypoint = keypoints._labelled[indexLabel];
      //     keypoint.selected = true;
      //     this.activeTool = selectTool;
      //     this.activeTool.click();
      //   } else {
      //     this.currentAnnotation.keypoint.next.label = String(
      //       indices.keypoint + 1
      //     );
      //     this.activeTool = kpTool;
      //     this.activeTool.click();
      //   }
      // }
    },
    onUpdateImage(imageId) {
      this.getImg(imageId);
    },
    // 开始标注
    startAnnotating(type) {
      if (this.selectModel == "prompt") {
        //提示标注
        if (!this.selectPromptModel) {
          return this.$message.warning("请选择提示模型");
        }
        if (!this.selectSegmentModel) {
          return this.$message.warning("请选择标注模型");
        }
        // if(!this.$refs.line?.line?.path.length) {
        //   return this.$message.warning('请给出提示画线')
        // }
        this.$refs.line.promptAnnotating(type);
      } else if (this.selectModel == "auto") {
        //开始自动标注
        if (!this.autoModelSelectConfig.selectedModelId) {
          return this.$message.warning("请选择自动标注模型");
        }
        this.$refs.autoAnnotate.autoAnnotating(
          type,
          this.autoModelSelectConfig.selectedModel
        );
      } else {
        this.$message.warning("请选择标注模式");
      }
    },
    /**
     * @public
     * 打开标注框，发现存在正在标注的任务，除了反显进度外 还需要反显标注模型,叠加/替换等选择项
     * taskType：2，提示标注; taskType：1，自动标注
     * options: 接口读取的配置，目前无前景背景，叠加重置等数据
     */
    setAnnotatingConfig(options) {
      this.isShow = true;
      if (options.taskType == 2) {
        //提示标注
        this.selectModel = "prompt";
        const modelName = options.modelName || "";
        let modelArr = modelName.split(",");
        this.selectPromptModel = modelArr[0];
        this.selectSegmentModel = modelArr[1];
      }
      if (options.taskType == 1) {
        //自动标注, 因为自动标注选择模型时下拉懒加载的方式，需要后端配合来反显，目前先使用前端缓存的方式
        this.selectModel = "auto";
        this.autoModelSelectConfig.selectedModelId = options.modelId;
        let model = {
          //便于用户直接开启下一次标注
          id: options.modelId,
          modelName: options.modelName,
          imageTagType: options.tagType,
        };
        this.autoModelSelectConfig.selectedModel = model;
        // 将上次选择的模型作为第一条插入模型列表
        this.autoModelSelectConfig.modelList.unshift(model);
        // 加载第一页模型列表
        this.$nextTick(() => {
          this.$refs.refSelectAutoModel._loadFirstPageData();
        });
      }
      if (options.preservePrevAnnos) {
        //处理叠加和替换选项
        this.selectedAnnotationOption = "overlay";
      } else {
        this.selectedAnnotationOption = "replace";
      }
    },
    callLineTool() {
      this.$refs.line.click();
    },
    // 获取提示标志模型列表
    async getaPromptModelList() {
      const res = await getaPromptModel();
      if (res.success) {
        this.promptModelList = res.data;
        if (this.promptModelList?.segmentModels?.length) {
          this.selectSegmentModel = this.promptModelList.segmentModels[0];
        }
      }
    },
    // 当配置项改变时触发
    // 1 代表选择的为标注的状态 2 代表的是标注在前景还是背景
    handleOptionChange(option, type) {
      if (type === 1) {
        this.selectedAnnotationOption = option;
      } else if (type === 2) {
        this.selectedAnnotationLabelArea = option;
        this.callLineTool();
      }
    },
    // 获取自动标注算法
    getAutoModelData({ page = 1, more = false, keyword = "" } = {}) {
      return new Promise((resolve, reject) => {
        getModelTableList({
          limit: 10,
          pageNo: page,
          modelName: keyword.trim(),
          modelType: 1, //通用模型
          tagType: this.datasetDetail?.dlTagType || "", //模型类别
          taskStatus: 2, //已完成训练的模型
        })
          .then((res) => {
            if (res.code != 0) {
              reject();
              return;
              // return this.$message.error('加载失败')
            }
            if (more) {
              // 如果是加载更多，则合并之前的数据
              this.autoModelSelectConfig.modelList = [
                ...this.autoModelSelectConfig.modelList,
                ...res.data.records,
              ];
            } else {
              this.autoModelSelectConfig.modelList = res.data.records;
            }
            // 更新pageNo
            this.autoModelSelectConfig.pageNo = page;
            // 判断hasMore的值
            this.autoModelSelectConfig.hasMore =
              res.data?.total > this.autoModelSelectConfig.modelList.length;
            resolve();
          })
          .catch((e) => {
            this.$message.error(
              e?.response?.data?.msg || e?.response?.data?.message
            );
            reject(e?.response?.data);
          });
      });
    },
    // 删除单张或多张图片的标注
    async handleDeleteAnnotations(selectedDeleteOption) {
      if (this.noDatasetMode) {
        //非数据集模式
        // this.clearAnnotationComPath()
        this.modalInstance.deleteAnnotation("all").then((res) => {
          if (res.code == 0) {
            //清除标注的apth
            this.clearAnnotationComPath();
            this.getData();
          }
        });
        return;
      }
      this.annotatingInfo = null;
      const loading = this.$GLoading("正在删除标注...");
      if (selectedDeleteOption === "cur") {
        //删除单张标注
        deleteByImageId(this.image.id)
          .then(() => {
            this.getImg(this.image.id);
            // 获取当前focus图片的标注信息并更新视图
            this.getData((ins, data) => {
              const annotations = (data.labels || []).flatMap(
                (item) => item.annotations
              );
              if (annotations && annotations.length) {
                //说明后台没清除掉该图片的标注
                console.error("查询到当前图片上仍有标注信息");
              } else {
                this.clearAnnotationComPath();
                this.$message.success("删除当前图片标注成功");
              }
            });
          })
          .catch((e) => {
            this.$message.error(e.data);
          })
          .finally(() => {
            loading.close();
          });
      }
      if (selectedDeleteOption === "all") {
        //删除数据集标注
        deleteByDatasetId(this.datasetId)
          .then((res) => {
            // if(res.code != 0) {
            //   return this.$message.error(res.msg)
            // }
            this.$message.success("删除数据集标注成功");
            // 获取当前focus图片的标注信息并更新
            this.getData((ins, data) => {
              const annotations = (data.labels || []).flatMap(
                (item) => item.annotations
              );
              if (annotations && annotations.length) {
                //说明后台没清除掉该图片的标注
                console.error("查询到当前图片上仍有标注信息");
              } else {
                this.clearAnnotationComPath();
              }
            });
            // 更新右侧缩略图
            // 设置全部loading
            const ids = this.modalInstance.processPictureList.map(
              (item) => item.id
            );
            this.modifyGroupLoading(ids);
            this.modalInstance.processPictureList.forEach((pic) => {
              this.modalInstance.loadThumbnail(pic.id).finally(() => {
                //加载完成后移除loading
                const index = ids.indexOf(pic.id);
                if (index > -1) {
                  ids.splice(index, 1);
                }
                this.modifyGroupLoading(ids);
              });
            });
          })
          .catch((e) => {
            this.$message.error(e.data);
            this.clearLoading();
          })
          .finally(() => {
            loading.close();
          });
      }
    },
    // 终止标注行为
    handleStopTask() {
      if (!this.taskId) {
        this.$message.warning("任务不存在");
        return false;
      }
      this.$refs.stopTask.stopTask();
    },
    // 展示SAMmask图片
    async showMaskPreviewer() {
      const markTaskId = this.markTaskId || this.$attrs.markTaskId;
      if (!markTaskId) {
        this.$message.warning("无mask信息");
        return;
      }
      this.showSamMaskModal = !this.showSamMaskModal;
      if (!this.showSamMaskModal) return;
      try {
        const res = await getSamMaskPicture(markTaskId);
        this.samMaskPictureUrl = window.URL.createObjectURL(res);
      } catch (e) {
        // this.$message.warning(e.response?.data?.msg)
        this.samMaskPictureUrl = null;
        this.showSamMaskModal = false;
      }
    },

    // Current Annotation Operations
    uniteCurrentAnnotation(
      compound,
      simplify = true,
      undoable = true,
      isBBox = false
    ) {
      this.currentAnnotation = this.getCurrentAnnotation();
      if (this.currentAnnotation == null) return;
      this.currentAnnotation.unite(compound, simplify, undoable, isBBox);
    },
    // subtractCurrentAnnotation(compound, simplify = true, undoable = true) {
    //   if (this.currentCategory == null) return;
    //   this.currentAnnotation.subtract(compound, simplify, undoable);
    // },

    selectLastEditorTool() {
      this.activeTool = localStorage.getItem("editorTool") || "Select";
    },

    setCursor(newCursor) {
      this.cursor = newCursor;
    },
    // incrementCategory() {
    //   if (this.current.category >= this.categories.length - 1) {
    //     this.current.category = -1;
    //   } else {
    //     this.current.category += 1;
    //     if (this.currentKeypoint) {
    //       this.currentAnnotation.onAnnotationKeypointClick(
    //         this.current.keypoint
    //       );
    //     }
    //   }
    // },
    // decrementCategory() {
    //   if (this.current.category === -1) {
    //     this.current.category = this.categories.length - 1;
    //     let annotationCount = this.currentCategory.category.annotations.length;
    //     if (annotationCount > 0) {
    //       this.current.annotation = annotationCount - 1;
    //     }
    //   } else {
    //     this.current.category -= 1;
    //   }
    // },
    // incrementAnnotation() {
    //   let annotationCount = this.currentCategory.category.annotations.length;
    //   if (this.current.annotation === annotationCount - 1) {
    //     this.incrementCategory();
    //     this.current.annotation = -1;
    //   } else {
    //     this.current.annotation += 1;
    //     if (
    //       this.currentAnnotation != null &&
    //       this.currentAnnotation.showKeypoints
    //     ) {
    //       this.current.keypoint = 0;
    //       this.currentAnnotation.onAnnotationKeypointClick(
    //         this.current.keypoint
    //       );
    //     } else {
    //       this.current.keypoint = -1;
    //     }
    //   }
    // },
    // decrementAnnotation() {
    //   let annotationCount = this.currentCategory.category.annotations.length;
    //   if (this.current.annotation === -1) {
    //     this.current.annotation = annotationCount - 1;
    //   } else if (this.current.annotation === 0) {
    //     this.decrementCategory();
    //   } else {
    //     this.current.annotation -= 1;
    //     if (
    //       this.currentAnnotation != null &&
    //       this.currentAnnotation.showKeypoints
    //     ) {
    //       this.current.keypoint =
    //         this.currentAnnotation.keypointLabels.length - 1;
    //       this.currentAnnotation.onAnnotationKeypointClick(
    //         this.current.keypoint
    //       );
    //     } else {
    //       this.current.keypoint = -1;
    //     }
    //   }
    // },
    // incrementKeypoint() {
    //   let keypointCount = this.currentAnnotation.keypointLabels.length;
    //   if (this.current.keypoint === keypointCount - 1) {
    //     this.incrementAnnotation();
    //   } else {
    //     this.current.keypoint += 1;
    //   }
    //   if (this.currentKeypoint != null) {
    //     this.currentAnnotation.onAnnotationKeypointClick(this.current.keypoint);
    //     // this.currentAnnotation.$emit("keypoint-click", this.current.keypoint);
    //   }
    // },
    // decrementKeypoint() {
    //   if (this.current.keypoint === 0) {
    //     this.decrementAnnotation();
    //   } else {
    //     this.current.keypoint -= 1;
    //   }
    //   if (this.currentKeypoint != null) {
    //     this.currentAnnotation.onAnnotationKeypointClick(this.current.keypoint);
    //     // this.currentAnnotation.$emit("keypoint-click", this.current.keypoint);
    //   }
    // },
    // moveUp() {
    //   if (this.currentCategory != null) {
    //     if (this.currentAnnotation != null) {
    //       if (this.currentKeypoint != null) {
    //         this.decrementKeypoint();
    //       } else if (
    //         this.currentAnnotation.showKeypoints &&
    //         this.current.keypoint == -1
    //       ) {
    //         this.decrementKeypoint();
    //       } else {
    //         this.decrementAnnotation();
    //       }
    //     } else if (this.current.annotation == -1) {
    //       this.decrementAnnotation();
    //     } else {
    //       this.decrementCategory();
    //     }
    //   } else {
    //     this.decrementCategory();
    //   }
    // },
    // moveDown() {
    //   if (this.currentCategory != null) {
    //     if (this.currentAnnotation != null) {
    //       if (this.currentKeypoint != null) {
    //         this.incrementKeypoint();
    //       } else if (
    //         this.currentAnnotation.showKeypoints &&
    //         this.current.keypoint == -1
    //       ) {
    //         this.incrementKeypoint();
    //       } else {
    //         this.incrementAnnotation();
    //       }
    //     } else if (this.current.annotation == -1) {
    //       this.incrementAnnotation();
    //     } else {
    //       this.incrementCategory();
    //     }
    //   } else {
    //     this.incrementCategory();
    //   }
    // },
    // stepIn() {
    //   if (this.currentCategory != null) {
    //     if (!this.currentCategory.isVisible) {
    //       this.currentCategory.isVisible = true;
    //       this.current.annotation = 0;
    //       this.currentAnnotation.showKeypoints = false;
    //       this.current.keypoint = -1;
    //     } else if (
    //       !this.currentCategory.showAnnotations &&
    //       this.currentAnnotationLength > 0
    //     ) {
    //       this.currentCategory.showAnnotations = true;
    //       this.current.annotation = 0;
    //       this.currentAnnotation.showKeypoints = false;
    //       this.current.keypoint = -1;
    //     } else if (
    //       !this.currentAnnotation.showKeypoints &&
    //       this.currentAnnotation.keypointLabels.length > 0
    //     ) {
    //       this.currentAnnotation.showKeypoints = true;
    //       this.current.keypoint = 0;
    //       this.currentAnnotation.onAnnotationKeypointClick(
    //         this.current.keypoint
    //       );
    //     }
    //   }
    // },
    // stepOut() {
    //   if (this.currentCategory != null) {
    //     if (
    //       this.currentAnnotation != null &&
    //       this.currentAnnotation.showKeypoints
    //     ) {
    //       this.currentAnnotation.showKeypoints = false;
    //       this.current.keypoint = -1;
    //     } else if (this.currentCategory.showAnnotations) {
    //       this.currentCategory.showAnnotations = false;
    //       this.current.annotation = -1;
    //     } else if (this.currentCategory.isVisible) {
    //       this.currentCategory.isVisible = false;
    //     }
    //   }
    // },
    // scrollElement(element) {
    //   element.scrollIntoView({
    //     behavior: "smooth",
    //     block: "center",
    //   });
    // },
    showAll() {
      if (this.$refs.categories == null) return;
      this.isShowAllAnnotations = true;
      const annotations = this.$refs.categories.getAnnotations();
      if (annotations) {
        annotations.forEach((annotation) => {
          annotation.isVisible = this.isShowAllAnnotations;
        });
      }
    },
    // 清除compoundPath
    clearAnnotationComPath() {
      if (this.$refs.categories == null) return;
      const annotations = this.$refs.categories.getAnnotations();
      if (annotations) {
        annotations.forEach((annotation) => {
          annotation.compoundPath && annotation.compoundPath.remove();
        });
      }
    },
    hideAll() {
      if (this.$refs.categories == null) return;

      const annotations = this.$refs.categories.getAnnotations();
      this.isShowAllAnnotations = false;
      annotations.forEach((annotation) => {
        annotation.isVisible = this.isShowAllAnnotations;
      });
    },
    // findCategoryByName(categoryName) {
    //   let categoryComponent = this.$refs.category.find(
    //     (category) =>
    //       category.category.name.toLowerCase() === categoryName.toLowerCase()
    //   );
    //   if (!categoryComponent) return null;
    //   return categoryComponent.category;
    // },
    // addAnnotation(categoryName, segments, keypoints, isbbox = false) {
    //   segments = segments || [];
    //   keypoints = keypoints || [];

    //   if (keypoints.length == 0 && segments.length == 0) return;

    //   let category = this.findCategoryByName(categoryName);
    //   if (category == null) return;

    //   axios
    //     .post("/api/v1/datacenter/dataListAnnotation/create", {
    //       imageId: this.image.id,
    //       labelId: category.id,
    //       segmentation: segments,
    //       keypoints: keypoints,
    //       isbbox: isbbox,
    //     })
    //     .then((response) => {
    //       let annotation = response.data;
    //       category.annotations.push(annotation);
    //     });
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
    // },

    updateAnnotationCategory(annotationId, labelId) {
      // const newCategory = this.findCategoryByName(newCategoryName);
      if (!annotationId || !annotationId) return;
      axios
        .put(
          `/api/v1/datacenter/dataListAnnotation/updateLabelById/${annotationId}`,
          { labelId: labelId }
        )
        .then(() => {
          this.getData();
          // let newAnnotation = {
          //   ...response.data,
          //   ...annotation,
          //   metadata: response.data.metadata,
          //   category_id: newCategory.id,
          // };

          // if (newAnnotation) {
          //   oldCategory.annotations = oldCategory.annotations.filter(
          //     (a) => a.id !== annotation.id
          //   );
          //   newCategory.annotations.push(newAnnotation);
          // }
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
    // 获取当前具体标注对象
    getCurrentAnnotation() {
      return this.$refs.categories.getAnnotation(this.current.annotation);
      // return this.currentCategory.getAnnotation(this.current.annotation);
    },
    // 获取当前标注对象类别
    getCurrentCategory() {
      const annotaiton = this.$refs.categories.getAnnotation(
        this.current.annotation
      );
      return annotaiton.category;
      // return this.getCategory(this.current.category);
    },
    onSlideChange(v) {
      this.$store.dispatch("doSetAnnotatorOpacity", v);
      this.$refs.categories.setColor();
    },
    getEle() {
      return this.$refs.tooltipContainer;
    },
  },
  watch: {
    activeTool(val) {
      if (val) {
        this.$nextTick(() => {
          // this.settingHeight = this.$refs.setting.offsetHeight;
        });
      }
    },
    doneLoading(done) {
      if (done) {
        if (this.loading.loader) {
          this.loading.loader.hide();
        }
      }
    },
    // taskId(newValue) {
    //   this.isStopDisabled =
    //     newValue === undefined || newValue === "" ? true : false;
    // },
    // currentCategory() {
    //   if (this.currentCategory != null) {
    //     if (
    //       this.currentAnnotation == null ||
    //       !this.currentCategory.showAnnotations
    //     ) {
    //       let element = this.currentCategory.$el;
    //       this.scrollElement(element);
    //     }
    //   }
    // },
    // currentAnnotation(newElement) {
    //   if (newElement != null) {
    //     if (newElement.showAnnotations) {
    //       let element = newElement.$el;
    //       this.scrollElement(element);
    //     }
    //   }
    // },
    // "current.category"(cc) {
    //   if (cc < -1) this.current.category = -1;
    //   //
    //   let max = this.categories.length;
    //   if (cc > max) {
    //     this.current.category = -1;
    //   }
    // },
    // "current.annotation"(ca) {
    //   if (ca < -1) this.current.annotation = -1;
    //   if (this.currentCategory != null) {
    //     let max = this.currentAnnotationLength;
    //     if (ca > max) {
    //       this.current.annotations = -1;
    //     }
    //   }
    // },
    // "current.keypoint"(sk) {
    //   if (sk < -1) this.current.keypoint = -1;
    //   if (this.currentCategory != null) {
    //     let max = this.currentAnnotationLength;
    //     if (sk > max) {
    //       this.current.keypoint = -1;
    //     }
    //   }
    // },
    annotating() {
      this.removeFromAnnotatingList();
    },
    user() {
      this.removeFromAnnotatingList();
    },
  },
  computed: {
    ...mapState({
      taskId: (state) => state.annotator.taskId,
      shapeOpacity: (state) => state.annotator.annotatorOpacity,
      selectedLabelArr: (state) => state.annotator.selectedLabelArr,
      tempAnnotationSavedDataArr: (state) =>
        state.annotator.tempAnnotationSavedDataArr,
    }),
    isDisabled() {
      if (
        this.createBy === this.$store.state.user.user.username ||
        this.$store.state.user.user.username === "admin"
      ) {
        return false;
      }
      return true;
    },
    doneLoading() {
      return !this.loading.image && !this.loading.data;
    },
    //   currentAnnotationLength() {
    //     if (this.currentCategory == null) return null;
    //     return this.currentCategory.category.annotations.length;
    //   },
    //   currentKeypointLength() {
    //     if (this.currentAnnotation == null) return null;
    //     return this.currentAnnotation.annotation.keypoints.length;
    //   },
    categoriesInstance() {
      return this.$refs.categories;
    },
    //   currentKeypoint() {
    //     if (this.currentCategory == null) {
    //       return null;
    //     }
    //     if (
    //       this.currentAnnotation == null ||
    //       this.currentAnnotation.keypointLabels.length === 0 ||
    //       !this.currentAnnotation.showKeypoints
    //     ) {
    //       return null;
    //     }
    //     if (this.current.keypoint == -1) {
    //       return null;
    //     }
    //     return {
    //       label: [String(this.current.keypoint + 1)],
    //       visibility: this.currentAnnotation.getKeypointVisibility(
    //         this.current.keypoint
    //       ),
    //     };
    //   },
    //   user() {
    //     return this.$store.getters["user/user"];
    //   },
    /**
     * 标志位 Boolean  true： 在数据中心使用   false： 在原有数据集中使用
     * 使标注功能在出数据集标注以外（这里仅指应用管理-数据中心使用，对单张图片进行标注）的地方可以使用，做一些功能的屏蔽和特殊处理
     */
    noDatasetMode() {
      return !!this.nonDatasetSchema.queryAnnotationDataRequest;
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
    this.getaPromptModelList();
    this.$nextTick(() => {
      // 禁用slider组件键盘功能
      this.$refs.slider.$refs.sliderRef.onKeyDown = () => {
        return null;
      };
    });
    // this.loading.loader = this.$loading.show({
    //   color: "white",
    //   // backgroundColor: "#4b5162",
    //   height: 150,
    //   opacity: 0.8,
    //   width: 150
    // });

    this.initCanvas();
    if (this.image.id) {
      this.getData();
    } else {
      //存在未知原因的偶现focusId不存在问题，这里异步再取一次
      this.$nextTick(() => {
        this.image.id = parseInt(this.identifier);
        this.getData();
      });
    }

    this.$nextTick(() => {
      // this.settingHeight = this.$refs.setting.offsetHeight;
    });
    // this.$socket.emit("annotating", { image_id: this.image.id, active: true });
  },
  async created() {
    // 未知类型的数据集 只能查看，不显示左右区域
    this.panels.show.left = this.panels.show.right = this.mode !== "unknown";
    this.paper = new paper.PaperScope();
    this.$store.dispatch("doSetPaperScope", this.paper);
    this.image.id = parseInt(this.identifier);
    // this.image.url = "/api/image/" + this.image.id;
    this.image.url = this.imageUrl;
  },
  beforeDestroy() {
    this.$refs.line && this.$refs.line.removeTimer();
    this.$refs.autoAnnotate && this.$refs.autoAnnotate.removeTimer();
    this.$store.dispatch("doClearTempAnnotationSavedDataArr");
  },
};
</script>

<style lang="scss" scoped>
@import "./assets/tagsStyle.css";
@import "./assets/tooltip.css";

.right-panel-header {
  padding: 8px;
  background-color: rgba(167, 205, 255, 1);
  overflow: hidden;
  border-radius: 8px;
  font-family: Arial, Helvetica, sans-serif;
  & > h3 {
    text-align: left;
    font-size: 16px;
    color: black;
    font-weight: 700;
  }
}
.picture-info {
  margin-bottom: 5px;
  & dl {
    color: #333333;
    margin: 0;
    padding: 0;
  }

  & dt {
    font-weight: bold;
    // color: black;
    float: left; /* 左浮动 */
    clear: left; /* 清除浮动，确保每个 dt 在新行 */
    width: 100px; /* 描述名称的宽度 */
    text-align: left; /* 右对齐 */
    padding-right: 10px; /* 右边距 */
  }

  & dd {
    margin-left: 100px; /* 与 dt 的宽度对齐 */
    text-align: left;
    margin-bottom: 5px; /* 每个描述项的间距 */
    white-space: nowrap; /* 不换行 */
    overflow: hidden; /* 超出部分隐藏 */
    text-overflow: ellipsis; /* 显示省略号 */
    color: #333333;
  }
}
.annotate-setting {
  text-align: left;
  & .list-item {
    margin-bottom: 6px;
    &-title {
      display: inline-block;
      width: 110px;
      color: #333333;
      font-weight: bold;
      margin-right: 5px;
    }
  }
}

.logoTitle {
  display: flex;
  justify-content: space-between;

  // text-align: left;
  .title-style {
    font-size: 24px;
    font-weight: 700 !important;
    font-style: normal;
    color: #d9001b;
  }
  .name-style {
    color: #d9001b;
    font-size: 17px;
    font-weight: bold;
    white-space: nowrap; /* 不换行 */
    overflow: hidden; /* 超出部分隐藏 */
    text-overflow: ellipsis; /* 显示省略号 */
  }
  .close-confirm {
    color: #000;
    line-height: 20px;
  }
}

.currentDataName {
  color: black;
  font-size: 16px;
  font-weight: 700;
  text-align: left;
  display: inline-block;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.headCheckboxGroup {
  margin: 8px 0;
  text-align: left;
}

.batch-confirm {
  margin-top: 4px;

  & > h3 {
    text-align: left;
    font-size: 16px;
    color: black;
    font-weight: 700;
  }

  .slider {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
}

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
  background-color: rgba(167, 205, 255, 1);
  padding: 0 4px;
  position: relative;
  float: left;
  height: inherit;
  font-size: 16px;
  box-shadow: 5px 10px;
  .canvas-operate,
  .annotation-operate,
  .image-operate {
    color: #000;
    font-weight: bold;
    font-size: 14px;
  }
  .btn-list {
    margin-top: 14px;
  }
  .canvas-operate {
    margin-top: 40px;
  }
  .annotation-operate,
  .image-operate {
    margin-top: 24px;
  }
  .line-tool {
    margin: 0 -4px 0 -4px;
    padding: 10px 0;
    background: #fff;
    text-align: center;
  }
}

.right-panel {
  margin-top: 4px;
  /* padding-top: 40px; */
  margin-left: 4px;
  background-color: transparent;
  width: 300px;
  height: inherit;
  float: right;
  position: relative;
  border-radius: 8px;
  box-shadow: none !important;
}

.top-panel {
  height: 74px;
  position: relative;
  width: auto;
  background-color: #fff;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;

  .selectModel {
    float: left;
    margin: 2px 5px;
    width: 160px;
    line-height: 31px;
  }

  .icon-tool {
    font-size: 20px;
    color: #02a7f0;
    cursor: pointer;
    line-height: 35px;
    margin: auto 8px;
  }

  .disabled {
    cursor: not-allowed;
  }

  .icon-preview {
    font-size: 15px;
    color: #000;
  }

  .remove-line-btn {
    color: #02a7f0;
  }

  .radio-list {
    margin: auto 5px;
    &.res {
      display: flex;
      align-items: center;
      color: #555;
      margin: 0 10px;
      .res-desc {
        margin-right: 10px;
        font-weight: bold;
      }
      .res-redio {
        display: flex;
      }
    }
    div {
      input {
        width: 12px;
      }

      label {
        display: inline-block;
        margin: 0;
        margin-left: 4px;
        color: #000;
        font-size: 12px;
        vertical-align: text-bottom;
        white-space: nowrap;
      }
    }
  }

  .main-select-content {
    display: flex;
    align-items: center;
  }

  // 标注过程中的提示信息
  .annotate-process-info {
    text-align: right;
    font-size: 14px;
    width: auto;
    color: #1890ff;
    margin-right: 10px;
  }
  .label-list {
    left: 420px;
    display: flex;
    .fore,
    .back {
      display: flex;
      align-items: center;
      cursor: pointer;
      color: #555;
      outline: none;
    }
    .back {
      margin-left: 12px;
      &:hover {
        color: #811776;
      }
      &.active {
        color: #811776;
        background: unset;
      }
    }
    .fore {
      &:hover {
        color: #00ff00;
      }
      &.active {
        background: unset;
        color: #00ff00;
      }
    }
    .line-icon {
      display: block;
      font-size: 18px;
    }
  }
}

.none {
  height: 0;
}

.model-select {
  margin: 10px auto 0;
  width: 90%;
}

.model-select:focus {
  box-shadow: none;
  border-color: none;
}

.middle-panel {
  margin-top: 5px;
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
  margin-top: 4px;
  padding-left: 8px;
  padding-right: 8px;
  overflow: auto;
}

.sidebar-title {
  color: black;
}

/* Tool section */
.tool-section {
  margin: 5px;
  border-radius: 5px;
  // background-color: #383c4a;
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

::v-deep .ant-modal-mask,
::v-deep .ant-modal-wrap {
  z-index: 9999;
}

.slider {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  .aplha-des {
    color: #333;
    font-weight: bold;
    width: 110px;
    margin-right: 5px;
  }
  .alpha-val {
    flex: 1;
    margin-right: 5px;
  }
  :deep(.ant-slider-track) {
    background: #1890ff;
  }
  :deep(.ant-slider) {
    margin: 0 6px;
  }
}
.annote-configuration {
  display: flex;
  flex-direction: column;
}
.divider {
  width: 0;
  box-sizing: border-box;
  height: 35px;
  border-left: 1px solid rgba(0, 0, 0, 0.1);
  margin: 0 5px;
}
</style>
