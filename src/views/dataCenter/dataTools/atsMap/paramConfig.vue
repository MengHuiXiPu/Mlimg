<template>
  <div class="param-config-panel">
    <header class="right-header">操作区</header>
    <div class="right-content scrollbar">
      <div class="space-between info-item ant-form-item-label ">
        <label>图片名称</label>
        <span class="info-value">{{ image.picName }}</span>
      </div>
      <div class="space-between info-item ant-form-item-label ">
        <label>图片像素</label>
        <span class="info-value">{{ image.width }} * {{ image.height }}</span>
      </div>
      <div class="space-between info-item ant-form-item-label ">
        <label style="font-weight: bold;">算法参数设置</label>
        <span><a class="common-link" @click="showAdvanced = !showAdvanced" v-if="hasAdvancedParams">{{ showAdvanced ? `收起高级参数`:`展开高级参数` }}</a></span>
      </div>
      <a-form-model
        style="width: 100%;"
        :model="formData"
        :rules="formRules"

        layout=“vertical”
        labelAlign="right"
        ref="refInputForm"
        class="scrollbar params-form"
      >
        <a-form-model-item v-for="item in calcParams" :key="item.name" :prop="item.name">
          <span slot="label" :title="item.label">
            <span class="label-text">{{ item.label }}</span>
            <a-tooltip :title="item.introduction" v-if="item.introduction">
              <a-icon type="question-circle" class="table-question-icon"/> 
            </a-tooltip>
          </span>
          <!-- 单选 -->
          <a-select v-model="formData[item.name]" v-if="item.type==='radio'" :placeholder="item.placeholder" :allowClear="!item.required">
            <a-select-option :value="option.value" v-for="option in item.options" :key="option.value">{{ option.label }}</a-select-option>
          </a-select>
          <!-- 多选 -->
          <a-select v-model="formData[item.name]" v-else-if="item.type==='checkbox'" mode="multiple" :placeholder="item.placeholder">
            <a-select-option :value="option.value" v-for="option in item.options" :key="option.value">{{ option.label }}</a-select-option>
          </a-select>
          <a-input-number v-model="formData[item.name]" v-else-if="item.type==='numberInput'"
            :min="Array.isArray(item.range) ? ([null, undefined].includes(item.range[0]) ? -Infinity : item.range[0]) : -Infinity"
            :max="Array.isArray(item.range) ? ([null, undefined].includes(item.range[1]) ? Infinity : item.range[1]) : Infinity"
            :precision="item.precision || 0"
            :placeholder="item.placeholder"
            style="width: 100%;"
          />
          <a-input v-model="formData[item.name]" v-else-if="item.type==='stringInput'" allowClear/>
          <!-- 其他情况默认输入框 -->
          <a-input v-model="formData[item.name]" v-else :placeholder="item.placeholder" allowClear/>
        </a-form-model-item>
      </a-form-model>
    </div>
  </div>
</template>

<script>

export default {
  data() {
    return {
      formData: {},
      // labelCol: { span: 12 },
      // wrapperCol: { span: 12 },
      showAdvanced: false, //是否显示高级参数配置
    }
  },
  computed: {
    /**
     * 根据是否显示高级参数配置，来过滤参数列表
     */
    calcParams() {
      if (this.showAdvanced) return this.params
      // 只显示基础配置参数
      else return this.params.filter(item => item.isBase)
    },
    // 生成表单校验规则
    formRules() {
      const rules = {}
      this.calcParams.forEach(item => {
        rules[item.name] = [
          { required: item.required, message: `${item.label}不能为空`, trigger: ['blur'] }
        ]
      })
      return rules
    },
    // 判断是否有高级配置参数
    hasAdvancedParams() {
      return this.params.some(item => !item.isBase)
    },
  },
  props: {
    // 当前选中图片信息
    image: {
      type: Object,
      default: () => ({})
    },
    // 算法参数项
    params: {
      type: Array,
      default: () => ([])
    },
  },
  methods: {
    /**
     * @description 初始化表单
     */
    init() {
      this.formData = this.params.reduce((pre, item) => {
        // pre[item.name] = item.value
        this.$set(pre, item.name, item.value)
        return pre
      }, {})
    },
    /**
     * @public 
     * @description 下一步，校验表单
     */
    nextStep() {
      // 先校验表单
      return new Promise((resolve, reject) => {
        this.$refs.refInputForm.validate((valid) => {
          if (valid) {
            // 将 formData 赋值给 params
            const newParams = this.params.map(item => {
              item.value = this.formData[item.name]
              return item
            })
            resolve(newParams)
          } else {
            this.$message.warning("请检查参数配置")
            reject(new Error('表单校验失败'))
          }
        })
      })
    }
  },
}
</script>

<style lang="less" scoped>
// 文本超出显示省略号共用 class
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.param-config-panel {
  border-top: 1px solid #f2f2f2;
  border-left: 1px solid #f2f2f2;
  background-color: #fff;
  padding-left: 10px;
  // background-color: #daeaff;
  .right-header {
    height: 40px;
    text-align: center;
    line-height: 40px;
    font-weight: 600;
  }
  .right-content {
    background-color: #d7edf7;
    height: calc(100% - 40px);
    overflow: auto;
    padding: 15px 10px;
    // .info-item {
    //   padding: 0 15px;
    // }
    .info-value {
      max-width: 150px;
      .ellipsis();
    }
    .params-form {
      ::v-deep .ant-form-item {
        margin-bottom: 0px;
      }
      ::v-deep .ant-form-item label {
        font-size: 13px;
        margin-bottom: 0;
        .label-text {
          font-size: 13px;
          text-align: left;
          display: inline-block;
          vertical-align: middle;
          // width: 90px;
          max-width: 220px;
          .ellipsis();
        }
      }
    }
  }
}
</style>