<template>
  <div>
    <step-layout>
      <template slot="rightSpecial">
        <div class="datasetSelect" style="font-family: '微软雅黑', sans-serif;font-size: 14px;">
          测试集：
          <a-select style="width: 250px" @change="changeALL" v-model="selectTestDataset" :dropdownMatchSelectWidth="false" show-search :filter-option="filterOption">
            <a-select-option :value="item.id" :key="item.id" v-for="item in datasetList">
              {{ item.dlName }}
            </a-select-option>
          </a-select>
        </div>
        <div class="monitorDetailBottom" ref="tableBox">
          <a-divider class="title" type="vertical" />
          <span class="title">模型列表</span>
          <div class="table-header">
            <a-radio-group v-model="selectType" @change="selectTypeChange">
              <a-radio :value="1">全选</a-radio>
              <a-radio :value="2">反选</a-radio>
            </a-radio-group>
            <a-popconfirm
                title="确定删除当前所选中的模型么?"
                @confirm="delModel()"
                :disabled="selectedRowKeys.length === 0"
            >
              <a-button type="link" :disabled="selectedRowKeys.length === 0">批量删除</a-button>
            </a-popconfirm>
          </div>
<!--          :scroll="{ y: '25vh', x: 1300 + (columns.length - 9) * 100 }"-->
          <a-table
              :columns="columns"
              :data-source="tableData"
              :pagination="false"
              :rowClassName="rowClassName"
              :loading="tableLoading"
              :rowKey="(record) => record.modelName"
              :row-selection="rowSelection">
          <template slot="testDataset" slot-scope="text, record">
            <a-select v-model="record.selectedDataset" style="width: 250px" @change="handleSelectChange(record)" :dropdownMatchSelectWidth="false" show-search :filter-option="filterOption">
              <a-select-option :value="item.id" :key="item.id" v-for="item in datasetList">
                {{ item.dlName }}
              </a-select-option>
            </a-select>
          </template>
          <span slot="modelSchedule" slot-scope="text, record">
            <a-progress v-if="record.taskStatus === 1 || record.taskStatus === 2" :percent="record.modelSchedule" />
            <a-popover overlayClassName="modelSchedule" placement="left">
              <template slot="content">
                <a-alert
                    message="Error"
                    :description="record.remark || '未知原因，请联系管理员'"
                    type="error"
                    show-icon
                />
              </template>
              <a-tag v-if="record.taskStatus === 3" style="cursor: pointer;" :color="'red'">异常终止</a-tag>
            </a-popover>
            <a-tag v-if="record.taskStatus === 4" style="cursor: pointer;" :color="'red'">手动终止</a-tag>
          </span>
          <span slot="iou" slot-scope="text, record">
            <span v-if="record.iou === -1">NaN</span>
            <span v-else>{{ record.iou }}</span>
          </span>
          <span slot="recall" slot-scope="text, record">
            <span v-if="record.recall === -1">NaN</span>
            <span v-else>{{ record.recall }}</span>
          </span>
          <span slot="action" slot-scope="text, record">
            <a @click="startTask(record)" :disabled="record.taskStatus === 1">
              <span>{{record.taskStatus === 1 ? "测试中" : "测试"}}</span>
            </a>
            <a style="padding-left:10px;" @click="goResult(record)" :disabled="record.modelSchedule !== 100">
              <span>结果</span>
            </a>
            <a style="padding-left:10px;" :disabled="record.bestModel" @click="setBest(record)">
              <span>设置为最优</span>
            </a>
          </span>
          </a-table>
        </div>
      </template>
      <template slot="bottomSpecial">
        <a-button @click="prevStep" style="margin-left: 10px" class="btnStep">上一步</a-button>
        <a-button type="primary" @click="nextStep" class="btnStep" style="margin-left: 10px;">下一步</a-button>
        <a-button style="margin-left: 10px;" @click="cancel" class="btnStep">取消</a-button>
      </template>
    </step-layout>
  </div>
</template>

<script>
import StepLayout from '@/components/StepLayout'
import { getParams } from '@/utils/util'
import {getDataSetList, getPictureIdPageList, getTargetType} from "@/api/dataCenter"
import {getFileCategoryAndCount} from "@/api/modelManage";
import { getOffLineId } from "@/api/imageManage";
import * as modelApi from "@/api/modelManage";
import {mapState} from "vuex";
import {
  fetchTrainMonitorQXData,
  fetchTrainMonitorModelList,
  actionSetBestModel,
  updateForecastDataSet,
  delInfoModels, getBusinessModelManageInfo
} from '@/api/modelManage'
import { createOffLineTask } from "@/api/offlineForecast"
import { getOfflineTableList,
  delOfflineById,
  fetchOfflineForecastPodRunLog,
  checkTaskNameAvl,
  fetchOfflineModelHistoryLog,
  offlineModelTrainTaskStop,
  OffLineTaskRename
} from "@/api/offlineForecast"

export default {
  name: 'Step5',
  components: {
    StepLayout,
  },
  props: {
    modelID: {
      type: Number
    }
  },
  data () {
    // const { computEngineType, coreSize, memorySize, gpuSize, videoMemorySize, gpuMaxSize } = { ...this.$store.state.offline }
    const { computEngineType, coreSize, memorySize, gpuSize, videoMemorySize, gpuMaxSize } = { ...this.$store.state.model.step.dataSouce }

    return {
      timer: null,
      loopModelListTimer: null,  //
      idList: [],
      echartWidth: '100%',
      // chartData: [],
      option: null,
      loading: false,
      tableLoading: false,
      selectType: '',
      columns: [
        {
          key: 'modelName',
          dataIndex: 'modelName',
          title: '模型名称',
          ellipsis: true,
          align: 'left',
          width: '40%',
          // fixed: true
        }, {
          key: 'selectedDataset',
          dataIndex: 'selectedDataset',
          title: '测试集',
          scopedSlots: { customRender: "testDataset" },
          // ellipsis: true,
          align: 'center',
          width: 250
        }, {
          key: 'loss',
          dataIndex: 'loss',
          title: 'loss',
          ellipsis: true,
          align: 'center',
          width: 70
        }, {
          key: 'acc',
          dataIndex: 'acc',
          title: 'acc',
          ellipsis: true,
          align: 'center',
          width: 70
        }, {
          key: 'iou',
          dataIndex: 'iou',
          title: 'iou',
          scopedSlots: { customRender: "iou" },
          ellipsis: true,
          align: 'center',
          width: 70
        }, {
          key: 'recall',
          dataIndex: 'recall',
          title: 'recall',
          scopedSlots: { customRender: "recall" },
          ellipsis: true,
          align: 'center',
          width: 70
        }, {
          key: 'createTime',
          dataIndex: 'createTime',
          title: '测试时间',
          // ellipsis: true,
          align: 'center',
          width: 120
        }, {
          key: 'modelSchedule',
          dataIndex: 'modelSchedule',
          title: '测试进度',
          // ellipsis: true,
          scopedSlots: { customRender: "modelSchedule" },
          align: 'center',
          width: 120
        }, {
          key: 'action',
          dataIndex: 'action',
          title: '操作',
          scopedSlots: { customRender: "action" },
          align: 'right',
          width: 175
        }
      ],
      tableData: [],
      datasetList: [],
      selectedRowKeys: [],
      pagination: {
        current: 1,
        pageSize: 10
      },
      saveLoading: false,
      form: {
        computEngineType, coreSize, memorySize, gpuSize, videoMemorySize, gpuMaxSize
      },
      visible: false,
      confirmLoading: false,
      selectTestDataset: "", // 选择测试集
    }
  },
  beforeDestroy() {
    if (this.timer) clearTimeout(this.timer);
    if (this.loopModelListTimer) clearTimeout(this.loopModelListTimer);
  },
  computed: {
    rowSelection () {
      return {
        selectedRowKeys: this.selectedRowKeys,
        onChange: this.onSelectChange,
        // getCheckboxProps: record => ({
        //   props: {
        //     disabled: record.bestModel
        //   }
        // })
      }
    },
    ...mapState({
      step1ImageItem: state => state.model.step.step1ImageItem,
      offline: state => state.offline,
      currentModel: state => state.model.currentModel,
      modelInfoRecord: state => state.model.modelInfoRecord
    }),
    // currentModel() {
    //   return this.$store.state.model.currentModel;
    // },
    // modelInfoRecord() {
    //   return this.$store.state.model.modelInfoRecord;
    // },
  },
  watch: {
    selectTestDataset(value, valueOld) {
      this.tableData.forEach(item => {
        if(item.selectedDataset == '' || isNaN(item.selectedDataset)) {
          item.selectedDataset = parseInt(value);
          console.log("item.selectedDataset:  ", item.selectedDataset)
        }
      })
    }
  },
  async mounted () {
    await this.getDataList({ isFirst: true, dlTagType: this.step1ImageItem.tagType || this.modelInfoRecord.tagType, pageSize: 9999999 })
    await this.getTableList();
    await this.getTaskList({ isFirst: true })
    if(this.modelInfoRecord.taskStatus > 0) {
      // this.form.gpuMaxSize = this.modelInfoRecord.gpuMaxSize
      this.form.gpuSize = this.modelInfoRecord.gpuSize
      this.form.computEngineType = this.modelInfoRecord.computEngineType;
      this.form.coreSize = this.modelInfoRecord.coreSize;
      this.form.memorySize = this.modelInfoRecord.memorySize;
      this.form.videoMemorySize = this.modelInfoRecord.videoMemorySize;
    }
    this.tableLoading = false
    console.log("gpuMaxSize: +++++++++++", this.form)
  },
  methods: {
    changeALL (value) {
      let params = {
        id: this.idList.join(','),
        allDlId: value
      }
      console.log(params);
      updateForecastDataSet(params).then((res) => {
        console.log(res, 'sssssssssss');
      })
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
    async setBest (record) {
      const params = {
        modelName: record.modelName,
        trainModelId: this.$route.query.id
      }
      this.tableLoading = true
      const res = await actionSetBestModel(params)
      this.tableLoading = false
      if (!res.code === 0) return false
      this.loadtableLoadinging = false
      this.tableLoading = false
      this.$message.success('设置成功')
      await this.getTableList()
    },
    rowClassName (record) {
      // console.log("rowClassName record: ", record);
      let name = ''
      if (record.bestModel) name += 'bestModel '
      if (record.selected) name += 'selected '
      return name
    },
    // 获取模型列表(对应modelManageInfo表)
    // 增加needLoading, 标识是否需要loading效果（领导提出来定时刷新列表时不需要loading效果）
    async getTableList ({ needLoading = true } = {}) {
      this.tableLoading = needLoading
      // const res = await fetchTrainMonitorModelList({ trainModelId: this.$route.query.id })
      const res = await fetchTrainMonitorModelList({ trainModelId: this.modelID || this.$store.state.model.currentModel})
      this.tableLoading = false
      if (!res.code === 0) return false
      if (res.data && res.data.length) {
        if (res.data[0].allDlId) {
          this.selectTestDataset = res.data[0].allDlId
        }
      }
      try {
        Object.keys(JSON.parse(res.data[0]?.other)).forEach(item => {
          let flag = true;
          this.columns.forEach((k) => {
            if(k.key === item) {
              flag = false;
            }
          });
        })
      } catch {
        console.log('自定义训练参数格式错误！！！')
      }
      console.log("res.data: ", res.data);
      this.idList = []
      this.tableData = res.data.map(item => {
        this.idList.push(item.id)
        let other = {}
        try {
          other = JSON.parse(item.other)
        } catch {
          console.log('自定义训练参数格式错误！！！')
        }
        return {
          ...item,
          ...other,
          selected: false,
          selectedDataset: item.dlId ? item.dlId : '',
        }
      })
      console.log("this.tableData: ", this.tableData)
      if (this.loopModelListTimer) clearTimeout(this.loopModelListTimer)
      // 30s后刷新模型列表（需求：开始训练后，停留在step5，训练任务已完成但该页面模型列表未更新）
      this.loopModelListTimer = setTimeout(async () => {
        await this.getTableList({ needLoading: false })
        // 必须也同步刷新测试任务进度列表
        this.getTaskList({ isFirst: true })
      }, 60000);  //改为一分钟
    },
    selectTableRow (params) {
      if (params.componentType !== 'series') return false
      this.tableData.forEach(item => {
        item.selected = false
        if (item.modelName === params.name) {
          item.selected = true
        }
      })
      this.$nextTick(() => {
        const box = document.querySelector('.monitorDetailBottom .ant-table-body')
        // 获取当前高亮行的位置
        const rowScroll = document.querySelector('.selected').offsetTop
        box.scrollTop = rowScroll - 15
      })
    },
    onSelectChange (selectedRowKeys) {
      this.selectedRowKeys = selectedRowKeys
      if (this.selectedRowKeys.length === this.tableData.length) {
        this.selectType = 1
      } else {
        this.selectType = ''
      }
    },
    selectTypeChange () {
      if (this.selectType === 1) {
        this.selectedRowKeys = this.tableData.map(item => item.modelName)
      } else {
        this.selectedRowKeys = this.tableData.filter(item => {
          return !this.selectedRowKeys.includes(item.modelName)
        }).map(item => item.modelName)
      }
    },
    async delModel (modelName) {
      const params = {
        modelName: modelName || this.selectedRowKeys.toString(),
        trainModelId: this.modelID || this.$store.state.model.currentModel
      }
      console.log("delModel params: +++++", params)
      const res = await delInfoModels(params)
      if (res.code !== 0) return false
      this.$message.success('删除成功')
      await this.getTableList()
      this.selectedRowKeys = []
    },
    nextStep () {
      this.$emit('nextStep')
    },
    prevStep () {
      this.$emit('prevStep')
    },
    cancel () {
      this.$emit('cancel')
    },
    async getDataList (param) {//获取数据集列表
      console.log("getDataList params1: ", param)
      const params = getParams(param, this, "modelDataMrg");//调用api整理参数
      console.log("getDataList params2: ", params)
      const responseData = await getDataSetList(params);//调用api返回可用数据集列表
      if (responseData.code === 0) {//校验码正确
        this.loading = false;
        if (params.currentIndex !== 1) {
          this.datasetList = [...this.datasetList, ...responseData.data.records]
        } else {
          this.datasetList = responseData.data.records//设置数据集列表的内容
        }
      }
      console.log("AAAthis.datasetList: ", this.datasetList)
    },
    handleSelectChange(record) {
      console.log(record)
      let params = {
        id: record.id,
        dlId: record.selectedDataset
      }
      updateForecastDataSet(params).then((res) => {
        console.log(res, 'sssssssssss');
      })
    },
    async startTask (record) {
      console.log("record++++： ", record)
      if (record.taskStatus === 2) {
        this.$confirmEle('是否要进行再次估评？', {
          cancelButtonText: '取消',
          confirmButtonText: '确定',
          type: 'info',
        }).then(async() => {
            if (record.selectedDataset) {
            this.tableLoading = true
            const params = {
              ...this.offline,
              ...this.form,
              dlId: record.selectedDataset + ''
            }
            params.modelId = record.modelId;
            params.modelType = this.$route.query.modelType
            const index = this.datasetList.findIndex(item => item.id === record.selectedDataset);
            params.dlItem = this.datasetList[index];
            params.taskName = record.modelName; //  + Date.now()
            console.log("params++++++++++: ", params);
            console.log("this.datasetList: ", this.datasetList)
            if (!params.tagType) {
              params.tagType = this.step1ImageItem.tagType || this.modelInfoRecord.tagType
            }
            const res = await createOffLineTask(params)
            console.log("res+++++++: ", res);
            const { code, msg } = res
            // this.saveLoading = false
            if (code === 0) {
              this.$message.success('新建离线评估成功')
              this.getTaskList({ isFirst: true })
              this.tableLoading = false;
              // bus.$emit('reloadOffline')
              // this.$store.commit('clearOfflineState')
              // this.$router.push("/train/offline")
            }
          } else {
            this.$message.error('请选择数据集')
          }
          }
        ).catch(()=>{})
        return
      }
      if (record.selectedDataset) {
        this.tableLoading = true
        const params = {
          ...this.offline,
          ...this.form,
          dlId: record.selectedDataset + ''
        }
        params.modelId = record.modelId;
        params.modelType = this.$route.query.modelType
        const index = this.datasetList.findIndex(item => item.id === record.selectedDataset);
        params.dlItem = this.datasetList[index];
        params.taskName = record.modelName; //  + Date.now()
        console.log("params++++++++++: ", params);
        console.log("this.datasetList: ", this.datasetList)
        if (!params.tagType) {
          params.tagType = this.step1ImageItem.tagType || this.modelInfoRecord.tagType
        }
        const res = await createOffLineTask(params)
        console.log("res+++++++: ", res);
        const { code, msg } = res
        // this.saveLoading = false
        if (code === 0) {
          this.$message.success('新建离线评估成功')
          this.getTaskList({ isFirst: true })
          this.tableLoading = false;
          // bus.$emit('reloadOffline')
          // this.$store.commit('clearOfflineState')
          // this.$router.push("/train/offline")
        }
      } else {
        this.$message.error('请选择数据集')
      }
    },
    // this.getTaskList({ isFirst: true })
    async getTaskList (param) {
      if (param?.dataType === 'select') this.currentTreeData = { ...param }
      const params = getParams(param, this, "offline")
      if (param?.isFirst) {
        params.nodeId = 0
        params.nodeCode = ''
      }
      await this.getList(params)

    },
    // 这里是查询离线预测表（在模型信息表的基础上，当开始测试时，会生成一条离线预测数据）
    async getList (params) {
      // console.log("this.$route.query.modelType: ", this.$route.query.modelType)
      params.modelType = this.$route.query.modelType
      params.modelId = this.$route.query.id
      const res = await getOfflineTableList(params)
      console.log("res+++++++++: ", res)
      const { data: { records = [] } = {}, code, msg } = res
      if (code === 0) {
        this.tableData = this.tableData.map(item => {
          const index = records.findIndex(i => i.taskName === item.modelName);
          console.log("records index： ", index ,"   ", records[index]);
          let taskInfo = {}
          if(index !== -1) {
            taskInfo = records[index];
            console.log("taskInfo+++++++++++: ", taskInfo)
            item.selectedDataset = parseInt(taskInfo.dlIds);
            console.log("selectedDataset: ", item.selectedDataset)

            console.log("taskInfo.modelSchedule: ", taskInfo.modelSchedule, ",taskInfo.modelSchedule: ", Number(taskInfo.modelSchedule))
            item.modelSchedule = Number(taskInfo.modelSchedule)
            this.$set(item, 'taskStatus', taskInfo.taskStatus)
          }
          return {
            ...taskInfo,
            ...item,
            // modelSchedule: item.modelSchedule ? Number(taskInfo.modelSchedule) : 0,
          }
        })
        let isrefreesh = this.tableData.some(item => item.taskStatus === 1)
        console.log(isrefreesh);
        if (isrefreesh) {
          if (this.timer) clearTimeout(this.timer)
          this.timer = setTimeout(() => {
            this.getList(params)
          }, 5000);
        }
      }
      // this.tableLoading = false
      console.log("合并后this.tableData: ", this.tableData);
    },
    async goResult(record) {
      //modeltype=1，通用模型，modeltype=2，业务模型
      // console.log(this.modelDetail)
      let data = await getOffLineId(record.modelId, record.taskName)
      if(data.code != 0) {  //非0时 可能没有id，会导致push后用id请求的接口报错
        return this.$message.error(data.msg)
      }
      let id = data.data?.id
      this.$store.commit('setCurrentOffline', id)
      let bread = {
        ...this.$route.meta,
        path: this.$route.path
      }
      localStorage.setItem("bread", JSON.stringify(bread))
      this.$router.push({
        path: `/train/offline/detail/`,
        query: {
          // modelId: this.currentModel, key: '4', modelType: this.modelInfoRecord.modelType, id: record.id, datalist: this.modelInfoRecord.dataList
          modelId: this.currentModel || this.modelID || this.modelInfoRecord.id, modelType: this.modelInfoRecord.modelType, id: id
        }
      })
    },
    handleOk(e) {
      this.$refs.resourceModal.$refs.ruleForm.validate(valid => {
        if (valid) {
          this.confirmLoading = true;
        } else {
          this.$message.info("必填项不能为空！");
          return false;
        }
      });
    },
    handleCancel(e) {
      // 调用子组件的函数，清空字段
      this.visible = false;
    },
  }
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
a[disabled] {
  color: rgba(0, 0, 0, 0.25)!important;
  cursor: not-allowed;
  pointer-events: none;
}
/deep/.ant-table-tbody tr.bestModel > td {
  color: #008000;
}
/deep/ .ant-table-thead > tr > th {
  padding: 4px!important;
}
/deep/ .ant-table-tbody > tr > td {
  padding: 4px!important;
}
// /deep/ .ant-select-selection {
//   max-width: 150px!important;
// }
.btnStep {
  width: @nextStepWidth;
  height: @nextStepHeight;
  color: @nextStepColor;
  background-color: @nextStepBgc;
  border-radius: @borderRadiusSmall;
}
.disabled {
  color: #333;
  background-color: #fff;
}
.monitorDetail{
  width: 100%;
  height: 100%;
  background-color: #fff;
  span.title{
    font-weight: bold;
    font-size: 14px;
  }
  &Top{
    height: 39vh
  }
  // &Bottom{
  //   // height: calc(60vh - 210px);
  // }
}
/deep/ .bestModel{
  color: #008000;
  font-weight: bold
}
/deep/ .selected{
  background: #f0f6ff;
  box-shadow: 0px 2px 5px #ccc;
}
.datasetSelect {
  margin-bottom: 32px;
  font-size: @paneFontSize;
}
/deep/ .ant-table-wrapper .ant-table-thead > tr:first-child > th:last-child {
  border-top-right-radius: 0!important;
}

/deep/ .ant-table-header {
  background-color: transparent;
}
</style>
