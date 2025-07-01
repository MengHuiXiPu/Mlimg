<template>
  <a-modal
    :visible="visible"
    :title="createDirectoryForm.id ? '修改任务组配置' : '新增任务组配置'"
    :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
    @ok="createDirectory"
    @cancel="cancelCreateDirectory"
    :maskClosable="false"
  >
    <a-form-model
      :model="createDirectoryForm"
      ref="ruleForm"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      :rules="rules"
      layout="horizontal"
    >
      <a-form-model-item label="图片类型" prop="name">
        <a-input :maxLength="50" v-model="createDirectoryForm.name" />
      </a-form-model-item>
      <a-form-model-item label="名称匹配" prop="rule">
        <a-input v-model="createDirectoryForm.rule" />
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
import {
  taskGroupConfig
} from "@/api/appCenter"
export default {
  name: 'CreateDirectory',
  props: {},
  data () {
    return {
      visible: false,
      loading: false,
      createDirectoryForm: {
        name: '',
        rule: ''
      },
      rules: {
        name: [{ required: true, message: '请输入图片类型', trigger: 'blur' }],
        rule: [{ required: true, message: '请输入名称匹配', trigger: 'blur' }]
      }
    }
  },
  methods: {
    showModal (record) {
      this.visible = true
      this.createDirectoryForm = { ...record }
    },
    createDirectory () {
      // 新增目录
      this.$refs.ruleForm.validate(valid => {
        if (!valid) return false
        this.loading = true
        const method = this.createDirectoryForm.id ? 'put' : 'post'
        taskGroupConfig.createTaskGroupConfig(this.createDirectoryForm, method).then(res => {
          this.loading = false
          if (res.code !== 0) return false
          this.$message.success('操作成功')
          this.$emit('addDirectory')
          this.visible = false
        })
      })
    },
    cancelCreateDirectory () {
      // 取消新增目录
      this.visible = false
      this.$refs.ruleForm.resetFields()
    }
  }
}
</script>