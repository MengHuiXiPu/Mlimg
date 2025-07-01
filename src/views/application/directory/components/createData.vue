<template>
  <a-modal
    :visible="visible"
    :title="rowId ? '修改数据' : '新增数据'"
    :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
    @ok="createData"
    @cancel="cancelCreateData"
    :maskClosable="false"
  >
    <div v-for="(item, index) in createDataForm" :key="item.id">
      <a-form-model
        :model="item"
        ref="ruleForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        layout="horizontal"
      >
        <template v-if="index === createDataForm.length - 1">
          <a-form-model-item
            :label="item.name">
            <a-input :maxLength="50" v-model="item.value"/>
          </a-form-model-item>
        </template>
        <template v-else>
          <a-form-model-item
            :label="item.name"
            :help="item.validText"
            :validateStatus="item.valid"
            required>
            <a-input :maxLength="50" v-model="item.value" @blur="validChange(item)" />
          </a-form-model-item>
        </template>
      </a-form-model>
    </div>
  </a-modal>
</template>

<script>
import {
  inferenceCatalogInfo
} from "@/api/appCenter"
export default {
  name: 'CreateData',
  props: {
    directoryTableData: {
      type: Array,
      default: () => [],
      required: false
    }
  },
  data () {
    return {
      visible: false,
      loading: false,
      createDataForm: [],
      rowId: null,
      rules: { required: true, messaage: '当前值不能为空', trigger: 'blur' }
    }
  },
  mounted () {
  },
  methods: {
    showModal (record) {
      this.visible = true
      this.rowId = record?.recordId
      this.createDataForm = this.directoryTableData.map(item => {
        return {
          recordId: this.rowId || null,
          value: record ? record[item.name] : '',
          confId: item.id,
          name: item.name,
          valid: '',
          validText: ''
        }
      })
    },
    createData () {
      const errorList = this.createDataForm.filter((item, index) => {
        if (item.value === '') {
          item.valid = 'error'
          item.validText = '当前值不能为空'
        } else {
          item.valid = ''
          item.validText = ''
        }
        return item.value === '' && index !== this.createDataForm.length - 1
      })
      if (errorList.length > 0) return false
      this.loading = true
      const method = this.rowId ? 'put' : 'post'
      inferenceCatalogInfo(this.createDataForm, method).then(res => {
        this.loading = false
        if (res.code !== 0) return false
        this.$message.success('操作成功')
        this.$emit('addDirectory')
        this.visible = false
      })
    },
    validChange (item) {
      if (item.value === '') {
        item.valid = 'error'
        item.validText = '当前值不能为空'
      } else {
        item.valid = ''
        item.validText = ''
      }
    },
    cancelCreateData () {
      this.visible = false
      this.createDataForm = []
    }
  }
}
</script>