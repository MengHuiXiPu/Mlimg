<template>
  <a-modal
    :visible="visible"
    :title="createDirectoryForm.id ? '修改目录' : '新增目录'"
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
      <a-form-model-item label="目录名称" prop="name">
        <a-input :maxLength="50" v-model="createDirectoryForm.name" />
      </a-form-model-item>
      <a-form-model-item label="解析来源" prop="value">
        <a-input v-model="createDirectoryForm.value" />
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
import {
  inferenceCatalogConf,
  inferenceCatalogConfInfo
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
        value: ''
      },
      rules: {
        name: [{ required: true, message: '请输入目录名称', trigger: 'blur' }],
        value: [{ required: true, message: '请输入解析来源', trigger: 'blur' }]
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
        inferenceCatalogConf(this.createDirectoryForm, method).then(res => {
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