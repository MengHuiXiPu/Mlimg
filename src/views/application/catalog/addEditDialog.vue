<template>
  <a-modal
    :visible="visible"
    title="模型配置"
    width="1000px"
    @cancel="handleCancel"
    :maskClosable="false"
    centered
    wrapClassName="addCatalogEditDialog">
    <a-spin :spinning="loading">
<!--      :col="1"-->
<!--      :row="999"-->
      <a-form-model
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        ref="ruleForm"
        layout="horizontal"
        :rules="dynRules"
        :model="rowData"
      >
        <div v-if="isNormalApp">
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
                placeholder="输入值模糊搜索"
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
        <a-form-model-item class="form-model-item-title four" label="业务配置">
        </a-form-model-item>
        <a-form-model-item label="业务参数" prop="businessParam">
          <a-input v-model="rowData.businessParam" type="textarea" />
        </a-form-model-item>
        <a-form-model-item label="是否回写CSV">
          <a-select v-model="rowData.writeCsv">
            <a-select-option :value="false">否</a-select-option>
            <a-select-option :value="true">是</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item class="form-model-item-title four" label="阈值配置">
          <a-radio-group v-model="codeListType" @change="changeCodeListType">
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
        <a-form-model-item label="code阈值" style="max-height: 200px;overflow-y: auto" v-if="!codeListType">
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
            <span style="cursor: pointer;font-size: 18px" v-if="codeThresholdList.length === 0">
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
              <a-col :span="1">
                <span @click="codeThresholdList.splice(index, 1)" style="cursor: pointer;font-size: 18px">
                  <a-icon type="minus-circle" theme="twoTone" two-tone-color="red" />
                </span>
              </a-col>
              <a-col :span="1" v-if="index === codeThresholdList.length - 1">
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
          <a-input type="textarea" v-model="rowData.codeThreshold"></a-input>
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
        </div>
        <p class="showAdvanced">
          <span @click="showAdvanced = true" v-if="!showAdvanced">显示高级设置</span>
          <span @click="showAdvanced = false" v-else>隐藏高级设置</span>
        </p>
        <template v-if="showAdvanced">
          <a-form-model-item class="form-model-item-title" label="资源配置">
          </a-form-model-item>
          <a-form-model-item label="任务数" prop="replicaNum" v-if="!isEsdDisabled">
            <a-input-number
              v-model="rowData.replicaNum"
              :min="1"
              :max="rowData.task_num_max || 3"
              :precision="0"
            ></a-input-number>
            <span style="margin-left: 10px;cursor: pointer" title="请谨慎设置，任务数越多，消耗的计算资源越多，能够处理的并行度越高"><a-icon type="question-circle" /></span>
          </a-form-model-item>
          <a-form-model-item label="消息量阈值" prop="taskQueueLen" v-if="rowData.runMode !== 0 && !isEsdDisabled">
            <a-input-number v-model="rowData.taskQueueLen" :min="1" :max="1000" :precision="0"></a-input-number>
            <a-tooltip>
              <template slot="title">
                自动模式下，消息并发量较大时，可适当增大该值，节约任务切换的耗时
              </template>
              <span style="margin-left: 10px;cursor: pointer"><a-icon type="question-circle" /></span>
            </a-tooltip>
          </a-form-model-item>
          <a-form-model-item label="资源模式" prop="resouceModel">
            <a-select v-model="rowData.resouceModel">
              <a-select-option :value="2">GPU模式</a-select-option>
              <a-select-option :value="1">CPU模式</a-select-option>
            </a-select>
            <div class="resource">
              <a-form-model-item label="CPU" prop="coreSize">
                <a-input-number
                  :min="1"
                  :step="0.1"
                  v-model="rowData.coreSize"/>
                <span class="type">核</span>
              </a-form-model-item>
              <a-form-model-item label="内存" prop="memorySize">
                <a-input-number
                  :min="0"
                  v-model="rowData.memorySize"/>
                <span class="type">GB</span>
              </a-form-model-item>
              <template v-if="rowData.resouceModel === 2">
                <a-form-model-item label="GPU" prop="gpuSize">
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
                </a-form-model-item>
              </template>
            </div>
          </a-form-model-item>
          <a-form-model-item label="消息过期时间">
            <a-input-number
              v-model="rowData.msgExpireTime" :min="0" :precision="0"/><span style="margin-left: 10px">秒</span>
          </a-form-model-item>
          <a-form-model-item v-for="(item,index) in selectedDsList" :key="item.id">
            <span slot="label">
              {{`数据源挂载${index+1}`}}&nbsp;
              <a-tooltip title="若算法预测需要从外部数据源nas/nfs上读取图片或其他数据时，请选择配置对应的数据源，以便算法可以通过路径读取到数据源上的图片数据">
                <a-icon type="question-circle-o" style="vertical-align: 2px;"/>
              </a-tooltip>
            </span>
            <a-select v-model="item.id">
              <a-select-option :value="option.id" v-for="option in calcDataSourceList" :key="option.id" :disabled="option.disabled" >{{option.dsName }}
              </a-select-option>
            </a-select>
          </a-form-model-item>
          <div style="text-align: center;">
            <a-button type="link" @click="doAddDsMount" :disabled="selectedDsList.some(s => !s.id)" >新增数据源挂载</a-button>
          </div>
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
  uploadThreshold,
  updateTaskDesc,
  getApplicationcenterById
} from "@/api/appCenter"
import {
  getMaxCodeImageNumber
} from '@/api/dataCenter'
import { getResourceConfig, downloadFile } from '@/utils/util'
import { getModelInfoById } from '@/api/modelManage'
import { getDataSoureList } from '@/api/dataCenter'
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
  name: "AddEditDialog",
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
    const confirmJSON = (rule, value, callback) => {
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
    }
    const gpuValidator = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('请输入gpu核心数!'))
      } else {
        callback()
      }
    }
    const gpuMemory = (rule, value, callback) => {
      if (!value) {
        return callback(new Error('请输入gpu显存数!'))
      } else {
        return callback()
      }
    }
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
        taskQueueLen: [{ required: this.true, message: '请输入消息量阈值!', trigger: 'blur' }],
        coreSize: [{ required: true, message: '请输入cpu核心数!', trigger: 'blur' }],
        memorySize: [{ required: true, message: '请输入cpu内存数!', trigger: 'blur' }],
        // gpuSize: [{ required: true, message: '请输入gpu核心数!', trigger: 'blur' }],
        gpuSize: [{ required: true, validator: gpuValidator, trigger: 'blur' }],
        videoMemorySize: [{ required: true, validator: gpuMemory, trigger: 'blur' }]
      },
      rules2:{
        replicaNum: [{ required: true, message: '请输入任务数!', trigger: 'blur' }],
        coreSize: [{ required: true, message: '请输入cpu核心数!', trigger: 'blur' }],
        memorySize: [{ required: true, message: '请输入cpu内存数!', trigger: 'blur' }],
        // gpuSize: [{ required: true, message: '请输入gpu核心数!', trigger: 'blur' }],
        gpuSize: [{ required: true, validator: gpuValidator, trigger: 'blur' }],
        videoMemorySize: [{ required: true, validator: gpuMemory, trigger: 'blur' }]
      },
      rowData: {
        customFields: {},
        sectionId: '',
        fileSourceId: "",
        taskModel: "",
        resouceModel: "",
        coreSize: 1,
        memorySize: 2,
        gpuSize: 1,
        videoMemorySize: 2,
        taskQueueLen: 5,
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
      codeThresholdList: [],
      addCode: '',
      showAdvanced: true,
      copyData: null,
      copyTableData: null,
      copyThresholdData: null,
      codeListType: 0,
      codeFilter: '',
      isEsd: 0,
      factory: '',
      dataSourceList: [], //可供选择的数据源列表
      selectedDsList: [{}], //已选数据源id列表
    }
  },
  computed: {
    isEsdDisabled () {
      return this.isEsd === '1' && this.rowData.runMode === 1
    },
    isNormalApp(){
      return this.rowData.pipInstanceId === null;
    },
    dynRules(){
      if(this.rowData.pipInstanceId === null){
        return this.rules;
      }else{
        return this.rules2;
      }
    },
    // 用于设置禁止选择已选的数据源
    calcDataSourceList() {
      return this.dataSourceList.map(item => {
        if(this.selectedDsList.find(s => s.id === item.id)) {
          return {...item, disabled: true}
        } else {
          return item
        }
      })
    }
  },
  watch: {
    codeThresholdList: {
      handler (val, olaVal) {
        if (this.rowData.taskStatus === 2) {
          if (this.copyThresholdData) {
            this.startDisabled = (this.copyThresholdData === JSON.stringify(this.codeThresholdList) &&
              this.copyData === JSON.stringify(this.rowData) &&
              this.copyTableData === JSON.stringify(this.tableData))
          } else {
            this.copyThresholdData = JSON.stringify(val)
          }
        }
      },
      deep: true
    },
    rowData: {
      handler (val, olaVal) {
        if (this.rowData.taskStatus === 2) {
          if (this.copyData) {
            this.startDisabled = (this.copyThresholdData === JSON.stringify(this.codeThresholdList) &&
              this.copyData === JSON.stringify(this.rowData) &&
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
            this.startDisabled = (this.copyThresholdData === JSON.stringify(this.codeThresholdList) &&
              this.copyData === JSON.stringify(this.rowData) &&
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
    // 新增数据源挂载
    doAddDsMount() {
      // 存在未选择的，则不允许新增

      this.selectedDsList.push({})
    },
    async getMaxCodeImageNumber () {
      this.loading = true
      const res = await getMaxCodeImageNumber({ keyName: 'task_flex_mode' })
      this.loading = false
      if (res.code !== 0) return false
      this.isEsd = res.data.valueInfo
    },
    async getTaskFactory () {
      this.loading = true
      const res = await getMaxCodeImageNumber({ keyName: 'factory' })
      this.loading = false
      if (res.code !== 0) return false
      this.factory = res.data.valueInfo
    },
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
      this.selectedDsList = [{}]
      
      this.fetchDataSourceList()
      this.getMaxCodeImageNumber()
      this.getTaskFactory()
      if (this.$refs.ruleForm) {
        // this.$refs.ruleForm.resetFields()
      }
      if (this.allData.configId) {
        this.loading = true
        if (this.allData.taskStatus === 2 || this.allData.taskStatus === 3) {
          this.startDisabled = true
        }
        const data = await getModelById(this.allData.configId)
        this.loading = false
        if (data.code === 0) {
          this.rowData = data.data
          this.getCodeThresholdList(data.data.codeThreshold)
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
          this.loading = true
          getResourceConfig().then(res => {
            this.loading = false
            this.rowData = {
              ...this.rowData,
              gpuMaxSize: res.gpu_size_max,
              task_num_max: res.task_num_max
            }
          })
          this.getTaskInfo()
          // const params = JSON.parse(data.data.businessParam)
          // if (params?.section_id) {
          //   this.rowData.sectionId = params.section_id
          //   delete params.section_id
          // }
          // this.rowData.businessParam = JSON.stringify(params)
          // 转换数据，反显已选择的挂载数据源
          if(data.data?.volumePaths) {
            try{
              this.selectedDsList = JSON.parse(data.data?.volumePaths)
            }catch{
              this.$message.warning('数据源配置有误: volumePaths非法格式')
              console.error("volumePaths", volumePaths)
            }
          }
        }
        this.loading = false
      } else {
        this.rowData = {
          customFields: {},
          fileSourceId: "",
          taskModel: 2,
          resouceModel: 2,
          coreSize: 1,
          memorySize: 2,
          gpuSize: 1,
          videoMemorySize: 2,
          msgExpireTime: 600,
          replicaNum: 1,
          runMode: 0,
          businessParam: '',
          codeThreshold: '',
          taskQueueLen: 5,
          writeCsv: false
        }
        this.getDataList()
        this.getModelInfo(this.allData.modelId)
        this.loading = true
        getResourceConfig().then(res => {
          this.loading = false
          this.rowData = {
            ...this.rowData,
            coreSize: res.cpu_core_default || 1,
            memorySize: res.cpu_size_default || 2,
            gpuSize: res.gpu_core_default || 1,
            videoMemorySize: res.gpu_size_default || 2,
            msgExpireTime: res.default_message_timeout,
            gpuMaxSize: res.gpu_size_max,
            task_num_max: res.task_num_max
          }
          this.getTaskInfo()
        })
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
      const params = {}
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
    async getModelInfo (id) {
      this.loading = true
      const res = await getModelInfoById(id)
      this.loading = false
      if (res.code !== 0) return false
      // const params = JSON.parse(res.data.businessParam)
      // if (params?.section_id) {
      //   this.rowData.sectionId = params.section_id
      //   delete params.section_id
      // }
      // this.rowData.businessParam = JSON.stringify(params)
      this.rowData.businessParam = res.data.businessParam
      this.rowData.codeThreshold = res.data.codeThreshold
      this.getCodeThresholdList(res.data.codeThreshold)
      this.$forceUpdate()
    },
    getCodeThresholdList (val) {
      try {
        const data = JSON.parse(val)
        const obj = {}
        const arr = Object.keys(data).sort()
        this.codeThresholdList = arr.map(item => {
          obj[item] = data[item]
          return {
            label: item,
            value: data[item]
          }
        })
        this.$set(this.rowData, 'codeThreshold', JSON.stringify(obj))
      } catch (err) {
        this.codeThresholdList = []
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
      if(this.isNormalApp) {
        if (this.factory === 't2' || this.factory === 't4') {
          if (this.tableData.some(item => item.value.length === 0)) {
            this.$message.warning('当前还有匹配条件值为空，请重新填写')
            return false
          }
        } else {
          if (this.tableData.filter(item => item.value.length > 0).length === 0) {
            this.$message.warning('匹配条件至少需要有一个值不为空，请重新填写')
            return false
          }
        }
      }
      this.$refs.ruleForm.validate(valid => {
        if (!valid) {
          return false
        } else {
          this.saveLoading = true
          this.rowData.customFields = {}
          this.tableData.forEach(element => {
            let key = this.directoryTableData.filter(item => {
              return item.name === element.name
            })[0]
            if (!key) key = { value: element.name }
            if (!element.value || element.value.length === 0) return false
            this.rowData.customFields[key.value] = this.condition[element.age - 1] + element.value.join(';')
          })
          this.rowData.taskId = this.allData.id
          this.rowData.taskIdleTime = 0
          this.rowData.modelId = this.allData.modelId
          this.rowData.id = this.allData.configId || ""
          this.rowData.online = online
          this.loading = true
          this.rowData.customFields = JSON.stringify(this.rowData.customFields);
          this.rowData.dataSourceId = this.rowData.dataSourceId || 0;
          this.rowData.fileSourceId = this.rowData.fileSourceId || 0;
          if (!this.codeListType) {
            const codeThreshold = {}
            this.codeThresholdList.forEach(item => {
              codeThreshold[item.label] = item.value
            })
            this.rowData.codeThreshold = JSON.stringify({ ...codeThreshold })
          }
          // this.rowData.businessParam = JSON.stringify({
          //   ...JSON.parse(this.rowData.businessParam),
          //   section_id: this.rowData.sectionId
          // })
          // 将挂载的数据源写入rowData
          this.rowData.volumeList = this.dataSourceList.filter(item => {
            if(this.selectedDsList.find(s => s.id === item.id) ) {
              return true
            }
            return false
          }).map(item => ({  //映射为后端只需要的三个字段
                id: item.id,
                pvcName: item.pvcName,
                reservedFields2: item.reservedFields2
            }))
          this.saveTaskDesc()
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
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
    changeCodeListType () {
      if (this.codeListType) {
        const codeThreshold = {}
        this.codeThresholdList.forEach(item => {
          codeThreshold[item.label] = item.value
        })
        this.$set(this.rowData, 'codeThreshold', JSON.stringify(codeThreshold))
      } else {
        this.changeCodeThresholdFormat(this.rowData.codeThreshold)
      }
    },
    changeCodeThresholdFormat (codeThreshold) {
      try {
        const data = JSON.parse(codeThreshold)
        this.codeThresholdList = Object.keys(data).map(item => {
          return {
            label: item,
            value: data[item]
          }
        })
      } catch (err) {
        this.$message.warning('阈值解析失败')
        this.codeThresholdList = []
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
      let keyObj = {}
      try {
        const obj = JSON.parse(res.data)
        Object.keys(obj).sort().forEach(item => {
          keyObj[item] = obj[item]
        })
        this.$set(this.rowData, 'codeThreshold', JSON.stringify(keyObj))
        this.changeCodeThresholdFormat(JSON.stringify(keyObj))
      } catch (err) {
        this.$message.warning('阈值解析失败')
      }
    },
    download () {
      if (this.codeListType === 0) {
        const codeThreshold = {}
        this.codeThresholdList.forEach(item => {
          codeThreshold[item.label] = item.value
        })
        this.$set(this.rowData, 'codeThreshold', JSON.stringify(codeThreshold))
      }
      const data = this.rowData.codeThreshold
      const url = '/api/v1/applicationcenter/inferenceTaskInfo/downloapImportCodeModel?data=' + data
      downloadFile(encodeURI(url))
    },
    // 获取数据源列表
    fetchDataSourceList() {
      getDataSoureList({
        pageNo: 1,
        limit: 10000
      }).then(res => {
        if(res.code == 0) {
          // pvcName字段存在才有意义
          this.dataSourceList = res.data?.records.filter(rec => {
            return !!rec.pvcName
          })
        }
      })
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
    padding: 0 10px;
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
/deep/ .ant-popover-message-title{
  padding-left: 0;
}
</style>
