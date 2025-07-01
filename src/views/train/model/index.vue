<template>
  <div class="page-content">
    <el-tabs v-model="tabActiveKey" @tab-click="tabOnChange" style="width: 155px;">
      <el-tab-pane label="通用模型" name="1"></el-tab-pane>
      <el-tab-pane label="业务模型" name="2"></el-tab-pane>
    </el-tabs>
    <!-- 查询表单 -->
    <div class="toolbar space-between">
      <el-form :inline="true" :model="searchFormData" size="small" ref="refSearchForm" @submit.native.prevent @keyup.enter.native="handSearch">
        <el-form-item label="目录">
          <dict-select-tree  @change="hanldeDictChanged" allowClear ref="dictSelectTree" size="default"></dict-select-tree>
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="searchFormData.name" placeholder="请输入" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="$event=>handSearch($event)">查询</el-button>
          <el-button type="primary" plain @click="handSearch($event, true)">重置</el-button>
        </el-form-item>
      </el-form>
      <div style="margin-bottom: 18px;">
        <el-button type="primary" @click="handCreate">新建</el-button>
      </div>
    </div>
    <div class="contentMain scrollbar">
      <a-table v-resize
              
               :rowKey="(record)=>record.id"
               :columns="columns"
               :data-source="data"
               @change="handleChange"
               @expand="getChildren"
               :loading="loading"
               :pagination="pagination.total > 10 ? pagination : false"
               :expandedRowKeys="expandedRowKeys">
        <!--record:当前行内容 text:当前列内容-->
        <!--      :disabled="!record.modelTrainAvl && record.taskStatus!=0"-->
        <a :class="{'action-text': true}"
           href="javascript:;"
           slot="modelName"
           slot-scope="text,record"
           @click="linkToDetail(record)"
           :title="text">
          <!--<tamplate slot="modelName" slot-scope="text,record">-->
          <!-- <a-tag color="#4aa6e8"
                 v-if="record.id === record.sourceVersionId"
                 style="zoom: 0.7; margin-right: 2px;border-radius: 10px;">
            {{ record.versionLabel }}
          </a-tag> -->
          <!--模型名称-->
<!--          {{ record.id === record.sourceVersionId ? text : record.versionLabel }}-->
          {{ text }}
          <!--</tamplate>-->
        </a>

        <!--这个a标签与上一个的区别在于v-if条件和内容 在某些情况下删去下面的部分不会影响正常显示-->
        <a :class="{'action-text': true}"
           href="javascript:;"
           slot="versionLabel"
           slot-scope="text, record"
           v-if="record.id !== record.sourceVersionId"
           :disabled="!record.modelTrainAvl&&record.taskStatus!=0"
           @click="linkToDetail(record)"
          >
           :title="text">
          <!-- <a-tag color="#4aa6e8"
                 style="zoom: 0.7; margin-right: 2px;border-radius: 10px;">
            {{ record.versionLabel }}
          </a-tag> -->
          {{ text }}
        </a>
        <!-- <span slot="versionLabel" slot-scope="text" v-else :title="text">{{ text }}</span> -->
        <span slot="isPublish"
              slot-scope="text">
                        <!--任务状态-->
<!--                        {{ text === 2 ? '已发布' : '未发布' }}-->
<!--                      {{ getTaskState(text) }}-->
                      <a-tag style="cursor: pointer;" :color="'blue'">{{ getTaskState(text) }}</a-tag>
                    </span>
        <span slot="imageName"
              slot-scope="text, record"
              :title="`${text}(${record.imageVersionLabel})`">
                        <!--算法名称-->

                        {{ `${text}(${record.imageVersionLabel})` }}
                    </span>

        <!-- <div slot="expandedRowRender" slot-scope="record" style="margin: 0">{{ record.describe }}</div> -->
        <!-- 1.启动 2.正常终止 3.异常终止 4.手动终止 0.完成设置-->
        <!--进度条-->
        <span slot="modelSchedule" slot-scope="text, record">
          <a-progress v-if="record.taskStatus === 1 && record.modelSchedule != 0" :percent="record.modelSchedule" />
          <a-progress v-if="record.taskStatus === 2  && record.modelSchedule != 0" :percent="record.modelSchedule" />
           <a-popover overlayClassName="modelSchedule" placement="left">
              <template slot="content">
                  <!--鼠标放在异常终止提示语上的弹出窗口-->
                  <a-alert message="info"
                           :description="record.remark || '资源调度中,请稍等'"
                           type="info"
                           show-icon />
              </template>
              <a-tag v-if="record.taskStatus === 1 && record.modelSchedule == 0" style="cursor: pointer;" :color="'blue'"> {{record.remark || '资源调度中'}} </a-tag>
          </a-popover>
          <a-popover overlayClassName="modelSchedule" placement="left">
              <template slot="content">
                  <!--鼠标放在异常终止提示语上的弹出窗口-->
                  <a-alert message="Error"
                           :description="record.remark || '未知原因，请联系管理员'"
                           type="error"
                           show-icon />
              </template>
              <a-tag v-if="record.taskStatus === 3" style="cursor: pointer;" :color="'red'">异常终止</a-tag>
          </a-popover>
          <a-tag v-if="record.taskStatus === 4" style="cursor: pointer;" :color="'red'">手动终止</a-tag>
          <a-tag v-if="record.taskStatus === 5" style="cursor: pointer;" :color="'yellow'">已暂停</a-tag>
      </span>
        <span slot="action" slot-scope="text, record">
          <!-- 开始是灰色，训练100%后才能发布，发布成功（标识）后变成灰色 -->
          <!--          @click="onMonitor(record)"-->
          <a @click="linkToDetail(record)"
             v-if="tabActiveKey === '1'"
             style="margin-right: 5px">监控</a>
             <!-- 功能未开发，先屏蔽 -->
          <!-- <a :disabled="!record.modelTrainAvl"
             @click="release(record)"
             v-action:model-list-release
             style="margin-right: 5px">发布</a> -->
          <a-dropdown>
              <a class="ant-dropdown-link">
                  更多
                <!-- <a-icon type="down" /> -->
              </a>
              <a-menu slot="overlay">
                  <!--完成训练设置且没开始训练的模型，可以直接开始训练-->
                  <!-- 手动终止的任务也可以开始 -->
                  <a-menu-item v-if="tabActiveKey === '1'"
                               v-action:model-list-end
                               @click="onStartTrain(record)"
                               :disabled="record.modelSchedule === 100 || ![0, 4].includes(record.taskStatus)">
                      开始训练
                  </a-menu-item>
                <!-- 只有在训练完成前，才可以终止训练 -->
                  <a-menu-item v-if="tabActiveKey === '1'"
                               v-action:model-list-end
                               @click="onStopTrain(record)"
                               :disabled="record.modelSchedule === 100 || record.taskStatus !== 1 ? true : false">
                      终止训练
                  </a-menu-item>
                  <!-- <a-menu-item v-if="record.id === record.sourceVersionId"
                               @click="handCreateVerison(record.parentVersionId, record)">
                      新增版本
                  </a-menu-item> -->
                <!-- 暂停（继续）训练：当模型开始训练后且训练进度没到100 -->
                  <!-- <a-menu-item v-if="tabActiveKey === '1'"
                               @click="onConfigShow(record)"
                               :disabled="((record.modelSchedule < 100 && record.taskStatus === 1) || record.taskStatus === 5) ? false : true">
                      {{ record.pauseStatus === 1 ? '继续训练' : '暂停训练' }}
                  </a-menu-item> -->
                <!--已发布=2的模型不能删除（置灰），应用平台删除后，恢复 -->
                  <a-menu-item v-action:model-list-delete @click="onDelModel(record)">删除训练任务</a-menu-item>
                  <a-menu-item v-action:model-list-delete
                               v-if="record.id === record.sourceVersionId"
                               @click="onRename(record)">
                      重命名
                  </a-menu-item>
                  <a-menu-item v-action:model-list-delete
                               v-if="record.id === record.sourceVersionId"
                               @click="showMoveNode(record)">
                      移动节点
                  </a-menu-item>
                <!-- 训练完成后，才可以去题库验证 -->
                  <!-- <a-menu-item v-if="tabActiveKey === '1'"
                               @click="onForecast(record)"
                               :disabled="!record.modelTrainAvl">
                      离线评估
                  </a-menu-item>
                  <a-menu-item v-if="tabActiveKey === '2'"
                               @click="onForecast(record)">
                      离线评估
                  </a-menu-item> -->
                <!-- 没有训练完成时，不能导出 -->
                  <a-menu-item v-if="tabActiveKey === '1'"
                               v-action:model-list-export
                               @click="onExportModel(record)"
                               :disabled="!record.modelTrainAvl">
                      模型导出
                  </a-menu-item>
                  <a-menu-item v-if="tabActiveKey === '2'"
                               v-action:model-list-export
                               @click="onExportModel2(record)"
                               :disabled="!record.modelTrainAvl">
                      模型导出
                  </a-menu-item>
                  <a-menu-item @click="toMiddleResult(record)">
                      中间结果
                  </a-menu-item>
                  <a-menu-item v-if="tabActiveKey === '1'"
                               @click="readLog(record)"
                               >
                      查看日志
                  </a-menu-item>
                  <a-menu-item @click="shareModel(record)"><span>设置共享</span></a-menu-item>
              </a-menu>
          </a-dropdown>
      </span>
      </a-table>
    </div>

    <release-dialog ref="addEditDialog"
                    :parentData.sync="parentData"
                    :pagination="pagination"
                    :type="0"
                    @getDataList="getDataList" />
    <a-modal v-model="logShow"
             title="查看日志"
             :width="'80%'"
             :maskClosable="false"
             centered>
      <template slot="footer">
        <a-button key="download" @click="downLoadLog" :disabled="!fileUrl">
          下载日志
        </a-button>
        <a-button key="back" @click="getModelLogData">
          刷新
        </a-button>
        <a-button key="submit" type="primary" @click="warpType = !warpType">
          换行
        </a-button>
      </template>
      <a-spin :spinning="logLoading" />
      <pre class="modelLog"
           v-if="!logLoading"
           :style="{
          'white-space': warpType ? 'pre-line' : 'nowrap'
        }">
     <textarea v-model="logList" class="scrollbar" disabled style="height: 65vh; width: 100%; outline: none; resize: none; border: none;"></textarea>
      </pre>
    </a-modal>
    <a-modal :visible="configShow"
             title="配置算力"
             :width="'50%'"
             @ok="confirmConfig"
             @cancel="cancelConfig"
             :maskClosable="false"
             centered>
      <div class="configModal">
        <a-form-model :label-col="{ span: 6 }"
                      :wrapper-col="{ span: 18 }"
                      :model="configForm"
                      :rules="configFormRule"
                      ref="configForm"
                      layout="horizontal">
          <a-form-model-item label="计算引擎">
            <a-radio-group v-model="configForm.engineCoreType">
              <a-radio :value="1">
                CPU
              </a-radio>
              <a-radio :value="2">
                GPU
              </a-radio>
            </a-radio-group>
          </a-form-model-item>
          <a-form-model-item label="CPU" prop="cpuSetCount">
            <a-input-number :min="1" :precision="0" v-model="configForm.cpuSetCount" style="width: 80%;margin-right:5px" />
            <span>核</span>
          </a-form-model-item>
          <a-form-model-item label="内存" prop="cpuSetMem">
            <a-input-number v-model="configForm.cpuSetMem"
                            :min="0"
                            style="width: 80%;margin-right:5px" />
            <span>GB</span>
          </a-form-model-item>
          <template v-if="configForm.engineCoreType === 2">
            <a-form-model-item label="GPU" prop="gpuSetCount">
              <a-input-number v-model="configForm.gpuSetCount" disabled style="width: 80%;margin-right:5px" />
              <span>张</span>
            </a-form-model-item>
            <a-form-model-item label="显存" prop="gpuSetMem">
              <a-input-number v-model="configForm.gpuSetMem"
                              :min="0"
                              :step="1"
                              :max="22"
                              style="width: 80%;margin-right:5px" />
              <span>GB</span>
            </a-form-model-item>
          </template>
        </a-form-model>
      </div>
    </a-modal>
    <a-modal :visible="renameVisible"
             title="重命名"
             @ok="handleRenameOk"
             :maskClosable="false"
             @cancel="handCancel">
      <a-form-model :model="renameForm"
                    :col="1"
                    :row="20"
                    ref="ruleForm"
                    :rules="rules"
                    layout="horizontal">
        <a-form-model-item label="任务名称" prop="modelName">
          <a-input :maxLength="50" v-model="renameForm.modelName" />
        </a-form-model-item>
      </a-form-model>
    </a-modal>
    <move-node ref="moveNode" @reload="reloadTree" />
    <modelImport ref="modelImport" @getDataList="getDataList"></modelImport>
    <AddModelDialog @goStepForm="goStepForm" />
    <!-- 设置共享 -->
    <share-modal ref="refShareModal" v-if="showShareDialog" :visible.sync="showShareDialog"></share-modal>
  </div>
</template>

<script>
import { axios } from '@/utils/request'
import moment from 'moment'
import { downloadFile, getParams } from '@/utils/util'
import moveNode from './components/moveNode'
import shareModal from "@/components/business/share/index.vue";
import dictSelectTree from "@/components/business/dictSelectTree/index.vue";
import {
  getModelTableList,
  delModel,
  stopModelTrain,
  getModelHistoryLog,
  getModelRealLog,
  pauseTrainModel,
  recoverTrainModel,
  modelVersion,
  editModelName,
  checkModelNameAvl,
  downloadFileCommon,
  delModeCheckDepend
} from "@/api/modelManage"//利用axios从后端获取模型数据
import { getResourceConfig } from '@/utils/util'
import bus from '@/utils/bus'
import AddModelDialog from "./components/AddModelDialog";
export default {
  name: "Model",
  components: {
    AddModelDialog,
    ReleaseDialog: () => ({ component: import('./components/ReleaseDialog') }),
    moveNode,
    modelImport: () => ({ component: import('./components/modelImport') }),
    shareModal,
    dictSelectTree,
  },
  data() {
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
    const checkName = async (rule, value, callback) => {
      if (!value || !value.trim()) {
        callback(new Error('当前值不能为空'))
      } else {
        const checkData = await checkModelNameAvl({
          modelName: value,
          modelType: Number(this.tabActiveKey)
        })
        if (checkData.data) {
          callback()
        } else {
          callback(new Error('当前名称已存在，请重新输入'))
        }
      }
    }
    return {
      searchFormData: {
        name: '',
      },
      isConfirm: false,
      fileUrl: '',
      visible: false,
      loading: false,
      logShow: false,
      configShow: false,
      configModelId: null,
      logLoading: false,
      currentModelLog: '',
      warpType: true,
      total: 0,
      parentData: {},
      configForm: {
        engineCoreType: 2,
        cpuSetMem: 2,
        cpuSetCount: 1,
        gpuSetMem: 2,
        gpuSetCount: 1
      },
      expandedRowKeys: [],
      pagination: {
        total: 0,
        pageSize: 10,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "30", "50"],
        showTotal: function (total) {
          return `共 ${total} 条`
        }
      },
      trainingTreeApi: {
        search: "getModelTreeList",
        add: "savaModelTreeList",
        edit: "editModelTreeList",
        delete: "deleteModelTreeList"
      },
      tabActiveKey: "1",
      treeData: [],
      data: [],
      timer: null,
      dialogName: '',
      modelTitle: '',
      logList: '',
      logTime: null,
      currentTreeData: null,
      configFormRule: {
        cpuSetCount: [{ required: true, message: '请输入CPU核数', trigger: 'blur' }],
        cpuSetMem: [{ required: true, message: '请输入CPU内存', trigger: 'blur' }],
        gpuSetCount: [{ required: true, validator: gpuValidator, trigger: 'blur' }],
        gpuSetMem: [{ required: true, validator: gpuMemory, trigger: 'blur' }]
      },
      renameForm: {},
      renameVisible: false,
      rules: {
        modelName: [
          { required: true, message: '请输入离线任务名称', trigger: 'blur' },
          { required: true, validator: checkName, trigger: "blur" }
        ],
      },
      currentNode: 0,
      taskMode: [{
        text: '未发布',
        value: '未发布',
        id: 1
      }, {
        text: '已发布',
        value: '已发布',
        id: 2
      }],
      filtersType: {},
      contentHeight: 0,

      // 模型信息
      modelInfo: {},
      queryDictObj: {},
      isFirst: true,
      showShareDialog: false,  //共享modal
    }
  },
  computed: {
    columns() {
      //表格表头信息用一个三目运算符控制。若tabActiveKey=1，则输出用于通用模型的表头对象数组，否则输出业务模型的表头对象数组
      return this.tabActiveKey === '1' ? [
        {
          title: '任务名称',
          dataIndex: "modelName",
          ellipsis: true,
          scopedSlots: { customRender: "modelName" },
          width: '35%',
          // align: 'center',
        },
        // {
        //   title: "版本号",
        //   dataIndex: "versionLabel",
        //   ellipsis: true,
        //   key: "versionLabel",
        //   width: 75,
        //   scopedSlots: { customRender: "versionLabel" }
        // },
        {
          title: "算法模板",
          ellipsis: true,
          dataIndex: "imageName",
          scopedSlots: { customRender: "imageName" },
          width: '35%',
          // align: 'center',
        },
        {
          title: "离线评估数",
          dataIndex: "forecastCounts",
          align: 'center',
          ellipsis: true,
          width: 110
        },
        {
          title: "任务状态",
          dataIndex: "isPublish",
          scopedSlots: { customRender: "isPublish" },
          width: 110,
          filters: this.taskMode,
          ellipsis: true,
          filterMultiple: false,
          // align: 'center',
        },{
          title: "创建人",
          dataIndex: "createBy",
          width: "100px",
        },
        {
          title: "创建时间",
          dataIndex: "createTime",
          width: 168,
          // align: 'center',
        },
        {
          title: "结束时间",
          dataIndex: "finishTime",
          width: 168,
          // align: 'center',
        },
        {
          title: "进度",
          dataIndex: "modelSchedule",
          scopedSlots: { customRender: "modelSchedule" },
          ellipsis: true,
          width: 200,
          align: 'left',
        },
        {
          title: "操作",
          dataIndex: "action",
          scopedSlots: { customRender: "action" },
          width: 182,
          align: 'right',
        }
      ] : [
        {
          title: '任务名称',
          dataIndex: "modelName",
          ellipsis: true,
          scopedSlots: { customRender: "modelName" },
          width: '15%',
          // align: 'center',
        },
        // {
        //   title: "版本号",
        //   dataIndex: "versionLabel",
        //   ellipsis: true,
        //   key: "versionLabel",
        //   width: 75,
        //   scopedSlots: { customRender: "versionLabel" }
        // },
        {
          title: "算法模板",
          ellipsis: true,
          dataIndex: "imageName",
          scopedSlots: { customRender: "imageName" },
          width: '15%',
          // align: 'center',
        },
        {
          title: "离线评估数",
          dataIndex: "forecastCounts",
          align: 'center',
          width: 70
        },
        {
          title: "任务状态",
          dataIndex: "isPublish",
          scopedSlots: { customRender: "isPublish" },
          width: 150,
          filters: this.taskMode,
          filterMultiple: false,
          // align: 'center',
        },{
          title: "创建人",
          dataIndex: "createBy",
          width: "140px",
        },
        {
          title: "创建时间",
          dataIndex: "createTime",
          width: 138,
          // align: 'center',
        },{
          title: "结束时间",
          dataIndex: "finishTime",
          width: 138,
          // align: 'center',
        },
        {
          title: "操作",
          width: 150,
          dataIndex: "action",
          scopedSlots: { customRender: "action" },
          align: 'right',
        }
      ]
    }
  },
  beforeDestroy() {
    bus.$off('reloadModel')
    clearTimeout(this.timer)
  },
  mounted() {
    bus.$on('reloadModel', (modelType) => {
      if (modelType) this.tabActiveKey = modelType
      this.getDataList({ isFirst: true })
    })
    this.getDataList({ isFirst: true })
    if (this.$route.params.add) {
      if (this.$route.params.type === 'model') {
        this.tabActiveKey = '2'
      }
      this.$nextTick(() => {
        this.handCreate()
      })
    }
    // this.$nextTick(() => {
    //   const windowHeight = window.innerHeight;
    //   console.log("this.$refs.headerContent: ", this.$refs.headerContent)
    //   console.log("this.$refs.headerContent: ", this.$refs.headerContent.offsetHeight)
    //   console.log("window.innerHeight: ", window.innerHeight)
    //   const headerHeight = this.$refs.headerContent.offsetHeight;
    //   this.contentHeight = windowHeight - headerHeight - 24 - 32; // 24是headerContent下边距，32是内容区的外边距
    //   console.log("this.contentHeight: ", this.contentHeight)
    // });
  },
  methods: {
    getTaskState(text) {
      // -4 等待配置
      // -3 算法选择
      // -2 数据选择
      // -1 训练参数配置
      // 0 训练中
      // 1 未发布
      // 2 已发布
      switch (text) {
        case -4:
          return '等待配置';
          break;
        case -3:
          return '算法选择';
          break;
        case -2:
          return '数据选择';
          break;
        case -1:
          return '训练参数配置';
          break;
        case 0:
          return '模型训练';
          break;
        case 1:
          return '未发布';
          break;
        case 2:
          return '已发布';
          break;
        case 3:
          return '等待训练';
          break;
      }
    },
     // 获取选择的目录列表
     hanldeDictChanged(dictObj) {
      this.queryDictObj = dictObj
      this.getDataList()
    },
    onRename(record) {
      this.$set(this.renameForm, 'id', record.id)
      this.$set(this.renameForm, 'modelName', record.modelName)
      this.renameVisible = true
    },
    handleRenameOk() {
      this.$refs.ruleForm.validate(async (valid) => {
        if (!valid) {
          return false
        } else {
          const res = await editModelName(this.renameForm)
          if (res.code !== 0) return false
          this.$message.success('修改成功！')
          this.handCancel()
          this.getDataList({
            pageSize: this.pagination.pageSize,
            pageIndex: this.pagination.current,
          })
        }
      })
    },
    handCancel() {
      this.$refs.ruleForm.resetFields()
      this.renameForm = {}
      this.renameVisible = false
    },
    mouseenter() {
      this.visible = true
    },
    handleVisibleChange(visible) {
      if (!visible) {
        this.visible = false
      }
    },
    getDataList(param = {}) {
      if (param?.dataType === 'select') this.currentTreeData = { ...param }//浅拷贝
      // 添加目录条件(别问我为啥这样写，只能说以前就这样写的)
      param.dataRef = this.queryDictObj
      const params = getParams(param, this, "model")
      if (param?.isFirst) {
        params.nodeId = 0
        params.nodeCode = ''
      }
      this.currentNode = params.nodeId || 0
      this.getList(params)//调用方法读取列表内容
      // this.setTimer(this.getList, params, 2 * 60 * 1000)
    },
    // 请求获取模型列表
    getList(params) {
      const { isPublish } = this.filtersType
      params.modelType = this.tabActiveKey
      params.isPublish = isPublish
      params.addType = 0
      if(this.isFirst) {
        this.loading = true//默认loading为true，显示加载中动效
        this.isFirst = false
      }
      if (!params?.noLoading) {
        this.loading = true
      }
      getModelTableList(params)//使用import的函数调用axios方法，从后端接口读取数据
          .then((res) => {
            //console.log(res);
            //如果可以正确获取数据，则把loading设置为false
            this.loading = false
            //对象属性解构，把res中的属性拆成records、code、msg，这里面records为原对象属性data的别名
            const { data: { records = [] } = {}, code, msg } = res
            if (code === 0) {//校验码，0表示成功
              this.pagination.total = res.data.total//数据总条数
              if (params?.isFirst) {//可选链式操作符
                this.total = res.data.total
              }
              // else {//否则total被更新为getModelTableList函数返回值
              //   getModelTableList({
              //     modelType: this.tabActiveKey
              //   }).then(data => {
              //     this.total = data.data.total
              //   })
              // }
              this.$refs.tree?.reloadData(this.currentTreeData)
              this.data = records.map(item => {
                if (item.taskStatus === 2) {
                  item.modelSchedule = 100
                }
                return {//若版本数大于1，则将children设为空数组以备之后存储版本列表，否则为undefined
                  ...item,
                  children: item.versionCounts > 1 ? [] : undefined,
                  modelSchedule: item.modelSchedule ? Number(item.modelSchedule) : 0,
                }
              })
              console.log("getList+++++: ", this.data)
              this.expandedRowKeys = []
              //若列表中有任务的任务状态为1，则十五秒后重新获取数据，定期更新数据列表
              clearTimeout(this.timer)
              if (this.data.filter(item => item.taskStatus === 1).length > 0) {
                this.setTimeOut(this.getList, params, 10 * 1000)
              }
            }
          })
          .catch(err => {
            this.loading = false
            // this.$message.error(err)
            clearInterval(this.timer)
          })
    },
    async getChildren(expanded, record) {
      if (!expanded) {
        this.expandedRowKeys = []
        return false
      } else {
        this.expandedRowKeys.push(record.id)
      }
      // 当状态为展开时，获取当前算法的所有版本
      this.loading = true
      const res = await modelVersion.getImageVersionList({ sourceVersionId: record.sourceVersionId })
      this.loading = false
      if (res.code !== 0) return false
      record.children = res.data.filter(item => {
        if (item.taskStatus === 2) {
          item.modelSchedule = 100
        }
        return item.id !== item.sourceVersionId
      })
    },
    tabOnChange(key) {
      // this.tabActiveKey = key
      // localStorage.setItem('modelTabActiveKey', key)
      this.getDataList({ modelType: this.tabActiveKey, isFirst: true })
    },//输入模型时调用
    //新建版本
    handCreate() {
      if (this.tabActiveKey === '1') {
        // 没完没了的log，log你妹啊
        // console.log("before: ", this.$store.state.model.step.newModelVisible)
        this.$store.commit('setNewModelVisible', true);
        // console.log("after: ", this.$store.state.model.step.newModelVisible)
        // 跳转到新建模型
        // let bread = {
        //   ...this.$route.meta,
        //   path: this.$route.path
        // }
        // localStorage.setItem("bread", JSON.stringify(bread))
        // this.$router.push({
        //   path: "/train/model/step-form",
        //   query: { modelType: this.tabActiveKey, active: new Date().getTime(), parentId }
        // })
      } else {
        this.$router.push({
          path: '/train/model/addBusinessSteps',
          query: { modelType: this.tabActiveKey, active: new Date().getTime(), }
        })
      }
    },
    handCreateVerison(parentId, record) {
      console.log("parentId: ++++++", parentId);
      let index = this.data.findIndex(item => item.id === parentId);
      // console.log("index: ", index);
      if(index !== -1) {
        const info = {
          id: this.data[index].id,
          modelName: this.data[index].modelName,
          storedDirName: this.data[index].storedDirName,
          modelDescription: this.data[index].modelDescription,
          storedDirId: this.data[index].storedDirId,
        };
        console.log("表单信息info: ", info);
        localStorage.setItem("info", JSON.stringify(info))
        // console.log("this.treeData[index].storedDirId: ", this.treeData[index].storedDirId)
        if (this.tabActiveKey === '1') {
          this.$router.push({//跳转到新建模型
            path: "/train/model/step-form",
            query: { modelType: this.tabActiveKey, active: new Date().getTime(), parentId, id: parentId, name: record.modelName }
          })
        } else {
          this.$router.push({
            path: '/train/model/addBusinessSteps',
            query: { modelType: this.tabActiveKey, active: new Date().getTime(), parentId, id: parentId }
          })
        }
      }
    },
    toMiddleResult(record) {
      this.$router.push({
        path: `/train/model/middleResult/`,
        query: { modelType: this.tabActiveKey, id: record.id, type: 'model' }
      })
    },
    goStepForm(id, name) {
      // 跳转到新建模型
      this.$router.push({
        path: "/train/model/step-form",
        query: { modelType: this.tabActiveKey, active: new Date().getTime(), id: id}
      })
    },
    async getModelList(param, id) {
      const params = getParams(param, this, "model")
      await this.getList2(params, id)//调用方法读取列表内容
      // this.setTimer(this.getList, params, 2 * 60 * 1000)
    },
    // 请求获取模型列表，待优化
    async getList2(params, id) {
      params.modelType = '1'// 模型类型，默认为通用模型，所以设置为1；
      this.loading = true//默认loading为true，显示加载中动效
      const res = await getModelTableList(params)//使用import的函数调用axios方法，从后端接口读取数据
      //对象属性解构，把res中的属性拆成records、code、msg，这里面records为原对象属性data的别名
      const { data: { records = [] } = {}, code, msg } = res
      if (code === 0) {//校验码，0表示成功
        //如果可以正确获取数据，则把loading设置为false
        // this.loading = false
        this.modelInfo = records.filter(item => item.id == id ); // 返回的是数组
        this.modelInfo = this.modelInfo[0] // 获取第一个对象
        this.modelInfo.modelSchedule = this.modelInfo.taskStatus === 2? 100 : this.modelInfo.modelSchedule;
        // this.$store.commit('setModelInfoRecord', this.modelInfo);
      }else {
        // this.loading = false
      }
      console.log("this.modelInfo++++++++: ", this.modelInfo)
    },
    async linkToDetail(record) {//点击模型名称超链接进入详情页
      // this.$store.commit('setCurrentModel', record.id)
      // if (record.taskStatus === 4) {
      //   this.$message.info('该模型已销毁，容器已回收')
      //   return
      // }
      if(this.tabActiveKey === '1') {
        // 跳转到新建模型
        let bread = {
          ...this.$route.meta,
          path: this.$route.path
        }
        localStorage.setItem("bread", JSON.stringify(bread))
        // await this.getModelList({ modelType: '1', isFirst: true, pageSize: 999999, pageIndex: 1 }, record.id)
        this.modelInfo = record
        this.modelInfo.modelSchedule = this.modelInfo.taskStatus === 2? 100 : this.modelInfo.modelSchedule;
        console.log("step this.modelInfo", this.modelInfo)
        // const step = this.modelInfo?.taskStatus === 0? 0:3;
        let step = 0;
        if(this.modelInfo?.taskStatus === 0) { // 模型配置时跳转到指定步骤
          step = this.modelInfo?.isPublish === 3? 3 : this.modelInfo?.isPublish + 3
        }else {
          step = 3; // 其他状态跳转到模型监控页面
        }
        this.$router.push({
          path: `/train/model/step-form`,
          // query: { modelType: this.tabActiveKey, id: record.id, taskStep: step, parentId: '', name: record.modelName }//向新建模型页面传数据
          query: { modelType: this.tabActiveKey, id: record.id, taskStep: step, parentId: '' }//向新建模型页面传数据
        })
      }else {
        // this.$router.push({
        //   path: `/train/model/addBusinessSteps`,
        //   query: { modelType: this.tabActiveKey, id: record.id, parentId: '' }//向新建模型页面传数据
        // })
        let bread = {
          ...this.$route.meta,
          path: this.$route.path
        }
        localStorage.setItem("bread", JSON.stringify(bread))
        this.$router.replace({
          path: `/train/model/detail/`,
          query: { modelType: this.tabActiveKey, id: record.id, taskStatus:record.taskStatus, modelId:record.imageId}//向详情页传数据
        })
      }
      // this.$router.replace({
      //   path: `/train/model/detail/`,
      //   query: { modelType: this.tabActiveKey, id: record.id,taskStatus:record.taskStatus }//向详情页传数据
      // })

    },

    // 模型发布
    async release(record) {
      this.parentData = record
      this.$nextTick(() => {
        this.$refs.addEditDialog.showDialog()
      })
    },
    onConfigShow(record) {
      if (record.pauseStatus === 1) {
        this.configShow = true
        this.configModelId = record.id
        this.getResourceConfigData(record)
      } else {
        pauseTrainModel({ modelId: record.id }).then(res => {
          if (res.code === 0) {
            this.$message.success('操作成功')
            this.getDataList({
              pageSize: this.pagination.pageSize,
              pageIndex: this.pagination.current,
            })
          }
        })
      }
    },
    async getResourceConfigData(res) {
      // const res = await getResourceConfig()
      this.configForm = {
        engineCoreType: res.computEngineType,
        cpuSetCount: res.coreSize,
        cpuSetMem: res.memorySize,
        gpuSetCount: res.gpuSize,
        gpuSetMem: res.videoMemorySize,
      }
    },
    // 终止训练
    onStopTrain(record) {
      this.$confirm({
        title: "确定要终止训练吗?",
        content: "此操作将终止训练，请确认是否终止?",
        cancelText: '取消',
        okText: '确定',
        onOk: () => {
          const obj = {
            modelId: record.id
          }
          stopModelTrain(obj)
              .then((res) => {
                if (res.code === 0) {
                  this.$message.success('终止成功!')
                  // 终止训练后查询列表，注意当前的页数和模型类型以及树节点id
                  this.getDataList({
                    pageSize: this.pagination.pageSize,
                    pageIndex: this.pagination.current,
                  })
                }
              })
          // .catch(err => this.$message.error(err))
        },
        onCancel() { }
      })
    },
    renderTaskList(taskList) {
      const task = taskList.map(item => {
        return <p>
          <span class="taskType">{item.typeName}</span>
          <span class="taskName">{item.name}</span>
          <span class="taskTime">{moment(item.createTime).format('YYYY-MM-DD HH:mm:ss')}</span>
        </p>
      })
      return <div class="task">
        <h4>当前模型已关联以下内容，请先删除下列模型组或者任务再删除该模型：</h4>
        <div class="taskList">
          <p>
            <span class="taskType">类型</span>
            <span class="taskName">任务名称</span>
            <span class="taskTime">发布时间</span>
          </p>
          {task}
        </div>
      </div>
    },
    // 删除模型
    async onDelModel(record) {
      let taskList = []
      this.loading = true
      const res = await delModeCheckDepend(record.id).catch(() => { this.loading = false })
      this.loading = false
      if (res?.code === 0) {
        taskList = res.data
      }else {
        return
      }
      const content = taskList.length === 0 ? "此操作将永久删除，请确认是否删除?" : this.renderTaskList(taskList)
      this.$confirm({
        title: taskList.length === 0 ? `确定要删除 ${record.modelName} 吗?` : '提示',
        content,
        cancelText: '取消',
        okText: '确定',
        width: 600,
        okButtonProps: {
          props: { disabled: taskList.length !== 0 },
        },
        onOk: () => {
          this.loading = true
          delModel(record.id).then((res) => {
            if (res.code === 0) {
              this.$message.success('删除成功!')
              if (this.data.length === 1 && this.pagination.total !== 1)
                this.pagination.current--
              this.getDataList({
                pageSize: this.pagination.pageSize,
                pageIndex: this.pagination.current,
              })
              // this.total--
              // this.$refs.tree.reloadData(this.currentTreeData)
            }
          }).finally(() => { this.loading = false })
        },
        onCancel() { }
      })
    },
    onStartTrain(record) {//不修改设置，以已保存的训练设置快速开始
      const params = {
        modelId: record.id,
      }
      const jsonparams = JSON.stringify(params);
      axios.post(`/api/v1/traincenter/modelManageInfo/completeSetTrainStart/`, jsonparams, {
        headers: {
          'Content-Type': 'application/json',
        }
      }).then(res => {
        // 请求成功的回调，此时返回code===0
        if (res.code === 0) {
          this.$message.success('启动成功!');
          // 终止训练后查询列表，注意当前的页数和模型类型以及树节点id
          this.getDataList({
            pageSize: this.pagination.pageSize,
            pageIndex: this.pagination.current,
          })
        }
      }).catch(error => {
        // 请求失败的回调
        this.$message.error('启动失败!');
      });
    },
    // 题库验证
    onForecast(record) {
      let bread = {
        ...this.$route.meta,
        path: this.$route.path
      }
      localStorage.setItem("bread", JSON.stringify(bread))
      this.$router.push({
        path: `/train/model/detail/`,
        // 6 默认跳到“离线评估”
        query: { key: this.tabActiveKey === '1' ? "6" : '3', modelType: this.tabActiveKey, id: record.id } // key是详情页题库验证的key
      })
    },
    onMonitor(record) {
      this.$store.commit('setCurrentModel', record.id)
      let bread = {
        ...this.$route.meta,
        path: this.$route.path
      }
      localStorage.setItem("bread", JSON.stringify(bread))
      this.$router.push({
        path: `/train/model/detail/`,
        query: { key: '3', modelType: this.tabActiveKey, id: record.id, taskStatus: record.taskStatus} // key是详情页题库验证的key
      })
    },
    // 模型导出
    async onExportModel(record) {
      // const url = '/api/v1/traincenter/modelManageInfo/download'
      // // await downloadFile(url)
      // downloadFileCommon(url,{"id":record.id,zipFilePath:"exportCommonModel_"+record.id+".zip"})
      // //  await downloadFile(url)
      
      // this.$message.info("模型导出中");
      window.open(`${location.origin}/api/v1/traincenter/modelManageInfo/download?id=${record.id}`)
    },
    // 业务模型
    async onExportModel2(record) {
      const url = '/api/v1/traincenter/modelManageInfo/downloadInference'
      // console.log("onExportModel2: ", url);
      downloadFileCommon(url,{"id":record.id,zipFilePath:"exportBizModel_"+record.id+".pth"});
        // await downloadFile(url)
      this.$message.info("模型导出中，请耐心等待")
    },
    // 点击分页等
    handleChange(pagination, filters, sorter) {
      this.filtersType = {
        isPublish: (filters?.isPublish && filters.isPublish.length > 0) ?
            this.taskMode.filter(item => filters.isPublish[0] === item.value)[0].id :
            null,
      }
      this.getDataList({
        pageSize: pagination.pageSize,
        pageIndex: pagination.current,
        search: this.searchFormData.name,
      })
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
    },
    readLog(params) {
      this.logShow = true
      this.currentModelLog = { ...params }
      this.getModelLogData()
    },
    getModelLogData() {
      this.logLoading = true
      const isHistory = this.currentModelLog.modelSchedule > 0 || this.currentModelLog.taskStatus === 3 || this.currentModelLog.taskStatus === 4
      const getData = isHistory ? getModelHistoryLog : getModelRealLog
      getData(this.currentModelLog.id).then(res => {
        if (res.code === 0) {
          this.logList = res.data.content
          this.fileUrl = res.data.fileUrl
        }
        if (!isHistory) {
          // this.logTime = setInterval(() => {
          //   this.getModelLogData()
          //   clearInterval(this.logTime)
          // }, 5000)
        }
        this.logLoading = false
      })
    },
    async downLoadLog() {
      // 下载当前模型日志
      // downloadFile('/api/v1/traincenter/modelManageInfo/downloadTrainHistoryLog/' + this.currentModelLog.id)

      const url = '/api/v1/traincenter/modelManageInfo/downloadTrainHistoryLog'
      // await downloadFile(url)
      downloadFileCommon(url,{"id":this.currentModelLog.id,zipFilePath:"exportTrainHistoryLog_"+this.currentModelLog.id+".txt"})
    },
    confirmConfig() {
      this.$refs.configForm.validate((valid) => {
        if (!valid) {
          return false
        } else {
          if (this.isConfirm) return
          this.isConfirm = true
          const params = {
            ...this.configForm,
            modelId: this.configModelId
          }
          recoverTrainModel(params).then(res => {
            if (res.code === 0) {
              this.$message.success('操作成功')
              this.configShow = false
              this.configModelId = null
              this.isConfirm = false
              this.getDataList({
                pageSize: this.pagination.pageSize,
                pageIndex: this.pagination.current,
              })
            }
          }).catch(() => {this.isConfirm = false})
        }
      })
    },
    cancelConfig() {
      this.$refs.configForm.resetFields()
      this.configShow = false
      this.configModelId = null
    },
    reloadTree() {
      this.$refs.tree.activeData()
    },
    show(record) {//此函数没有实际作用
      console.log(record);
    },
    showMoveNode(record) {
      this.$refs.moveNode.showModal(record.id)
    },
    showModelImport() {
      this.$refs.modelImport.showModal()
    },
    async modelExport() {
      this.loading = true
      const params = `?modelType=${this.tabActiveKey}&nodeId=${this.currentNode}`
      downloadFile('/api/v1/traincenter/modelManageInfo/downloadModelInfoByNode' + params)
      this.loading = false
    },
    async shareModel(record) {
      this.showShareDialog = true
      await this.$nextTick()
      await this.$refs.refShareModal.invokeModal({ data: record, type: 'model'})
      this.getDataList()
    },
    handSearch(event, reset) {
      if(reset) {
        this.$refs.refSearchForm.resetFields()
      }
      this.pagination.current = 1
      this.getDataList({ search: this.searchFormData.name })
    }
  }
}
</script>

<style lang="less">
.modelLog {
  max-height: calc(100vh - 250px);
  // margin: -30px 0 -40px 0;
}
</style>

<style lang="less" scoped>
@import "~@/config/theme.less";
.page-content {
  display: flex;
  flex-direction: column;
  .contentMain {
    flex: 1;
    overflow: auto;
  }
}
.scrollbar {
  &::-webkit-scrollbar {
    cursor: pointer;
    width: 6px;
    height: 8px;
    background-color: #fff;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0,0,0,.3);
    border-radius: 6px;
    border: solid transparent;
    cursor: pointer;
  }
  &::-webkit-scrollbar-track {
    background-color: #fff;
  }
}
.contentMain {
  // border-radius: @borderRadiusBig;
  //background-color: #fff;
  .scrollbar()
}
a {
  color: @tableNameColor;
}
a[disabled] {
  color: rgba(0, 0, 0, 0.25);
  cursor: not-allowed;
  pointer-events: none;
}

.taskList {
  overflow-y: auto;
  max-height: 250px;
  .taskType,.taskName,.taskTime

  {
    display: inline-block;
    width: 33%
  }
}

.table-region {
  background-color: #fff;
  border-radius: @borderRadiusBig;
  //border-top-left-radius: 4px;
  //border-top-right-radius: 4px;
}

/deep/ .ant-pagination-item-active a {
  color: #1890ff !important;
  background-color: #fff;
}

/deep/ .splitter-pane.vertical.splitter-paneR {
  min-height: 100%;
  height: auto;
  border-left: 1px solid rgba(0,0,0,0.2);
}

/deep/ .vue-splitter-container {
  min-height: calc(100vh - 168px);
}

/deep/ .ant-table-thead > tr > th {
  background-color: @tableHeadBgc;
  color: @tableHeadColor;
  font-size: @tableHeadFontSize;
  font-weight: 700;
}

/deep/ .ant-table-tbody > tr > td {
  font-size: @tableBodyFontSize;
  color: @tableBodyColor;
}

/deep/ .ant-table-row-level-0:nth-child(odd) {
  background-color: @tableBGC1; /* 奇数行背景色 */
}

/deep/ .ant-table-row-level-0:nth-child(even) {
  background-color: @tableBGC2; /* 偶数行背景色 */
}

/deep/ .ant-tag{
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 0;
}
</style>