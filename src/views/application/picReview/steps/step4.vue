<template>
  <div class="step4-container">
    <p style= "color: #E6A23C;margin-bottom:0;">请设定需要复判的Defect图片，平台获取图片与图片的业务信息，发送给算法推理服务进行处理</p>
    <!-- 配置表单 -->
    <!-- 这个表单很乱，产品改了好几回，嵌套层次乱掉了 -->
    <div class="step4-config-content">
      <!--选择提取方式  -->
      <el-row>
        <!-- <el-col :span="4"><i style="color: #f5222d">*&nbsp;</i>Defect图片信息提取规则</el-col>
        <el-col :span="18">
          <el-radio-group v-model="extractRadio" :disabled="readOnly">
            <el-radio label="custom">按字段Defect字段筛选</el-radio>
            <el-radio label="builtin">业务规则</el-radio>
          </el-radio-group>
        </el-col> -->
        <span style="display: inline-block;width: 220px;"><i style="color: #f5222d">*&nbsp;</i>Defect图片信息提取规则</span>
        <span>
          <el-radio-group v-model="extractRadio" :disabled="readOnly">
            <el-radio label="custom">按字段Defect字段筛选</el-radio>
            <el-radio label="builtin">业务规则</el-radio>
          </el-radio-group>
        </span>
      </el-row>
      <!-- 根据提取方式，显示配置表单 -->
      <el-form ref="refForm" :model="picRule" label-width="180px" style="margin: 15px 30px;" :rules="formRules">
        <el-form-item label="Defect字段过滤条件设置" v-if="extractRadio === 'custom'">
          <!-- 嵌套defect复判筛选规则表单> -->
          <el-form ref="refDefectForm" :model="picRule" :rules="defectFormRules" label-width="120px" label-position="top">
            <template >
              <template v-for="(item,index) in picRule.customFilterRules" >
                <el-row>
                  <el-col :span="7">
                    <el-form-item label="Defect字段名称" :prop="`customFilterRules.${index}.fieldName`" :rules="defectFormRules.fieldName">
                      <el-select v-model="item.fieldName" allow-create filterable  default-first-option placeholder="请输入/选择" :disabled="readOnly">
                        <el-option  :label="field" :value="field" v-for="field in fieldsList" :key="field"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="条件" :prop="`customFilterRules.${index}.operation`" :rules="defectFormRules.operation">
                      <el-select v-model="item.operation" placeholder="请选择" :disabled="readOnly">
                        <el-option  label="等于" value="="></el-option>
                        <el-option  label="不等于" value="!="></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="值" :prop="`customFilterRules.${index}.value`" :rules="defectFormRules.value">
                      <el-input v-model="item.value" :disabled="readOnly"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="1" v-if="index > 0"> 
                    <a-tooltip placement="top" title="删除当前条件">
                      <!-- <el-button type="text" icon="el-icon-delete" size="large" style="font-size: 18px;padding: 6px;margin-top:36px;" @click="deleteCondition(index)" :disabled="readOnly"></el-button> -->
                      <el-link type="primary" @click="deleteCondition(index)" :disabled="readOnly" :underline="false" style="margin-top:36px;padding-left:10px;">删除</el-link>
                    </a-tooltip>
                  </el-col>
                </el-row>
                <!-- 与/或逻辑关系 -->
                <el-row v-if="index !== picRule.customFilterRules.length-1">
                  <el-col :span="7">
                    <el-form-item label="" :prop="`customFilterRules.${index}.logic`" :rules="defectFormRules.logic">
                      <el-select v-model="item.logic" placeholder="请选择" :disabled="readOnly">
                        <el-option  label="与" :value="1"></el-option>
                        <el-option  label="或" :value="2"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row v-if="index === picRule.customFilterRules.length-1">
                  <el-link type="primary" @click="addCondition" :underline="false" icon="el-icon-plus" :disabled="readOnly">新增筛选条件</el-link>
                </el-row>
              </template>
            </template>
          </el-form>
        </el-form-item>
        <el-form-item label="Defect图片业务字段选择" v-if="extractRadio === 'custom'" prop="businessFields">
          <el-select v-model="picRule.businessFields" allow-create filterable  default-first-option placeholder="请输入Defect字段" :disabled="readOnly" multiple>
            <el-option  :label="field" :value="field" v-for="field in fieldsList" :key="field"></el-option>
          </el-select>
          <!-- <el-row>
            <el-link type="primary" @click="addFiled" :underline="false" icon="el-icon-plus" :disabled="readOnly">增加新的字段</el-link>
          </el-row> -->
        </el-form-item>
        <!-- <el-form-item label="Defect图片业务字段选择" v-if="extractRadio === 'custom'">
          <el-select v-for="(businessField,idx) in formData.businessFields" :key="businessField"
            v-model="businessFields[idx]" allow-create filterable  default-first-option placeholder="请输入/选择" :disabled="readOnly">
            <el-option  :label="field" :value="field" v-for="field in fieldsList" :key="field"></el-option>
          </el-select>
          <el-row>
            <el-link type="primary" @click="addFiled" :underline="false" icon="el-icon-plus" :disabled="readOnly">增加新的字段</el-link>
          </el-row>
        </el-form-item> -->

        <el-form-item label="选择业务规则" prop="builtinAggRuleId" v-show="extractRadio === 'builtin'">
          <el-select v-model="picRule.builtinAggRuleId" placeholder="请选择" :disabled="readOnly">
            <el-option  :label="rule.name" :value="rule.id" v-for="rule in ruleList" :key="rule.id">
              <a-tooltip :title="rule.description">
                {{ rule.name }}
              </a-tooltip>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { getRuleList, getBuiltInConfig } from '@/api/picReview';
import { validateName, validateAlphabetNumHyphenUnderline } from '@/utils';
export default {
  name: 'step4',
  props: {
    state: {
      type: Object,
      default: () => ({})
    },
    setState: {
      type: Function,
      default: () => { }
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    picRule() {
      return this.state.picRule;
    },
  },
  data() {
    return {
      ruleList: [], //图片筛选规则列表
      fieldsList: [], //内置的Defect字段列表
      extractRadio: "custom",  //提示方式  custom：自定义  builtin： 内置规则
      // picRule: {
      //   builtinAggRuleId: null, //内置的图片规则，与 customFilterRules 和 businessFields 属性互斥
      //   customFilterRules: [ //自定义图片过滤规则，与 builtinAggRuleId 属性互斥
      //     {
      //       fieldName: '', //业务code
      //       operation: '', //条件
      //       value: '',
      //       logic: 1,
      //     }
      //   ],
      //   businessFields: [1] //自定义图片业务信息字段，与 builtinAggRuleId 属性互斥
      // }, //图片复判筛选规则配置
      formData: {
        builtinAggRuleId: null,
        businessFields: [], //业务字段
      },
      // defectFormData: {
      //   customFilterRules: [
      //     {
      //       fieldName: '', //业务code
      //       operation: '', //条件
      //       value: '',
      //       logic: 1,
      //     },
      //     {
      //       fieldName: '',
      //       operation: '',
      //       value: '',
      //       logic: 1,
      //     }
      //   ],
      // },
      formRules: {
        builtinAggRuleId: [
          { required: true, message: '请选择业务规则', trigger: 'change' }
        ],
        businessFields: [
          // 只能是字符
          // { validator: validateAlphabetNumHyphenUnderline, trigger: "change" },
        ],
      },
      defectFormRules: {
        fieldName: [
          { required: true, message: '请选择业务code', trigger: 'change' },
          { validator: validateAlphabetNumHyphenUnderline, trigger: ["blur", "change"] }
        ],
        operation: [
          { required: true, message: '请选择条件', trigger: 'change' }
        ],
        value: [
          { required: true, message: '请输入条件值', trigger: 'blur' },
          { validator: validateName, trigger: ["blur", "change"] }
        ],
        logic: [
          { required: true, message: '请选择逻辑关系', trigger: 'change' }
        ],

      }
    }
  },
  methods: {
    addCondition() {
      this.picRule.customFilterRules.push({
        fieldName: '',
        operation: '',
        value: '',
        logic: 1,
      })
    },
    addFiled() {
      // this.state.picRule.businessFields.push(null)
      this.formData.businessFields.push("")
    },
    deleteCondition(index) {
      this.picRule.customFilterRules.splice(index, 1)
    },
    // 获取汇总规则列表
    getRuleList() {
      getRuleList().then(res => {
        if (res.code == 0) {
          // 只取图片筛选规则
          this.ruleList = (res.data || []).filter(item => item.type === 0)
        }
      })
    },
    /**
     * @public
     */
    async next({ resolve, reject }) {
      try {
        if (this.extractRadio === 'custom') { //校验内置表单
          this.$refs.refDefectForm.validate(valid => {
            if (valid) {
              resolve()
            } else {
              reject()
            }
          })
        }
        if (this.extractRadio === 'builtin') { //校验内置表单
          this.$refs.refForm.validate(valid => {
            if (!valid) {
              reject()
            } else {
              resolve()
            }
          })
        }
      } catch (err) {
        reject(err)
      }
    }
  },
  created() {
    this.getRuleList()
    getBuiltInConfig().then(res => {
      this.fieldsList = res.data?.fields || []
    })
  },
}
</script>

<style lang="less" scoped>
.step4-container {
  // height: 100%;
  // display: flex;
  // flex-direction: column;
  &::v-deep {
    .el-form--label-top .el-form-item__label {
      margin-bottom: 0;
      padding-bottom: 5px;
    }
    .el-alert {
      overflow: unset;
    }
  }
  .step4-config-content {
    padding: 20px;
  }
}
</style>