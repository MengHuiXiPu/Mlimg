<template>
  <div
    v-show="showCategory"
    :style="{
      'background-color': backgroundColor,
      'border-color': borderColor,
    }"
  >
    <div class="ca-title">
      <h3>标签管理</h3>
      <!-- 屏蔽标注模式切换 -->
      <!-- <a-checkbox
        :checked="mode === 'label'"
        class="checkedBoxStyle"
        @change="onCheckedChange"
        :disabled="$parent.noDatasetMode"
      >
        仅标注类别
      </a-checkbox> -->
    </div>
    <a-button type="primary" @click="openCaModal" style="width: 100%">
      编辑标签
    </a-button>
    <!-- <button
      class="btn btn-outline-light tool-input-button"
      data-toggle="modal"
      data-target="#caManage"
      style="width: 100%"
    >
      编辑标签
    </button> -->
    <div v-show="$parent.noDatasetMode || ['segment','detect', 'unknown'].includes(mode)">
      <form class="flex ca-margin">
        <label class="col-form-label">
          <a-checkbox :disabled="index === -1" @change="checkboxChange"
            ><span style="color: black">使用默认标签: </span></a-checkbox
          >
        </label>
        <select
          v-model="focusId"
          class="form-control custom-select-sm label-select"
          @change="handleSelectChange"
          :disabled="disabledSelectedLabel"
        >
          <option
            v-for="option in allCategories"
            :key="option.id"
            :value="option.id"
          >
            {{ option.name }}
          </option>
        </select>
      </form>
      <a-input-search
        v-model="search"
        placeholder="Search"
        :disabled="annotationsList.length < 2"
        @search="onSearch"
      />
      <div class="toggle-annotation-show">
        <a-button
          type="primary"
          class="annotation-btn"
          v-show="$parent.noDatasetMode || ['segment', 'detect'].includes(mode)"
          @click="toggleAnnotationShow"
          >{{ toggleBtnText }}(C)</a-button
        >
      </div>
      <ul class="list-group">
        <!-- <li
          class="list-group-item btn btn-link btn-sm text-left"
          :style="{ 'background-color': backgroundColor, color: 'white' }"
        >
          <input
            v-model="search"
            class="annotation-search"
            placeholder="Search"
            :disabled="annotationsList.length < 2"
          />
        </li> -->
        <template v-for="item in allCategories">
          <Annotation
          v-for="annotation in item.annotations.filter(
              (ele) => [2, 3].includes(ele.mode)
            )"
            :search="search"
            :key="annotation.id"
            :category="item"
            :simplify="simplify"
            :annotation="annotation"
            :current="current.annotation"
            @click="onAnnotationClick"
            :opacity="opacity"
            :index="getIndex(annotation.id)"
            :keypoint-edges="keypoint.edges"
            :keypoint-labels="keypoint.labels"
            :keypoint-colors="keypoint.colors"
            ref="annotation"
            :active-tool="activeTool"
            :scale="scale"
            @deleted="annotationDeleted"
            :all-categories="getCategoriesList"
          />
        </template>
      </ul>
    </div>
    <div v-show="mode == 'label'">
      <div class="label-list">
        <CLabel
          v-for="category in allCategories"
          :key="category.id + '-label'"
          :category="category"
          :search="categorysearch"
          :imageId="imageId"
        />
      </div>
    </div>
    <!-- 标签管理编辑标签弹窗 -->
    <div
      class="modal fade"
      id="caManage"
      tabindex="-1"
      role="dialog"
      data-backdrop="static"
      data-keyboard="false"
    >
    <div class="modal-dialog modal-dialog-centered modal-lg" style="width: 560px;" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">编辑标签</h5>
            <button
              type="button"
              class="close"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="ca-action">
              <span style="color: rgba(0, 0, 0, 0.85)"
                >您可以对标签进行增加、删除、调整顺序等操作</span
              >
              <div>
                <a-button
                  type="primary"
                  icon="plus"
                  ghost
                  size="small"
                  style="margin-right: 8px"
                  @click="handleAdd"
                />
                <a-button
                  type="primary"
                  icon="edit"
                  ghost
                  style="margin-right: 8px"
                  :disabled="cannotConfirm"
                  @click="openSmallModal"
                  size="small"
                />
                <a-button
                  type="primary"
                  icon="delete"
                  :disabled="!selectedRows.length"
                  ghost
                  @click="deleteRows"
                  size="small"
                />
              </div>
            </div>
            <a-table
              size="small"
              :columns="columns"
              :data-source="labelList"
              :scroll="{ y: 400 }"
              :pagination="false"
              :row-selection="rowSelection"
              :rowKey="(record) => record.id"
            >
              <template slot="name" slot-scope="text, record">
                <editable-cell
                  :key="record.orderNum"
                  :text="record.name"
                  :nameList="labelList.map((ele) => ele.name)"
                  ref="editableCell"
                  @change="onCellChange(record.orderNum, 'name', $event)"
                />
              </template>
              <template slot="action" slot-scope="text, record">
                <div style="display: flex; align-items: center">
                  <a-button
                    type="primary"
                    icon="up"
                    ghost
                    size="small"
                    style="margin-right: 8px"
                    @click="moveUp(record)"
                  />
                  <a-button
                    type="primary"
                    ghost
                    icon="down"
                    size="small"
                    style="margin-right: 8px"
                    @click="moveDown(record)"
                  />
                  <a-button
                    type="primary"
                    icon="to-top"
                    ghost
                    size="small"
                    style="margin-right: 8px"
                    :disabled="toTopDisabled(record)"
                    @click="moveToTop(record)"
                  />
                  <a-button
                    type="primary"
                    icon="delete"
                    ghost
                    size="small"
                    style="margin-right: 8px"
                    @click="deleteItem(record)"
                  />
                </div>
              </template>
            </a-table>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary font-size14"
              data-dismiss="modal"
            >
              关闭
            </button>
            <button
              type="button"
              class="btn btn-primary font-size14"
              :disabled="cannotConfirm"
              @click="handleConfirm"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- 标签管理编辑多项弹窗 -->
    <div
      class="modal fade"
      id="smallModal"
      tabindex="-1"
      role="dialog"
      data-backdrop="static"
      data-keyboard="false"
    >
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">编辑多项</h5>
            <button
              type="button"
              class="close"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div style="text-align: left; color: rgba(0, 0, 0, 0.85)">
              请编辑你的Label Name, 支持新增和删除。<br />
              每一个Label Name请用回车隔开。
            </div>
            <a-textarea
              v-model="batchEditString"
              placeholder="Controlled autosize"
              :auto-size="{ minRows: 5, maxRows: 10 }"
            />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary font-size14" @click="batchEdit">
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import paper from "paper";
import axios from "axios";
// import Annotations from "../models/annotations";
import Label from "./Label";
import Annotation from "./Annotation";
import editableCell from "./tools/editableCell.vue";
import KeypointsDefinition from "./tools/KeypointsDefinition";
import { arrayDiff } from "../libs/config";
import uniqueId from "lodash/uniqueId";

import JQuery from "jquery";

let $ = JQuery;

export default {
  name: "Category",
  components: {
    Annotation,
    KeypointsDefinition,
    editableCell,
    CLabel: Label,
  },
  inject: ["modalInstance"],
  props: {
    // category: {
    //   type: Object,
    //   required: true,
    // },
    // index: {
    //   type: Number,
    //   required: true,
    // },
    mode: {
      type: String,
      required: true,
    },
    current: {
      type: Object,
      required: true,
    },
    hover: {
      type: Object,
      required: true,
    },
    opacity: {
      type: Number,
      required: true,
    },
    scale: {
      type: Number,
      default: 1,
    },
    imageId: {
      type: String,
      required: true,
    },
    categorysearch: {
      type: String,
      required: true,
    },
    simplify: {
      type: Number,
      default: 1,
    },
    activeTool: {
      type: String,
      required: true,
    },
    allCategories: {
      type: Array,
      required: true,
    },
    defaultCategory: {
      type: Number,
      required: true,
    },
    isShowAllAnnotations: {
      type: Boolean,
      default: false,
    },
  },
  data: function () {
    return {
      focusId: "",
      category: {},
      index: -1,
      columns: [
        {
          title: "标签名称",
          dataIndex: "name",
          key: "name",
          scopedSlots: { customRender: "name" },
          width: "40%",
        },
        {
          title: "操作",
          dataIndex: "action",
          key: "action",
          scopedSlots: { customRender: "action" },
        },
      ],
      labelList: [],
      batchEditString: [],
      selectedRows: [],
      group: null,
      // supercategory: this.category.supercategory,
      color: "",
      keypoint: {
        labels: [],
        edges: [],
        colors: [],
      },
      selectedAnnotation: -1,
      showAnnotations: false,
      // isVisible: false,
      search: "",
      isMounted: false,
      justOnce: true,
      disabledSelectedLabel: false,
      allLabelAnnotationCount: [], //各标签（所有标签，包括类别标签和分割标签）下的标注数详情
    };
  },
  methods: {
    openCaModal() {
      $("#caManage").modal("show");
      // 此if为兼容数据管理中的标注功能
      if (this.$parent.noDatasetMode) {
        //将label数据特殊保存处理
        return;
      }
      this.getLabelAnnotationCount();
    },
    /**
     * 查询各标签（所有标签：包括类别标签和分割标签）下的标注数，返回的数据结构和getLabelCount返回的一致： [{"id": 1280,"count": 0,"labelName": "segment"}, ...]
     */
    getLabelAnnotationCount() {
      axios
        .get(
          `/api/v1/datacenter/dataListAnnotation/getAllLabelCountStatsByDatasetId/${this.$parent.dataset.id}`
        )
        .then((res) => {
          // if(res.code !=0) return this.$message.warning(res.msg)
          this.allLabelAnnotationCount = res.data || [];
        });
    },
    // 批量编辑，运用diffArray算法，进行增删。
    batchEdit() {
      const regex = /^[ \t\r\n]+$/;
      const newArray = this.batchEditString
        .split("\n")
        .filter((item) => !regex.test(item) && item.length != 0);
      console.log(newArray, "checknewArray");

      const array = [...this.labelList.map((item) => item.name)];
      const operations = arrayDiff(array, newArray);
      operations.forEach((operation) => {
        if (operation.type === "delete") {
          const index = this.labelList.findIndex(
            (ele) => ele.name === operation.item
          );
          // 执行删除操作，根据 operation.index 删除数组 this.labelList 中的元素
          if (!this.labelList[index].annotations.length) {
            this.labelList.splice(index, 1);
          }
        } else if (operation.type === "insert") {
          // 执行插入操作，将 operation.item 插入到数组 this.labelList 的 operation.index 位置
          this.labelList.splice(operation.index, 0, {
            name: operation.item,
            annotations: [],
            dlId: this.$parent.dataset.id,
            orderNum: undefined,
          });
        }
      });
      $("#smallModal").modal("hide");
    },
    openSmallModal() {
      const array = [...this.labelList.map((item) => item.name)];
      this.batchEditString = array.join("\n");
      $("#smallModal").modal("show");
    },
    // 屏蔽标注模式切换
    // onCheckedChange(e) {
    //   if (e.target.checked) {
    //     this.$emit("on-mode", "label");
    //     this.getLabelCount();
    //   } else {
    //     this.$emit("on-mode", "segment");
    //   }
    // },
    handleAdd() {
      const { labelList } = this;
      const newData = {
        name: "Write down new label name.",
        annotations: [],
        dlId: this.$parent.dataset.id,
        orderNum: 1,
      };
      this.labelList = [newData, ...labelList];
      this.labelList.forEach((item, index) => {
        item.orderNum = index + 1;
      });
    },
    onCellChange(orderNum, dataIndex, value) {
      const labelList = [...this.labelList];
      const target = labelList.find((item) => item.orderNum === orderNum);
      if (target && target.id) {
        axios
          .put(`/api/v1/datacenter/dataLabel/editNameById/${target.id}`, {
            newName: value,
          })
          .then(() => {
            target[dataIndex] = value;
            this.labelList = labelList;
          });
      } else {
        target[dataIndex] = value;
        this.labelList = labelList;
      }
    },
    moveToTop(record) {
      const index = this.labelList.findIndex(
        (item) => item.orderNum === record.orderNum
      );
      if (index > 0 && index < this.labelList.length) {
        const temp = this.labelList[index];
        this.labelList.splice(index, 1);
        this.labelList.unshift(temp);
      }
      this.labelList.forEach((item, index) => {
        item.orderNum = index + 1;
      });
    },
    toTopDisabled(record) {
      return (
        this.labelList.findIndex(
          (item) => item.orderNum === record.orderNum
        ) === 0
      );
    },
    moveUp(record) {
      const index = this.labelList.findIndex(
        (item) => item.orderNum === record.orderNum
      );
      if (index > 0 && index < this.labelList.length) {
        const temp = this.labelList[index];
        this.labelList.splice(index, 1);
        this.labelList.splice(index - 1, 0, temp);
      }
      this.labelList.forEach((item, index) => {
        item.orderNum = index + 1;
      });
    },
    moveDown(record) {
      const index = this.labelList.findIndex(
        (item) => item.orderNum === record.orderNum
      );
      if (index >= 0 && index < this.labelList.length - 1) {
        const temp = this.labelList[index];
        this.labelList.splice(index, 1);
        this.labelList.splice(index + 1, 0, temp);
      }
      this.labelList.forEach((item, index) => {
        item.orderNum = index + 1;
      });
    },
    deleteItem(row) {
      // 此if为兼容数据管理中的标注功能
      if (this.$parent.noDatasetMode) {
        //将label数据特殊保存处理
        if (row.annotations?.length) {
          this.$message.warning("该标签下存在标注信息，无法删除");
        } else {
          const index = this.labelList.findIndex((label) => label.id == row.id);
          index > -1 && this.labelList.splice(index, 1);
        }
        return;
      }
      // 以下为数据集标注原本逻辑
      const targetLabelDetail =
        this.allLabelAnnotationCount.find((lab) => lab.id === row.id) || {};
      if (targetLabelDetail.count && targetLabelDetail.count > 0) {
        //说明该标签下有标注，不能删除
        return this.$message.warning("该标签下存在标注信息，无法删除");
      }
      const index = this.labelList.findIndex(
        (item) => item.orderNum === row.orderNum
      );
      if (index > -1) {
        this.labelList.splice(index, 1);
      }
      this.labelList.forEach((item, index) => {
        item.orderNum = index + 1;
      });
    },
    deleteRows() {
      this.selectedRows.forEach((item) => {
        const index = this.labelList.findIndex(
          (ele) => item.orderNum === ele.orderNum
        );
        if (index > -1 && item.annotations.length <= 0) {
          this.labelList.splice(index, 1);
        }
      });
      this.labelList.forEach((item, index) => {
        item.orderNum = index + 1;
      });
      console.log(this.labelList, "checkLabelList");
    },
    // 标签编辑modal 确认
    handleConfirm() {
      // 此if为兼容数据管理中的标注功能
      if (this.$parent.noDatasetMode) {
        //将label数据特殊保存处理
        this.modalInstance.updateLabels(this.labelList).then(() => {
          this.$emit("on-update");
          $("#caManage").modal("hide");
        });
        return;
      }
      axios
        .put(
          `/api/v1/datacenter/dataLabel/batchEditByDatasetId/${this.$parent.dataset.id}`,
          { labels: this.labelList }
        )
        .then(() => {
          this.onUpdate();
          $("#caManage").modal("hide");
        });
    },
    // 标签相关操作之后要做的更新
    onUpdate() {
      this.$emit("on-update");
    },
    getCategory(targetId) {
      for (let i = 0; i < this.allCategories.length; i++) {
        const annotations = this.allCategories[i].annotations;
        for (let j = 0; j < annotations.length; j++) {
          if (annotations[j].id === targetId) {
            return this.allCategories[i];
          }
        }
      }
      return null; // 如果未找到匹配的记录，则返回 null
    },
    getIndex(targetId) {
      const extractedAnnotations = this.allCategories
        .flatMap((item) => item.annotations)
        .filter((item) => [2, 3].includes(item.mode));
      const index = extractedAnnotations.findIndex(
        (item) => item.id === targetId
      );
      return index;
    },
    handleSelectChange() {
      this.category = this.allCategories.find(
        (item) => item.id === this.focusId
      );
      this.index = this.allCategories.findIndex(
        (item) => item.id === this.focusId
      );
    },
    checkboxChange(e) {
      if (e.target.checked) {
        this.disabledSelectedLabel = true;
        this.$emit("checked", this.category.id);
      } else {
        this.disabledSelectedLabel = false;
        this.$emit("checked", null);
      }
    },
    // show(index) {
    //   if (this.search.length === 0) return true;
    //   return this.filterFound.indexOf(index) > -1;
    // },
    // resetCategorySettings() {
    // this.supercategory = this.category.supercategory;
    //   this.color = this.category.color || "";
    //   this.keypoint = {
    //     labels: [],
    //     edges: [],
    //     colors: [],
    //   };
    // },

    handleNewAnnotations(id, annotationId, callback) {
      const category = this.allCategories.find((item) => item.id === id);
      category.annotations.push({
        // "datasetId": 1856,
        labelId: id,
        // "imageId": 2047675,
        mode: 3,
        segmentation: [],
        area: null,
        bbox: [],
        keypoints: [],
        metadata: {},
        iscrowd: false,
        id: annotationId,
        color: "#FF0000",
        // "remark": null,
        width: 0,
        height: 0,
        // "confidence": 1.0,
        annoSource: 1,
      });
      this.selectedAnnotation = this.getIndex(annotationId);
      this.$nextTick(() => {
        this.$parent.selectLastEditorTool();
        this.$emit("click", {
          annotation: this.selectedAnnotation,
          category: this.index,
          keypoint: -1,
        });
        this.showAnnotations = true;
        if (callback != null) callback();
      });
    },

    /**
     * Created Annotation
     * shape： 矩形 多边形等，目标检测改为分割并增加新的目标检测后，做bbox标注时需要将mode设置为2，其他时候仍保留原有的3
     */
    createAnnotation(callback, labelId, shape) {
      let parent = this.$parent;
      const id = labelId || this.category.id;
      const annotationId = parseInt(
        uniqueId() + Date.now().toString().substr(-7)
      );
      // 此if为兼容数据管理中的标注功能
      if (parent.noDatasetMode) {
        this.handleNewAnnotations(id, annotationId, callback);
        return Promise.resolve();
      } else {
        // 暂存数据集标注用于后续保存
        this.$store.dispatch("doSetTempAnnotationSavedDataArr", {
          annotationId,
          imageId: parent.image.id,
          labelId: id,
          mode: shape === "bbox" ? 2 : 3,
        });
        this.handleNewAnnotations(id, annotationId, callback);
        return Promise.resolve();
      }
      // Annotations.create({
      //   image_id: parent.image.id,
      //   category_id: this.category.id,
      // }).then(response => {
      // this.$socket.emit("annotation", {
      //   action: "create",
      //   category_id: this.category.id,
      //   annotation: response.data
      // });

      //   this.category.annotations.push(response.data);

      //   this.selectedAnnotation = annotationId;
      //   this.$nextTick(() => {
      //     this.$parent.selectLastEditorTool();
      //     this.$emit("click", {
      //       annotation: annotationId,
      //       category: this.index,
      //       keypoint: -1,
      //     });
      //   });

      //   this.isVisible = true;
      //   this.showAnnotations = true;

      //   let annotations = this.$refs.annotation;
      //   if (annotations == null) return;

      //   let annotation = annotations[annotationId - 1];
      //   if (annotation == null) {
      //     this.$parent.scrollElement(this.$el);
      //   } else {
      //     this.$parent.scrollElement(annotation.$el);
      //   }
      // });
    },
    // onUpdateClick() {
    //   this.category.keypoint_labels = [...this.keypoint.labels];
    //   this.category.keypoint_edges = [...this.keypoint.edges];
    //   this.category.keypoint_colors = [...this.keypoint.colors];
    //   this.category.supercategory = this.supercategory;
    // },
    /**
     * Exports data for send to backend
     * @returns {json} Annotation data, and settings
     */
    export() {
      let refs = this.$refs;
      // let categoryData = {
      //   // Category Identification
      //   id: this.category.id,
      //   name: this.category.name,
      //   // Show in side bar
      //   show: this.category.show,
      //   // Show groups on canvas
      //   visualize: this.isVisible,
      //   // color: this.color,
      //   metadata: [],
      //   annotations: [],
      //   // supercategory: this.category.supercategory,
      //   keypoint_labels: this.category.keypoint_labels,
      //   keypoint_edges: this.category.keypoint_edges,
      //   keypoint_colors: this.category.keypoint_colors,
      // };
      const res = [];
      if (refs.hasOwnProperty("annotation")) {
        refs.annotation.forEach((annotation) => {
          res.push(annotation.export());
        });
      }
      // 类别标注
      const annotaiton = this.hasSelected.item;
      if (annotaiton) {
        res.push(annotaiton);
      }
      let categoryData = {
        annotations: res,
      };
      return categoryData;
    },

    // addKeypointEdge(edge) {
    //   this.keypoint.edges.push(edge);
    // },
    // removeKeypointEdge(edge) {
    //   let index = this.keypoint.edges.findIndex((e) => {
    //     let i1 = Math.min(edge[0], edge[1]) == Math.min(e[0], e[1]);
    //     let i2 = Math.max(edge[0], edge[1]) == Math.max(e[0], e[1]);

    //     return i1 && i2;
    //   });

    //   if (index !== -1) {
    //     let edge = this.keypoint.edges[index];
    //     this.keypoint.edges.splice(index, 1);
    //     let annotations = this.$refs.annotation;
    //     if (annotations) {
    //       annotations.forEach((a) => a.keypoints.removeLine(edge));
    //     }
    //   }
    // },
    /**
     * Event handler for visibility button
     */
    // onEyeClick() {
    //   this.isVisible = !this.isVisible;

    //   if (this.showAnnotations && !this.isVisible) {
    //     this.showAnnotations = false;
    //   }

    //   if (this.showAnnotations)
    //     if (this.isCurrent) {
    //       this.$emit("click", {
    //         annotation: this.selectedAnnotation,
    //         category: this.index,
    //         keypoint: -1,
    //       });
    //     }
    // },
    /**
     * Event handler for keypoint click
     */
    // onKeypointClick(annotation_index, keypoint_index) {
    //   let indices = {
    //     annotation: annotation_index,
    //     category: this.index,
    //     keypoint: keypoint_index,
    //   };
    //   this.selectedAnnotation = annotation_index;
    //   this.showAnnotations = true;

    //   this.$emit("click", indices);
    // },
    /**
     * Event handler for annotation click
     */
    onAnnotationClick(index) {
      let indices = {
        annotation: index,
        category: this.index,
        keypoint: -1,
      };
      this.selectedAnnotation = index;
      this.showAnnotations = true;
      this.$emit("click", indices);
    },
    /**
     * Event Handler for category click
     */
    onClick() {
      let indices = {
        annotation: this.selectedAnnotation,
        category: this.index,
        keypoint: -1,
      };
      this.$emit("click", indices);

      if (this.category.annotations.length === 0) return;
      this.showAnnotations = !this.showAnnotations;

      // if (this.showAnnotations && !this.isVisible) {
      //   this.isVisible = true;
      // }
    },
    /**
     * Creates paperjs group
     */
    initCategory() {
      this.setColor();
    },
    /**
     * @returns {Annotation} returns annotation and provided index
     */
    getAnnotation(index) {
      let ref = this.$refs.annotation;
      if (ref == null) return null;
      ref.sort((a, b) => {
        return a.index - b.index;
      });
      return ref[index];
    },
    getAnnotations() {
      return this.$refs.annotation;
    },
    /**
     * Sets color of current group depending on state.
     * Show annotation colors if showAnnotations is true,
     * Show as group color if showAnnotations is false
     */
    setColor() {
      let annotations = this.$refs.annotation;
      if (annotations == null) return;

      annotations.forEach((a) => a.setColor());
      // if (this.showAnnotations) {
      //   annotations.forEach((a) => a.setColor());
      // } else {
      //   annotations.forEach((a) => {
      //     a.compoundPath.fillColor = this.color;
      //     a.keypoints.color = this.darkHSL;
      //     a.keypoints.bringToFront();
      //   });
      // }
    },
    annotationDeleted(index) {
      const id = this.$parent.image.id;
      this.$emit("update-image", id);
      // if (this.selectedAnnotation >= index) {
      //   this.selectedAnnotation--;
      // }
      // let indices = {
      //   annotation: this.selectedAnnotation,
      //   category: this.index,
      //   keypoint: -1,
      // };
      // this.$emit("click", indices);
      // if (this.category.annotations.length === 0) this.isVisible = false;
    },
    toggleAnnotationShow() {
      if (this.isShowAllAnnotations) {
        this.$parent.hideAll();
      } else {
        this.$parent.showAll();
      }
    },
  },
  computed: {
    toggleBtnText() {
      return this.isShowAllAnnotations
        ? this.$t("dataCenter.hideAll")
        : this.$t("dataCenter.showAll");
    },
    hasSelected() {
      for (let i = 0; i < this.allCategories.length; i++) {
        const label = this.allCategories[i];
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
    cannotConfirm() {
      return this.labelList.some(
        (item) => item.name === "Write down new label name."
      );
    },
    categoryIds() {
      return this.allCategories.map((item) => item.id);
    },
    showCategory() {
      let search = this.categorysearch.toLowerCase();
      if (search.length === 0) return true;
      return this.category.name.toLowerCase().includes(search);
    },
    getCategoriesList() {
      return this.allCategories.map((category) => ({
        value: category.id,
        text: category.name,
      }));
    },
    rowSelection() {
      return {
        onChange: (selectedRowKeys, selectedRows) => {
          this.selectedRows = selectedRows;
          console.log(
            `选中的值: ${selectedRowKeys}`,
            "selectedRows: ",
            selectedRows
          );
        },
        onSelectAll: (selected, selectedRows, changeRows) => {
          this.selectedRows = selectedRows;
          console.log(
            "  用户手动选择/取消选择所有列的回调  ",
            selected,
            selectedRows,
            changeRows
          );
        },
      };
    },
    annotationsList() {
      const result = [];

      this.allCategories.forEach((label) => {
        if (label.annotations && Array.isArray(label.annotations)) {
          result.push(...label.annotations);
        }
      });
      return result;
    },
  },
  watch: {
    color() {
      this.setColor();
    },
    // isVisible(newVisible) {
    //   let annotations = this.$refs.annotation;
    //   if (annotations == null) return;

    //   annotations.forEach((a) => {
    //     // a.keypoints.visible = newVisible;
    //     a.isVisible = newVisible;
    //   });
    //   this.setColor();
    // },
    showAnnotations(showing) {
      if (!showing) {
        this.$emit("click", {
          annotation: -1,
          keypoint: -1,
          category: this.index,
        });
      }
      this.setColor();
    },
    category() {
      this.initCategory();
    },
    "allCategories.length": {
      handler(val) {
        if (this.justOnce) {
          this.focusId = val ? this.allCategories[0].id : "";
          this.category = val ? this.allCategories[0] : {};
          this.index = 0;
          this.justOnce = false;
        }
      },
    },
  },
  mounted() {
    this.initCategory();
    // $(this.$refs.category_settings).on(
    //   "hidden.bs.modal",
    //   this.resetCategorySettings
    // );
    $("#caManage").on("show.bs.modal", () => {
      this.labelList = JSON.parse(JSON.stringify(this.allCategories));
      this.labelList.forEach((item, index) => {
        item.orderNum = index + 1;
      });
    });

    this.isMounted = true;
  },
};
</script>

<style lang="scss" scoped>
.flex {
  display: flex;
}
// .ant-btn{
//   width: 100%;
// }
.btn-outline-light {
  color: black;
  // background-color: transparent;
  // background-image: none;
  border-color: black;
}
.label-color {
  color: black;
}
// .list-group-item {
//   height: 22px;
//   font-size: 13px;
//   padding: 2px;
//   background-color: #4b5162;
// }

.category-icon {
  display: block;
  float: left;
  margin: 0;
  padding: 5px 10px 5px 10px;
}

.btn-link {
  margin: 0;
  padding: 0;
}
.annotation-icon {
  margin: 0;
  padding: 3px;
}

.card-header {
  display: block;
  margin: 0;
  padding: 0;
}

.card {
  background-color: #404552;
}

.annotation-search {
  width: 100%;
  height: 18px;
  color: black;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  text-align: center;
  border-radius: 4px;
}
.checkedBoxStyle {
  margin-bottom: 8px;
  color: black;
}

.ca-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  & > h3 {
    color: black;
    font-size: 16px;
    font-weight: 700;
  }
}
.ca-margin {
  align-items: center;
  margin: 8px 0;
  .label-select {
    flex: 1;
    padding-top: 0;
    padding-bottom: 0;
    font-size: 14px;
    height: calc(1.8125rem + 3px);
  }
}

.ca-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.label-list {
  margin: 16px 0;
  display: grid;
  grid-gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  // max-height: 232px;
  // overflow: auto;
}

a.aButton-style {
  color: #1890ff !important;
  font-size: 14px;
  &.disabled-link {
    color: rgba(0, 0, 0, 0.25) !important; /* 改变颜色表示禁用状态 */
    text-decoration: none; /* 移除下划线 */
    cursor: not-allowed; /* 禁用点击事件 */
  }
}

.font-size14 {
  font-size: 14px;
}

.toggle-annotation-show {
  margin: 10px 0 0 0;
  text-align: right;
  .annotation-btn {
    height: 30px;
    padding: 0 5px;
  }
}

::v-deep .ant-table-scroll {
  border-radius: 0;
}
::-webkit-input-placeholder {
  /* WebKit, Blink, Edge */

  color: lightgray;
}
:-moz-placeholder {
  /* Mozilla Firefox 4 to 18 */
  color: lightgray;
  opacity: 1;
}
::-moz-placeholder {
  /* Mozilla Firefox 19+ */
  color: lightgray;
  opacity: 1;
}
:-ms-input-placeholder {
  /* Internet Explorer 10-11 */
  color: lightgray;
}
::-ms-input-placeholder {
  /* Microsoft Edge */
  color: lightgray;
}
::placeholder {
  /* Most modern browsers support this now. */
  color: lightgray;
}
</style>
