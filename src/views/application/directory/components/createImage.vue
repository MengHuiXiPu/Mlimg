<template>
  <a-modal
    :visible="visible"
    :title="createImageForm.id ? '编辑捞图源' : '新增捞图源'"
    :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
    destroyOnClose
    @ok="createData"
    @cancel="cancelCreateData"
    :maskClosable="false"
  >
    <a-form-model
      :model="createImageForm"
      ref="ruleForm"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      :rules="rules"
      layout="horizontal"
    >
      <a-form-model-item label="捞图源名称" prop="name">
        <a-input v-model="createImageForm.name" />
      </a-form-model-item>
      <a-form-model-item label="消息源" prop="messageSourceId">
        <a-select
          v-model="createImageForm.messageSourceId"
          showSearch
          :filter-option="filterOption"
          @change="changeItem($event, 'messageSource')">
          <a-select-option
            v-for="(item,key) in messageSourceList"
            :key="key"
            :value="item.id"
            :disabled="item.exist"
          >{{ item.name }}</a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item label="文件源" prop="fileSourceId">
        <a-select
          v-model="createImageForm.fileSourceId"
          showSearch
          :filter-option="filterOption"
          mode="multiple"
          @change="changeItem($event, 'fileSource')">
          <a-select-option
            v-for="(item,key) in fileSourceList"
            :key="key"
            :value="item.id"
          >{{ item.name }}</a-select-option>
        </a-select>
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
import { imageSource } from "@/api/appCenter"
export default {
  name: 'CreateImage',
  data () {
    return {
      visible: false,
      createImageForm: {
        fileSourceId: [],
        messageSourceId: [],
        name: ''
      },
      rowId: null,
      loading: false,
      messageSourceList: [],
      fileSourceList: [],
      rules: {
        name: [{ required: true, message: '请输入捞图源名称', trigger: 'blur' }],
        messageSourceId: [{ required: true, message: '请选择消息源', trigger: 'change' }],
        fileSourceId: [{ required: true, message: '请选择文件源', trigger: 'change' }]
      }
    }
  },
  mounted () {
  },
  methods: {
    async showModal (record) {
      this.visible = true
      this.loading = true
      await this.getDsTypesList()
      this.loading = false
      if (record?.id) {
        const fileSourceId = record.fileSourceId.split(',').map(item => Number(item))
        this.createImageForm = {
          ...record,
          fileSourceId: this.fileSourceList.filter(item => {
            return fileSourceId.includes(item.id)
          }).map(item => item.id)
        }
      } else {
        this.createImageForm = {
          fileSourceId: [],
          messageSourceId: [],
          name: ''
        }
      }
    },
    createData () {
      this.$refs.ruleForm.validate(valid => {
        if (!valid) return false
        this.loading = true
        const { fileSourceId, fileSourceName } = this.createImageForm
        const params = {
          ...this.createImageForm,
          fileSourceId: fileSourceId.join(),
          fileSourceName: this.createImageForm.id ? fileSourceName : fileSourceName.join()
        }
        const method = this.createImageForm.id ? 'put' : 'post'
        imageSource.createImageSource(params, method).then(res => {
          this.loading = false
          if (res.code !== 0) return false
          this.$message.success('操作成功')
          this.$emit('addDirectory')
          this.visible = false
        })
      })
    },
    async getDsTypesList () {
      const message = imageSource.getSourceOption
      const file = imageSource.getSourceOption
      const messageData = await message(1)
      if (messageData.code !== 0) return false
      this.messageSourceList = messageData.data
      const fileData = await file(0)
      if (fileData.code !== 0) return false
      this.fileSourceList = fileData.data
    },
    changeItem (val, type) {
      const source = this[type + 'List'].filter(item => {
        return type === 'fileSource' ? val.includes(item.id) : val === item.id
      })
      this.$set(this.createImageForm, type + 'Name', type === 'fileSource' ? source.map(item => item.name) : source[0].name)
    },
    cancelCreateData () {
      this.$refs.ruleForm.resetFields()
      this.visible = false
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    }
  }
}
</script>