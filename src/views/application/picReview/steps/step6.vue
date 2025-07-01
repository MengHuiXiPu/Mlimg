<template>
  <a-form-model
    ref="refForm"
    class="step6-form"
    :label-col="{ span: 5 }"
    :wrapper-col="{ span: 17 }"
    layout="horizontal"
    :model="state"
    labelAlign="left"
    :rules="formRules">
    <a-form-model-item label="应用名称" prop="applicationName">
      <a-input :maxLength="50" v-model="state.applicationName" placeholder="请输入"/>
    </a-form-model-item>
    <a-form-model-item label="数据源描述" prop="applicationDesc">
      <a-input v-model="state.applicationDesc" type="textarea" placeholder="请输入" :autoSize="{ minRows: 4, maxRows: 10 }" maxlength="512" />
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import { validateName } from '@/utils';
// 设置虚拟站点信息
export default {
  name: 'step6',
  props: {
    state: {
      type: Object,
      default: () => ({})
    },
    setState: {
      type: Function,
      default: () => { }
    }
  },
  data() {
    return {
      // formData: {
      //   applicationName: '',
      //   applicationDesc: ''
      // },
      formRules: {
        applicationName: [
          { required: true, message: '请输入虚拟站点名称', trigger: 'blur' },
          { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' },
          { validator: validateName, trigger: ["blur", "change"] },
        ],
      }
    }
  },
  methods: {
    /**
     * @public
     */
    next({ resolve, reject }) {
      this.$refs.refForm.validate(valid => {
        if (valid) {
          resolve()
        } else {
          reject()
        }
      })
    }
  },
}
</script>

<style lang="less" scoped>
.step6-form {
  width: 60%;
  padding-top: 5vh;
}
</style>