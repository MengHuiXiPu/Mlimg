<template>
  <a-modal
    :visible="visible"
    title="开单配置"
    :ok-button-props="{ props: {
      disabled: saveLoading,
      loading: saveLoading
    }}"
    @ok="createData"
    width="1000px"
    @cancel="cancelCreateData"
    :maskClosable="false"
    centered
    wrapClassName="addBilling"
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
        <a-form-model-item label="在线任务" prop="taskId">
          <a-select v-model="rowData.taskId" @change="getTaskInfo(rowData.taskId)" showSearch :filter-option="filterOption" :disabled="rowData.id">
            <a-select-option
              v-for="item in taskDataList"
              :key="item.id"
              :value="item.id"
            >{{ item.taskName }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="开单题库" prop="kdDatalistId">
          <a-select v-model="rowData.kdDatalistId" showSearch :filter-option="filterOption" :disabled="rowData.id">
            <a-select-option
              v-for="item in dataSetList"
              :key="item.id"
              :value="item.id"
            >{{ item.dlName }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item class="form-model-item-title four" label="开单阈值设置">
        </a-form-model-item>
        <!-- <p-switch-form-item label="置信度阈值" prop="kdFieldValue">
          <p-input v-model="rowData.kdFieldValue" type="textarea" :disabled="rowData.id"/>
        </p-switch-form-item> -->
        <a-form-model-item label="code阈值" style="max-height: 200px;overflow-y: auto">
          <a-popconfirm
            ok-text="确定"
            cancel-text="取消"
            @confirm="addCodeFun"
            @cancel="addCode = ''"
          >
            <span slot="icon"></span>
            <template slot="title">
              Code：<a-input v-model="addCode"></a-input>
            </template>
            <span style="cursor: pointer;font-size: 18px" v-if="codeThresholdList.length === 0 && !rowData.id">
              <a-icon type="plus-circle" theme="twoTone" two-tone-color="#52c41a" />
            </span>
          </a-popconfirm>
          <a-form-model-item v-for="(item, index) in codeThresholdList" :key="index" :label="item.label">
            <a-row>
              <a-col :span="15">
                <a-slider :disabled="rowData.id" v-model="item.value" :min="0" :max="1.1" :step="0.0001" />
              </a-col>
              <a-col :span="5">
                <a-input-number
                  v-model="item.value"
                  :min="0"
                  :max="1.1"
                  :step="0.0001"
                  style="marginLeft: 16px"
                  :disabled="rowData.id"
                />
              </a-col>
              <a-col v-if="!rowData.id" :span="1">
                <span @click="codeThresholdList.splice(index, 1)" style="cursor: pointer;font-size: 18px">
                  <a-icon type="minus-circle" theme="twoTone" two-tone-color="red" />
                </span>
              </a-col>
              <a-col :span="1" v-if="index === codeThresholdList.length - 1 && !rowData.id">
                <a-popconfirm
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="addCodeFun"
                  @cancel="addCode = ''"
                >
                  <span slot="icon"></span>
                  <template slot="title">
                    Code：<a-input v-model="addCode"></a-input>
                  </template>
                  <span style="cursor: pointer;font-size: 18px">
                    <a-icon type="plus-circle" theme="twoTone" two-tone-color="#52c41a" />
                  </span>
                </a-popconfirm>
              </a-col>
            </a-row>
          </a-form-model-item>
        </a-form-model-item>
        <a-form-model-item class="form-model-item-title four" label="业务配置">
        </a-form-model-item>
        <a-form-model-item label="业务参数" prop="businessParam">
          <a-input v-model="rowData.businessParam" type="textarea" :disabled="rowData.id"/>
        </a-form-model-item>
        <a class="showAdvanced">
          <span @click="showAdvanced = true" v-if="!showAdvanced">显示高级设置</span>
          <span @click="showAdvanced = false" v-else>隐藏高级设置</span>
        </a>
        <template v-if="showAdvanced">
          <a-form-model-item class="form-model-item-title" label="资源配置">
          </a-form-model-item>
          <a-form-model-item label="资源模式" prop="resourceType">
            <a-select v-model="rowData.resourceType" :disabled="rowData.id">
              <a-select-option :value="2">GPU模式</a-select-option>
              <a-select-option :value="1">CPU模式</a-select-option>
            </a-select>
            <div class="resource">
              <a-form-model-item label="CPU" prop="cpuCore">
                <a-input-number
                  :min="1"
                  :precision="0"
                  v-model="rowData.cpuCore"/>
                <span class="type">核</span>
              </a-form-model-item>
              <a-form-model-item label="内存" prop="cpuMem">
                <a-input-number
                  :min="0"
                  v-model="rowData.cpuMem"/>
                <span class="type">GB</span>
              </a-form-model-item>
              <template v-if="rowData.resourceType === 2" prop="gpuCore">
                <a-form-model-item label="GPU">
                  <a-input-number
                    disabled
                    v-model="rowData.gpuCore"/>
                  <span class="type">张</span>
                </a-form-model-item>
                <a-form-model-item label="显存" prop="gpuMem">
                  <a-input-number
                    :min="0"
                    :max="rowData.gpuMaxSize || 8"
                    :step="0.001"
                    :precision="3"
                    v-model="rowData.gpuMem"/>
                  <span class="type">GB</span>
                  <a-tooltip
                    class="gpuNumber"
                    :style="{
                      position: 'absolute',
                      'margin-left': '10px',
                      color: '#ccc',
                      'line-height': '40px',
                      cursor: 'pointer'
                    }"
                  >
                    <template slot="title">
                      {{ `当前GPU最大显存：${rowData.gpuMaxSize}GB` }}
                    </template>
                    <a-icon type="question-circle" />
                  </a-tooltip>
                </a-form-model-item>
              </template>
            </div>
          </a-form-model-item>
        </template>
      </a-form-model>
    </a-spin>
  </a-modal>
</template>

<script>
import {
  getApplicationcenterList,
  billing,
  getModelById
} from '@/api/appCenter'
import {
  getDataSetList
} from "@/api/dataCenter"
import { getResourceConfig } from '@/utils/util'
import { getK8SDataInfo, getModelInfoById } from '@/api/modelManage'
export default {
  name: 'AddBilling',
  data () {
    const confirmJSON = (rule, value, callback) => {
      if (!value) {
        // callback(new Error('业务参数不能为空'))
        callback()
      } else {
        if (!isNaN(value)) {
          return callback(new Error('当前参数不符合JSON规范，请重新填写'))
        }
        try {
          const jsonString = JSON.parse(value)
        } catch (err) {
          return callback(new Error('当前参数不符合JSON规范，请重新填写'))
        }
        callback()
      }
    }
    const gpuValidator = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('请输入gpu核心数!'))
      } else {
        callback()
        // if (Number(value) > (this.k8sDataInfo.gpuCapacity - this.k8sDataInfo.gpuUsed)) {
        //   callback(new Error('剩余GPU数量不足，请确认后重新输入!'))
        // } else {
        //   callback()
        // }
      }
    }
    const gpuMemory = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('请输入gpu显存数!'))
      } else {
        if (Number(value) > this.rowData.gpuMaxSize) {
          return callback(new Error('剩余GPU显存不足，请确认后重新输入!'))
        } else {
          return callback()
        }
      }
    }
    return {
      rules: {
        taskId: [{ required: true, message: '请选择在线任务', trigger: 'change' }],
        kdDatalistId: [{ required: true, message: '请选择开单题库', trigger: 'change' }],
        resourceType: [
          {
            required: true,
            message: "请选择资源模型",
            trigger: "change"
          }
        ],
        kdFieldValue: [{ required: true, message: '请输入置信度阈值!', trigger: 'blur' }, {
          validator: confirmJSON,
          trigger: 'blur'
        }],
        businessParam: [{
          validator: confirmJSON,
          trigger: 'blur'
        }],
        cpuCore: [{ required: true, message: '请输入cpu核心数!', trigger: 'blur' }],
        cpuMem: [{ required: true, message: '请输入cpu内存数!', trigger: 'blur' }],
        // gpuCore: [{ required: true, message: '请输入gpu核心数!', trigger: 'blur' }],
        gpuCore: [{ required: true, validator: gpuValidator, trigger: 'blur' }],
        gpuMem: [{ required: true, validator: gpuMemory, trigger: 'blur' }]
      },
      visible: false,
      rowId: null,
      loading: false,
      saveLoading: false,
      rowData: {},
      k8sDataInfo: {},
      taskDataList: [],
      dataSetList: [],
      showAdvanced: false,
      addCode: '',
      codeThresholdList: [],
    }
  },
  mounted () {
    this.getK8SData()
  },
  methods: {
    async getK8SData () {
          const data = await getK8SDataInfo();
          if (data.code !== 0) return false;
          let datajson = JSON.stringify(data?.data);
          if (typeof (datajson) == "undefined") return false;
          this.k8sDataInfo = JSON.parse(datajson);
    },
    async showModal (record) {
      this.visible = true
      this.tableData = []
      if (this.$refs.ruleForm) {
        this.$refs.ruleForm.resetFields()
      }
      if (record?.id) {
        this.rowData = JSON.parse(JSON.stringify(record))
        this.getCodeThresholdList(this.rowData.kdFieldValue)
        const res = await getResourceConfig()
        this.rowData = {
          ...this.rowData,
          gpuMaxSize: res.gpu_size_max
        }
      } else {
        const res = await getResourceConfig()
        this.rowData = {
          cpuCore: res.cpu_core_default || 1,
          cpuMem: res.cpu_size_default || 2,
          gpuCore: res.gpu_core_default || 1,
          gpuMem: res.gpu_size_default || 2,
          gpuMaxSize: res.gpu_size_max,
          resourceType: 2,
          businessParam: '',
          kdFieldValue: ''
        }
      }
      this.getTaskDataList()
      this.getDataSetList()
    },
    async getTaskDataList () {
      const responseData = await getApplicationcenterList({
        limit: 9999
      })
      if (responseData.code === 0) {
        this.taskDataList = responseData.data.records
      }
    },
    async getDataSetList () {
      const responseData = await getDataSetList({
        limit: 9999,
        dlType: 3
      })
      if (responseData.code === 0) {
        this.dataSetList = responseData.data.records.filter(item => item.status === 2)
      }
    },
    async getTaskInfo (id) {
      const config = this.taskDataList.filter(item => {
        return item.id === id
      })[0]
      if (config.configId) {
        const res = await getModelById(config.configId)
        if (res.code !== 0) return false
        this.rowData.businessParam = res.data.businessParam
        this.getCodeThresholdList(res.data.codeThreshold)
        this.rowData.kdFieldValue= res.data.codeThreshold
      } else {
        this.getModelInfo(config.modelId)
      }
    },
    async getModelInfo (id) {
      const res = await getModelInfoById(id)
      if (res.code !== 0) return false
      this.rowData.businessParam = res.data.businessParam
      this.getCodeThresholdList(res.data.codeThreshold)
      this.rowData.kdFieldValue= res.data.codeThreshold
    },
    createData () {
      this.$refs.ruleForm.validate(valid => {
        if (!valid) {
          return false
        } else {
          this.saveLoading = true
          this.rowData.taskName = this.taskDataList.filter(item => {
            return item.id === this.rowData.taskId
          })[0].taskName
          this.rowData.kdDatalistName = this.dataSetList.filter(item => {
            return item.id === this.rowData.kdDatalistId
          })[0].dlName
          const codeThreshold = {}
          this.codeThresholdList.forEach(item => {
            codeThreshold[item.label] = item.value
          })
          this.rowData.kdFieldValue = JSON.stringify({ ...codeThreshold })
          const method = this.rowData.id ? 'put' : 'post'
          billing.addBilling(this.rowData, method).then(data => {
            this.saveLoading = false
            if (data.code === 0) {
              this.$emit("getDataList")
              this.cancelCreateData()
              this.$message.success(this.rowData.id ? "修改成功" : '新建成功')
            }
          })
        }
      })
    },
    cancelCreateData () {
      this.$refs.ruleForm.resetFields()
      this.codeThresholdList = []
      this.visible = false
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
    addCodeFun () {
      if (!/^\w+/.test(this.addCode)) {
        this.$message.warning('只能输入字母、数字和下划线')
        return false
      }
      this.codeThresholdList.push({
        label: this.addCode,
        value: 0.5
      })
      this.addCode = ''
    },
    getCodeThresholdList (val) {
      try {
        const data = JSON.parse(val)
        this.codeThresholdList = Object.keys(data).map(item => {
          return {
            label: item,
            value: data[item]
          }
        })
      } catch (err) {
        this.codeThresholdList = []
      }
    },
  }
}
</script>

<style lang="less">
.addBilling{
  overflow-x: hidden;
  .tcl-modal-body{
    padding-top: 20px;
  }
  .tcl-form{
    .showAdvanced{
      text-align: right;
      color: #4b91f9;
      padding-right: 49px!important;
      margin-bottom: -24px;
      line-height: 32px;
      z-index: 1;
      span{
        cursor: pointer;
      }
    }
    .form-model-item-title{
      .tcl-form-item-label{
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

<style lang="less" scoped>
/deep/.tcl-form-item-control {
  width: calc(100% - 35px);
}
/deep/ .resource{
  margin-top: 10px;
  &>*{
    width: 25%;
    float: left;
    .tcl-form-item-label{
      width: 60px;
    }
    /deep/.tcl-form-item-control {
      width: 100%;
      .type{
        margin-left: 5px;
      }
    }
  }
}
</style>