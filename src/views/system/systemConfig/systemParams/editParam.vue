<template>
  <a-modal
    :visible="visible"
    :title="'参数配置'"
    :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
    @ok="save"
    @cancel="cancel"
    :maskClosable="false"
  >
    <a-form-model
      :model="form"
      ref="ruleForm"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      :rules="rules"
      layout="horizontal"
    >
      <a-form-model-item label="参数名称" prop="keyInfo">
        <a-input :maxLength="50" v-model="form.keyInfo" placeholder="请输入参数名称" disabled />
      </a-form-model-item>
      <a-form-model-item label="参数值" prop="valueInfo">
        <a-input v-model="form.valueInfo" placeholder="请输入参数值"/>
      </a-form-model-item>
      <a-form-model-item label="参数描述" prop="remark">
        <a-input v-model="form.remark" placeholder="请输入参数描述" type="textarea"  />
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>
<script>
import system from '@/api/system'
export default {
  name: "editParam",
  data () {
    return {
      loading: false,
      visible: false,
      form: {},
      rules: {
        keyInfo: [{ required: true, message: '请输入参数名称', trigger: 'blur' }],
        valueInfo: [{ required: true, message: '请输入参数值', trigger: 'blur' }],
        remark: [{ required: true, message: '请输入参数描述', trigger: 'blur' }]
      }
    }
  },
  methods: {
    showModal (record) {
      console.log(record)
      this.visible = true
      this.form = { ...record }
    },
    save () {
      console.log(this.form)
      this.$refs.ruleForm.validate(async valid => {
        if (!valid) {
          return false
        } else {
          const res = await system.systemConfig.editConfig(this.form)
          if (res.code !== 0) return false
          this.$message.success('修改成功')
          this.$emit('getDataList')
          this.cancel()
        }
      })
    },
    cancel () {
      this.visible = false
      this.form = {}
    }
  }
}
</script>

<style scoped lang="less">
</style>
