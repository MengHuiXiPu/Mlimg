<template>
  <a-modal
    :visible="visible"
    title="复判任务配置"
    :ok-button-props="{ props: {
      disabled: saveLoading,
      loading: saveLoading
    }}"
    @ok="createData"
    @cancel="cancelCreateData"
    :maskClosable="false"
    centered
    wrapClassName="addOPCodeTask"
  >
    <a-spin :spinning="loading">
      <a-form-model
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        ref="ruleForm"
        layout="horizontal"
        :rules="rules"
        :model="rowData"
      >
        <a-form-model-item label="复判任务名称" prop="reviewTaskName">
          <a-input v-model="rowData.reviewTaskName" />
        </a-form-model-item>
      </a-form-model>
    </a-spin>
  </a-modal>
</template>

<script>
import {
  esdReview,
  lscReview
} from '@/api/appCenter'
export default {
  name: 'addOPCodeTask',
  data () {
    return {
      rules: {
        reviewTaskName: [{ required: true, message: '请输入复判任务名称', trigger: 'blur' }]
      },
      visible: false,
      rowId: null,
      loading: false,
      saveLoading: false,
      rowData: {},
      type: 1,
      api: [esdReview, esdReview, esdReview, lscReview]
    }
  },
  mounted () {
  },
  methods: {
    async showModal (record, type) {
      this.visible = true
      if (this.$refs.ruleForm) {
        this.$refs.ruleForm.resetFields()
      }
      this.type = type
      this.rowData = JSON.parse(JSON.stringify(record))
    },
    createData () {
      this.$refs.ruleForm.validate(valid => {
        if (!valid) {
          return false
        } else {
          this.saveLoading = true
          this.api[this.type].saveResult(this.rowData).then(data => {
            this.saveLoading = false
            if (data.code === 0) {
              this.$message.success('操作成功')
              this.$emit('addSuccess')
              this.visible = false
            }
          })
        }
      })
    },
    cancelCreateData () {
      this.$refs.ruleForm.resetFields()
      this.visible = false
    }
  }
}
</script>

<style lang="less">
.addOPCodeTask{
  overflow-x: hidden;
  .ant-modal-body{
    padding-top: 20px;
  }
  .ant-form{
    .ant-form-item{
      // margin-bottom: 0
    }
    .form-model-item-title{
      .ant-form-item-label{
        text-align: left;
        padding-left: 10px;
        overflow: inherit;
        label{
          font-weight: bold;
          font-size: 16px;
          &::before{
            content: '';
            position: absolute;
            left: -8px;
            top: 0;
            width: 3px;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
          }
          &::after{
            content: '';
          }
        }
      }
    }
  }
}
</style>