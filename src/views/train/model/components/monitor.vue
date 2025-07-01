<template>
  <div class="monitorDetail">
    <a-spin :spinning="loading" style="height: 255px;">
      <div class="monitorDetailTop">
          <!-- <a-divider class="title" type="vertical" /> -->
          <!-- <span class="title">训练曲线</span> -->
          <div style="height: 300px;">
            <echart
              :styleObj="echartWidth"
              :option="option"
              @click="selectTableRow"
             />
          </div>
      </div>
    </a-spin>
    <!--      展示日志信息-->
    <a-spin :spinning="logLoading">
      <div v-if="showLog" class="log-style">
        <a-divider class="title" type="vertical" />
        <span class="title" v-tooltip.top="'查看详情'" @click="readLog(record)" style="cursor: pointer;">训练日志 &nbsp;<a-icon type="code" class="log-detail-icon"/></span>
        <div class="statusBlock">
          <a-tag v-if="this.modelInfoRecord.taskStatus === 1 && this.modelDetail.modelSchedule != 0" style="cursor: pointer;" :color="'blue'" @click="readLog(record)">模型训练</a-tag>
          <a-tag v-if="this.modelInfoRecord.taskStatus === 2 && this.modelDetail.modelSchedule != 0" style="cursor: pointer;" :color="'green'" @click="readLog(record)">训练完成</a-tag>
          <a-tag v-if="this.modelInfoRecord.taskStatus === 3" style="cursor: pointer;" :color="'red'" @click="readLog(record)">异常终止</a-tag>
          <a-tag v-if="this.modelInfoRecord.taskStatus === 4" style="cursor: pointer;" :color="'red'" @click="readLog(record)">手动终止</a-tag>
          <a-tag v-if="this.modelInfoRecord.taskStatus === 5" style="cursor: pointer;" :color="'yellow'" @click="readLog(record)">已暂停</a-tag>
        </div>


        <a-modal v-model="logShow"
             title="查看日志"
             :width="'80%'"
             :maskClosable="false"
             centered
             @ok="handleOk">
          <template slot="footer">
            <a-button key="download" @click="downLoadLog" :disabled="!fileUrl">
              下载日志
            </a-button>
            <a-button key="back" @click="getModelLogDataver3">
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
            <textarea v-model="logList" class="scrollbar" ref="refLogModal" disabled style="height: 65vh; width: 100%; outline: none; resize: none; border: none;"></textarea>
          </pre>
        </a-modal>

<!--        <pre class="modelLog"-->
<!--             style="height: 100%; white-space: normal;width: 100%">-->
<!--          -->
<!--        </pre>-->
        <div class="text-style">
<!--          <p>-->
<!--&lt;!&ndash;            {{ logList && logList.content }}&ndash;&gt;-->

<!--          </p>-->
          <!-- 暂时关闭-->
          <!-- <textarea :infinite-scroll-disabled="isDisabled" ref="scrollTextArea" v-infinite-scroll="scrollLoad" v-model="logList" disabled class="textarea">
          </textarea> -->
          <!-- 按领导要求 不再截取日志展示，直接展示所有日志 -->
          <textarea ref="refMiddleLog" v-model="logList" disabled class="textarea">
          </textarea>
        </div>
      </div>
    </a-spin>
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
<!--      :scroll="{ y: '25vh', x: 1300 + (columns.length - 9) * 100 }"-->
      <a-table
        :columns="columns"
        :data-source="tableData"
        :pagination="false"
        :rowClassName="rowClassName"
        :loading="tableLoading"
        :rowKey="(record) => record.modelName"
        :row-selection="rowSelection">
        <span slot="iou" slot-scope="text, record">
          <span v-if="record.iou === -1">NaN</span>
          <span v-else>{{ record.iou }}</span>
        </span> 
        <span slot="recall" slot-scope="text, record">
          <span v-if="record.recall === -1">NaN</span>
          <span v-else>{{ record.recall }}</span>
        </span>
        <span slot="acc" slot-scope="text, record">
          <span v-if="record.acc === -1">NaN</span>
          <span v-else>{{ record.acc }}</span>
        </span>
        <span slot="bestModel" slot-scope="text, record">
          {{ record.bestModel ? '是' : '否' }}
        </span>
        <span slot="action" slot-scope="text, record">
          <a-popconfirm
            title="确认删除该模型么?"
            @confirm="delModel(record.modelName)"
          >
            <a :disabled="record.bestModel" style="margin-right: 5px">
              <span>删除</span>
            </a>
          </a-popconfirm>
          <a :disabled="record.bestModel" @click="setBest(record)">
            <span>设置为最优</span>
          </a>
          <a style="padding-left:10px;" v-if="false" @click="goDownPth(record)">
            <span>下载</span>
          </a>
        </span>
      </a-table>
    </div>
  </div>
</template>
<script>
import { Echart } from "@/components"
import {
  getModelInfoById,
  fetchTrainMonitorQXData,
  fetchTrainMonitorModelList,
  actionSetBestModel,
  getModelHistoryLog,
  getModelRealLog,
  delInfoModels, getBusinessModelManageInfo, downloadFileCommon
} from '@/api/modelManage'  //利用axios从后端获取模型数据
import {
  getModelTableList,
  getModelDLtByDLId,
  stopModelTrain,
  getCodeData,
  getCodeList,
} from "@/api/modelManage"//利用axios从后端获取模型数据
import system from "@/api/system";
import configSystem from "@/config/system";
import config from "@/config/config";
import { getParams } from '@/utils/util'
import { mixinHeader } from "@/utils/mixin"
import bus from "@/utils/bus";
import {downLoadLog} from '@/views/train/model'

export default {
  name: "monitorDetail",
  components: {
    Echart
  },
  mixins: [mixinHeader],
  props: {
    modelDetail: { // 该对象仅包含了模型id
      type: Object,
      default: () => {}
    },
    showLog: {
      type: Boolean,
      default: false,
    }
  },
  data () {
    return {
      isGetModelInfo: true,
      timer3: null,
      timer2: null,
      timer1: null,
      // logpage: 1,
      // 推测应该是后台一次性把所有日志返回了，这里dateloge记录全量日志，logList从中分页截取展示
      // dateloge: '',
      echartWidth: '100%',
      chartData: [],
      option: null,
      loading: false,
      tableLoading: false,
      logShow: false,
      fileUrl: '',
      selectType: '',
      legend: {
        lr: '学习率lr',
        loss: '残差loss',
        iou: '重叠率iou',
        acc: '准确率acc',
        recall: '召回率recall'
      },
      columns: [
        {
          key: 'modelName',
          dataIndex: 'modelName',
          title: '模型名称',
          ellipsis: true,
          align: 'left',
          width: '60%',
          // fixed: true
        }, {
          key: 'epoch',
          dataIndex: 'epoch',
          // title: '迭代次数epoch',
          // ellipsis: true,
          title: 'epoch',
          align: 'right',
          width: 72
        }, {
          key: 'lr',
          dataIndex: 'lr',
          // title: '学习率lr',
          // ellipsis: true,
          title: 'lr',
          align: 'right',
          width: 85
        }, {
          key: 'loss',
          dataIndex: 'loss',
          // title: '残差loss',
          ellipsis: true,
          title: 'loss',
          align: 'right',
          width: 85
        }, {
          key: 'acc',
          dataIndex: 'acc',
          // title: '准确率acc',
          // ellipsis: true,
          title: 'acc',
          scopedSlots: { customRender: "acc" },
          align: 'right',
          width: 85
        }, {
          key: 'iou',
          dataIndex: 'iou',
          // title: '重叠率iou',
          // ellipsis: true,
          title: 'iou',
          scopedSlots: { customRender: "iou" },
          align: 'right',
          width: 85
        }, {
          key: 'recall',
          dataIndex: 'recall',
          // title: '召回率recall',
          // ellipsis: true,
          title: 'recall',
          scopedSlots: { customRender: "recall" },
          align: 'right',
          width: 56
        }, {
          key: 'bestModel',
          dataIndex: 'bestModel',
          title: '是否最优',
          scopedSlots: { customRender: "bestModel" },
          // ellipsis: true,
          align: 'center',
          width: 76
        }, {
          key: 'action',
          dataIndex: 'action',
          title: '操作',
          scopedSlots: { customRender: "action" },
          align: 'right',
          width: 160
        }
      ],
      tableData: [],
      selectedRowKeys: [],
      timer: null, // 记录定时器

      logLoading: false, // 日志加载状态
      logList: '', // 日志信息
      warpType: true, // 控制日志信息是否换行展示

      currentNode: '',
      pagination: {
        current: '',
        pageSize: '',
      },
      isFirst: true,
    }
  },
  computed: {
    // isDisabled () {
    //   return this.logList === this.dateloge
    // },
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
    modelInfoRecord() {
      return this.$store.state.model.modelInfoRecord;
    },
    modelId() {
      return this.$route.query.id
    }
  },
  watch: {
    modelInfoRecord: {
      async handler(value) {
        if(value.taskStatus === 1) {
          await this.getModelLogData()
        }
      },
      deep: true,
    },
    'tableData.length': {
      handler(v) {
        if (v) {
          bus.$emit('monitorList', this.tableData)
        }
      }
    }
  },
  async mounted(){
    // 模拟异步获取数据，实际情况中应该根据你的业务逻辑进行调整
    // const xAxisMax = await this.fetchXAxisMax();
    // console.log("xAxisMax: ", xAxisMax)
    this.option = {
      color: ["#c12e34", "#e6b600", "#0098d9", "#2b821d", "#005eaa", "#339ca8", "#cda819", "#32a487"],
      xAxis: {
        name: 'epoch',
        type: 'category',
        boundaryGap: false,  // 设置边界间隙为false，使数据点与刻度对齐
        data: [],
        position: 'bottom',
        axisLine: {
          onZero: false  // 将纵轴的刻度线显示在纵轴非0的位置
        },
        axisLabel: {
          position: 'right', // 将刻度标签显示在右侧
          interval: 0, // 设置刻度标签显示的间隔，0 表示全部显示
          align: 'center', // 设置刻度标签的对齐方式
          fontSize: 9,
        }
      },
      yAxis: {
        name: '指标',
        type: 'value'
      },
      legend: {
        show: true,
        // 图例放在右侧
        orient: 'vertical',
        right: 'right',
        top: 'middle', // 垂直居中
      },
      tooltip: {
        show: true,
        trigger: 'axis'
      },
      grid: {
        left: '5%', // 设置图表容器的左边距
        right: '10%', // 设置图表容器的右边距
        top: '10%', // 设置图表容器的上边距
        bottom: '25%' // 设置图表容器的下边距
      }
    }
    this.chartData = []
    this.tableData = []
    console.log("mounted this.modelDetail: +++++", this.modelDetail)
    console.log("Step4 mounted modelInfoRecord: +++++", this.modelInfoRecord)
    // await this.getModelInfoById(this.modelDetail.id)
    // await this.getDataList({ modelType: this.$route.query.modelType, isFirst: true, pageSize: 99999 })
    console.log("after getModelInfoById this.modelDetail: +++++", this.modelDetail)
    // if(this.modelInfoRecord.taskStatus > 0) {
    //   await this.getChartData()
    //   await this.getTableList()
    // }

    // if(this.modelInfoRecord.taskStatus > 1) {
    //   await this.getModelLogData()
    // }
    // this.timer && clearInterval(this.timer);
    // this.timer = setInterval(() => {
    //   this.getChartData()
    //   this.getTableList()
    //   this.getModelLogData()
    // }, 1000*60)
  },
  // activated() {
  //   console.log("activated this.modelDetail: +++++", this.modelDetail)
  //   this.getChartData()
  //   this.getTableList()
  //   this.getModelLogData()
  //   // this.timer && clearInterval(this.timer);
  //   // this.timer = setInterval(() => {
  //   //   this.getChartData()
  //   //   this.getTableList()
  //   //   this.getModelLogData()
  //   // }, 1000*60)
  // },
  deactivated() {
    clearInterval(this.timer);
    clearTimeout(this.timer1)
    clearTimeout(this.timer2)
    clearTimeout(this.timer3)
  },
  beforeDestroy() {
    clearInterval(this.timer);
    clearTimeout(this.timer1)
    clearTimeout(this.timer2)
    clearTimeout(this.timer3)
  },

  methods: {
    // scrollLoad () {
    //   this.logpage = this.logpage + 1
    //   this.logList = this.dateloge.substring(0, 1000 * this.logpage)
    // },
    handleOk(e) {
      console.log(e);
      this.logLoading = false;
    },
    readLog(params) {
      this.logShow = true
      this.currentModelLog = { ...params }
      this.getModelLogDataver3()
    },
    // 这个方法好像是只处理弹框查看日志里的数据，getModelLogData方法用来处理当前页面中间显示的日志信息
    // 获取模型训练日志信息
    async getModelLogDataver3() {
      console.log("获取日志信息+++++: ", this.modelDetail)
      console.log("this.modelInfoRecord: ", this.modelInfoRecord)
      // if(this.isFirst) {
      //   this.logLoading = true
      // }
      this.logLoading = true
      const isHistory = this.modelDetail.modelSchedule > 0 || [2,3,4,5].includes(this.modelDetail.taskStatus) || [2,3,4,5].includes(this.modelInfoRecord.taskStatus)
      console.log("isHistory: ", isHistory)
      // const isHistory = true
      const getData = isHistory ? getModelHistoryLog : getModelRealLog
      const res = await getData(this.modelDetail.id || this.modelId)
      if (res.code === 0) {
        if(res.data?.content) {
          // this.dateloge = res.data.content ?? ''
          // this.isFirst = false
          this.logList = res.data.content
          // console.log("日志logList: ", this.logList)
          this.fileUrl = res.data.fileUrl
        }
      }
      console.log("日志log： ", res);
      // console.log("日志log内容： ", res.data.content);
      this.logLoading = false
      this.scrollLogToBottom("refLogModal")
    },
    // 打开日志modal 自动滚动到底部
    scrollLogToBottom(refName) {
      this.$nextTick(() => {
        const container = this.$refs[refName];
        container && (container.scrollTop = container.scrollHeight);
      })
    },
    async downLoadLog() {
      // 下载当前模型日志
      // downloadFile('/api/v1/traincenter/modelManageInfo/downloadTrainHistoryLog/' + this.currentModelLog.id)

      const url = '/api/v1/traincenter/modelManageInfo/downloadTrainHistoryLog'
      // await downloadFile(url)
      // console.log("this.modelDetail.id: ", this.modelDetail.id)
      // downloadFileCommon(url,{"id":this.currentModelLog.id,zipFilePath:"exportTrainHistoryLog_"+this.currentModelLog.id+".txt"})
      downloadFileCommon(url,{"id":this.modelDetail.id,zipFilePath:"exportTrainHistoryLog_"+this.modelDetail.id+".txt"})
      
    },


    // async getDataList(param) {
    //   const params = getParams(param, this, "model")
    //   if (param?.isFirst) {
    //     params.nodeId = 0
    //     params.nodeCode = ''
    //   }
    //   this.currentNode = params.nodeId || 0
    //   await this.getList(params)//调用方法读取列表内容
    //   // this.setTimer(this.getList, params, 2 * 60 * 1000)
    // },
    // // 请求获取模型列表
    // async getList(params) {
    //   // const { isPublish } = this.filtersType
    //   params.modelType = this.$route.query.modelType
    //   // params.isPublish = isPublish
    //   // this.loading = true//默认loading为true，显示加载中动效
    //   const res = await getModelTableList(params)   //使用import的函数调用axios方法，从后端接口读取数据
    //   console.log('getModelTableList res: ', res);
    //   //如果可以正确获取数据，则把loading设置为false
    //   // this.loading = false
    //   //对象属性解构，把res中的属性拆成records、code、msg，这里面records为原对象属性data的别名
    //   const { data: { records = [] } = {}, code, msg } = res
    //   if (code === 0) {//校验码，0表示成功
    //     console.log('okkkkkkkkkkkkk!!!!!!!!!')
    //     console.log('this.modelDetail.id: ', this.modelDetail.id)
    //     this.modelDetail = records.filter(item =>  item.id == this.modelDetail.id );
    //     this.modelDetail = this.modelDetail[0]
    //     this.modelDetail.modelSchedule = this.modelDetail.taskStatus === 2? 100 : 0;
    //     // this.$store.commit('setModelInfoRecord', this.modelInfo[0]);
    //   }
    //   console.log("this.modelDetail++++++++kkkkkkk: ", this.modelDetail)
    // },
    // 查询基本信息
    async getModelInfoById (id) {
      // this.loading = true;//先设置加载中动效，载入数据后取消此动效
      //调用api获取模型数据集信息并赋值给modelInfo
      const data = await getModelInfoById(id)
      if (data.code === 0) {//成功返回code为0
        this.modelDetail = data?.data
        if (data.data.taskStatus === 2) {
          clearTimeout(this.timer3)
          console.log('setModelInfoRecord55555555555', data.data);
          this.$store.commit('setModelInfoRecord', data.data)
        }
        if (data.data.taskStatus === 1) {
          clearTimeout(this.timer3)
          this.timer3 = setTimeout(async() => {
            this.getModelInfoById(this.modelId)
          }, 1000 * 30)
        }
        console.log("this.modelDetail++++++++++xxxxxx: ", this.modelDetail);
      }
    },
    //下载模型
    // async goDownPth (record) {
    //   const res = await getBusinessModelManageInfo(record.modelId)
    //   if(res.code == 0  && res.data.algorithmStoredDir && record.modelName){
    //     let midPath= res.data.algorithmStoredDir+"/output/models/"+record.modelName;
        //暂时webURL固定
        // console.debug(record.modelId+",midPath:"+midPath)
        // const url = '/api/v1/traincenter/modelManageInfo/downloadCommonFile'
        // await downloadFile(url)

        // downloadFileCommon(url,{"filePath":midPath,"zipFilePath":record.modelName})
        //  await downloadFile(url)


        // let downURl = configSystem.webUrl+"/"+encodeURIComponent(midPath);
        // window.open(downURl);
        // this.$message.success('下载模型:'+record.modelName)
    //   }
    // },
    async setBest (record) {
      const params = {
        modelName: record.modelName,
        // trainModelId: this.$route.query.id  // 这个ID不对，应该是record
        trainModelId: record.modelId
      }
      this.tableLoading = true
      const res = await actionSetBestModel(params)
      if (!res.code === 0) return false
      // this.loadtableLoadinging = false
      this.$message.success('设置成功')
      await this.getTableList()
      await this.getChartData()
    },
    rowClassName (record) {
      let name = ''
      if (record.bestModel) name += 'bestModel'
      if (record.selected) name += 'selected '
      return name
    },
    async getChartData (value) {
      if (value !== "noloading") {
        this.loading = true
      }
      // const res = await fetchTrainMonitorQXData({ trainModelId: this.$route.query.id })
      console.log("trainModelId: this.modelDetail.id : ", this.modelDetail.id)
      const res = await fetchTrainMonitorQXData({ trainModelId: this.modelDetail.id || this.modelId })
      if (!res.code === 0) return false
      this.loading = false
      this.chartData = res.data
      console.log("chartData: ", this.chartData)

      // var xAxisMax = this.option.xAxis[0].max;  // 横坐标刻度最大值
      var xAxisMax = this.chartData.length;
      console.log("刻度最大值:", xAxisMax);
      // 根据条件设置刻度间隔
      var intervall;
      if (xAxisMax > 50) {
          intervall = 2;
      } else {
          intervall = 1;
      }
      // console.log("刻度间隔:", intervall);

      let xAxis = {
        name: 'epoch',
        type: 'category',
        axisLabel: {
          // interval: intervall,
          interval: 0,  // 初始刻度间隔为0，表示使用默认间隔
          formatter: function (value, index) {
            // console.log("刻度间隔:", intervall);
            if (intervall === 2) {
              // 根据条件设置刻度间隔
              if (index % 2 === 0) {
                  return value;  // 刻度值仍然显示
              } else {
                  return '\n';  // 刻度值不显示，相当于间隔为2
              }
            }
            else if (intervall === 1) {
              return value;
            }
          }
        }
      }
      console.log("getChartData: ", res);
      try {
        let other = {}
        Object.keys(JSON.parse(this.chartData[0].other)).forEach(item => {
          console.log('item: ',item);
          other[item] = item
        })
        this.legend = {
          ...this.legend,
          ...other
        }
      } catch {
        // console.log("getChartData: ", '自定义训练参数格式错误！！！')
        console.log('echarts自定义训练参数格式错误！！！')
      }


      const series = Object.keys(this.legend).map(line => {
      const data = this.chartData.map(item => {
        if (!item.other) item.other = '{}';
        const other = JSON.parse(item.other);
        
        // 添加条件判断，仅将值不为-1的数据点添加到数组中
        const value = item[line] || other[line];
        if (value !== -1) {
          return {
            name: item.modelName,
            value,
            symbolSize: item.keyPoint ? 8 : 4,
            symbol: item.bestModel ? 'circle' : 'emptyCircle'
          };
        } else {
          return null; // 返回null表示该数据点不应该显示
        }
      }).filter(dataPoint => dataPoint !== null); // 过滤掉值为null的数据点

        xAxis.data = this.chartData.map(item => item.epoch);

        return {
          name: this.legend[line],
          data,
          type: 'line',
          smooth: true
        };
      });

      this.option = {
        ...this.option,
        xAxis,
        series
      };

      this.loading = false
      if(this.modelInfoRecord.taskStatus == 1 || this.modelDetail.taskStatus == 1) {
        console.log(this.modelInfoRecord.taskStatus, '88888888888888888888')
        // await this.getChartData()
        // this.setTimeOut(this.getChartData, null, 5*1000);
        if (this.timer1) clearTimeout(this.timer1)
        this.timer1 = setTimeout(async() => {
          await this.getChartData('noloading')
        }, 5000)
        if (this.isGetModelInfo) {
          this.isGetModelInfo = false
          this.timer3 = setTimeout(async() => {
            this.getModelInfoById(this.modelId)
          }, 1000 * 30)
        }
      }
    },
    async getTableList (data) {
      if (data && data?.loading) {
        this.tableLoading = false
      } else {
        this.tableLoading = true
      }
      // const res = await fetchTrainMonitorModelList({ trainModelId: this.$route.query.id })
      const res = await fetchTrainMonitorModelList({ trainModelId: this.modelDetail.id || this.modelId })
      console.log("getTableList: +++++", res);
      if (!res.code === 0) return false
      // try {
      //   Object.keys(JSON.parse(res.data[0]?.other)).forEach(item => {
      //     let flag = true;
      //     this.columns.forEach((k) => {
      //       // console.log("k.key: ", k.key)
      //       if(k.key === item) {
      //         flag = false;
      //       }
      //     });
      //     if(flag) {
      //       // 5决定了dice的所在列位置
      //       let columnsName = item;
      //       if(item === "dice") {
      //         columnsName = "相似系数" + columnsName;
      //       }
      //       this.columns.splice(5, 0, {
      //         key: item,
      //         dataIndex: item,
      //         title: columnsName,
      //         ellipsis: true,
      //         align: 'center',
      //         // width: 100,
      //       })
      //     }
      //   })
      // } catch {
      //   console.log('自定义训练参数格式错误！！！')
      // }

      this.tableData = res.data.map(item => {
        // let other = {}
        // try {
        //   other = JSON.parse(item.other)
        // } catch {
        //   console.log('自定义训练参数格式错误！！！')
        // }
        return {
          ...item,
          // ...other,
          selected: false
        }
      })
      this.tableLoading = false
      if(this.modelInfoRecord.taskStatus == 1 || this.modelDetail.taskStatus == 1) {
        // await this.getModelLogData()
        this.setTimeOut(this.getTableList, {loading: true}, 5*1000);
      }
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
        trainModelId: this.modelDetail.id
      }
      console.log("delModel params: +++++", params)
      const res = await delInfoModels(params)
      if (res.code !== 0) return false
      this.$message.success('删除成功')
      await this.getChartData()
      await this.getTableList()
      this.selectedRowKeys = []
    },
    // 
    // 获取模型训练日志信息
    async getModelLogData() {
      console.log("获取日志信息+++++: ", this.modelDetail)
      console.log("this.modelInfoRecord: ", this.modelInfoRecord)
      if(this.isFirst) {
        this.logLoading = true
      }
      const isHistory = this.modelDetail.modelSchedule > 0 || [2,3,4,5].includes(this.modelDetail.taskStatus) || [2,3,4,5].includes(this.modelInfoRecord.taskStatus)
      const getData = isHistory ? getModelHistoryLog : getModelRealLog
      const res = await getData(this.modelDetail.id || this.modelId)
      if (res.code === 0) {
        if(res.data?.content) {
          this.logList = res.data?.content || ""
          // this.dateloge = res.data.content ?? ''
          // if (this.isFirst) {
          //   this.logpage = 1
            this.isFirst = false
          //   this.logList = this.dateloge.substring(0, 1000)
          // }
        }
      }
      console.log("日志log： ", res);
      // if (!isHistory) {
      //   this.logTime = setInterval(() => {
      //     this.getModelLogData()
      //     clearInterval(this.logTime)
      //   }, 5000)
      // }
      this.logLoading = false
      this.scrollLogToBottom("refMiddleLog")
      if(this.modelInfoRecord.taskStatus == 1 || this.modelDetail.taskStatus == 1) {
        clearTimeout(this.timer2)
        this.timer2 = setTimeout(()=>{
          this.getModelLogData()
        }, 5000)
      }
    }
  }
}
</script>
<style lang="less" scoped>
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

.statusBlock {
  width: 80px;
  float: right;
}

.log-style {
  height: 120px;
  margin-bottom: 16px;
  .text-style {
    width: 100%;
    height: 100%;
    overflow: auto;
    p {
      font-size: 10px;
    }
    .textarea {
      font-size: 10px;
      resize: none;
      outline: none;
      width: 100%;
      height: 100px;
      .scrollbar()
    }
  }
}
.monitorDetail{
  height: 100%;
  //min-width: 1000px;
  background-color: #fff;
  span.title{
    font-weight: bold;
    font-size: 14px;
  }
  &Top{
    // 表格高度
    height: 26vh
  }
  &Bottom{
    // height: calc(60vh - 210px);
  }
}
/deep/ .bestModel{
  color: #008000;
  font-weight: bold
}
/deep/ .selected{
  background: #f0f6ff;
  box-shadow: 0px 2px 5px #ccc;
}
.modelLog {
  max-height: calc(100vh - 250px);
  // margin: -30px 0 -40px 0;
}
.log-detail-icon {
  vertical-align: middle;
  cursor: pointer;
}
</style>