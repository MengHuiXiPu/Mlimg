<template>
  <a-modal
    :visible="visible"
    :title="title"
    :maskClosable="false"
    @cancel="handleCancel"
    width="700px"
  >
    <a-form-model
      ref="refConfigForm" class="create-model-form"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
      layout="horizontal"
      :model="formData"
      :rules="formRules">
      <a-form-model-item label="数据源名称" prop="name">
        <a-input :maxLength="50" v-model="formData.name" placeholder="请输入"/>
      </a-form-model-item>
      <a-form-model-item label="数据源描述" prop="remark">
        <a-input v-model="formData.remark" type="textarea" placeholder="请输入" :autosize="{ minRows: 3, maxRows: 10 }" :maxLength="500"/>
      </a-form-model-item>
      <a-form-model-item label="数据源类型" prop="type">
        <a-radio-group v-model="formData.type">
          <a-radio :value="0">Tibco RV</a-radio>
          <!-- <a-radio :value="true"></a-radio> -->
        </a-radio-group>
      </a-form-model-item>
      <a-form-model-item label="Network" prop="network">
        <a-input v-model="formData.network" placeholder="请输入"/>
      </a-form-model-item>
      <a-form-model-item label="Service" prop="service">
        <a-input v-model="formData.service" placeholder="请输入"/>
      </a-form-model-item>
      <a-form-model-item label="Daemon地址" prop="daemon">
        <a-input v-model="formData.daemon" placeholder="10.10.10.1:3000"/>
      </a-form-model-item>
      <a-form-model-item label="Subject Name" prop="subjectName">
        <a-input v-model="formData.subjectName" placeholder="请输入"/>
      </a-form-model-item>
    </a-form-model>
    <template slot="footer">
      <a-button key="back" @click="handleCancel">取消</a-button>
      <!-- <span> -->
        <a-button type="primary" :loading="testLoading" @click="handleTest">连接测试</a-button>
        <a-button type="primary" :loading="confirmLoading" @click="handleOk">保存</a-button>
      <!-- </span> -->
    </template>
  </a-modal>
</template>

<script>
import { validateName } from '@/utils';
import { addRVSource, updateRVSource, testRVSource } from "@/api/dataCenter.js";
import { networkIPReg } from '@/utils/util'
export default {
  data() {
    const validDaemon = (rule, value, callback) => {
      if (!networkIPReg.test(value)) {
        return callback(new Error("请输入正确的Network地址，如10.10.10.1:3000"));
      }
      callback();
    };
    return {
      confirmLoading: false,
      testLoading: false,
      formData: {
        id: undefined, // 标识是否是编辑
        name: "",
        remark: "",
        type: 0,
        service: "",
        network: "",
        daemon: "",
        subjectName: "",
      },
      formRules: {
        name: [
          { required: true, message: "请输入数据源名称", trigger: "blur" },
          { validator: validateName, trigger: ["blur", "change"] }
        ],
        type: [
          { required: true, message: "请选择数据源类型", trigger: "blur" }
        ],
        service: [
          { required: true, message: "请输入Service", trigger: "blur" }
        ],
        network: [
          { required: true, message: "请输入Network", trigger: "blur" },
        ],
        daemon: [
          { required: true, message: "请输入daemon地址", trigger: "blur" },
          { validator: validDaemon, trigger: ["blur"] }
        ],
        subjectName: [
          { required: true, message: "请输入Subject Name", trigger: "blur" }
        ]
      }
    }
  },
  computed: {
    title() {
      return this.formData.id ? "编辑消息队列源" : "新建消息队列源"
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
  },
  methods: {
    // 测试连接
    handleTest() {
      // 校验是否填写daemon，填写后才可进行连接测试
      this.$refs.refConfigForm.validateField("daemon", errorMessage => {
        if (errorMessage) return
        this.testLoading = true
        const { daemon } = this.formData
        testRVSource(daemon).then(res => {
          if (res.code === 0 && res.data === true) {
            this.$message.success("连接成功")
          } else {
            this.$message.error("连接失败")
          }
        }).finally(() => {
          this.testLoading = false
        })
      })
    },
    handleCancel() {
      this.$emit("update:visible", false)
    },
    handleOk() {
      this.$refs.refConfigForm.validate(valid => {
        if (!valid) {
          return false
        }
        const { id, status } = this.formData
        // 如果是修改，且修改前状态是连接正常，需要二次弹框确认
        if (id && status == 1) {
          return this.$confirm({
            title: "编辑数据源",
            content: "请确认是否进行RV配置的修改，修改可能会对使用了该RV源的应用造成影响，请谨慎操作！",
            width: 500,
            onOk: () => {
              this.handleSave()
            }
          })
        }
        this.handleSave()
      })
    },
    async handleSave() {
      const { id, name, remark, type, service, network, daemon, subjectName } = this.formData
      this.confirmLoading = true
      const method = id ? updateRVSource : addRVSource
      const res = await method({
        id,
        name,
        remark,
        type,
        service,
        network,
        daemon,
        subjectName
      })
      this.confirmLoading = false
      if (res.code === 0) {
        this.$message.success("保存成功")
        this.$emit("update:visible", false)
        this.$emit("success")
      }
    },
    /**
     * @public 编辑时，将原有数据带入
     */
    setFormData(record) {
      const { name, remark, type = 0, service, network, daemon, subjectName, id, status } = record
      this.formData = {
        id,
        name,
        remark,
        type,
        service,
        network,
        daemon,
        subjectName,
        status,
      }
    }
  },
  mounted() {

  }
}
</script>

<style lang="less" scoped>
</style>