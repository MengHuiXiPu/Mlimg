<template>
  <a-modal
    :visible="visible"
    title="切换角色"
    @ok="handleOk"
    @cancel="handleCancel"
    :maskClosable="false"
  >
    <template slot="footer">
      <a-button key="back" @click="handleCancel">
        取消
      </a-button>
      <a-button key="submit" type="primary" :loading="loading" @click="handleOk">
        确定
      </a-button>
    </template>
    <a-form-model
      :model="form"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      ref="ruleForm"
      :rules="rules"
      layout="horizontal"
    >
      <a-form-model-item label="选择节点" prop="roleType">
        <a-select v-model="form.roleType">
          <a-select-option v-for="item in roleList" :key="item.value" :value="item.value">
            {{ item.name }}
          </a-select-option>
        </a-select>
      </a-form-model-item>
    </a-form-model>
    <span style="margin-left:12px;color:red">修改主机角色会变更主机可执行的任务类型，请谨慎修改！</span>
  </a-modal>
</template>

<script>
import system from "@/api/system"
export default {
  name: "changeRole",
  data () {
    return {
      visible: false,
      loading: false,
      form: {
        role: '', // 请求不是这个值，这里只是为了显示再input中并校验
      },
      rules: {
        role: [{ required: true, message: '请选择角色', trigger: 'change' }],
      },
      roleList: [{
        value: 1,
        name: '在线'
      }, {
        value: 2,
        name: '离线'
      }, {
        value: 3,
        name: '混合'
      }]
    }
  },
  methods: {
    showModal (record = {}) {
      this.visible = true
      this.form = {
        hostIp: record.hostIp,
        roleType: record.hostRole
      }
    },
    handleOk () {
      this.$refs.ruleForm.validate(async (valid) => {
        if (!valid) {
          return false
        } else {
          this.loading = true
          const params = {
            ...this.form
          }
          const res = await system.monitor.changeRole(params)
          this.loading = false
          if (res.code !== 0) return false
          this.$message.success('移动成功')
          this.handleCancel()
          this.$emit('reload')
        }
      })
    },
    handleCancel () {
      this.$refs.ruleForm.resetFields()
      this.visible = false
    }
  }
}
</script>

<style scoped>
</style>
