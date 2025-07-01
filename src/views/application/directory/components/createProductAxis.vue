<template>
  <a-modal
    :visible="visible"
    :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
    title="编辑产品坐标"
    destroyOnClose
    @ok="createData"
    @cancel="cancelCreateData"
    :maskClosable="false"
  >
    <a-form-model
      :model="createFileForm"
      ref="ruleForm"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      :rules="rules"
      layout="horizontal"
    >
      <a-form-model-item label="产品名称" prop="productName">
        <a-input v-model="createFileForm.productName" />
      </a-form-model-item>
      <a-form-model-item label="产品类别" prop="productSpecName">
        <a-input v-model="createFileForm.productSpecName" />
      </a-form-model-item>
      <a-form-model-item label="站点" prop="processOperationName">
        <a-input v-model="createFileForm.processOperationName" />
      </a-form-model-item>
      <a-form-model-item label="机台" prop="eqpType">
        <a-input v-model="createFileForm.eqpType" />
      </a-form-model-item>
      <a-form-model-item label="X坐标" prop="axisX">
        <a-input-number
          v-model="createFileForm.axisX"
          :precision="0"
          :min="-10000"
          :max="10000"
          style="width: 100%"
        />
      </a-form-model-item>
      <a-form-model-item label="Y坐标" prop="axisY">
        <a-input-number
          v-model="createFileForm.axisY"
          :precision="0"
          :min="-10000"
          :max="10000"
          style="width: 100%"
        />
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
import { productAxis } from "@/api/appCenter"
export default {
  name: 'CreateFile',
  data () {
    return {
      visible: false,
      createFileForm: [],
      loading: false,
      rules: {
        productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
        productSpecName: [{ required: true, message: '请选择产品类型', trigger: 'blur' }],
        processOperationName: [{ required: true, message: '请输入站点', trigger: 'blur' }],
        eqpType: [{ required: true, message: '请输入机台', trigger: 'blur' }],
        axisX: [{ required: true, message: '请输入X坐标', trigger: 'blur' }],
        axisY: [{ required: true, message: '请输入Y坐标', trigger: 'blur' }]
      }
    }
  },
  mounted () {
  },
  methods: {
    showModal (record) {
      this.visible = true
      this.createFileForm = record?.id ? { ...record } : {
        productName: '',
        productSpecName: '',
        processOperationName: '',
        eqpType: '',
        axisX: 0,
        axisY: 0
      }
    },
    createData () {
      this.$refs.ruleForm.validate(valid => {
        if (!valid) return false
        this.loading = true
        const method = this.createFileForm.id ? 'put' : 'post'
        productAxis.editData(this.createFileForm, method).then(res => {
          this.loading = false
          if (res.code !== 0) return false
          this.$message.success('操作成功')
          this.$emit('addDirectory')
          this.visible = false
        })
      })
    },
    cancelCreateData () {
      this.visible = false
      this.$refs.ruleForm.resetFields()
    }
  }
}
</script>