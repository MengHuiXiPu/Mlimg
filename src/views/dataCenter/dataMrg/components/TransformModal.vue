<template>
  <div>
    <a-modal
        ref="transformModal"
        title="测试集目录结构转换"
        :visible="visible"
        centered
        @ok="handleOk"
        @cancel="handleCancel"
        :maskClosable="!confirmLoading"
        :destroyOnClose="true"
        :closable="!confirmLoading"
        :keyboard="!confirmLoading"
        :cancel-button-props="{ props: { disabled: confirmLoading } }"
        :ok-button-props="{ props: { disabled: confirmLoading } }"
        style="position: relative;"
    >
      <a-form-model
          ref="ruleForm"
          :model="form"
          :rules="rules"
          :label-col="labelCol"
          :wrapper-col="wrapperCol"
      >
        <a-form-model-item ref="currentDir" label="当前数据集目录" prop="currentDir">
          <a-input v-model="form.currentDir" disabled/>
        </a-form-model-item>
        <a-form-model-item label="输出集目录" prop="outputDir">
          <a-input v-model="form.outputDir" />
        </a-form-model-item>
        <a-form-model-item label="面外配置开关" prop="isValidate" size="small">
          <a-switch v-model="form.isValidate" />
        </a-form-model-item>
        <a-form-model-item v-if="form.isValidate" label="面外配置内容" prop="validateText">
          <a-input v-model="form.validateText" type="textarea" style="width:400px;height:320px;" />
        </a-form-model-item>
      </a-form-model>
      <div v-if="confirmLoading" class="mask"></div>
      <a-spin :spinning="confirmLoading" :indicator="indicator" style="position:absolute;top: 50%;left: 50%;">
      </a-spin>
    </a-modal>
  </div>
</template>

<script>
export default {
  name: "TransformModal",
  props: {
    visible,
    confirmLoading,
  },
  data(){
    return {
      indicator: <a-icon type="loading" style="font-size: 32px" spin />,
      labelCol: { span: 8 },
      wrapperCol: { span: 14 },
      form: {
        currentDir: "",
        outputDir: "",
        isValidate: true,
        validateText: `# if use 'mean_Laplacian', blur score is lower the blurrer
# if use 'GaussianBlur', blur score is higher the blurrer
blur_measure = 'GaussianBlur'
blur_threshold = 25

check_out_by_filename_coord = false
x_coordinate_index_of_filename = 4
y_coordinate_index_of_filename = 5

use_gate1_instead = false
out_list = [
]

panel_xrange = [
    -1097.58,
    -570.54,
    -541.54,
    -14.5,
    14.5,
    541.54,
    570.54,
    1097.58,
]
panel_yrange = [
    -1261.99,
    -965.53,
    -946.23,
    -649.77,
    -630.47,
    -334.01,
    -314.71,
    -18.2499999999999,
    13.95,
    310.41,
    329.71,
    626.17,
    645.47,
    941.93,
    961.23,
    1257.69,
]
`,
      },
      rules: {
        currentDir: [
          { required: true, message: '请输入当前数据集目录', trigger: 'blur' },
        ],
        outputDir: [{ required: true, message: '请输入输出集目录', trigger: 'blur'}],
        isValidate: [{ required: true, message: '请选择是否开启验证配置', trigger: 'change' }],
        validateText: [{ required: true, message: '请输入验证配置内容', trigger: 'blur' }],
      },
    }
  },
  methods: {
    handleOk() {
      this.$emit("handleOk")
    }
  }
}
</script>

<style scoped>

</style>