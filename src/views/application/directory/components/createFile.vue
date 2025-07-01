<template>
  <a-modal
    :visible="visible"
    :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
    destroyOnClose
    @ok="createData"
    @cancel="cancelCreateData"
    :maskClosable="false"
  >
    <template slot="title">
      <span>{{ createFileForm.id ? '编辑文件源' : '新增文件源' }}</span>
      <a-popover title="路径规则：" placement="bottomLeft">
        <template slot="content">
          <pre
            class="modelLog"
            :style="{
              'white-space': warpType ? 'pre-line' : 'nowrap',
              color: '#000'
            }">
            &lt;MESSAGE.BODY.PRODUCTNAME&gt;[0:8]尖括号内的值表示要从RV消息中解析；<br/>
            中括号的值表示要截取字符串的长度，包括左边界但不包括右边界
          </pre>
        </template>
        <span style="cursor: pointer; margin-left: 10px"><a-icon type="question-circle" /></span>
      </a-popover>
    </template>
    <a-form-model
      :model="createFileForm"
      ref="ruleForm"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      :rules="rules"
      layout="horizontal"
    >
      <a-form-model-item label="文件源名称" prop="name">
        <a-input v-model="createFileForm.name" />
      </a-form-model-item>
      <a-form-model-item label="文件源" prop="fileSourceId">
        <a-select v-model="createFileForm.fileSourceId">
          <a-select-option
            v-for="(item,key) in dsNasTypesOption"
            :key="key"
            :value="item.id"
          >{{ item.dsName }}</a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item label="CSV文件路径" prop="csvReadPath">
        <a-input v-model="createFileForm.csvReadPath" />
      </a-form-model-item>
      <a-form-model-item label="图片路径" prop="imgReadPath">
        <a-input v-model="createFileForm.imgReadPath" />
      </a-form-model-item>
      <a-form-model-item label="OP判CODE路径" prop="csvJudgePath">
        <a-input v-model="createFileForm.csvJudgePath" />
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
import { fileSource, getdDataSourceInfo } from "@/api/appCenter"
export default {
  name: 'CreateFile',
  data () {
    return {
      visible: false,
      createFileForm: [],
      rowId: null,
      loading: false,
      dsNasTypesOption: [],
      rules: {
        name: [{ required: true, message: '请输入文件源名称', trigger: 'blur' }],
        fileSourceId: [{ required: true, message: '请选择文件源', trigger: 'change' }],
        csvReadPath: [{ required: true, message: '请输入CSV文件路径', trigger: 'blur' }],
        imgReadPath: [{ required: true, message: '请输入图片路径', trigger: 'blur' }],
        csvJudgePath: [{ required: true, message: '请输入OP判CODE路径', trigger: 'blur' }]
      }
    }
  },
  mounted () {
  },
  methods: {
    showModal (record) {
      this.visible = true
      this.createFileForm = record?.id ? { ...record } : {
        id: null,
        fileSourceId: '',
        csvReadPath: '/LINK/<MESSAGE.BODY.EQPTYPE>/<MESSAGE.BODY.PRODUCTSPECNAME>/<MESSAGE.BODY.PRODUCTNAME>[0:5]/<MESSAGE.BODY.PRODUCTNAME>[0:8]/<MESSAGE.BODY.PRODUCTNAME>',
        imgReadPath: '/<MESSAGE.BODY.EQPTYPE>/<MESSAGE.BODY.PRODUCTSPECNAME>/<MESSAGE.BODY.PRODUCTNAME>[0:5]/<MESSAGE.BODY.PRODUCTNAME>[0:8]/<MESSAGE.BODY.PRODUCTNAME>/Image',
        csvJudgePath: '/TBMRE/<MESSAGE.BODY.PRODUCTSPECNAME>/<MESSAGE.BODY.PRODUCTNAME>[0:5]/<MESSAGE.BODY.PRODUCTNAME>[0:8]/<MESSAGE.BODY.PRODUCTNAME>/Source'
      }
      this.getDsTypesList()
    },
    createData () {
      this.$refs.ruleForm.validate(valid => {
        if (!valid) return false
        this.loading = true
        const method = this.createFileForm.id ? 'put' : 'post'
        fileSource.inferenceFileSourceConf(this.createFileForm, method).then(res => {
          this.loading = false
          if (res.code !== 0) return false
          this.$message.success('操作成功')
          this.$emit('addDirectory')
          this.visible = false
        })
      })
    },
    async getDsTypesList () {
      const data = await getdDataSourceInfo({ dsTypes: 'NAS,NFS' })
      if (data.code === 0) {
        this.dsNasTypesOption = data.data
      }
    },
    cancelCreateData () {
      this.visible = false
      this.$refs.ruleForm.resetFields()
    }
  }
}
</script>