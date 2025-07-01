<template>
  <a-form-model
    class="step5-form"
    ref="refForm"
    :label-col="{ span: 8 }"
    :wrapper-col="{ span: 16 }"
    layout="horizontal"
    :model="state"
    labelAlign="left"
    :rules="formRules">
    <a-form-model-item label="虚拟站点名称" prop="virtualStationName">
      <a-input :maxLength="50" v-model="state.virtualStationName" placeholder="请输入" :disabled="readOnly"/>
    </a-form-model-item>
    <a-form-model-item label="虚拟设备名称" prop="virtualDeviceName">
      <a-input :maxLength="50" v-model="state.virtualDeviceName" placeholder="请输入" :disabled="readOnly"/>
    </a-form-model-item>
    <a-form-model-item label="Glass/Panel结果汇总规则" prop="resultSummaryRuleId">
      <a-select v-model="state.resultSummaryRuleId" placeholder="请输入" :disabled="readOnly">
        <a-select-option :value="item.id" v-for="item in ruleList" :key="item.id">
          <a-tooltip :title="item.description">
            {{ item.name }}
          </a-tooltip>
        </a-select-option>
      </a-select>
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import { validateName } from '@/utils';
import { getRuleList } from '@/api/picReview';
// 设置虚拟站点信息
export default {
  name: 'step5',
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
  data() {
    return {
      ruleList: [], //汇总规则列表
      // formData: {
      //   virtualStationName: '',
      //   virtualDeviceName: '',
      //   resultSummaryRuleId: '',
      // },
      formRules: {
        virtualStationName: [
          { required: true, message: '请输入虚拟站点名称', trigger: 'blur' },
          // { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' },
          { validator: validateName, trigger: ["blur", "change"] }
        ],
        virtualDeviceName: [
          { required: true, message: '请输入虚拟设备名称', trigger: 'blur' },
          { validator: validateName, trigger: ["blur", "change"] }
        ],
        resultSummaryRuleId: [
          { required: true, message: '请选择Glass/Panel结果汇总规则', trigger: ['blur', 'change'] },
        ],
      }
    }
  },
  methods: {
    /**
     * @public
     * @description 下一步
     */
    next({ resolve, reject }) {
      this.$refs.refForm.validate(valid => {
        if (valid) {
          resolve()
        } else {
          reject()
        }
      })
    },
    // 获取汇总规则列表
    getRuleList() {
      getRuleList().then(res => {
        if (res.code == 0) {
          // 只取汇总规则
          this.ruleList = (res.data || []).filter(item => item.type === 4)
        }
      })
    },
  },
  created() {
    this.getRuleList()
  },
}
</script>

<style lang="less" scoped>
.step5-form {
  width: 60%;
  padding-top: 5vh;
}
</style>