/*
 * @Author: lichao.sun 
 * @Date: 2025-01-21 15:55:44 
 * @Last Modified by: lichao.sun
 * @Last Modified time: 2025-02-06 15:52:15
 * @Desc: 图片移动  目标目录配置modal
 */
<template>
  <a-modal
    :visible="visible"
    :title="title"
    :maskClosable="false"
    :confirmLoading="confirmLoading"
    @cancel="handleCancel"
    @ok="handleOk"
    okText="移动"
    width="650px"
  >
    <a-spin :spinning="loading">
      <el-form
        ref="refConfigForm" class="create-model-form"
        layout="horizontal"
        label-width="120px"
        :model="formData"
        :rules="formRules"
      >
        <el-form-item label="选择移动位置" required prop="targetLabelName">
          <a-select style="width: 35%" v-model="formData.moveType" @change="changeMoveType">
            <a-select-option :value="option.value" v-for="option in moveTypeList" :key="option.value">{{option.label}}</a-select-option>
          </a-select>
          <el-select v-model="formData.targetLabelName" :disabled="!allowCreate" :allow-create="allowCreate" filterable  
            default-first-option :popper-append-to-body="false" style="width: 60%" clearable>
            <el-option :value="label" :label="label" v-for="label in labelList" :key="label" :disabled="disabledLabelName === label"></el-option>
          </el-select>
          <div style= "color: #E6A23C;font-size: 13px;" v-show="[0, 2].includes(formData.moveType)">移动到已标注图片，平台将修改所选择图片所对应的标注信息</div>
        </el-form-item>
      </el-form>
    </a-spin>
  </a-modal>
</template>

<script>
import { getLabelList, movePicturesToLabel } from "@/api/dataCenter.js"
import { validateName } from '@/utils';
export default {
  data() {
    return {
      // visible: false,
      title: '移动图片',
      confirmLoading: false,
      formData: {
        targetLabelName: '', // 目标标签名称
        moveType: 0, //0 从未标注移动到已标注 1 从已标注移动到未标注 2 已标注移动到已标注
      },
      formRules: {
        targetLabelName: [
          { required: true, message: '请选择要移动到的标签', trigger: 'change' },
          { max: 50, message: '标签名称不能超过50个字符', trigger: 'change' },
          { validator: validateName, trigger: 'change' }
        ]
      },
      markedLabelsList: [], // 已标注的标签列表
      unmarkedLabelsList: [], // 未标注的标签列表
      // 当前图片所在的label/勾选的要移动的完整label，要禁止选择
      disabledLabelName: '',
      dlTagType: null, //数据集类型: 分类  分割 目标检测
      loading: false,
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // 数据集ID
    datasetId: {
      type: [String, Number],
      default: ""
    },
    // 标签列表，按顺序依次为 已标注label列表、未标注label列表
    labelList: {
      type: Array,
      default: () => [[], []]
    },
    // 从已标注列表/未标注列表打开的移动modal，用来给后端上送不同的moveType, 1:'已标注'   2: '未标注' }
    markRange: {
      type: String,
      default: 1
    }
  },
  computed: {
    moveTypeList() {
      if (this.markRange === 1) { //从已标注列表移动
        return [
          { value: 2, label: '移动到已标注图片' },
          { value: 1, label: '移动到未标注图片' }
        ]
      } else if (this.markRange === 2) { //从未标注列表移动
        return [
          // { value: 3, label: '移动到未标注图片' },
          { value: 0, label: '移动到已标注图片' }
        ]
      }
    },
    // 根据moveType，返回可选择的标签列表
    labelList() {
      if (this.formData.moveType == 1) return this.unmarkedLabelsList
      return this.markedLabelsList
    },
    // 允许新建标签
    // 分类数据集，要移动到未标注时，禁止选择和输入标签默认使用”null“标签
    allowCreate() {
      return !(this.dlTagType == '分类' && this.formData.moveType == 1)
      // return this.dlTagType !== '分类'
    },

  },
  watch: {
    "formData.moveType": {
      handler(val) {
        if (val == 1 && this.dlTagType == '分类') {
          this.formData.targetLabelName = 'null'
        }
      },
    },
  },
  methods: {
    // 改变移动类型后，清除选中的标签
    changeMoveType() {
      this.formData.targetLabelName = ''
      // 清除表单校验
      this.$nextTick(() => {
        this.$refs.refConfigForm.clearValidate()
      })
    },
    /**
     * @public
     * 记录传递的数据，不写在props里了
     */
    initState(data = {}) {
      this.formData.sourceLabelName = data.sourceLabelName
      this.formData.picIds = data.picIds
      this.disabledLabelName = data.disabledLabelName
      this.dlTagType = data.dlTagType
    },
    // 获取数据集下的label信息
    getLabelInfo() {
      this.loading = true
      // markRange: 1, //已标注的标签  1 未标注的标签 0
      Promise.all([getLabelList({ dlId: this.datasetId, markRange: 1 }), getLabelList({ dlId: this.datasetId, markRange: 0 })]).then(res => {
        this.markedLabelsList = res[0]?.data || []
        this.unmarkedLabelsList = res[1]?.data || []
      }).finally(() => {
        this.loading = false
      })
    },
    handleCancel() {
      this.$emit("update:visible", false)
    },
    handleOk() {
      this.$refs.refConfigForm.validate(async (valid) => {
        if (valid) {
          this.confirmLoading = true
          const { targetLabelName, moveType, sourceLabelName, picIds } = this.formData
          const params = {
            picIds, //移动的图片id集合
            sourceLabelName, //原始标签，这个字段有值的话，后端按这个字段获取所有图片移动，这个字段为空的话取picIds字段
            dlId: this.datasetId,
            moveType, //0 从未标注移动到已标注 1 从已标注移动到未标注 2 已标注移动到已标注，改变标签
            targetLabelName,
          }
          const res = await movePicturesToLabel(params).catch(err => {
            this.confirmLoading = false
          })
          this.confirmLoading = false
          if (res?.code === 0) {
            this.$message.success("操作成功")
            this.$emit("success")
            this.handleCancel()
          }
        }
      })
    },
  },
  created() {
    this.getLabelInfo()
    // 根据markRange为moveType设置默认值
    this.formData.moveType = this.markRange === 1 ? 2 : 0
  }
}
</script>

<style lang="less" scoped>
// fix el-select在a-modal中宽度自适应失效问题
/deep/ .el-select-dropdown {
  min-width: 280px !important;
}
</style>