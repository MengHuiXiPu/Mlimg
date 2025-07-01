<template>
  <a-modal
    :visible="visible"
    :title="modalTitle"
    @ok="handleOk"
    @cancel="handleCancel"
    :maskClosable="false"
    :confirm-loading="confirmLoading"
    width="600px"
  >
    <a-form-model
      ref="refConfigForm" class="import-scheme-form"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 17 }"
      layout="horizontal"
      :model="formData"
      :rules="formRules">
      <a-form-model-item label="模板名称" prop="name">
        <a-input :maxLength="128" v-model="formData.name"/>
      </a-form-model-item>
      <a-form-model-item label="模板描述" prop ="algorithmDescribe" v-if="!this.formData.id">
        <a-input v-model="formData.desc" type="textarea" placeholder="请输入" :autosize="{ minRows: 3, maxRows: 10 }" :maxLength="512"/>
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>
<script>
import { validateName } from '@/utils';
import { saveTemp } from "@/api/tempMake.js";
export default {
  data() {
    return {
      confirmLoading: false,
      formData: {
        id: null,
        name: '',
        desc: '',
      },
      formRules: {
        name: [
          { required: true, message: "模板名称", trigger: "blur" },
          { validator: validateName, trigger: ["blur", "change"] }
        ],
      }
    }
  },
  computed: {
    modalTitle() {
      return this.formData.id ? '更新模板' : '新建模板'
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
  },
  methods: {
    handleCancel() {
      this.$emit("update:visible", false)
    },
    handleOk() {
      this.$refs.refConfigForm.validate(valid => {
        if (!valid) {
          return false
        }
        const { name, desc, id } = this.formData
        this.confirmLoading = true
        const params = {
          name,
        }
        if (id) {
          params.id = id //update 信息，否则会create
        } else { //update 时，不需要desc，仅重命名
          params.desc = desc
        }
        saveTemp(params).then(res => {
          if (res?.code === 0) {
            const msg = this.formData.id ? '更新成功' : '创建成功'
            this.$message.success(msg)
            this.handleCancel()
            this.$emit("success")
          }
        }).finally(() => {
          this.confirmLoading = false
        })
      })
    },
    /**
     * @public
     */
    initState(item) {
      this.formData = {
        id: item.id,
        name: item.name,
        desc: item.desc,
      }
    }
  },
}
</script>