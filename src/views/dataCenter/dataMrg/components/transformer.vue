<template>
  <a-modal
    :visible="visible"
    title="转换新数据集"
    @ok="handleOk"
    @cancel="handleCancel"
    :maskClosable="false"
    :confirm-loading="confirmLoading"
    width="850px"
    okText="转换并创建"
  >
    <a-form-model
      ref="ruleForm"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 18 }"
      layout="horizontal"
      :model="formData"
      :rules="formRules">
      <a-form-model-item label="数据类型转换方式" prop="target" class="margin-bottom-0">
        <a-radio-group v-model="formData.target" @change="targetChange">
          <a-radio :value="item.value" v-for="item in transTypeList" :key="item.value"> {{item.label}}</a-radio>
        </a-radio-group>
        <!-- 分类转分割或目标检测时的提示 -->
        <div style= "color: #E6A23C;font-size: 13px;" v-if="formData.source==='classification' &&  ['segmentation', 'detection'].includes(formData.target)">
          分类转换为分割或目标检测数据集，将生成没有标注框的但具备Code的分割或目标检测数据集
        </div>
      </a-form-model-item>
      <!-- 做像素裁剪时 记得includes李添加3 -->
      <a-form-model-item label="裁剪方式" prop="subType" class="margin-bottom-0" v-if="['1','2','4'].includes(formData.subType)">
        <a-radio-group v-model="formData.subType">
          <a-radio value="1" v-if="showSubtype1">按标注内容进行图像裁剪</a-radio>
          <!-- <a-radio value="3" v-if="showSubtype3">按像素裁剪</a-radio> -->
          <a-radio value="2" v-if="showSubtype2">业务裁剪规则</a-radio>
          <a-radio value="4" v-if="showSubtype4">按标注框进行图像裁剪</a-radio>
        </a-radio-group>
        <!-- 裁剪配置  method字段 -->
        <div class="clip-config-content">
          <a-radio-group v-model="formData.method">
            <!-- 仅分割转分类可见 -->
            <template v-if="formData.source === 'segmentation' &&formData.target==='classification' ">
              <a-radio :style="radioStyle" value="original_crop">方式1：对图像中标注形状进行外接矩形截图</a-radio>
              <a-radio :style="radioStyle" value="2">方式2：对图像中标注形状进行外接正方形截图，外接框最小尺寸设置
                <el-select v-model="annotationMethod.method2" size="mini" style="width: 100px">
                  <el-option  label="224" value="224_scale_crop"></el-option>
                  <el-option  label="299" value="299_scale_crop"></el-option>
                </el-select>
                <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                不足尺寸长度边，自动拓宽
              </a-radio>
              <a-radio :style="radioStyle" value="3">方式3：对图像中标注形状进行外接矩形截图，外接框最小尺寸设置 
                <el-select v-model="annotationMethod.method3" size="mini" style="width: 100px">
                  <el-option  label="224" value="224_crop"></el-option>
                  <el-option  label="299" value="299_crop"></el-option>
                </el-select>
                <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                短边自动拓宽，长边等比例拓宽
              </a-radio>
            </template>
            <!-- 仅分割转分割可见 -->
            <a-radio :style="radioStyle" value="cut_t10" v-if="formData.source === 'segmentation' &&formData.target==='segmentation'" >方式1： 针对T10特殊情况的裁剪逻辑
              <a-tooltip title="T10线上推理的图与离线收集的图的尺寸不一致，故对当前收集的图片（包括标注）做对应的裁剪、resize等操作, 使得新生成的数据集的尺寸保持与线上一致。">
                <a-icon type="question-circle-o" style="vertical-align: 1px;"/>
              </a-tooltip>
            </a-radio>
            <!-- 仅目标检测转分类可见 -->
            <a-radio :style="radioStyle" value="cut_rectangle" v-if="formData.source === 'detection' &&formData.target==='classification'">方式1：对图像中标矩形框进行裁剪</a-radio>
          </a-radio-group>
          <div style= "color: #E6A23C;font-size: 13px;" v-if="showSubtype1 || showSubtype4">提示：若一张图包含有多个标注框，则一张图裁剪后将得到多张图片</div>
        </div>
      </a-form-model-item>
      
      <!-- <div class="clip-config-content" style="margin-left:0;padding-leftL: 0;">
        <a-form-model-item label="横向裁剪" prop="subType">
          <span>像素起始点：<a-input-number :min="0" size="small"/></span>
          <span>像素终止点：<a-input-number :min="0" size="small"/></span>
        </a-form-model-item>
        <a-form-model-item label="纵向裁剪" prop="subType">
          
        </a-form-model-item>
      </div> -->

      <a-form-model-item label="新数据集名称" prop="newDlName">
        <a-input :maxLength="50" v-model="formData.newDlName" placeholder="请输入新数据集名称"/>
      </a-form-model-item>
      <a-form-model-item label="新数据集类型" prop="target">
        <a-select v-model="formData.target" >
          <a-select-option :value="val" v-for="(val,type) in typeDict" :key="val" :disabled="val !=formData.target">{{ type }}</a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item label="描述" prop="dlDescribe">
        <a-input v-model="formData.dlDescribe" type="textarea" placeholder="请输入描述信息"  maxlength="512"/>
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
// const dlTagType
// 基于分割数据集，转换并创建新的分类数据集
// import { checkNotSpace } from "@/utils/formValidate.js";
import { validateName } from "@/utils"
import { datasetConvert } from "@/api/dataCenter";
export default {
  data() {
    return {
      confirmLoading: false,
      typeDict: {
        "分类": "classification",
        "分割": "segmentation",
        "目标检测": "detection",
      },
      record: {},   //数据集数据record
      formData: {
        newDlName: '', //新数据集名称
        subType: "1", //裁剪方式
        method: '',  //转换方法
        dlDescribe: '',
        source: "", //源数据集类型
        target: "classification", //目标数据集类型
      },
      // 分割转分类，按标注内容转换时，方式2，方式3每种方式都对应两个转换方法，需要单独配置
      annotationMethod: {
        method2: "224_scale_crop",
        method3: "224_crop",
      },
      radioStyle: {
        display: 'block',
        margin: " 10px 0"
        // height: '30px',
        // lineHeight: '30px',
      },
      formRules: {
        target: [{ required: true, message: "请选择转换类型", trigger: "change" }],
        newDlName: [
          { required: true, trigger: "blur", message: "请输入新数据集名称" },
          { validator: validateName, trigger: ["blur", "change"] }
        ],
        subType: [{ required: true, message: "请选择裁剪方式", trigger: "change" }],
        method: [{ required: true, message: "请选择转换方法", trigger: "change" }],
      },

    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
  },
  computed: {
    // 转换方式列表
    transTypeList() {
      const tranTypeListDict = {
        segmentation: [
          { value: "classification", label: "分割转换为分类" },
          { value: "segmentation", label: "分割转换为分割" },
        ],
        detection: [
          { value: "classification", label: "目标检测转换为分类" },
          // { value: "detection", label: "目标检测转换为目标检测" },
        ],
        classification: [
          { value: "segmentation", label: "转换为分割数据集" },
          { value: "detection", label: "转换为目标检测数据集" },
          // { value: "classification", label: "转换为分类数据集" },
        ]
      }
      return tranTypeListDict[this.typeDict[this.record?.dlTagType]] || []
    },
    // 按标注内容进行图像裁剪：分割转分类显示
    showSubtype1() {
      return this.formData.source === "segmentation" && this.formData.target === "classification"
    },
    // 业务裁剪规则: 分割转分割显示
    showSubtype2() {
      return this.formData.source === "segmentation" && this.formData.target === "segmentation"
    },
    // 按像素裁剪： 分割转分割、目标检测转目标检测、分类转分类显示
    showSubtype3() {
      return this.formData.source === "segmentation" && this.formData.target === "segmentation" ||
        this.formData.source === "detection" && this.formData.target === "detection" ||
        this.formData.source === "classification" && this.formData.target === "classification"
    },
    // 按标注框进行图像裁剪： 目标检测转分类显示
    showSubtype4() {
      return this.formData.source === "detection" && this.formData.target === "classification"
    },
  },
  methods: {
    targetChange() {
      const { source, target } = this.formData
      if (source === "segmentation") {
        // 分割转分割，默认使用业务裁剪规则，分割转分类，默认使用标注内容
        this.formData.subType = target === "segmentation" ? "2" : "1";
        this.formData.method = target === "segmentation" ? "cut_t10" : "original_crop";
      }
      else if (source === "detection") {
        // 目标检测转分类，默认使用标注框裁剪
        this.formData.subType = target === "classification" ? "4" : "3"
        this.formData.method = target === "classification" ? "cut_rectangle" : ""  //按像素裁剪后面再做
      } else if (source === "classification") { //分类有三种转换方式, 都不需要配置methods, 仅分类转分类时需要subType为3： 像素裁剪
        this.formData.subType = target === "classification" ? "3" : ""
        this.formData.method = "";
        // 分类转分类需要配置像素裁剪
      }
      // ...
    },
    // 处理送给转换接口的数据
    buildParams() {
      const { source, target, subType, method, newDlName, dlDescribe } = this.formData
      const result = {
        id: this.record.id,
        newDlName,
        dlDescribe,
        subType,
        method,
        source,
        target,
      }
      if (source === "segmentation" && target === "classification") { //分割转分类时
        // 分割转分类，按标注内容转换时，方式2，方式3每种方式都对应两个转换方法，需要单独配置
        if (subType === "1" && ["2", "3"].includes(method)) {
          result.method = this.annotationMethod[`method${method}`]
        }
      }
      // 以下两个字段在后端是枚举，如果传”“接口会报错  0.0
      if (!method) delete result.method
      if (!subType) delete result.subType
      return result
    },
    handleOk() {
      this.$refs.ruleForm.validate(async (valid, obj) => {//验证表单数据
        if (!valid) return false
        try {
          this.confirmLoading = true
          const params = this.buildParams()
          const res = await datasetConvert(params)
          this.confirmLoading = false
          if (res.code == 0) { //
            this.$message.success("操作成功")
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
    initState(record = {}) {
      this.record = record
      // 设置源数据集类型
      this.formData.source = this.typeDict[record.dlTagType]
      if (this.formData.source === "classification") { //target默认设置分割
        this.formData.target = "segmentation"
      }
      // 初始化默认选中状态
      this.targetChange()
    }
  },
}
</script>

<style lang="less" scoped>
.margin-bottom-0 {
  margin-bottom: 0;
}
.clip-config-content {
  // margin-left: 150px;
  // padding: 10px 5px;
  padding-left: 20px;
  border-radius: 5px;
  // background: #f6f7fa;
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