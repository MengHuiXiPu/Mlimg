<template>
  <a-modal
    :visible="isShow"
    wrap-class-name="full-modal"
    :footer="null"
    :mask="false"
    :maskClosable="true"
    :destroyOnClose="true"
    :zIndex="990"
    @cancel="close"
  >
    <div slot="title">
      <div class="vertical-center">
        <strong class="title-style"> RPA标注  </strong>
      </div>
    </div>
    <!-- 因为绑定了key： focusid，导致每次切换图片  都会触发 hook:mounted-->
    <Annotator
      id="rpaAnnotator"
      ref="rpaAnnotator"
      :key="focusId"
      :rpaId="rpaId"
      :identifier="focusId"
      :imageUrl="getImageUrl"
      :currentArgs="currentArgs"
      :pictureList="pictureList"
      @clear-args="handleSaveUpdate"
      @save-args="handleSaveUpdate"
      @delete-category="handleDeleteOpInstance"
      @hook:mounted="annotatorMounted"
      @focus-image="handleImgFocus"
    >
      <template #pictureAction>
        <div class="picture-act">
          <a-upload
            name="file"
            :showUploadList="false"
            :action="uploadUrl"
            :data="{ projectId: rpaId }"
            :headers="{ Authorization: getToken() }"
            :multiple="false"
            @change="uploadOnChange"
          >
            <a-button> <a-icon type="upload" /> 点击上传 </a-button>
          </a-upload>
          <a-button  :disabled="!focusId"  @click="handleDeletePicture" style="flex: 1; margin-left: 8px">删除</a-button>
        </div>
      </template>
      <template #pictureList>
        <div class="right-panel shadow-lg img-list">
          <div
            class="img-box"
            :class="{ 'focus-style': focusId === item.id }"
            v-for="item in pictureList"
            :key="item.id"
            @click="handleFocus(item)"
            :ref="`pictureDiv-${item.id}`"
          >
            <img :id="'pic_' + item.id" :src="imgSrc(item)" />
          </div>
        </div>
      </template>

      <template #opGroupList>
        <select
          v-model="opGroupId"
          placeholder="请选择算子组实例"
          class="form-control op-group-select"
          :disabled="opGroupList.length === 0"
          @change="handleSelectChange"
        >
          <option v-for="option in opGroupList" :key="option.id" :value="option.id">{{ option.name }}</option>
        </select>
      </template>
      <template #bindOpGroup>
        <a-button block @click="isAddOpShow = true" style="margin-bottom: 16px">算子组标注</a-button>
      </template>
      <!-- 标注结果显示区 -->
      <template #outputArgs>
        <p v-show="opGroupId" style="color: #4b5162">标注参数如下：</p>
        <li
          v-show="opGroupId"
          v-for="item in currentArgs"
          :key="item.id"
          class="outputArgs"
        >
          <span>{{ `${item.operator}:  ` }}</span>
          <div v-if="item.labelingType !== 'template'" style="text-align: left">
            <div v-for="(val, key, index) in item.value" :key="index">
              <span>{{ key }}</span
              >:<span>{{ val || "--" }}</span>
            </div>
          </div>
          <div style="flex: 1" v-else>
            <img style="width: 100%" v-if="argsUrl" :src="argsUrl" />
          </div>
        </li>
      </template>
    </Annotator>
    <a-modal
      title="关联算子组"
      :visible="isAddOpShow"
      :closable="false"
      :mask="false"
      :maskClosable="false"
      :keyboard="false"
      :destroyOnClose="true"
      :zIndex="1000"
      @ok="associateOpGroup"
      @cancel="handleOpGroupFormCancel"
    >
      <a-form-model
        ref="OpGroupForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        layout="horizontal"
        :model="rowOpGroupData"
        :rules="OpGroupFormRules"
      >
        <a-form-model-item label="算子组实例名称" prop="name">
          <a-input v-model="rowOpGroupData.name" />
        </a-form-model-item>
        <a-form-model-item label="算子组模板" prop="opGroupId">
          <a-select v-model="rowOpGroupData.opGroupId" placeholder="please select operator group" >
            <a-select-option
              v-for="item in opGroupTemplateList"
              :key="item.id"
              :value="item.id"
            >
              {{ item.name }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
      </a-form-model>
    </a-modal>
  </a-modal>
</template>

<script>
import RPA from "@/api/rpa";
import Operator from "@/api/operator";
import Annotator from "../cocoAnnotation/Annotator.vue";
import renderSvg from "../cocoAnnotation/mixins/renderSvg";
import { getToken } from "@/utils/auth";
import { convertToCoordinates } from "../cocoAnnotation/libs/config";

export default {
  name: 'RpaModel',
  props: {
    isShow: {
      type: Boolean,
      default: false,
    },
    rpaId: {
      type: [Number, Boolean],
      default: null,
    },
  },
  components: {
    Annotator,
  },
  mixins: [renderSvg],
  data() {
    return {
      isAddOpShow: false,
      backendStatus: "Hello Annotation",
      focusId: null,
      opGroupId: "",    // 选中的算子组实例id
      opGroupList: [],  //算子实例下拉列表
      // 选中算子实例后，对应的各算子信息
      currentArgs: [],
      imageUrl: "",
      // confirmPictureList: [],
      pictureList: [],
      opGroupTemplateList: [],
      uploadUrl: "/api/v1/pipelinecenter/rpaLabelingImage/create",
      rowOpGroupData: {
        name: "",
        opGroupId: "",
      },
      OpGroupFormRules: {
        name: [
          {
            required: true,
            message: "请输入算子组实例名称",
            trigger: "blur",
          },
        ],
        opGroupId: [
          {
            required: true,
            message: "请选择算子祖模板",
            trigger: "change",
          },
        ],
      },
      picIdUrlMap: {},
      argsUrl: "",
      // mountedIndex: 0,
    };
  },
  computed: {
    getImageUrl() {
      return this.imageUrl || require("@/assets/images/annotatorDefault.png");
    },
  },
  watch: {
    isShow(val) {
      if (val) {
        this.getPictureList(true);
        this.getOpGroupList();
        // 获取算子组列表供备用。
        Operator.getOperatorGroupTemplateList({
          pageNo: 1,
          limit: 1000,
        }).then((res) => {
          this.opGroupTemplateList = res.data.records;
        });
      } else {
        this.focusId = null;
        this.imageUrl = "";
        this.opGroupId = "";
      }
    },
    // focusId(val) {
    //   if (val && this.opGroupId) {
    //     this.handleSelectChange();
    //   }
    // },
  },
  provide() {
    return {
      modalInstance: this,
    };
  },
  methods: {
    getToken,
    // url
    imgSrc(item) {
      return item.url || require("@/assets/images/place.gif");
    },
    base64ToImageUrl(base64String) {
      // 构建data URL
      const imageUrl = `data:image/jpeg;base64,${base64String}`;
      return imageUrl;
    },
    uploadOnChange(args) {
      // console.log(file);
      if (args.file.response && args.file.response.success) {
        this.getPictureList();
      }
    },
    getPictureList(isFirst = false) {
      RPA.getListByProjectId(this.rpaId).then((res) => {
        this.pictureList = res.data || [];
        if (this.pictureList.length) {
          let onceFlag = true;
          this.pictureList.forEach(async (ele) => {
            if (!this.picIdUrlMap[ele.id]) {
              const res = await RPA.getImage(ele.id);
              const url = this.base64ToImageUrl(res.data);
              this.$set(ele, "url", url);
              this.$set(this.picIdUrlMap, ele.id, url);
            } else {
              this.$set(ele, "url", this.picIdUrlMap[ele.id]);
            }
            if (isFirst && onceFlag) {
              this.imageUrl = this.pictureList[0].url;
              this.focusId = this.pictureList[0].id;           
              onceFlag = false;
            }
          });
          // 创建一个存放 Promise 实例的数组
          // const promises = this.pictureList.map((ele) => {
          //   if (!this.picIdUrlMap[ele.id]) {
          //     return RPA.getImage(ele.id).then((res) => {
          //       const url = this.base64ToImageUrl(res.data);
          //       this.$set(ele, "url", url);
          //       this.$set(this.picIdUrlMap, ele.id, url);
          //     });
          // } else {
          //   this.$set(ele, "url", this.picIdUrlMap[ele.id]);
          // }
          // });

          // // 使用 Promise.all 等待所有的 Promise 实例完成
          // Promise.all(promises).then(() => {
          //   if (isFirst) {
          //     this.imageUrl = this.pictureList[0].url;
          //     this.focusId = this.pictureList[0].id;
          //   }
          // });
        } else {
          this.focusId = null;
          this.imageUrl = "";
        }
      });
    },
    /**
     * 获取算子实例列表
     */
    getOpGroupList(callback) {
      Operator.getOperatorList({
        pageNo: 1,
        limit: 1000,
        operatorType: 2,
        rpaLabelingId: this.rpaId,
      }).then((res) => {
        this.opGroupList = res.data.records;
        if (callback != null) callback();
      });
    },
    /**
     * 算子组实例切换
     */
    handleSelectChange() {
      // 切换算子实例的时候必须要清空Compound
      this.clearCompound();
      // 同时必须重新置位current
      this.$refs.rpaAnnotator.current = {
        category: -1,
        annotation: -1,
        keypoint: -1,
      }
      const width = this.$refs.rpaAnnotator.image.raster.width;
      const height = this.$refs.rpaAnnotator.image.raster.height;
      // item：当前选中的算子实例
      const item = this.opGroupList.find((ele) => ele.id === this.opGroupId);
      if(!item) return 
      const label = {
        name: item.name,
        id: item.id,
        color: "FF0000",
      };
      this.currentArgs = item.rpaLabelingDetail.args.map((item, index) => {
        return {
          id: index,
          ...item,
        };
      });
      // 找到template的记录，并获取对应的截图。
      const ele =
        this.currentArgs.find((item) => item.labelingType === "template") || {};
      if (ele.value) {
        this.getScreenshot(ele.value);
      } else {
        this.argsUrl = "";
      }
      const annotations = this.currentArgs.map((item, index) => {
        return {
          id: index,
          defaultValue: JSON.stringify(item.value),
          segmentation:
            item.imageId === this.focusId
              ? convertToCoordinates(item.segmentation || item.value)
              : [], 
          name: item.operator,
          labelingType: item.labelingType,
          color: "FF0000",
          width: width,
          height: height,
          mode: 3,
          // 锁定单个算子，前端默认设为false
          lockValue: item.lockValue || false,

          imageId: item.imageId || null
        };
      });
      
      label.annotations = annotations;
      // this.$refs.rpaAnnotator.$nextTick(() => {
      //   })
      // categories竟然是从这里赋的值
      this.$refs.rpaAnnotator.categories = [].concat(label);
      this.$refs.rpaAnnotator.$forceUpdate()
    },
    // 切换算子实例的时候，清除画框
    clearCompound() {
      // to do
      const annotatorRef = this.$refs.rpaAnnotator;
      // console.log(annotatorRef)
      if (annotatorRef.current.category !== -1) {
        const category =
          annotatorRef.$refs.category[annotatorRef.current.category];
        if(!category) return
        category.$refs.annotation.forEach((ele) => {
          ele.delete();
        });
      }
    },
    // save args 或者 清除args之后，重新获取算子实例列表
    handleSaveUpdate() {
      this.getOpGroupList(this.handleSelectChange);
    },
    handleDeleteOpInstance() {
      this.getOpGroupList(() => {
        this.opGroupId = "";
        this.$refs.rpaAnnotator.categories = [];
      });
    },
    handleDeletePicture() {
      RPA.deleteRpaPic(this.focusId).then(() => {
        this.getPictureList(true);
      });
    },
    // 创建算子组标注实例
    associateOpGroup() {
      this.$refs.OpGroupForm.validate((valid) => {
        if (valid) {
          const data = Object.assign({}, this.rowOpGroupData);
          RPA.createOpGroupInstance(this.rpaId, data).then((res) => {
            this.handleOpGroupFormCancel();
            this.getOpGroupList();
          })
          .catch((e) => {
            console.log(e);
          });
        }
      })
    },
    getScreenshot(path) {
      RPA.downloadScreenshot(this.rpaId, {
        operatorId: this.opGroupId,
        imgPath: path,
      }).then((res) => {
        this.argsUrl = this.base64ToImageUrl(res.data);
      });
    },
    handleOpGroupFormCancel() {
      this.$refs["OpGroupForm"].resetFields();
      this.isAddOpShow = false;
    },
    close() {
      this.$refs.rpaAnnotator.current.annotation = {
        category: -1,
        annotation: -1,
        keypoint: -1,
      }
      this.$emit("update:isShow", false);
    },
    // 切换图片
    handleFocus(item) {
      this.$refs.rpaAnnotator.current = {
        category: -1,
        annotation: -1,
        keypoint: -1,
      }
      this.imageUrl = item.url;
      this.focusId = item.id;
    },
    handleImgFocus(imageId) {
      const item = this.pictureList.find((ele) => ele.id === imageId);
      if(!item || this.focusId == imageId)  return
      const picDiv = this.$refs[`${"pictureDiv-" + imageId}`]
      picDiv && picDiv[0] && picDiv[0].click()
    },
    annotatorMounted() {
      // 在切图之后初始化annotator后，要保留之前的标注显示，同时点中Category。
      if (this.opGroupId) {
        // const indices = {
        //   annotation: -1,
        //   category: 0,
        //   keypoint: -1,
        // };
        this.handleSelectChange();
        setTimeout(() => {
          // 点中第一个category
          const categories = this.$refs.rpaAnnotator?.$refs.category;
          if (categories.length) {
            categories[0].onClick();
          }
        }, 200);
      }
    },
  },
};
</script>

<style lang="less" scoped>
#rpaAnnotator {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: rgba(218, 234, 255, 1); //annotator的底色
  overflow: hidden;
}

.vertical-center {
  display: flex;
  align-items: center;
  .title-style {
    font-size: 22px;
    color: #d9001b;
  }
}
.picture-act {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
.img-list {
  width: 200px;
  padding: 4px;
  overflow: auto;
}

.img-box {
  position: relative;
  width: 100%;
  height: auto;
  padding: 4px;
  cursor: pointer;

  & > img {
    width: 100%;
    height: auto;
  }
}

.focus-style {
  border: 2px solid #ff0000;
}

.outputArgs {
  color: #4b5162;
  display: flex;
  padding: 0 10px;
  margin-bottom: 16px;
  & > span {
    margin-right: 8px;
  }
}

/deep/ .full-modal .ant-modal {
  width: 100% !important;
  height: 100vh;
  top: 0;
  margin: 0;
  padding: 0;
}
/deep/ .full-modal .ant-modal-header {
  border-radius: 0;
  border: none;
  // border-bottom: 1px solid;
  background-color: #bedcff;
}

/deep/ .full-modal .ant-modal-content {
  height: 100vh;
  border-radius: 0;
}

/deep/ .full-modal .ant-modal-body {
  height: calc(100% - 48px);
  padding: 0;
}

/deep/ .full-modal .ant-modal-close-x {
  color: #ffffff;
}
.op-group-select {
  font-size: 14px;
  padding: 3px 10px;
  height: 32px;
}
</style>