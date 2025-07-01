<template>
  <a-modal
    :visible="visible"
    :title="form.id ? '修改任务' : '新增任务'"
    :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
    @ok="createTask"
    @cancel="cancelCreateTask"
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
      <a-form-model-item label="标题" prop="title">
        <a-input :maxLength="50" v-model="form.title"/>
      </a-form-model-item>
      <a-form-model-item label="应用类型" prop="appType">
          <a-select v-model="form.appType">
            <a-select-option v-for="item in appTypeList" :key="item.value" :value="item.value">
              {{ item.title }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
      <a-form-model-item label="备注" prop="description">
        <a-input v-model="form.description" type="textarea" />
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
import experience from '@/api/experience'
import bus from '@/utils/bus'
export default {
  name: 'createTask',
  props: {},
  data () {
    return {
      visible: false,
      loading: false,
      form: {
        title: '',
        appType: '',
        description: ''
      },
      rules: {
        title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
        appType: [{ required: true, message: '请选择应用类型', trigger: 'change' }],
        description: [{ required: true, message: '请输入备注', trigger: 'blur' }]
      },
      appTypeList: [{
        title: '人脸人体',
        value: 1
      }, {
        title: '文字识别',
        value: 2
      }, {
        title: '工业质检',
        value: 3
      }]
    }
  },
  methods: {
    showModal (record) {
      this.visible = true
      this.form = { ...record }
    },
    createTask () {
      // 新增目录
      this.$refs.ruleForm.validate(valid => {
        if (!valid) return false
        this.loading = true
        const method = this.form.id ? 'put' : 'post'
        experience.manage.editTask(this.form).then(res => {
          this.loading = false
          if (res.code !== 0) return false
          this.$message.success('操作成功')
          bus.$emit('reloadTask')
          this.$emit('reload')
          this.visible = false
        })
      })
    },
    cancelCreateTask () {
      // 取消新增目录
      this.visible = false
      this.$refs.ruleForm.resetFields()
    }
  }
}
</script>