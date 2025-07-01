<template>
  <a-modal
    :visible="visible"
    :title="isUpdate? '更新应用': '创建应用'"
    @ok="handleOk"
    @cancel="handleCancel"
    :maskClosable="false"
    :confirm-loading="confirmLoading"
    width="600px"
  >
    <a-form-model
      ref="ruleForm" class="import-scheme-form"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 17 }"
      layout="horizontal"
      :model="formData"
      :rules="formRules">
      <a-form-model-item label="应用名称" prop="name">
        <a-input :maxLength="50" v-model="formData.name"/>
      </a-form-model-item>
      <!-- <a-form-model-item label="选择镜像" prop="imageId">
        <image-select v-model="formData.imageId" allowClear width="100%" @getAllData="handleImageChange"></image-select>
      </a-form-model-item> -->
      
      <a-form-model-item label="算法文件" prop="algorithmName">
        <a-input v-model="formData.algorithmName" disabled>
          <a-upload slot="addonAfter" :showUploadList="false" :before-upload="uploadSchemeFile">
            <a-button type="default"><a-icon type="upload"></a-icon>上传文件</a-button>
          </a-upload>
        </a-input>
      </a-form-model-item>
      <!-- <a-form-model-item label="GPU">
        <a-radio-group v-model="formData.needGpu">
          <a-radio :value="1">需要</a-radio>
          <a-radio :value="0"> 不需要</a-radio>
        </a-radio-group>
      </a-form-model-item> -->
      <a-form-model-item label="描述信息" prop ="algorithmDescribe">
        <a-textarea placeholder="" :rows="2" v-model="formData.algorithmDescribe" maxLength="30"/>
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
import imageSelect from "@/components/business/imageSelector/index.vue"
import { createAlgorithmApp, updateAlgorithmApp } from "@/api/runtorun.js";
import { checkNotSpace } from "@/utils/formValidate.js";
export default {
  components: {
    imageSelect,
  },
  data() {
    return {
      confirmLoading: false,
      formData: {
        id: undefined,
        name: '',
        // needGpu: 0, //
        algorithmZip: null,   //算法文件 file
        algorithmName: '',  //算法文件名称
        // imageId: '',
        // imageUrl: '', //镜像路径
        // imageName: '', //镜像名称
        algorithmDescribe: '',
      },
      formRules: {
        name: [{ required: true, validator: checkNotSpace, trigger: "blur"}],
        // imageId: [{ required: true, message: "请选择镜像", trigger: "blur"}],
        algorithmName: [{ required: true, message: "请上传算法文件", trigger: "change"}],
      }
    }
  },
  computed: {
    isUpdate() {
      return this.formData.id ? true: false
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
  },
  methods: {
    // handleImageChange(res) {
    //   this.formData.imageUrl = res.ckAddress || ""
    //   this.formData.imageName = res.name || ""
    // },
    uploadSchemeFile (file) {
      this.formData.algorithmName = file.name;
      this.formData.algorithmZip = file;
      // this.$refs.ruleForm.clearValidate(['algorithmName'])
      return false
    },
    handleOk() {
      this.$refs.ruleForm.validate(async (valid, obj) => {//验证表单数据
        if (!valid) return false
        try {
          this.confirmLoading = true
          const fileForm = new FormData();
          const { id, name, algorithmZip, imageId, imageUrl,imageName,algorithmDescribe, algorithmName, needGpu } = this.formData
          fileForm.append('name', name)
          algorithmZip && fileForm.append('algorithmZip', algorithmZip)
          fileForm.append('algorithmName', algorithmName)
          // fileForm.append('needGpu', needGpu)

          // fileForm.append('imageId', imageId)
          // fileForm.append('imageUrl', imageUrl)
          // fileForm.append('imageName', imageName)
          fileForm.append('algorithmDescribe', algorithmDescribe)
          const res = this.isUpdate ? await updateAlgorithmApp(id, fileForm): await createAlgorithmApp(fileForm)
          this.confirmLoading = false
          if(res.code == 0) { //
            this.$message.success("已保存")
            this.handleCancel( {},true)
          }
        } catch (error) {
          this.confirmLoading = false
        }
      })
    },
    handleCancel($event, refreshFlag) {
      this.$emit("update:visible", false)
      if(refreshFlag) {
        this.$emit('refreshList')
      }
    },
    /**
     * @public 更新算法应用时外部调用，传入应用信息
     * @param {*} data 
     */
    initState(data = {}) {
      const { id, name, imageId,imageName, imageUrl, needGpu=0, algorithmName, algorithmDescribe} = data
      this.formData.name = name
      // this.formData.imageId = imageId
      // this.formData.imageName = imageName
      // this.formData.imageUrl = imageUrl
      // this.formData.needGpu = needGpu
      this.formData.algorithmName = algorithmName
      this.formData.algorithmDescribe = algorithmDescribe
      this.formData.id = id
    }
  },
}
</script>

<style lang="less" scoped>
.import-scheme-form {
  ::v-deep .ant-input-group-addon{
    border: none;
  }
  ::v-deep .ant-input-group-addon{
    border: none;
    background-color: transparent;
  }
}
</style>