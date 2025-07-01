<template>
  <a-modal
    :visible="visible"
    title="任务组配置"
    width="1000px"
    @cancel="handleCancel"
    :maskClosable="false"
    centered
    wrapClassName="addCatalogEditDialog">
    <a-spin :spinning="loading">
      <a-form-model
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        ref="ruleForm"
        layout="horizontal"
        :rules="rules"
        :model="rowData"
      >
        <a-form-model-item class="form-model-item-title four" label="消息源" prop="dataSourceId">
          <a-select v-model="rowData.dataSourceId" showSearch :filter-option="filterOption">
            <a-select-option
              v-for="(item,key) in messageDataList"
              :key="key"
              :value="item.id"
            >{{ item.name }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item class="form-model-item-title four" label="文件源" prop="fileSourceId">
          <a-select v-model="rowData.fileSourceId" showSearch :filter-option="filterOption">
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
        <a-form-model-item label="任务描述">
          <a-input v-model="rowData.taskDesc" type="textarea" />
        </a-form-model-item>
        <!-- <a-form-model-item class="form-model-item-title four" label="业务参数">
        </a-form-model-item>
        <a-form-model-item label="section_id">
          <a-select v-model="rowData.sectionId">
            <a-select-option :value="'t2'">t2</a-select-option>
            <a-select-option :value="'t4'">t4</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="其他参数" prop="businessParam">
          <a-input v-model="rowData.businessParam" type="textarea" />
        </a-form-model-item> -->
        <template v-if="selectModel">
          <a-form-model-item class="form-model-item-title" label="模型配置">
            <a-radio-group v-model="selectModel" @change="changeSelectModel(selectModel)">
              <a-radio v-for="item in Object.keys(rowData.modelList)" :key="Number(item)" :value="Number(item)">
                {{ `${rowData.modelList[item].modelName}(${rowData.modelList[item].versionLabel})` }}
              </a-radio>
            </a-radio-group>
          </a-form-model-item>
          <a-form-model-item
            label="图片类型"
            :prop="'modelList.' + selectModel + '.matchRuleId'"
            :rules="{
              required: true,
              message: '请选择图片类型',
              trigger: 'blur',
            }">
            <a-select
              v-model="rowData.modelList[selectModel].matchRuleId"
              @change="changeMatchRule"
              showSearch
              :filter-option="filterOption"
              style="width: 50%">
              <a-select-option v-for="item in taskConfigList" :key="item.id" :value="item.id" :disabled="modelRuleDisabled(item.id)">
                {{ item.name }}
              </a-select-option>
            </a-select>
            <a-input v-model="rowData.modelList[selectModel].matchRule" disabled style="margin-left: 5%;width: 45%"></a-input>
          </a-form-model-item>
          <a-form-model-item label="资源模式"
            :prop="'modelList.' + selectModel + '.resouceModel'"
            :rules="{ required: true, message: '请选择资源模型!', trigger: 'blur' }">
            <a-select v-model="rowData.modelList[selectModel].resouceModel">
              <a-select-option :value="2">GPU模式</a-select-option>
              <a-select-option :value="1">CPU模式</a-select-option>
            </a-select>
            <div class="resource">
              <a-form-model-item label="CPU"
              :prop="'modelList.' + selectModel + '.cpuCoreSize'"
              :rules="{ required: true, message: '请输入cpu核心数!', trigger: 'blur' }">
                <a-input-number
                  :min="1"
                  :precision="0"
                  v-model="rowData.modelList[selectModel].cpuCoreSize"/>
                <span class="type">核</span>
              </a-form-model-item>
              <a-form-model-item label="内存"
              :prop="'modelList.' + selectModel + '.cpuMemSize'"
              :rules="{ required: true, message: '请输入cpu内存数!', trigger: 'blur' }">
                <a-input-number
                  :min="0"
                  v-model="rowData.modelList[selectModel].cpuMemSize"/>
                <span class="type">GB</span>
              </a-form-model-item>
              <template v-if="rowData.modelList[selectModel].resouceModel === 2">
                <a-form-model-item label="GPU">
                  <a-input-number
                    disabled
                    v-model="rowData.modelList[selectModel].gpuCoreSize"/>
                  <span class="type">张</span>
                </a-form-model-item>
                <a-form-model-item label="显存"
                :prop="'modelList.' + selectModel + '.gpuMemSize'"
                :rules="{ required: true, message: '请输入gpu显存数!', trigger: 'blur' }">
                  <a-input-number
                    :min="0"
                    :max="rowData.gpuMaxSize"
                    :step="0.001"
                    :precision="3"
                    v-model="rowData.modelList[selectModel].gpuMemSize"/>
                  <span class="type">GB</span>
                </a-form-model-item>
              </template>
            </div>
          </a-form-model-item>
          <a-form-model-item class="form-model-item-title four" label="业务配置">
          </a-form-model-item>
          <a-form-model-item
            label="业务参数"
            :prop="'modelList.' + selectModel + '.businessParam'"
            :rules="{
              validator: confirmJSON,
              trigger: 'blur',
            }"
            v-if="rowData.modelList[selectModel]">
            <a-input v-model="rowData.modelList[selectModel].businessParam" type="textarea" />
          </a-form-model-item>
          <a-form-model-item class="form-model-item-title four" label="阈值配置">
            <a-radio-group v-model="rowData.modelList[selectModel].codeListType" @change="changeCodeListType">
              <a-radio :value="0">列表模式</a-radio>
              <a-radio :value="1">JSON模式</a-radio>
            </a-radio-group>
            <a-input
              v-model="codeFilter"
              placeholder="请输入code查询"
              style="width: 200px"
            />
            <a-button type="link" @click="$refs.fileUpload.click()" style="float: right">
              导入阈值
            </a-button>
            <a-button type="link" @click="download" style="float: right">
              下载模板
            </a-button>
            <input accept=".xls, .xlsx" ref="fileUpload" type="file" hidden @change="uploadThreshold" />
          </a-form-model-item>
          <a-form-model-item v-if="!rowData.modelList[selectModel].codeListType" label="code阈值" style="max-height: 200px;overflow-y: auto">
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
              <span style="cursor: pointer;font-size: 18px" v-if="rowData.modelList[selectModel].codeThresholdList.length === 0">
                <a-icon type="plus-circle" theme="twoTone" two-tone-color="#52c41a" />
              </span>
            </a-popconfirm>
            <a-form-model-item
              v-for="(item, index) in rowData.modelList[selectModel].codeThresholdList"
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
                <a-col :span="1">
                  <span @click="rowData.modelList[selectModel].codeThresholdList.splice(index, 1)" style="cursor: pointer;font-size: 18px">
                    <a-icon type="minus-circle" theme="twoTone" two-tone-color="red" />
                  </span>
                </a-col>
                <a-col :span="1" v-if="index ===rowData.modelList[selectModel].codeThresholdList.length - 1">
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
          <a-form-model-item label="code阈值" v-else>
            <a-input type="textarea" v-model="rowData.modelList[selectModel].codeThreshold"></a-input>
          </a-form-model-item>
        </template>
        <a-form-model-item label="是否回写CSV">
          <a-select v-model="rowData.writeCsv">
            <a-select-option :value="false">否</a-select-option>
            <a-select-option :value="true">是</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item class="form-model-item-title" label="模式配置">
          <a-popover title="规则：" placement="bottomLeft">
            <template slot="content">
              <pre
                class="modelLog"
                :style="{
                  'white-space': warpType ? 'pre-line' : 'nowrap',
                  color: '#000'
                }">
                <b>任务模式：</b><br/>
                正式模式：任务处理消息后，将结果实时反馈给生产系统；<br/>
                测试模式：任务处理消息后，结果不反馈给生产系统；<br/>
                <b>运行模式：</b><br/>
                常驻：上线状态下，任务将一直占据计算资源不释放；<br/>
                自动：上线状态下，任务在设置的时间内未接受到需要处理的消息，任务将释放计算资源，直到接收到需要处理的消息；<br/>
                <b style="color: red">请慎重设置该模式，资源足够的情况下，建议采用常驻模式；</b>
              </pre>
            </template>
            <span style="cursor: pointer"><a-icon type="question-circle" /></span>
          </a-popover>
        </a-form-model-item>
        <a-form-model-item label="任务模式" prop="taskModel">
          <a-select v-model="rowData.taskModel">
            <a-select-option :value="1">正式模式</a-select-option>
            <a-select-option :value="2">测试模式</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="运行模式" prop="runMode">
          <a-select v-model="rowData.runMode">
            <a-select-option :value="0">常驻</a-select-option>
            <a-select-option :value="1">自动</a-select-option>
          </a-select>
        </a-form-model-item>
        <p class="showAdvanced">
          <span @click="showAdvanced = true" v-if="!showAdvanced">显示高级设置</span>
          <span @click="showAdvanced = false" v-else>隐藏高级设置</span>
        </p>
        <template v-if="showAdvanced">
          <a-form-model-item class="form-model-item-title" label="资源配置">
          </a-form-model-item>
          <a-form-model-item label="任务数" prop="replicaNum">
            <a-input-number v-model="rowData.replicaNum" :min="1" :max="rowData.task_num_max || 3" :precision="0"></a-input-number>
            <span style="margin-left: 10px;cursor: pointer" title="请谨慎设置，任务数越多，消耗的计算资源越多，能够处理的并行度越高"><a-icon type="question-circle" /></span>
          </a-form-model-item>
          <a-form-model-item label="消息量阈值" prop="taskQueueLen" v-if="rowData.runMode === 1">
            <a-input-number v-model="rowData.taskQueueLen" :min="1" :max="1000" :precision="0"></a-input-number>
            <a-tooltip>
              <template slot="title">
                自动模式下，消息并发量较大时，可适当增大该值，节约任务切换的耗时
              </template>
              <span style="margin-left: 10px;cursor: pointer"><a-icon type="question-circle" /></span>
            </a-tooltip>
          </a-form-model-item>
          <a-form-model-item label="消息过期时间">
            <a-input-number
              v-model="rowData.msgExpireTime" :min="1" :precision="0"/><span style="margin-left: 10px">秒</span>
          </a-form-model-item>
        </template>
      </a-form-model>
    </a-spin>

    <template slot="footer">
      <a-button key="back" @click="handleCancel">取消</a-button>
      <a-button key="submit" type="primary" @click="handleOk(false)" :disabled="(rowData.taskStatus === 2 || rowData.taskStatus === 3)" :loading="saveLoading">保存</a-button>
      <a-button key="submit" type="primary" @click="handleOk(true)" :disabled="startDisabled" :loading="saveLoading">上线</a-button>
    </template>
  </a-modal>
</template>

<script>
import {
  getModelById,
  saveApplicationcenter,
  editApplicationcenter,
  getChildrenList,
  inferenceCatalogConfList,
  messageSource,
  fileSource,
  taskGroupConfig,
  uploadThreshold,
  updateTaskDesc,
  getApplicationcenterById
} from "@/api/appCenter"
import { getResourceConfig, downloadFile } from '@/utils/util'
import { modelGroup } from '@/api/modelManage'
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
  name: "AddEditDialogGroup",
  props: {
    pagination: {
      type: Object,
      default: () => {}
    },
    allData: {
      type: Object,
      default: () => {}
    }
  },
  data () {
    return {
      rules: {
        dataSourceId: [{ required: true, message: '请选择输入源', trigger: 'change' }],
        pubSourceId: [{ required: true, message: "请选择输出源", trigger: "change" }],
        csvReadPath: [{ required: true, message: "请输入CSV路径", trigger: "blur" }],
        imgReadPath: [{ required: true, message: "请输入图片路径", trigger: "blur" }],
        csvResultPath: [{ required: true, message: "请输入OP判CODE路径", trigger: "blur" }],
        fileSourceId: [
          {
            required: true,
            message: "请选择文件源",
            trigger: "change"
          }
        ],
        taskModel: [
          {
            required: true,
            message: "请选择任务模式",
            trigger: "change"
          }
        ],
        runMode: [
          {
            required: true,
            message: "请选择运行模式",
            trigger: "change"
          }
        ],
        replicaNum: [{ required: true, message: '请输入任务数!', trigger: 'blur' }],
        taskQueueLen: [{ required: true, message: '请输入消息量阈值!', trigger: 'blur' }]
      },
      rowData: {
        customFields: {},
        sectionId: '',
        fileSourceId: "",
        taskModel: "",
        taskQueueLen: 5,
        modelList: {},
        writeCsv: false
      },
      visible: false,
      loading: false,
      saveLoading: false,
      dsNasTypesOption: [],
      columns,
      tableData: [],
      fileDataList: [],
      messageDataList: [],
      directoryDataList: {},
      taskDataList: [],
      directoryTableData: [],
      condition: [">", "<", ">=", "<=", "=="],
      startDisabled: false,
      selectModelOld: 0,
      selectModel: 0,
      addCode: '',
      showAdvanced: false,
      copyData: null,
      copyTableData: null,
      taskConfigList: [],
      computedConfig: {},
      codeFilter: ''
    }
  },
  watch: {
    rowData: {
      handler (val, olaVal) {
        if (this.rowData.taskStatus === 2) {
          if (this.copyData) {
            this.startDisabled = (this.copyData === JSON.stringify(this.rowData) &&
              this.copyTableData === JSON.stringify(this.tableData))
          } else {
            if (!this.loading) {
              this.copyData = JSON.stringify(val)
            }
          }
        }
      },
      deep: true
    },
    tableData: {
      handler (val, olaVal) {
        if (this.rowData.taskStatus === 2) {
          if (this.copyTableData) {
            this.startDisabled = (this.copyData === JSON.stringify(this.rowData) &&
              this.copyTableData === JSON.stringify(this.tableData))
          } else {
            this.copyTableData = JSON.stringify(val)
          }
        }
      },
      deep: true
    }
  },
  methods: {
    async getInferenceDataSourceConfList (params) {
      this.loading = true
      const res = await messageSource.inferenceDataSourceConfList(params)
      this.loading = false
      if (res.code === 0) {
        this.messageDataList = res.data.records
      }
    },
    async getInferenceFileSourceConfList (params) {
      this.loading = true
      const res = await fileSource.inferenceFileSourceConfList(params)
      if (res.code === 0) {
      this.loading = false
        this.fileDataList = res.data.records
      }
    },
    async getResourceConfig (id) {
      const res = await getResourceConfig()
      this.computedConfig = {
        coreSize: res.cpu_core_default || 1,
        memorySize: res.cpu_size_default || 2,
        gpuSize: res.gpu_core_default || 1,
        videoMemorySize: res.gpu_size_default || 2,
        msgExpireTime: res.default_message_timeout || 600,
        gpuMaxSize: res.gpu_size_max,
        task_num_max: res.task_num_max
      }
      const { gpuMaxSize, task_num_max, msgExpireTime } = this.computedConfig
      this.rowData = {
        ...this.rowData,
        gpuMaxSize,
        task_num_max
      }
      if (!id) this.$set(this.rowData, 'msgExpireTime', msgExpireTime)
    },
    async getTaskInfo () {
      const res = await getApplicationcenterById(this.allData.id)
      if (res.code !== 0) return false
      this.$set(this.rowData, 'taskDesc', res.data.taskDesc)
    },
    async showDialog () {
      this.visible = true
      this.startDisabled = false
      this.saveLoading = false
      this.tableData = []
      if (this.$refs.ruleForm) {
        // this.$refs.ruleForm.resetFields()
      }
      await this.getTaskConfigList()
      if (this.allData.configId) {
        this.loading = true
        if (this.allData.taskStatus === 2 || this.allData.taskStatus === 3) {
          this.startDisabled = true
        }
        const data = await getModelById(this.allData.configId)
        this.loading = false
        if (data.code === 0) {
          this.rowData = data.data
          this.rowData.modelList = {}
          this.getCodeThresholdList(data.data.modelGroupParam)
          this.getModelInfo(this.allData.modelId)
          const customFields = JSON.parse(data.data.customFields)
          const tableDataCopy = []
          const nameList = (await this.getInferenceCatalogConfList()).data.records
          Object.keys(customFields).forEach(async (item, index) => {
            this.getChildrenList({ level: nameList.filter(key => key.value === item)[0] ? nameList.filter(key => key.value === item)[0].level : index + 1 })
            tableDataCopy.push({
              name: nameList.filter(key => key.value === item)[0] ? nameList.filter(key => key.value === item)[0].name : item,
              age: this.condition.indexOf(customFields[item].split(/([>,<,=]=?)/)[1]) + 1,
              value: customFields[item].split(/([>,<,=]=?)/)[2].split(';'),
              key: Math.floor(Math.random() * (1000 - 1)) + 1,
              editable: false,
              open: false,
            })
          })
          this.tableData = [...tableDataCopy]
          // const params = JSON.parse(data.data.businessParam)
          // if (params?.section_id) {
          //   this.rowData.sectionId = params.section_id
          //   delete params.section_id
          // }
          // this.rowData.businessParam = JSON.stringify(params)
          this.getTaskInfo()
        }
      } else {
        this.rowData = {
          customFields: {},
          fileSourceId: "",
          taskModel: 2,
          resouceModel: 2,
          replicaNum: 1,
          runMode: 0,
          taskQueueLen: 5,
          modelList: {},
          writeCsv: false
        }
        this.getDataList()
        this.getModelInfo(this.allData.modelId, 'new')
        this.getTaskInfo()
      }
      this.getInferenceDataSourceConfList({ limit: 9999 })
      this.getInferenceFileSourceConfList({ limit: 9999 })
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
      this.loading = true
      const list = await inferenceCatalogConfList()
      this.loading = false
      if (!list.code === 0) return false
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
      this.getChildrenList({
        level: 1
      })
    },
    async getModelInfo (modelId, type) {
      this.loading = true
      const res = await modelGroup.getModelGroup(modelId, 'get')
      this.loading = false
      if (res.code !== 0) return false
      await this.getResourceConfig(this.allData.configId)
      const { coreSize, memorySize, gpuSize, videoMemorySize } = this.computedConfig
      res.data.subModelList.forEach(item => {
        const { id, businessParam, modelName, modelVersionLabel, codeThreshold, codeListType } = item
        if (type === 'new') {
          this.$set(this.rowData.modelList, id, {
            modelId: id,
            businessParam,
            codeThresholdList: this.activeCodeThresholdList(codeThreshold, id),
            codeThreshold,
            matchRule: '',
            matchRuleId: '',
            modelName,
            versionLabel: modelVersionLabel,
            codeListType: 0,
            resouceModel: 2,
            cpuCoreSize: coreSize,
            cpuMemSize: memorySize,
            gpuCoreSize: gpuSize,
            gpuMemSize: videoMemorySize
          })
        } else {
          this.$set(this.rowData.modelList, id, {
            ...this.rowData.modelList[id],
            codeListType: 0,
            versionLabel: modelVersionLabel
          })
          const code = this.rowData.modelList[id].codeThreshold
          this.rowData.modelList[id].codeThresholdList = this.activeCodeThresholdList(JSON.stringify(code), id)
        }
      })
      if (res.data.subModelList.length > 0) {
        this.selectModel = this.selectModelOld = res.data.subModelList[0].id
      }
      this.$forceUpdate()
    },
    activeCodeThresholdList (_data, id) {
      try {
        const data = JSON.parse(_data)
        const obj = {}
        const arr = Object.keys(data).sort()
        const result = arr.map(item => {
          obj[item] = data[item]
          return {
            label: item,
            value: data[item]
          }
        })
        this.rowData.modelList[id].codeThreshold = obj
        return result
      } catch (err) {
        return []
      }
    },
    async getTaskConfigList() {
      const params = {
        limit: 99999,
        pageNo: 1
      }
      const res = await taskGroupConfig.getDataList(params)
      this.loading = false
      if (res.code !== 0) return false
      this.taskConfigList = res.data.records
    },
    getCodeThresholdList (val) {
      try {
        const modelList = JSON.parse(val)
        modelList.forEach(item => {
          this.$set(this.rowData.modelList, item.modelId, item)
        })
        this.$forceUpdate()
        this.$nextTick(() => {
          if (modelList.length > 0) {
            this.selectModel = modelList[0].modelId
          }
        })
      } catch (err) {
        this.rowData.modelList = {}
      }
    },
    addCodeFun () {
      if (!/^\w+/.test(this.addCode)) {
        this.$message.warning('只能输入字母、数字和下划线')
        return false
      }
      this.rowData.modelList[this.selectModel].codeThresholdList.push({
        label: this.addCode,
        value: 0.5
      })
      this.addCode = ''
      this.$forceUpdate()
    },
    async getChildrenList (params) {
      this.loading = true
      const res = await getChildrenList(params)
      this.loading = false
      if (res.code === 0) {
        this.directoryTableData.forEach((item, index) => {
          if (item.level === params.level) {
            this.directoryDataList[item.name] = res.data.sort()
          }
        })
        this.$forceUpdate()
      }
    },
    changeParent (record, index) {
      this.$refs[record.name][0].blur()
      record.open = false
      if (index === this.tableData.length - 1) return false
      this.getChildrenList({
        level: index + 2,
        parentValue: record.value.join(';')
      })
    },
    async saveTaskDesc () {
      const params = {
        taskDesc: this.rowData.taskDesc,
        taskId: this.rowData.taskId
      }
      this.saveLoading = true
      this.loading = true
      const res = await updateTaskDesc(params)
      this.saveLoading = false
      this.loading = false
      if (res.code !== 0) return false
    },
    handleOk (online) {
      if (this.tableData.some(item => item.value.length === 0)) {
        this.$message.warning('当前还有匹配条件值为空，请重新填写')
        return false
      }
      this.$refs.ruleForm.validate(valid => {
        if (!valid) {
          return false
        } else {
          let status = false
          Object.keys(this.rowData.modelList).forEach(item => {
            if (!this.rowData.modelList[item].matchRuleId) {
              status = true
            }
          })
          if (status) {
            this.$message.warning('当前还有图片类型为空，请选择')
            return false
          }
          this.rowData.customFields = {}
          this.tableData.forEach(element => {
            const key = this.directoryTableData.filter(item => {
              return item.name === element.name
            })
            if (key.length > 0) {
              const val = key[0].value
              this.rowData.customFields[val] = this.condition[element.age - 1] + element.value.join(';')
            }
          })
          this.rowData.taskId = this.allData.id
          this.rowData.taskIdleTime = 0
          this.rowData.modelId = this.allData.modelId
          this.rowData.id = this.allData.configId || ""
          this.rowData.online = online
          this.rowData.customFields = JSON.stringify(this.rowData.customFields)
          this.rowData.modelGroupParam = JSON.stringify(Object.values(this.rowData.modelList).map(item => {
            let codeThreshold = {}, codeThresholdList = []
            if (!item.codeListType) {
              codeThresholdList = [ ...item.codeThresholdList ]
              item.codeThresholdList.forEach(item => {
                codeThreshold[item.label] = item.value
              })
            } else {
              codeThreshold = item.codeThreshold
              const data = JSON.parse(item.codeThreshold)
              codeThresholdList = Object.keys(data).map(item => {
                return {
                  label: item,
                  value: data[item]
                }
              })
            }
            return {
              ...item,
              codeThreshold,
              codeThresholdList
            }
          }))
          this.saveTaskDesc()
          this.saveLoading = true
          this.loading = true
          const request = this.allData.configId ? editApplicationcenter : saveApplicationcenter
          request(this.rowData).then(data => {
            this.saveLoading = false
            this.loading = false
            if (data.code === 0) {
              this.$emit("getDataList", {
                pageSize: this.pagination.pageSize,
                pageIndex: this.pagination.current
              })
              this.visible = false
              this.$message.success("修改成功！")
            }
          })
        }
      })
    },
    handleCancel () {
      this.visible = false
      this.copyData = null
      this.copyTableData = null
      this.copyThresholdData = null
      this.showAdvanced = false
      this.saveLoading = false
      this.directoryDataList = {}
      this.selectModel = ''
      this.rowData = {}
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
    confirmJSON (rule, value, callback) {
      if (!value) {
        // callback(new Error('业务参数不能为空'))
        callback()
      } else {
        if (!isNaN(value)) {
          return callback(new Error('当前参数不符合JSON规范，请重新填写'))
        }
        try {
          const json = JSON.parse(value)
        } catch (err) {
          return callback(new Error('当前参数不符合JSON规范，请重新填写'))
        }
        callback()
      }
    },
    changeSelectModel (val) {
      this.$refs.ruleForm.validateField('modelList.' + this.selectModelOld + '.businessParam', (valid) => {
        if (valid) {
          this.$set(this.rowData.modelList[this.selectModelOld], 'businessParam', '')
        }
      })
      this.$refs.ruleForm.clearValidate('modelList.' + this.selectModelOld + '.businessParam')
      this.$nextTick(() => {
        this.selectModelOld = val
      })
    },
    changeMatchRule (val) {
      this.rowData.modelList[this.selectModel].matchRule = this.taskConfigList.filter(item => item.id === val)[0].rule
    },
    modelRuleDisabled (id) {
      let disabled = false
      Object.keys(this.rowData.modelList).forEach(item => {
        if (this.rowData.modelList[item].matchRuleId === id) {
          disabled = true
        }
      })
      return disabled
    },
    changeCodeListType () {
      if (this.rowData.modelList[this.selectModel].codeListType) {
        const codeThreshold = {}
        this.rowData.modelList[this.selectModel].codeThresholdList.forEach(item => {
          codeThreshold[item.label] = item.value
        })
        this.rowData.modelList[this.selectModel].codeThreshold = JSON.stringify(codeThreshold)
      } else {
        this.changeCodeThresholdFormat(this.rowData.modelList[this.selectModel].codeThreshold)
      }
    },
    changeCodeThresholdFormat (codeThreshold) {
      try {
        const data = JSON.parse(codeThreshold)
        this.rowData.modelList[this.selectModel].codeThresholdList = Object.keys(data).map(item => {
          return {
            label: item,
            value: data[item]
          }
        })
      } catch (err) {
        this.$message.warning('阈值解析失败')
        this.rowData.modelList[this.selectModel].codeThresholdList = []
      }
    },
    async uploadThreshold (e) {
      if (e.target.files.length === 0) return false
      const file = e.target.files[0]
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadThreshold(formData)
      this.$refs.fileUpload.value = ''
      if (res.code !== 0) return false
      this.rowData.modelList[this.selectModel].codeThreshold = res.data
      this.changeCodeThresholdFormat(res.data)
    },
    download () {
      const data = this.rowData.codeThreshold
      const url = '/api/v1/applicationcenter/inferenceTaskInfo/downloapImportCodeModel?data=' + data
      downloadFile(encodeURI(url))
    }
  }
}
</script>

<style lang="less">
.addCatalogEditDialog{
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

<style scoped lang="less">
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
  margin-bottom: 15px;
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
    padding: 0 10px;
    .ant-form-item-label{
      width: 60px;
    }
    .ant-form-item-control {
      width: 100%;
      .type{
        margin-left: 5px;
      }
    }
  }
}
/deep/ .ant-popover-message-title{
  padding-left: 0;
}
</style>
