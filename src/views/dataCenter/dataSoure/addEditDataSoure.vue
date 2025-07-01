<template>
  <a-modal
    :visible="visible"
    wrapClassName="AddEditDataSoureDialog"
    :closable="false"
    :maskClosable="false"
    :destroyOnClose="true"
    :dialog-style="{ top: '5vh' }"
    :title="dataSetTitle"
    width="700px">
    <!-- <div slot="title" class="title" style="font-size: 22px;">
      {{ dataSetTitle }}
      <a-button v-if="parentData.id" :loading="loading" class="connect-btn" @click="handleConnect(false)">连接测试</a-button>
    </div> -->
    <a-form-model :label-col="{ span: 4 }" :wrapper-col="{ span: 16 }" ref="ruleForm" layout="horizontal" :model="parentData" :rules="rules" class="form-model scrollbar">
      <a-form-model-item label="数据源名称" prop="dsName">
        <a-input :maxLength="50" v-model="parentData.dsName" />
      </a-form-model-item>
      <a-form-model-item label="数据源描述" prop="dsDescribe">
        <a-input v-model="parentData.dsDescribe" type="textarea" :rows="3"/>
      </a-form-model-item>
      <a-form-model-item label="数据源类型" prop="dsType">
        <!-- <a-select v-model="parentData.dsType" :disabled="Boolean(parentData.id)" @change="handleTypeChange">
          <a-select-option
            v-for="(item,key) in typeOption"
            :key="key"
            :value="item.value">
            {{ item.title }}
          </a-select-option>
        </a-select> -->
        <a-radio-group v-model="parentData.dsType" :disabled="Boolean(parentData.id)" @change="handleTypeChange">
          <a-radio value="NAS">NAS</a-radio>
          <!-- <a-radio :value="NFS">NFS</a-radio> -->
        </a-radio-group>
      </a-form-model-item>
      <a-form-model-item label="协议类型" prop="protocolType">
        <a-select v-model="parentData.protocolType" :disabled="Boolean(parentData.id)" @change="handleProtocolChange">
          <a-select-option :value="0"> nfs </a-select-option>
          <a-select-option :value="1"> smb </a-select-option>
        </a-select>
      </a-form-model-item>
      <div v-if="parentData.protocolType === 1">
        <a-form-model-item label="账号" prop="dsUsername">
          <a-input :disabled="Boolean(parentData.id)" v-model="parentData.dsUsername" />
        </a-form-model-item>
        <a-form-model-item label="密码" prop="dsPassword">
          <a-input :disabled="Boolean(parentData.id)" v-model="parentData.dsPassword" type="password"/>
        </a-form-model-item>
        <a-form-model-item label="NAS IP地址" prop="dsIp" >
          <a-input :disabled="Boolean(parentData.id)" v-model="parentData.dsIp" placeholder="10.10.10.1"/>
        </a-form-model-item>
        <a-form-model-item label="NAS 远程目录" prop="reservedFields1" >
          <a-input :disabled="Boolean(parentData.id)" v-model="parentData.reservedFields1" placeholder="/home/t1/array/1111"/>
        </a-form-model-item>
        <a-form-model-item label="挂载映射目录" prop="reservedFields2">
          <a-input :disabled="Boolean(parentData.id)" v-model="parentData.reservedFields2" placeholder="/"/>
        </a-form-model-item>
      </div>

      <div v-if="parentData.protocolType === 0">
        <a-form-model-item label="NAS IP地址" prop="dsIp">
          <a-input v-model="parentData.dsIp" placeholder="10.10.10.1" :disabled="Boolean(parentData.id)"/>
        </a-form-model-item>
        <a-form-model-item label="NAS 远程目录" prop="reservedFields1">
          <a-input v-model="parentData.reservedFields1" placeholder="/home/t1/array/1111" :disabled="Boolean(parentData.id)"/>
        </a-form-model-item>
        <a-form-model-item label="挂载映射目录" prop="reservedFields2">
          <a-input :disabled="Boolean(parentData.id)" v-model="parentData.reservedFields2" placeholder="/"/>
        </a-form-model-item>
      </div>
      <!-- <a-form-model-item label="项目">
        <a-input v-model="parentData.program" placeholder="项目信息"/>
      </a-form-model-item> -->
    </a-form-model>
    <template slot="footer">
      <a-button key="back" @click="handleCancel">取消</a-button>
        <a-button type="primary" :loading="testLoading" @click="handleConnect(false)">连接测试</a-button>
        <a-button type="primary" :loading="loading" @click="handleOk(true)">保存</a-button>
    </template>
  </a-modal>
</template>

<script>
import {
  saveDataSoure,
  editDataSoure,
  contectDataSoureTest,
  checkDataSourceNameAvl
} from "@/api/dataCenter"
import { KafkaIPReg, RVIPReg, networkIPReg } from '@/utils/util'
import { validateAccount } from "@/utils/validate.js";
export default {
  name: "AddEditDataSoureDialog",
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    dataSetTitle: {
      type: String,
      default: ""
    },
    parentData: {
      type: Object,
      default: () => {}
    },
    pageData: {
      type: Object,
      default: () => {}
    },
    dataName: {
      type: String,
      default: ''
    }
  },
  data () {
    const validatedsIp = (rule, value, callback) => {
      // const ipReg = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(value)) {
        callback(new Error('请输入正确的主机地址,如10.10.10.1'))
      } else {
        callback()
      }
    }
    const validatedsPort = (rule, value, callback) => {
      const port = Number(value)
      const showErr = !(/^[0-9]\d*$/.test(port) && 1 * port >= 0 && 1 * port <= 65535)
      if (value === '') {
        callback(new Error('请输入端口'))
      } else if (showErr) {
        callback(new Error("您的端口不符合范围：0-65535"))
      } else {
        callback()
      }
    }
    const validatenetwork = (rule, value, callback) => {
      const showErr = !networkIPReg.test(value)
      if (value === '') {
        callback(new Error('请输入network'))
      } else if (showErr) {
        callback(new Error("请输入正确的地址，如 10.10.10.1:8080"))
      } else {
        callback()
      }
    }
    const checkName = async (rule, value, callback) => {
      if (!value || !value.trim()) {
        callback(new Error('当前值不能为空'))
      } else {
        if (value === this.dataName) return callback()
        const checkData = await checkDataSourceNameAvl({
          dataSourceName: value
        })
        if (checkData.data) {
          callback()
        } else {
          callback(new Error('当前名称已存在，请重新输入'))
        }
      }
    }
    return {
      rules: {
        dsName: [
          {
            required: true,
            message: "请输入数据源名称",
            trigger: "blur"
          }, {
            required: true,
            validator: checkName,
            trigger: "blur"
          }
        ],
        dsIp: [
          { required: true, message: "请输入NAS IP地址", trigger: "blur" },
          { required: true, validator: validatedsIp, trigger: ['blur'] }
        ],
        dsSubject: [
          { required: true, message: "请输入主题", trigger: "blur" }
        ],
        cmName: [
          { required: true, message: "请输入分组名称", trigger: "blur" }
        ],
        network: [
          // { required: true, message: "请输入network", trigger: "blur" },
          { required: true, validator: validatenetwork, trigger: ['blur'] }
        ],
        dsUsername: [
          { required: true, message: "请输入用户名", trigger: "blur" },
          { validator: validateAccount, trigger: "blur" }
        ],
        dsPassword: [
          { required: true, message: "请输入密码", trigger: "blur" }
        ],
        dsPort: [
          // { required: true, message: "请输入端口", trigger: "blur" },
          { required: true, validator: validatedsPort, trigger: ['blur'] }
          ],
        reservedFields1: [
          { required: true, message: '请输入NAS 远程目录', trigger: 'blur' }
        ],
        reservedFields2: [
          { required: true, message: '请输入挂载映射目录', trigger: 'blur' }
        ],
        protocolType: [
          { required: true, message: '请选择协议类型', trigger: 'change' }
        ],
        dsType: [
          {
            required: true,
            message: "请选择数据源类型",
            trigger: "change"
          }
        ],
        dsDataFormat: [
          {
            required: true,
            message: "请选择编码格式",
            trigger: "change"
          }
        ],
      },
      typeOption: [ //何炳龙 要求屏蔽掉rv和kafka
        //  {
        //   title: "RV",
        //   value: "RV"
        // },
        {
          title: "NAS",
          value: "NAS"
        },
        // {
        //   title: "KAFKA",
        //   value: "KAFKA"
        // },
        {
          title: "NFS",
          value: "NFS"
        }
      ],
      formatOption: [
        {
          value: "UTF-8",
          title: "UTF-8"
        },
        {
          value: "GBK",
          title: "GBK"
        },
        {
          value: "GB2312",
          title: "GB2312"
        },
        {
          value: "UTF-16",
          title: "UTF-16"
        },
        {
          value: "ASCII",
          title: "ASCII"
        }
      ],
      messageOption: [
        {
          title: "text",
          value: "text"
        },
        {
          title: "json",
          value: "json"
        },
      ],
      loading: false,
      testLoading: false,
    }
  },
  methods: {
    //切换协议
    handleProtocolChange() {
      // 重置表单校验
      this.$refs.ruleForm.clearValidate()
    },
    handleOk () {
      this.$refs.ruleForm.validate(valid => {
        if (!valid) {
          return false
        } else {
          this.loading = true
          const methods = this.parentData.id ? editDataSoure : saveDataSoure
          methods(this.parentData).then((data) => {
            this.loading = false
            if (data.code === 0) {
              this.$message.success(this.parentData.id ? "修改成功！" : "新增成功！")
              this.$emit("getDataList", {
                pageSize: this.parentData.id ? this.pageData.pageSize : 10,
                pageIndex: this.parentData.id ? this.pageData.current : 1
              })
              this.$emit("cancel")
              // this.$refs.ruleForm.resetFields()
            }
          }).catch(() => {
            this.loading = false
          })
        }
      })
    },
    handleCancel () {
      this.loading = false
      // this.$refs.ruleForm.resetFields()
      this.$emit("cancel")
    },
    handleConnect (type) {
      const that = this
      this.$refs.ruleForm.validate(valid => {
        if (!valid) {
          return false
        } else {
          that.testLoading = true
          const data = contectDataSoureTest(that.parentData)
          .then((data) => {
            console.log("data: ", data);
            if (data.code === 0) {
              that.testLoading = false
              that.parentData.status = 1
              if (type) {
                this.handleOk()
              } else {
                this.$message.success('连接成功')
              }
            } else {
              that.testLoading = false
              that.parentData.status = 2
              // this.$emit("cancel")
            }
          })
        }
      })
    },
    handleTypeChange () {
      this.parentData.dsIp = ""
      this.parentData.dsPort = ""
      this.parentData.network = ""
      // this.parentData.program = ""
      this.parentData.cmName = ''
      this.parentData.status = 3
      this.parentData.reservedFields2 = '/'
      this.$refs.ruleForm.clearValidate()
    }
  }
}
</script>

<style lang="less">
.AddEditDataSoureDialog{
  .ant-form-item-label {
    width: 110px;
  }
  .port .ant-form-item-label {
    width: 80px;
  }
  .ant-form-inline .ant-form-item {
    margin-bottom: 10px;
  }
  .title {
    display: flex;
    justify-content: space-between;
  }
  .form-model {
    max-height: 70vh;
    overflow: auto;
  }
}
</style>
