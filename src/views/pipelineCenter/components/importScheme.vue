<template>
  <a-modal :visible="visible" title="导入方案" @ok="handleOk" @cancel="handleCancel" :maskClosable="false"
    :confirm-loading="confirmLoading" width="600px">
    <a-form-model ref="ruleForm" class="import-scheme-form" :label-col="{ span: 6 }" :wrapper-col="{ span: 17 }"
      layout="horizontal" :model="formData" :rules="formRules">
      <a-form-model-item label="方案类别">
        <a-radio-group v-model="formData.schemeType">
          <a-radio :value="1">普通方案</a-radio>
          <a-radio :value="0"> 算法方案</a-radio>
        </a-radio-group>
      </a-form-model-item>
      <a-form-model-item label="方案名称" prop="name">
        <a-input :maxLength="50" v-model="formData.name" />
      </a-form-model-item>
      <a-form-model-item label="选择镜像" prop="customImageId" v-if="formData.schemeType === 0">
        <image-select v-model="formData.customImageId" allowClear width="100%"></image-select>
      </a-form-model-item>
      <a-form-model-item label="方案文件" prop="fileName">
        <a-input v-model="formData.fileName" disabled>
          <a-upload slot="addonAfter" :showUploadList="false" :before-upload="uploadSchemeFile">
            <a-button type="default"><a-icon type="upload"></a-icon>上传文件</a-button>
          </a-upload>
        </a-input>
      </a-form-model-item>
      <a-form-model-item label="备注" prop="remark" v-if="formData.schemeType === 1">
        <a-textarea v-model="formData.remark" :auto-size="{ minRows: 2, maxRows: 4 }" />
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
import imageSelect from "@/components/business/imageSelector/index.vue"
import Operator from "@/api/operator";
import { checkNotSpace } from "@/utils/formValidate.js";
export default {
  components: {
    imageSelect,
  },
  data() {
    return {
      confirmLoading: false,
      formData: {
        schemeType: 1,
        name: '',
        file: null,
        fileName: '',
        customImageId: '',
        remark: ""
      },
      formRules: {
        name: [{ required: true, validator: checkNotSpace, trigger: "blur" }],
        customImageId: [{ required: true, message: "请选择镜像", trigger: "blur" }],
        fileName: [{ required: true, message: "请上传方案文件", trigger: "change" }],
      }
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
  },
  methods: {
    uploadSchemeFile(file) {
      this.formData.fileName = file.name;
      this.formData.file = file;
      // this.$refs.ruleForm.clearValidate(['algorithmName'])
      return false
    },
    handleOk() {
      this.$refs.ruleForm.validate(async (valid, obj) => {//验证表单数据
        if (!valid) return false
        try {
          this.confirmLoading = true
          const fileForm = new FormData();
          const { name, file, customImageId, schemeType, remark } = this.formData
          let res = null
          if (schemeType == 1) { //普通方案
            fileForm.append('file', file)
            fileForm.append('templateImportDto', new Blob([JSON.stringify({
              name,
              remark
            })], {
              type: 'application/json'
            }))
            res = await Operator.schemePipeLineImport(fileForm)
          } else { //算法方案
            fileForm.append('file', file)
            fileForm.append('name', name)
            fileForm.append('customImageId', customImageId)
            res = await Operator.schemeImport(fileForm)
          }
          this.confirmLoading = false
          if (res.code == 0) { //
            this.$message.success(schemeType == 1 ? res.data : "已保存")
            this.handleCancel({}, true)
          }
        } catch (error) {
          this.confirmLoading = false
        }
      })
    },
    handleCancel($event, refreshFlag) {
      this.$emit("update:visible", false)
      if (refreshFlag) {
        this.$emit('refreshList')
      }
    },
  },
}
</script>

<style lang="less" scoped>
.import-scheme-form {
  ::v-deep .ant-input-group-addon {
    border: none;
  }

  ::v-deep .ant-input-group-addon {
    border: none;
    background-color: transparent;
  }
}
</style>