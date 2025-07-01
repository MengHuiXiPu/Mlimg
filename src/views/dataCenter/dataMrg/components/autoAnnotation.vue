<template>
  <a-modal
    :visible="visible"
    title="自动标注数据集"
    @ok="handleOk"
    @cancel="handleCancel"
    :maskClosable="false"
    width="800px"
  >
    <a-form-model
      ref="ruleForm"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
      layout="horizontal"
      :model="formData"
      :rules="formRules">
      <a-form-model-item label="数据集类型" class="margin-bottom-5">
        <!-- <span>{{ recordData.dlTagType }}</span> -->
        <a-select v-model="recordData.dlTagType" disabled>
          <a-select-option value="分类" >{{ '分类' }}</a-select-option>
          <a-select-option value="分割" >{{ '分割' }}</a-select-option>
          <a-select-option value="目标检测" >{{ '目标检测' }}</a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item label="智能标注方式" class="margin-bottom-5" prop="annotationMode">
        <a-radio-group v-model="formData.annotationMode">
          <a-radio value="auto">自动标注</a-radio>
        </a-radio-group>
      </a-form-model-item>
      <a-form-model-item label="自动标注模型" prop="modelId" class="margin-bottom-5">
         <!-- 智能标注模型选择 -->
        <!-- <load-select class="selectModel" size="mini" placeholder="请选择模型" style="width: 80%"
          v-model="autoModelSelectConfig.selectedModelId" :valueObj.sync="autoModelSelectConfig.selectedModel"
          :data="autoModelSelectConfig.modelList" :dictComposeLabel="'imageTagType'" :dictLabel="'modelName'"
          :page="autoModelSelectConfig.pageNo" :hasMore="autoModelSelectConfig.hasMore" :request="getAutoModelData"
          ref="refSelectAutoModel">
        </load-select> -->
        <a-select v-model="formData.modelId" show-search :filter-option="filterOption">
          <a-select-option :value="model.id" v-for="model in modelList" :key="model.id">{{ `${model.modelName}(${model.imageVersionLabel})-${model.imageTagType}` }}</a-select-option>
        </a-select>
        <div style= "color: #E6A23C;font-size: 13px;">选择训练成功的模型为标注模型，标注效果将依赖于模型本身的效果</div>
      </a-form-model-item>
      <a-form-model-item label="标注范围选择" prop="annotationRange" class="margin-bottom-5">
        <a-radio-group v-model="formData.annotationRange" @change="annotationRangeChange">
          <a-radio :value="item.value" v-for="item in annotationRangeList" :key="item.value" > {{ item.label }}</a-radio>
        </a-radio-group>
        <div class="label-checkbox-area" v-if="[1,2].includes(formData.annotationRange)">
          <!-- 全选，反选控制 -->
          <div style="text-align: right;" v-if="labelDetailList.length">
            <a-button @click="selectAllLabel" type="link">全选</a-button>
            <a-button @click="selectAllLabel('reverse')" type="link">反选</a-button>
          </div>
          <a-checkbox-group v-model="formData.selectedLabels" :options="labelDetailList" @change="selectedLabelChange"/>
        </div>
        <div v-else style= "color: #E6A23C;font-size: 13px;">将对数据集中的所有未标注图片进行标注</div>
      </a-form-model-item>
      
      <a-form-model-item label="标注信息设置" prop="annotationType" class="margin-bottom-5">
        <a-radio-group v-model="formData.annotationType">
          <a-radio :style="radioStyle" :value="0">清理已存在所有标注信息，并替换新的标注结果</a-radio>
          <a-radio :style="radioStyle" :value="1" v-if="recordData.dlTagType !='分类'">保留原来的标注信息，并叠加新的标注结果</a-radio>
          <a-radio :style="radioStyle" :value="2" v-if="recordData.dlTagType !='分类'">保留已有图片标签信息，新增标注框的信息，新生成标注框的标签复用图片已有标签信息</a-radio>
        </a-radio-group>
      </a-form-model-item>
      <!-- <a-form-model-item label="是否新增数据集" prop="subType" class="margin-bottom-5">
        <a-radio-group v-model="formData.subType">
          <a-radio value="0">在当前数据集上标注</a-radio>
          <a-radio value="1">新增数据集并标注</a-radio>
        </a-radio-group>
      </a-form-model-item> -->
    </a-form-model>
    <!-- 底部按钮 -->
    <template slot="footer">
      <a-button key="back" @click="handleCancel">取消</a-button>
      <a-button key="submit" type="primary" :loading="confirmLoading" @click="handleOk">开始标注</a-button>
      <!-- <a-button key="create" @click="handleCancel">创建并标注</a-button> -->
    </template>
  </a-modal>
</template>

<script>

// import { validateName } from "@/utils"
import { getModelTableList, getFileCategoryAndCount } from "@/api/modelManage";
// import loadSelect from "@/components/LoadSelect/index.vue";
import { getSingleDataListDetailById, autoAnnotation } from "@/api/dataCenter";
export default {
  name: "autoAnnotationModal",
  components: {
    // loadSelect,
  },
  data() {
    const validRange = (rule, value, callback) => {
      // 选择已标注/未标注时，必须勾选具体label
      if (value === 1 || value === 2) {
        if (this.formData.selectedLabels?.length === 0) {
          callback(new Error("请至少选择一个标签"));
        } else {
          callback();
        }
      } else {
        callback();
      }
    };
    return {
      confirmLoading: false,
      recordData: {},   //数据集数据record
      // labelDetailList: [], //数据集的标签数以及对应的图片数，标注数信息
      allLabelsDetail: [], //所有label明细
      markedLabelsDetail: [], //已标注的按照label明细
      unmarkedLabelsDeatil: [], //未标注的按照label明细

      radioStyle: {
        display: 'block',
        // height: '30px',
        lineHeight: '38px',
      },
      // 自动标注 模型选择组件的配置项
      // autoModelSelectConfig: {
      //   selectedModelId: '',
      //   selectedModel: {},
      //   pageNo: 1,
      //   modelList: [],
      //   hasMore: true
      // },
      formData: {
        selectedLabels: [],
        annotationMode: "auto", //只能标注方式
        annotationRange: 1, //标注范围选择
        annotationType: 0, //标注信息设置
        modelId: null,
        dlId: null,
      },
      formRules: {
        annotationRange: [
          { required: true, trigger: "change", message: "请选择标注范围" },
          { validator: validRange, trigger: "change" }
        ],
        annotationType: [{ required: true, message: "请选择标注信息设置" }],
        modelId: [{ required: true, message: "请选择标注模型", trigger: "change" }]
      },
      annotationRangeList: [
        { label: "标注未标注的图片", value: 1 },
        { label: "标注已标注的图片", value: 2 },
        { label: "标注所有图片", value: 3 }
      ],
      modelList: [], // 自动标注模型列表
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
  },
  computed: {
    // 根据选择的标注范围，显示不同的标签label
    labelDetailList() {
      const list = [this.unmarkedLabelsDeatil, this.markedLabelsDetail, this.allLabelsDetail,]
      return list[this.formData.annotationRange - 1]
    }
  },
  methods: {
    // 按照产品设计，范围是已标注时，将下面的label全都勾选，标注范围是未标注时，将下面的label全部不勾选
    annotationRangeChange() {
      if (this.formData.annotationRange === 1) {
        this.formData.selectedLabels = this.labelDetailList.map(item => item.value)
      } else {
        this.formData.selectedLabels = []
        // 移除默认的range校验(因为全都不勾选是默认行为) 又要默认全都不能勾选，又要必须选择，难啊
        this.$nextTick(() => {
          this.$refs.ruleForm.clearValidate("annotationRange");
        });
      }
    },
    // 勾选label变化时，手动触发range校验
    selectedLabelChange() {
      this.$refs.ruleForm.validateField("annotationRange");
    },
    // 全选/反选
    selectAllLabel(flag) {
      if (flag === "reverse") {// 反选
        const selectedLabels = new Set(this.formData.selectedLabels);
        this.formData.selectedLabels = this.labelDetailList
          .filter(item => !selectedLabels.has(item.value))
          .map(item => item.value);
      } else {
        this.formData.selectedLabels = this.labelDetailList.map(item => item.value)
      }
      // 触发range校验
      this.selectedLabelChange()
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
    handleOk() {
      this.$refs.ruleForm.validate(async (valid, obj) => {
        if (!valid) return false
        try {
          this.confirmLoading = true
          const { modelId, annotationRange, annotationType, dlId, selectedLabels } = this.formData
          const params = {
            modelId,
            dlId,
            annotationRange,
            annotationType,
            selectedLabels,
            // targetPictureIds: [],
            // preservePrevAnnos: false,
          }
          // console.debug(params)
          const res = await autoAnnotation(params)
          this.confirmLoading = false
          if (res.code == 0) { //
            this.$message.success("标注任务已启动")
            this.handleCancel({}, true)
          }
        } catch (error) {
          console.log(error)
          this.confirmLoading = false
        }
      })
    },
    handleCancel($event, refreshFlag) {
      this.$emit("update:visible", false)
      if (refreshFlag) {
        this.$emit('refreshList')
      }
    },
    // 查询数据集图片数，已标注数等信息
    // 查询标签以及标签下的图片数,标注数
    async fetchData() {
      const { id } = this.recordData
      Promise.all([
        // getSingleDataListDetailById(id),
        getFileCategoryAndCount({
          id,
          markRange: 0, //查询所有
          reviewRange: 0
        }),
        getFileCategoryAndCount({
          id,
          markRange: 1, //查询已标注label情况
          reviewRange: 0
        }),
        getFileCategoryAndCount({
          id,
          markRange: 2, //查询未标注label情况
          reviewRange: 0
        }),
        getModelTableList({
          limit: 10000,
          pageNo: 1,
          modelName: '',
          modelType: 1,  //通用模型
          tagType: this.recordData.dlTagType || "", //模型类别
          taskStatus: 2  //已完成训练的模型
        })
      ]).then(res => {
        if (res[0].code === 0 && res[1].code === 0 && res[2].code === 0 && res[3].code === 0) {
          const [allLabelsDetail, markedLabelsDetail, unmarkedLabelsDeatil, modelList] = res

          this.allLabelsDetail = allLabelsDetail.data.DataListCategory.map((item, index) => {
            return {
              value: item,
              label: `${item}(${allLabelsDetail.data.DataListCategoryNum[index]})`,
              // picNum: res.data.DataListCategoryNum[index],
            }
          })
          this.markedLabelsDetail = markedLabelsDetail.data.DataListCategory.map((item, index) => {
            return {
              value: item,
              label: `${item}(${markedLabelsDetail.data.DataListCategoryNum[index]})`,
              // picNum: res.data.DataListCategoryNum[index],
            }
          })
          this.unmarkedLabelsDeatil = unmarkedLabelsDeatil.data.DataListCategory.map((item, index) => {
            return {
              value: item,
              label: `${item}(${unmarkedLabelsDeatil.data.DataListCategoryNum[index]})`,
              // picNum: res.data.DataListCategoryNum[index],
            }
          })
          // 设置标注范围选项中的数量
          this.annotationRangeList.forEach((item, index) => {
            if (index == 0) {  //未标注
              item.label = `${item.label}(${markedLabelsDetail.data.sum[0] - markedLabelsDetail.data.sum[1]}张)`
            } else if (index == 1) {  //已标注
              item.label = `${item.label}(${markedLabelsDetail.data.sum[1]}张)`
            } else {  //全部
              item.label = `${item.label}(${markedLabelsDetail.data.sum[0]})张`
            }
          })
          //赋值自动标注模型列表
          this.modelList = modelList.data.records
          // 因为annotationRange默认勾选已标注，按照产品要求，将其下所有label都勾选上
          this.formData.selectedLabels = this.labelDetailList.map(item => item.value)
        }
      })
    },
    initState(record = {}) {
      this.recordData = record
      this.formData.dlId = record.id
      this.fetchData()
    },
    // 获取自动标注算法
    // getAutoModelData({ page = 1, more = false, keyword = '' } = {}) {
    //   return new Promise((resolve, reject) => {
    //     getModelTableList({
    //       limit: 10,
    //       pageNo: page,
    //       modelName: keyword.trim(),
    //       modelType: 1,  //通用模型
    //       tagType: this.recordData.dlTagType || "", //模型类别
    //       taskStatus: 2  //已完成训练的模型
    //     }).then((res) => {
    //       if (res.code != 0) {
    //         reject()
    //         return
    //         // return this.$message.error('加载失败')
    //       }
    //       if (more) {  // 如果是加载更多，则合并之前的数据
    //         this.autoModelSelectConfig.modelList = [...this.autoModelSelectConfig.modelList, ...res.data.records];
    //       } else {
    //         this.autoModelSelectConfig.modelList = res.data.records
    //       }
    //       // 更新pageNo
    //       this.autoModelSelectConfig.pageNo = page
    //       // 判断hasMore的值
    //       this.autoModelSelectConfig.hasMore = res.data?.total > this.autoModelSelectConfig.modelList.length
    //       resolve()
    //     }).catch(e => {
    //       this.$message.error(e?.response?.data?.msg || e?.response?.data?.message)
    //       reject(e?.response?.data)
    //     })
    //   })
    // },
  },
}
</script>

<style lang="less" scoped>
.margin-bottom-5 {
  margin-bottom: 5px;
}
.label-checkbox-area {
  // margin-left: 150px;
  // padding: 10px 5px;
  padding-left: 20px;
  border-radius: 5px;
  background: #f6f7fa;
}
// .create-model-form {
//   ::v-deep .ant-form-item{
//     margin-bottom: 15px;
//   }
//   ::v-deep .ant-input-group-addon{
//     border: none;
//     background-color: transparent;
//   }
// }
</style>