<template>
  <div>
    <a-modal v-model="visible" :title="formData.id ? '下发文件更新':'导入下发文件'" 
      @ok="handleUploadOk" @cancel="closeDialog" destroyOnClose :confirm-loading="confirmLoading"
    >
      <a-form-model
        ref="uploadForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        layout="horizontal"
        :model="formData"
        :rules="rules"
      >
        <a-form-model-item label="文件类型" prop="fileType">
          <!-- 更新时禁止切换类型 -->
          <a-select  v-model="formData.fileType" :disabled="!!formData.id">
            <a-select-option :value="item[0]" v-for="item in fileTypeList" :key="item[0]">
              {{ item[1] }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="文件名称" prop="name" >
          <a-input v-model="formData.name" :disabled="true"/>
          <!-- 后端未提供更新标注图片的接口，所以在更新时 fileType：2时禁止上传 -->
          <a-upload :showUploadList="false" :before-upload="beforeUpload" :accept="acceptFileExt.toString()" :disabled="(formData.id && formData.fileType==2) || formData.fileType==undefined">
            <a-tooltip :title="`仅支持${acceptFileExt.toString()}文件`">
              <a-button type="default" :disabled="(formData.id && formData.fileType==2) || formData.fileType==undefined">
                <a-icon type="upload"></a-icon>上传文件</a-button>
            </a-tooltip>
          </a-upload>
        </a-form-model-item>
        <a-form-model-item label="是否公开" prop="isPublic">
          <a-switch v-model="formData.isPublic" />
        </a-form-model-item>
        <a-form-model-item label="细分类型" prop="category">
          <a-input v-model="formData.category" />
        </a-form-model-item>
      </a-form-model>
    </a-modal>
  </div>
</template>

<script>
const initialFormData = {
  name: '',
  file: '',
  fileType: undefined,
  category: '', // 默认为空
  isPublic: false // 默认为false
}
import { importFile,importAnnotationFile, updateTransferFile } from '@/api/cloud.js'
import { FILETYPE } from '../constant.js'
export default {
  data() {
    return {
      fileTypeList: [
        ...FILETYPE
      ],
      formData: {...initialFormData},
      rules: {
        name: [{ required: true, message: "请选择文件", trigger: "blur",}],
        fileType: [
          { required: true, message: "请选择文件类型!", trigger: "change" },
        ],
      },
      confirmLoading: false,
    }
  },
  computed: {
    // 2：表示标注文件，只能是图片  0/1： sdk/逻辑文件： 只能是zip
    acceptFileExt() {
      return this.formData.fileType === 2 ? ['.jpg', '.png', '.jpeg']: ['.zip']
    }
  },
  props: {
    // 控制弹框显示， sync方式使用
    visible: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    /**
     * @public
     * @param {object} record :下发文件列表中的某一条的数据
     */
    setState(record) {
      if(record.id) { //是更新操作
        const { id, name, isPublic, category,fileType } = record
        this.formData.id = id
        this.formData.name = name
        this.formData.isPublic = isPublic
        this.formData.category = category,
        this.formData.fileType = fileType
      }
    },
    beforeUpload(file) {
      this.formData.name = file.name.split(".")[0];
      this.formData.file = file;
      return false;
    },
    // 创建上传/更新时的form-data参数
    buildFormData() {
      const fileForm = new FormData();
      const { id, name, isPublic, category,fileType, file } = this.formData
      fileForm.append('fileType', fileType)
      fileForm.append('category', category)
      fileForm.append('isPublic', isPublic)
      if(file) {
        fileForm.append('file', file)
      }
      if(id) {
        fileForm.append('id', id)
      }else { //新建时接口需要name，更新时不需要
        fileForm.append('name', name)
      }
      if(this.$route.query.appId){ // 加入 appId
        fileForm.append('appId', this.$route.query.appId)
      }
      return fileForm
    },
    // 新建时调用
    async uploadFile() {
      let fileForm = this.buildFormData()
      const uploadmethod = this.formData.fileType == 2 ? importAnnotationFile : importFile
      this.confirmLoading = true
      try {
        const res = await uploadmethod(fileForm);
        this.confirmLoading = false
        if (res.success) {
          this.closeDialog()
          this.$emit('upload-success')
          this.$message.success("导入成功");
        }else {
          this.$message.error("导入失败");
        }
      }catch{
        this.confirmLoading = false
      } 
    },
    // 更新时调用
    async updateFile() {
      this.confirmLoading = true
      let fileForm = this.buildFormData()
      try {
        const res = await updateTransferFile(fileForm);
        this.confirmLoading = false
        if (res.success) {
          this.closeDialog()
          this.$emit('upload-success')
          this.$message.success("更新成功");
        }else {
          this.$message.error("更新失败");
        }
      }catch{
        this.confirmLoading = false
      }
    },
    // 点击确定按钮
    handleUploadOk() {
      this.$refs["uploadForm"].validate(async (valid) => {
        if (valid) {
          if(this.formData.id) {
            this.updateFile()
          }else { //新建
            this.uploadFile()
          }
        }
      });
      
    },
    closeDialog() {
      this.formData = {...initialFormData}
      delete this.formData.id
      this.$emit('update:visible', false)
    }
  },
}
</script>