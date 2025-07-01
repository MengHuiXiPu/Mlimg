<template>
  <a-modal
    :visible="visible"
    :title="createMessageForm.id ? '编辑消息源' : '新增消息源'"
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
      :model="createMessageForm"
      ref="ruleForm"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      :rules="rules"
      layout="horizontal"
    >
      <a-form-model-item label="消息源名称" prop="name">
        <a-input v-model="createMessageForm.name" />
      </a-form-model-item>
      <a-form-model-item label="输入源" prop="subSourceId">
        <a-select v-model="createMessageForm.subSourceId" showSearch :filter-option="filterOption">
          <a-select-option
            v-for="(item,key) in dsNasTypesOption"
            :key="key"
            :disabled="item.id === createMessageForm.pubSourceId"
            :value="item.id"
          >{{ item.dsName }}</a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item label="输出源" prop="pubSourceId">
        <a-select v-model="createMessageForm.pubSourceId" showSearch :filter-option="filterOption">
          <a-select-option
            v-for="(item,key) in dsNasTypesOption"
            :key="key"
            :disabled="item.id === createMessageForm.subSourceId"
            :value="item.id"
          >{{ item.dsName }}</a-select-option>
        </a-select>
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
import { messageSource, getdDataSourceInfo } from "@/api/appCenter"
export default {
  name: 'CreateMessage',
  data () {
    return {
      visible: false,
      createMessageForm: [],
      rowId: null,
      loading: false,
      dsNasTypesOption: [],
      rules: {
        name: [{ required: true, message: '请输入文件源名称', trigger: 'blur' }],
        subSourceId: [{ required: true, message: '请选择输入源', trigger: 'change' }],
        pubSourceId: [{ required: true, message: '请选择输出源', trigger: 'change' }]
      }
    }
  },
  mounted () {
  },
  methods: {
    showModal (record) {
      this.visible = true
      this.createMessageForm = { ...record }
      this.getDsTypesList()
    },
    createData () {
      this.$refs.ruleForm.validate(valid => {
        if (!valid) return false
        this.loading = true
        const method = this.createMessageForm.id ? 'put' : 'post'
        messageSource.inferenceDataSourceConf(this.createMessageForm, method).then(res => {
          this.loading = false
          if (res.code !== 0) return false
          this.$message.success('操作成功')
          this.$emit('addDirectory')
          this.visible = false
        })
      })
    },
    async getDsTypesList () {
      const data = await getdDataSourceInfo({ dsTypes: 'RV,KAFKA', limit: 9999 })
      if (data.code === 0) {
        this.dsNasTypesOption = data.data
      }
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