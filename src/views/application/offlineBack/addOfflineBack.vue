<template>
  <a-modal
    :visible="visible"
    title="任务配置"
    :ok-button-props="{ props: {
      disabled: saveLoading,
      loading: saveLoading
    }}"
    @ok="createData"
    width="1000px"
    @cancel="cancelCreateData"
    :maskClosable="false"
    centered
    wrapClassName="addOfflineBack"
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
        <a-form-model-item label="回放名称" prop="name">
          <a-input v-model="rowData.name" :maxLength="50" />
        </a-form-model-item>
        <a-form-model-item label="选择任务" prop="taskId">
          <a-select v-model="rowData.taskId" @change="getTaskInfo(rowData.taskId)" showSearch :filter-option="filterOption" :disabled="rowData.id">
            <a-select-option
              v-for="item in taskDataList"
              :key="item.id"
              :value="item.id"
            >{{ item.taskName }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item class="form-model-item-title four" label="数据源">
        </a-form-model-item>
        <a-form-model-item label="消息源" prop="dataSourceId">
          <a-select v-model="rowData.dataSourceId" showSearch :filter-option="filterOption" :disabled="rowData.id">
            <a-select-option
              v-for="(item,key) in messageDataList"
              :key="key"
              :value="item.id"
            >{{ item.name }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="文件源" prop="fileSourceId">
          <a-select v-model="rowData.fileSourceId" showSearch :filter-option="filterOption" :disabled="rowData.id">
            <a-select-option
              v-for="(item,key) in fileDataList"
              :key="key"
              :value="item.id"
            >{{ item.name }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item class="form-model-item-title four" label="匹配条件">
        </a-form-model-item>
        <a-table :columns="columns" :data-source="tableData" :pagination="false" :rowKey="(record)=>record.key" :scroll="{ y: 200 }">
          <template v-for="col in ['name', 'age', 'value']" :slot="col" slot-scope="text, record, index">
            <div :key="col">
              <a-input
                v-if="col ==='name'"
                style="margin: -5px 0"
                :value="text"
                disabled
              />
              <a-select
                style="margin: -5px 0"
                :default-value="text"
                v-else-if="col ==='age'"
                disabled
              >
                <a-select-option style="width:100px" :value="1">&#62;</a-select-option>
                <a-select-option :value="2">&#60;</a-select-option>
                <a-select-option :value="3">&#62;=</a-select-option>
                <a-select-option :value="4">&#60;=</a-select-option>
                <a-select-option :value="5">==</a-select-option>
              </a-select>
              <a-select
                style="margin: -5px 0"
                :default-value="text"
                :ref="record.name"
                v-model="record.value"
                v-else
                @change="changeParent(record, index)"
                @focus="record.open = true"
                @blur="record.open = false"
                mode="multiple"
                :disabled="rowData.id"
                :token-separators="[';']"
                :open="record.open"
              >
                <a-select-option v-for="(item, index) in directoryDataList[record.name]" :key="index" :value="item">
                  {{ item }}
                </a-select-option>
              </a-select>
            </div>
          </template>
        </a-table>
        <a-form-model-item class="form-model-item-title" label="阈值配置" style="margin-top: 10px">
          <a-input
            v-model="codeFilter"
            placeholder="请输入code查询"
            style="width: 200px"
          />
        </a-form-model-item>
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
          <a-form-model-item
            v-for="(item, index) in codeThresholdList"
            v-show="!codeFilter || item.label.toUpperCase().includes(codeFilter.toUpperCase())"
            :key="index"
            :label="item.label"
          >
            <a-row>
              <a-col :span="15">
                <a-slider v-model="item.value" :min="0" :max="1.1" :step="0.0001" />
              </a-col>
              <a-col :span="5">
                <a-input-number
                  v-model="item.value"
                  :min="0"
                  :max="1.1"
                  :step="0.0001"
                  style="marginLeft: 16px"
                />
              </a-col>
              <a-col :span="1" v-if="!rowData.id">
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
        <a-form-model-item
          style="margin-top: 10px"
          class="form-model-item-title four"
          label="时间段"
          prop="dateRangValue">
          <a-range-picker
            v-model="rowData.dateRangValue"
            show-time
            :disabled-date="disabledDate"
            @change="changeTime"
            @calendarChange="calendarChange"
            :disabled="rowData.id"
            />
        </a-form-model-item>
        <a-form-model-item class="form-model-item-title four" label="业务配置">
        </a-form-model-item>
        <a-form-model-item label="业务参数" prop="businessParam">
          <a-input v-model="rowData.businessParam" type="textarea" :disabled="rowData.id"/>
        </a-form-model-item>
        <p class="showAdvanced">
          <span @click="showAdvanced = true" v-if="!showAdvanced">显示高级设置</span>
          <span @click="showAdvanced = false" v-else>隐藏高级设置</span>
        </p>
        <template v-if="showAdvanced">
          <a-form-model-item class="form-model-item-title" label="资源配置">
          </a-form-model-item>
          <a-form-model-item label="资源模式" prop="resouceModel">
            <a-select v-model="rowData.resouceModel" :disabled="rowData.id">
              <a-select-option :value="2">GPU模式</a-select-option>
              <a-select-option :value="1">CPU模式</a-select-option>
            </a-select>
            <div class="resource">
              <a-form-model-item label="CPU" prop="coreSize">
                <a-input-number
                  :min="1"
                  :precision="0"
                  v-model="rowData.coreSize"/>
                <span class="type">核</span>
              </a-form-model-item>
              <a-form-model-item label="内存" prop="memorySize">
                <a-input-number
                  :min="0"
                  v-model="rowData.memorySize"/>
                <span class="type">GB</span>
              </a-form-model-item>
              <template v-if="rowData.resouceModel === 2" prop="gpuSize">
                <a-form-model-item label="GPU">
                  <a-input-number
                    disabled
                    v-model="rowData.gpuSize"/>
                  <span class="type">张</span>
                </a-form-model-item>
                <a-form-model-item label="显存" prop="videoMemorySize">
                  <a-input-number
                    :min="0"
                    :max="rowData.gpuMaxSize"
                    :step="0.001"
                    :precision="3"
                    v-model="rowData.videoMemorySize"/>
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
  offlineBack,
  inferenceCatalogConfList,
  getChildrenList,
  messageSource,
  fileSource,
  getModelById
} from '@/api/appCenter'
import moment, { months } from 'moment'
import { getResourceConfig } from '@/utils/util'
import { getK8SDataInfo, getModelInfoById } from '@/api/modelManage'
const columns = [
  {
    title: "字段名",
    dataIndex: "name",
    width: "30%",
    scopedSlots: { customRender: "name" }
  },
  {
    title: "条件",
    dataIndex: "age",
    width: "25%",
    scopedSlots: { customRender: "age" }
  },
  {
    title: "值",
    dataIndex: "value",
    width: "30%",
    scopedSlots: { customRender: "value" }
  }
]
export default {
  name: 'AddOfflineBack',
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
    const checkName = async (rule, value, callback) => {
      if (!value || !value.trim()) {
        return callback(new Error('当前值不能为空'))
      } else if (!/^[a-zA-Z0-9-_\u4e00-\u9fa5]+$/.test(value)) {
        return callback(new Error('只能输入字母、数字、汉字、下划线和中杠'))
      } else {
        if (value === this.parentName) return callback()
        const checkData = await offlineBack.checkOfflineBackName({
          replayTaskName: value
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
        name: [{ required: true, validator: checkName, trigger: 'blur' }],
        taskId: [{ required: true, message: '请选择任务', trigger: 'change' }],
        dataSourceId: [{ required: true, message: '请选择输入源', trigger: 'change' }],
        pubSourceId: [{ required: true, message: "请选择输出源", trigger: "change" }],
        fileSourceId: [
          {
            required: true,
            message: "请选择文件源",
            trigger: "change"
          }
        ],
        resouceModel: [
          {
            required: true,
            message: "请选择资源模型",
            trigger: "change"
          }
        ],
        businessParam: [{
          validator: confirmJSON,
          trigger: 'blur'
        }],
        taskModel: [
          {
            required: true,
            message: "请选择任务模型",
            trigger: "change"
          }
        ],
        dateRangValue: [{
          required: true,
          message: "请选择时间段",
          trigger: "change"
        }],
        coreSize: [{ required: true, message: '请输入cpu核心数!', trigger: 'blur' }],
        memorySize: [{ required: true, message: '请输入cpu内存数!', trigger: 'blur' }],
        // gpuSize: [{ required: true, message: '请输入gpu核心数!', trigger: 'blur' }],
        gpuSize: [{ required: true, validator: gpuValidator, trigger: 'blur' }],
        videoMemorySize: [{ required: true, validator: gpuMemory, trigger: 'blur' }]
      },
      visible: false,
      rowId: null,
      loading: false,
      saveLoading: false,
      rowData: {},
      messageDataList: [],
      fileDataList: [],
      tableData: [],
      columns,
      k8sDataInfo: {},
      directoryDataList: {},
      directoryTableData: [],
      taskDataList: [],
      condition: [">", "<", ">=", "<=", "=="],
      showAdvanced: false,
      startTime: '',
      addCode: '',
      codeThresholdList: [],
      parentName: '',
      codeFilter: ''
    }
  },
  mounted () {
    this.getK8SData()
  },
  methods: {
    async getInferenceDataSourceConfList (params) {
      this.loading = true
      const res = await messageSource.inferenceDataSourceConfList(params)
      if (res.code === 0) {
        this.loading = false
        this.messageDataList = res.data.records
      }
    },
    async getK8SData () {
        const data = await getK8SDataInfo();
        if (data.code !== 0) return false;
        let datajson = JSON.stringify(data.data);
        if (typeof (datajson) == "undefined") return false;
        this.k8sDataInfo = JSON.parse(datajson);
    },
    async getInferenceFileSourceConfList (params) {
      this.loading = true
      const res = await fileSource.inferenceFileSourceConfList(params)
      if (res.code === 0) {
      this.loading = false
        this.fileDataList = res.data.records
      }
    },
    async showModal (record) {
      this.visible = true
      this.tableData = []
      if (this.$refs.ruleForm) {
        this.$refs.ruleForm.resetFields()
      }
      if (record?.id) {
        this.rowData = JSON.parse(JSON.stringify(record))
        this.parentName = record.name
        const customFields = JSON.parse(this.rowData.customFields)
        const tableDataCopy = []
        await this.getInferenceCatalogConfList()
        Object.keys(customFields).forEach(async (item, index) => {
          this.getChildrenList({ level: this.directoryTableData.filter(key => key.value === item)[0] ? this.directoryTableData.filter(key => key.value === item)[0].level : index + 1 })
          tableDataCopy.push({
            name: this.directoryTableData.filter(key => key.value === item)[0] ? this.directoryTableData.filter(key => key.value === item)[0].name : item,
            age: this.condition.indexOf(customFields[item].split(/([>,<,=]=?)/)[1]) + 1,
            value: customFields[item].split(/([>,<,=]=?)/)[2].split(';'),
            key: Math.floor(Math.random() * (1000 - 1)) + 1,
            editable: false,
            open: false,
          })
        })
        this.rowData.dateRangValue = [moment(this.rowData.startTime), moment(this.rowData.endTime)]
        this.tableData = [...tableDataCopy]
        const res = await getResourceConfig()
        this.rowData = {
          ...this.rowData,
          gpuMaxSize: res.gpu_size_max
        }
      } else {
        const res = await getResourceConfig()
        this.rowData = {
          coreSize: res.cpu_core_default || 1,
          memorySize: res.cpu_size_default || 2,
          gpuSize: res.gpu_core_default || 1,
          videoMemorySize: res.gpu_size_default || 2,
          gpuMaxSize: res.gpu_size_max,
          resouceModel: 2,
          businessParam: ''
        }
        await this.getDataList()
      }
      this.getInferenceDataSourceConfList({ limit: 9999 })
      this.getInferenceFileSourceConfList({ limit: 9999 })
      this.getTaskDataList()
    },
    async getTaskDataList () {
      this.loading = true
      const responseData = await getApplicationcenterList({
        limit: 9999999,
        taskType: 0
      })
      this.loading = false
      if (responseData.code === 0) {
        this.taskDataList = responseData.data.records
      }
    },
    async getInferenceCatalogConfList (params) {
      this.loading = true
      return inferenceCatalogConfList(params).then(res => {
        this.loading = false
        if (res.code === 0) {
          this.directoryTableData = res.data.records
          return res
        }
      })
    },
    async getDataList () {
      const params = {}
      this.loading = true
      const list = await inferenceCatalogConfList()
      if (list.code === 0) {
        this.directoryTableData = list.data.records
        this.tableData = list.data.records.map(item => {
          return {
            editable: false,
            name: item.name,
            age: 5,
            value: [],
            open: false,
            key: Math.floor(Math.random() * (1000 - 1)) + 1
          }
        })
      }
      this.getChildrenList({
        level: 1
      })
    },
    async getTaskInfo (id) {
      const config = this.taskDataList.filter(item => {
        return item.id === id
      })[0]
      if (config.configId) {
        this.loading = true
        const res = await getModelById(config.configId)
        this.loading = false
        if (res.code !== 0) return false
        this.rowData.businessParam = res.data.businessParam
        const customFields = JSON.parse(res.data.customFields)
        const tableDataCopy = []
        Object.keys(customFields).forEach(async (item, index) => {
          this.getChildrenList({ level: this.directoryTableData.filter(key => key.value === item)[0] ? this.directoryTableData.filter(key => key.value === item)[0].level : index + 1 })
          tableDataCopy.push({
            name: this.directoryTableData.filter(key => key.value === item)[0] ? this.directoryTableData.filter(key => key.value === item)[0].name : item,
            age: this.condition.indexOf(customFields[item].split(/([>,<,=]=?)/)[1]) + 1,
            value: customFields[item].split(/([>,<,=]=?)/)[2].split(';'),
            key: Math.floor(Math.random() * (1000 - 1)) + 1,
            editable: false
          })
        })
        if (tableDataCopy.length > 0) {
          this.tableData = [...tableDataCopy]
        } else {
          this.getDataList()
        }
        this.getCodeThresholdList(res.data.codeThreshold)
      } else {
        this.getModelInfo(config.modelId)
      }
    },
    async getModelInfo (id) {
      this.loading = true
      const res = await getModelInfoById(id)
      this.loading = false
      if (res.code !== 0) return false
      this.rowData.businessParam = res.data.businessParam
    },
    async getChildrenList (params) {
      this.loading = true
      const res = await getChildrenList(params)
      this.loading = false
      if (res.code === 0) {
        this.directoryTableData.forEach((item, index) => {
          if (item.level === params.level) {
            this.directoryDataList[item.name] = res.data
            const value = this.tableData[index].value
            this.tableData[index].value = this.tableData[index].value.filter(key => {
              return this.directoryDataList[item.name].includes(key)
            })
            if (value.length > this.tableData[index].value.length) {
              this.getChildrenList({
                level: item.level + 1,
                parentValue: this.tableData[index].value.join(';')
              })
            }
          }
        })
        this.$forceUpdate()
      }
    },
    changeTime (date, dateString) {
      if (date.length === 2) this.startTime = ''
    },
    calendarChange (date, dateString) {
      if (date.length === 2) {
        this.startTime = ''
      } else {
        this.startTime = date[0]
      }
    },
    disabledDate (current) {
      if (!this.startTime) {
        return current > moment(new Date())
      }
      const time = moment(this.startTime)
      return current && (current > moment(new Date()) || (current < time.subtract(1,'months') || current > time.add(2,'months')))
    },
    createData () {
      if (this.tableData.some(item => item.value.length === 0)) {
        this.$message.warning('当前还有匹配条件值为空，请重新填写')
        return false
      }
      this.$refs.ruleForm.validate(valid => {
        if (!valid) {
          return false
        } else {
          this.rowData.customFields = {}
          this.tableData.forEach(element => {
            const key = this.directoryTableData.filter(item => {
              return item.name === element.name
            })[0].value
            this.rowData.customFields[key] =
              this.condition[element.age - 1] + element.value.join(';')
          })
          this.rowData.customFields = JSON.stringify(this.rowData.customFields);
          const codeThreshold = {}
          this.codeThresholdList.forEach(item => {
            codeThreshold[item.label] = item.value
          })
          this.rowData.codeThreshold = JSON.stringify({ ...codeThreshold })
          this.saveLoading = true
          const method = this.rowData.id ? 'put' : 'post'
          offlineBack.editOfflineBack(this.rowData, method).then(data => {
            if (data.code === 0) {
              this.saveLoading = false
              this.$emit("getDataList")
              this.rowData.dateRangValue = []
              this.visible = false
              this.$message.success(this.rowData.id ? "修改成功" : '新建成功')
            }
          })
        }
      })
    },
    cancelCreateData () {
      this.rowData.dateRangValue = []
      this.directoryDataList = {}
      this.codeThresholdList = []
      this.showAdvanced = false
      this.$refs.ruleForm.resetFields()
      this.visible = false
    },
    changeTime (date, str) {
      this.rowData.startTime = moment(str[0]).valueOf()
      this.rowData.endTime = moment(str[1]).valueOf()
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
    changeParent (record, index) {
      this.$refs[record.name][0].blur()
      record.open = false
      if (index === this.tableData.length - 1) return false
      if (record.value.length === 0) {
        this.tableData.forEach((item, rowIndex) => {
          if (rowIndex > index) {
            item.value = []
            this.directoryDataList[item.name] = []
          }
        })
      } else {
        this.getChildrenList({
          level: index + 2,
          parentValue: record.value.join(';')
        })
      }
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
        const arr = Object.keys(data).sort()
        this.codeThresholdList = arr.map(item => {
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
.addOfflineBack{
  overflow-x: hidden;
  .ant-modal-body{
    padding-top: 20px;
  }
  .ant-form{
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

<style lang="less" scoped>
.example-img {
  height: 60px;
  display: inline-block;
  margin: auto;
}
.div-img {
  width: 100%;
  display: flex;
}
/deep/.ant-form-item-control {
  width: calc(100% - 35px);
}
.ant-table-wrapper{
  padding: 0 42px !important;
    // margin: 0;
}
.add-row {
  padding-top: 10px;
  text-align: center;
  color: #2f54eb;
  cursor: pointer;
  position: absolute;
  top: 350px;
  right: 36px;
}
/deep/ .resource{
  margin-top: 10px;
  &>*{
    width: 25%;
    float: left;
    .ant-form-item-label{
      width: 60px;
    }
    /deep/.ant-form-item-control {
      width: 100%;
      .type{
        margin-left: 5px;
      }
    }
  }
}
</style>