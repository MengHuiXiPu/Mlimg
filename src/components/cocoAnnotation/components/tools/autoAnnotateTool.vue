<template>
  <div>
    <!-- <div class="mb-8" style="display: none">
      <a-button
        type="ghost"
        class="lineBtn"
        size="small"
        :disabled="taskId !== ''"
        @click="openModal"
      >
        <span>自动</span><br />
        <span>标注</span>
      </a-button>
    </div> -->
  </div>
</template>

<script>
import axios from "axios";
import { mapMutations, mapState } from "vuex";
import { getPictureFileIds, getPicture } from "@/api/modelManage";
import { fetchDataConcurrently } from "@/components/cocoAnnotation/libs/config";
import {
  getPictureIdPageList,
  getSingleDataListDetailById,
} from "@/api/dataCenter";
import { getSystemConfig } from "@/api/dataCenter";
export default {
  name: "AutoAnnotateTool",
  inject: ["modalInstance"],
  data() {
    return {
      selectedModel: "",
      mode: "segment",
      // modelAllList: [],
      currentJustOnce: true,
      // taskId: "",
      timer: null,
      // columns: [
      //   {
      //     title: "模型名称",
      //     dataIndex: "modelName",
      //     key: "modelName",
      //     width: "40%",
      //   },
      //   {
      //     title: "算法模板",
      //     dataIndex: "imageName",
      //     key: "imageName",
      //   },
      // ],
      // keyword: "",
      // 这个应该是存储 在一次标注中，标注完成后会更新缩略图，更新过的记录在这里
      idList: [],
      // 标注过程中，每次轮询查到的完成标注的图片id，每次轮询要update，启动标注任务要清空
      finishedPicturesIds: [],
      annotaingModel: [],
    };
  },
  computed: {
    ...mapState({
      taskId: (state) => state.annotator.taskId,
    }),
    // filterModelList() {
    //   // const modeMap = {
    //   //   segment: "目标检测",
    //   //   label: "分类",
    //   // };
    //   if (this.annotaingModel.includes(this.$store.state.user.user.username)) {
    //     let modifiedModelAllList = [];
    //     this.modalInstance.modelAllList.map((currentModel) => {
    //       // 克隆当前元素，以防止直接修改原数组
    //       let modifiedModel = { ...currentModel };
    //       // 检查 modelName 是否为 "autolabel_cls" 或 "autolabel_seg"
    //       if (modifiedModel.modelName === "autolabel_cls") {
    //         // 修改 modelName 为 "分类标注"
    //         modifiedModel.modelName = "分类标注";
    //         modifiedModelAllList.push(modifiedModel);
    //       } else if (modifiedModel.modelName === "autolabel_seg") {
    //         // 修改 modelName 为 "分割标注"
    //         modifiedModel.modelName = "分割标注";
    //         modifiedModelAllList.push(modifiedModel);
    //       }
    //     });
    //     return modifiedModelAllList.filter(
    //       (item) => item.modelName.indexOf(this.keyword) > -1
    //     );
    //   }
    //   return this.modalInstance.modelAllList.filter(
    //     (item) => item.modelName.indexOf(this.keyword) > -1
    //   );
    // },
  },
  watch: {
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
              if (info.taskType === 1) {
                info.tagType === "分类" ? this.handleLabelResult({annotateTarget, targetPictureIds : info.targetPictureIds }) : this.handleResult({annotateTarget });
                this.$parent.setAnnotatingConfig(info)  
              }
              return;
            });
        }
      },
      immediate: true
    },
    "modalInstance.isShow": {
      handler(val) {
        // 当窗口被关闭时，停掉轮询
        if (!val) {
          this.timer && clearTimeout(this.timer);
        }
      },
    },
  },
  methods: {
    ...mapMutations(["modifyGroupLoading", "setTaskId", "clearLoading"]),
    // 执行自动标注
    async autoAnnotating(type, selectedModel = {}) {
      this.selectedModel = selectedModel
      this.$parent.save();
      this.$parent.annotatingInfo = false  //清空标注任务进度信息
      this.globalLoading = this.$loading({
        lock: true,
        text: '启动中',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.4)'
      });
      let targetPictureIds = [];
      if (type == "cur") {
        targetPictureIds.push(this.$parent.image.id);
      } else if (type == "all") {
        if(this.modalInstance.annotateTargetIds ) {
          targetPictureIds = this.modalInstance.annotateTargetIds
        }else { //去接口查询

        const params =
          this.modalInstance.datasetId + "_" + this.modalInstance.selectMenu;
        const idsRes = await getPictureFileIds(params, 2); //获取图片列表id
        // 记录idsRes,后续都不再调用接口(某些分类模型算法会导致selectMenu丢失，ids为空) 罗哥要求先这样实现
        if(this.selectedModel.imageTagType==='分类') {  //跑了自动分类模型时，就需要记录 annotateTargetIds了，否则都从后端取就可以
          this.modalInstance.addAnnotateTargetIds(idsRes.data || [])
        } 
        targetPictureIds = idsRes.data;
      }
      }
      axios
        .post(`/api/v1/datacenter/autoAnnotator/autoAnnotateWithModel`, {
          modelId: this.selectedModel.id,
          dlId: this.$parent.dataset.id,
          targetPictureIds: targetPictureIds,
          preservePrevAnnos:
            this.$parent.selectedAnnotationOption !== "replace", // 是否保留原有标注
        })
        .then((res) => {
          if (res.code == -1) {
            // this.$message.warning(res.msg);
            return;
          }
          if (res.data?.status === 1) {
            if (type == "cur") {
              this.modifyGroupLoading(targetPictureIds);
            } else if (type == "all") {
              // 设置全部loading
              this.modifyGroupLoading(
                this.modalInstance.processPictureList.map((item) => item.id)
              );
            }
            // this.taskId = res.data.id;
            this.setTaskId(res.data.id);
            this.idList = []
            const imageTagType = this.selectedModel.imageTagType;
            this.finishedPicturesIds = []
            if (imageTagType === "分类") {
              this.handleLabelResult({ annotateTarget: type, targetPictureIds });
            } else {
              this.handleResult({ annotateTarget: type });
            }
          }else {
            this.$message.error(res.msg || res?.data?.msg);
          }
        }).catch(e => { 
          this.$message.error(e.response?.data?.msg);
        })
        .finally(() => {this.globalLoading.close()});
    },
    // 处理分割自动标注结果
    async handleResult( { annotateTarget }) {
      this.timer && clearTimeout(this.timer)
      // 获取数据集详情，主要是获取自动标注任务状态，根据状态，来判断是否继续轮询。
      const datasetDetail = await getSingleDataListDetailById(
        this.$parent.dataset.id
      );
      // 查询进度信息以及哪些图片正在标注，哪些已经标注完成
      // 需要注意的是，停止标注任务后，会清空taskId,导致这里无taskId报错
      const processData = await axios.get(`/api/v1/datacenter/dataListAutoMarkTaskInfo/${this.taskId || datasetDetail?.data?.markTaskId}`)
      // 正在标注中的图片id，非正在标注的既是标注完成的
      const pendingPictureIds = processData?.data?.pendingPictureIds || []
      const targetPictureIds = processData?.data?.targetPictureIds || []
      // diff出完成标注的图片ids
      const finishedPicturesIds = targetPictureIds.filter(targetId => !pendingPictureIds.includes(targetId))
      // 更新已完成标注的缩略图
      finishedPicturesIds.forEach((ele, index) => {
        if (!this.idList.includes(ele)) {
          getPicture(ele, "thumbnail_with_bbox").then((res) => {
            const url = window.URL.createObjectURL(res);
            // ele.url = url;
            this.modalInstance.pictureLoadList.forEach((item) => {
              if (item.id === ele) {
                this.$set(item, "url", url);
              }
            });
            // this.$set(this.modalInstance.pictureLoadList[index], "url", url);
            this.$set(this.modalInstance.pictureLoadMap, ele, url);
            this.idList.push(ele);
          });
        }
      });
      // 更新loading
      this.modifyGroupLoading(pendingPictureIds);
      // 需要注意的是currentImageId是随时都可能变的(用户会在标注期间切换focus图片)，所以不能为了避免重复调用getData方法来用之前的currentJustOnce标志位变量来控制
      const currentImageId = this.$parent.image.id;
      // 当前显示的图片是否有标注结果了
      const hasCurrentResult = finishedPicturesIds.includes(currentImageId);
      // 
      const hasPrevResult = this.finishedPicturesIds.includes(currentImageId)
      // console.log('当前focus图是否在本次轮训标注完，是否在之前的轮训标注完',hasCurrentResult, hasPrevResult)
      if (hasCurrentResult && !hasPrevResult) { //当前focus图是本次轮训发现标注完成的，则$parent.getData()进行查询
        console.log('发起查询这张图片标注信息：', currentImageId)
        // 重新获取当前图片信息及标注
        this.$parent.getData();
      }
      // 更新记录本次轮训后完成标注的图片ids
      this.finishedPicturesIds = finishedPicturesIds
      // autoMarkTaskStatus: 1 进行中  2 已完成  3错误
      if (datasetDetail.data.autoMarkTaskStatus !== 1) {
        // 关掉所有loading
        this.clearLoading();
        if (this.timer) {
          clearTimeout(this.timer);
        }
        // this.taskId = "";
        this.setTaskId("");
        this.idList = [];
        this.$parent.annotatingInfo = `${datasetDetail.data?.autoMarkTaskStatusMessage}`
        return;
      }else { //标注进行中
        this.$parent.annotatingInfo = `${datasetDetail.data?.autoMarkTaskStatusMessage}，已完成标注：${processData?.data?.finished}/${processData?.data?.total}`
      }
      // 轮询
      this.timer = setTimeout(() => {
        this.handleResult(...arguments);
      }, 3000);
    },
    // 处理分类自动标注的结果
    async handleLabelResult({ annotateTarget, targetPictureIds=[] }) {
      // 获取数据集详情，主要是获取自动标注任务状态，根据状态，来判断是否继续轮询。
      const datasetDetail = await getSingleDataListDetailById(
        this.$parent.dataset.id
      );
      if (datasetDetail.data.autoMarkTaskStatus !== 1) {
        // 关掉所有loading
        this.clearLoading();
        if (this.timer) {
          clearTimeout(this.timer);
        }
        // 重新获取当前图片信息及标注
        this.$parent.getData();
        this.setTaskId("");
        this.$parent.annotatingInfo = `${datasetDetail.data?.autoMarkTaskStatusMessage}`
        return;
      }else {
        // 设置全部loading(用户点击切换图片会导致改图片loading消失),分类算法不需要根据进度更新单张缩略图状态
        // 分类算法，标注所有
        if(annotateTarget ==='all') {
          this.modifyGroupLoading(targetPictureIds);
        }
        // 标注全部时更新标注进度提示信息
        axios.get(`/api/v1/datacenter/dataListAutoMarkTaskInfo/${this.taskId || datasetDetail?.data?.markTaskId}`).then(res => {
          if(datasetDetail.data?.autoMarkTaskStatus == 1) {
            this.$parent.annotatingInfo = `${datasetDetail.data?.autoMarkTaskStatusMessage}，已完成标注：${res.data?.finished}/${res.data?.total}`
          }else {
            this.$parent.annotatingInfo = `${datasetDetail.data?.autoMarkTaskStatusMessage}`
          }
        });
      }
      // 轮询
      this.timer = setTimeout(() => {
        this.handleLabelResult(...arguments);
      }, 3000);
    },
    // 获取自动标注模型用户
    async getAnnotaingModel() {
      // 提示标注状态工具栏 配置
      const res = await getSystemConfig({ keyName: "auto_annotating_model" });
      if (res.code == "0" && res.data?.valueInfo) {
        this.annotaingModel = res.data?.valueInfo.split(",");
      }
    },
    /**
     * @public
     */
    removeTimer() {
      this.timer && clearTimeout(this.timer);
    }
  },
  created() {
    this.getAnnotaingModel();
  },
};
</script>

<style lang="less" scoped>
// .lineBtn {
//   height: auto;
//   &:disabled {
//     color: white;
//   }
//   &:not(:disabled) {
//     &:hover {
//       color: #2ecc71;
//       border-color: #2ecc71;
//     }
//     &:focus {
//       color: #2ecc71;
//       border-color: #2ecc71;
//     }
//   }
// }
.mb-8 {
  margin-bottom: 8px;
}
</style>
