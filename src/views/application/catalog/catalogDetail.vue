<template>
  <div>
    <a-spin :spinning="loading">
      <div class="page-content header">
        <a-row style="margin-bottom: 12px;">
          <a-button :disabled="!startEnable(detailData.infesvrState)" class="header-btn header-btn-right" type="primary"
                    @click="changeStatus">
            启动服务
          </a-button>
          <a-button :disabled="!stopEnable(detailData.infesvrState)" class="header-btn header-btn-right" type="danger"
                    @click="changeStatus">
            停止服务
          </a-button>
        </a-row>
        <a-descriptions
            :title="detailData.infesvrName"
            bordered
            :column="{ xxl: 4, xl: 4, lg: 4, md: 4, sm: 1, xs: 1 }"
            size="middle"
        >
          <a-descriptions-item label="描述：">
            {{ detailData.infesvrDescribe }}
          </a-descriptions-item>
          <a-descriptions-item label="运行状态：">
            <run-state :state="detailData?.infesvrState" :inferservice-id="detailData?.id" @refreshed="refreshedStatus"/>
          </a-descriptions-item>
          <a-descriptions-item label="版本数量：">
            {{ detailData.versionCount }}
          </a-descriptions-item>
          <a-descriptions-item label="创建人：">
            {{ detailData.createBy }}
          </a-descriptions-item>
          <a-descriptions-item label="资源规格：">
            {{ resourceSpecFormat(detailData.currVersionInfo?.simpleConfigInfo) }}
          </a-descriptions-item>
          <a-descriptions-item label="创建时间：">
            {{ detailData.createTime | moment }}
          </a-descriptions-item>
          <a-descriptions-item label="更新时间：">
            {{ detailData.updateTime | moment }}
          </a-descriptions-item>
        </a-descriptions>
      </div>

      <div class="page-content content">
        <a-tabs v-model="activeKey" v-if="initialized">
          <a-tab-pane :key="1" tab="任务概览" v-if="false">
            <div class="task-top">
              <div class="task-toa-left">
                <a-divider class="title" type="vertical"/>
                <span style="font-weight: bold">任务名称：{{ detailData.infesvrName }}</span>
                <a-descriptions class="detail">
                  <a-descriptions-item label="任务状态" :span="1">
                    <run-state :state="detailData.infesvrState" :inferservice-id="detailData?.id" @refreshed="refreshedStatus"/>
                  </a-descriptions-item>
                  <a-descriptions-item label="任务路径" :span="1">{{
                      (detailData.taskPath || "").replace(';', '/')
                    }}
                  </a-descriptions-item>
                  <a-descriptions-item label="创建用户" :span="1">{{ detailData.createBy }}</a-descriptions-item>
                  <a-descriptions-item label="上线日期" :span="3">{{
                      detailData.onlineTime | moment
                    }}
                  </a-descriptions-item>
                  <a-descriptions-item label="任务描述" :span="3">{{ detailData.infesvrDescribe }}</a-descriptions-item>
                  <a-descriptions-item label="访问地址" :span="3"><p v-for="url in accessUrls">{{ url }}</p>
                  </a-descriptions-item>
                  <!-- <a-descriptions-item label="UI预览地址" :span="3">
                    <a :href="UIUrl" target="_blank">{{ UIUrl }}</a>
                  </a-descriptions-item> -->
                  <a-descriptions-item label="说明文档" :span="3">
                    <a-button type="link" @click="showDocument = true">查看</a-button>
                    <a-modal v-model="showDocument" title="说明文档" :footer="null" width="70vw">
                      <div v-html="renderedMarkdown" class="document-container scrollbar markdown-body"></div>
                    </a-modal>
                  </a-descriptions-item>
                </a-descriptions>
              </div>
            </div>
          </a-tab-pane>
          <a-tab-pane :key="2" tab="版本列表">
            <version-list :detailData="detailData" @onUpdate="handleVersionUpdate"/>
          </a-tab-pane>
          <a-tab-pane :key="3" tab="接口信息">
            <p v-for="url in accessUrls">{{ url }}</p>
            <div class="task-top">
              <div class="task-toa-left">
                <a-descriptions class="detail">
                  <a-descriptions-item label="通信协议" :span="24">
                    HTTP
                  </a-descriptions-item>
                  <a-descriptions-item label="请求地址" :span="24">
                    <p>
                      {{ url }}
                      <copy-to-clipboard :text="url" @copy="copyUrl">
                        <img src="@/assets/copy.png" style="margin-left: 20px;"/>
                      </copy-to-clipboard>
                    </p>
                  </a-descriptions-item>
                  <a-descriptions-item label="请求方式" :span="24">
                    POST
                  </a-descriptions-item>
                  <a-descriptions-item label="请求头（Headers）" :span="12">
                    <a-table :columns="interfaceInfoColumns" :data-source="interfaceInfoData" rowKey="key"
                             :pagination="false">
                    </a-table>
                  </a-descriptions-item>
                  <!-- <a-descriptions-item label="UI预览地址" :span="3">
                    <a :href="UIUrl" target="_blank">{{ UIUrl }}</a>
                  </a-descriptions-item> -->
                  <a-descriptions-item label="请求说明" :span="24">
                    <!--                    <a-button type="link" @click="showDocument = true">查看</a-button>-->
                    <!--                    <a-modal v-model="showDocument" title="说明文档" :footer="null" width="70vw">-->
                    <!--                      <div v-html="renderedMarkdown" class="document-container scrollbar markdown-body"></div>-->
                    <!--                    </a-modal>-->
                    <a-textarea placeholder="接口文档示例"
                                :auto-size="{ minRows: 5, maxRows: 10 }"
                                style="width: 700px"
                    >
                    </a-textarea>
                  </a-descriptions-item>
                </a-descriptions>
              </div>
            </div>
          </a-tab-pane>
          <a-tab-pane :key="4" tab="接口测试" v-if="false">

          </a-tab-pane>
          <a-tab-pane :key="5" tab="监控信息">
            <monitor-panel :detail-data="{...detailData, id: this.$route.query.id }"/>
          </a-tab-pane>
          <a-tab-pane :key="6" tab="告警配置">
            <alarm-config :alarm="alarm"/>

          </a-tab-pane>
          <a-tab-pane :key="7" tab="实例列表" v-if="false">
            <instance-list :serviceId="detailData.configId"/>
          </a-tab-pane>
          <a-tab-pane :key="8" tab="运行日志">
            <log-info :loginfo="loginfo"/>
          </a-tab-pane>
          <a-tab-pane :key="9" tab="操作记录">
            <operate-record :serviceId="detailData.id"/>
          </a-tab-pane>
        </a-tabs>
      </div>
    </a-spin>
  </div>
</template>

<script>
import {Modal} from 'ant-design-vue';
import {Echart, NoData} from "@/components"
import {getLineOption} from '@/components/Echart/option/line'
import moment from "moment"
import {
  getStatisticsById,
  getunionMatrixById,
  getDataFlow,
  getOnlineData,
  getAppUrlList,
  getInferserviceInfoById, startInferserviceByIdWithVersion, stopInferserviceById,
} from "@/api/appCenter"
import config from '@/config/config'
import {getBackgroundStyle, getMatrixColumns, downloadFile} from '@/utils/util'
import realTimeDetail from './realTimeDetail'
import AlarmConfig from './alarmConfig.vue';
import monitorPanel from '@/views/application/catalog/MonitorPanel'
import markdownIt from 'markdown-it';
import 'github-markdown-css';
import logInfo from './loginfo.vue';
import CopyToClipboard from 'vue-copy-to-clipboard'
import versionList from "@/views/application/catalog/versionList.vue";
import InstanceList from "@/views/application/catalog/instanceList.vue";
import OperateRecord from "@/views/application/catalog/operateRecord.vue";
import * as utils from "./utils";
import RunState from "@/views/application/catalog/widgets/RunState.vue";
import {RunningStateEnum} from "@/views/application/catalog/constants";

const {date} = config;
export default {
  name: "CatalogDetail",
  components: {
    RunState,
    OperateRecord,
    InstanceList,
    Echart,
    NoData,
    realTimeDetail,
    AlarmConfig,
    monitorPanel,
    logInfo,
    CopyToClipboard,
    versionList
  },
  data() {
    return {
      loading: false,
      echartLodaing: false,
      tabKey: '1',
      lineData: [],
      mode: "today",
      option: {},
      byCodeOption: {},
      activeKey: 2,
      detailData: {
      },
      timeList: date,
      selectTime: date.find(item => item.key === 'today').value,
      matrixData: [],
      matrixColumns: [],
      quota: {label: "图片总数", key: 'sampleTotal'},
      quotaList: [
        {label: "图片总数", key: 'sampleTotal'},
        {label: "准确率", key: 'precisionRate'},
        {label: "覆盖率", key: 'recallRate'},
      ],
      dataFlowData: [],
      dataFlowOption: {},
      startTime: moment(new Date()),
      optionTop: {},
      accessUrls: [],
      UIUrl: '',
      showDocument: false, //查看说明文档

      alarm: {},
      loginfo: {},

      interfaceInfoColumns: [
        {
          title: '参数名',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: '类型',
          dataIndex: 'type',
          key: 'type',
        },
        {
          title: '值',
          dataIndex: 'value',
          key: 'value',
        },
      ],
      interfaceInfoData: [
        {
          key: '1',
          name: 'Content-Type',
          type: 'String',
          value: 'application/json'
        },
      ],
      url: 'http://ai-gateway.sit.sf-express.com/openapi/pipeline/2c5bf847-1d6b-456b-a2e4-6edc8404e53f/run',
      initialized: false,
    }
  },
  beforeRouteEnter(to, _, next) {
    const {id} = to.query
    next(vm => {
      vm.tabKey = '1'
      vm.mode = "today"
      vm.selectTime = date.find(item => item.key === 'today').value
      vm.quota = {label: "图片总数", key: 'sampleTotal'}
      // vm.getUIUrl(pipId, instanceId)
      vm.initialized = false;
      vm.getDetailInfo(id)
      // vm.getStatisticsAndMatrix(id)
      // vm.getDataFlowData(id)
      // vm.getOnlineData(id)
      // vm.getAccessUrlList(id)
    })
  },
  computed: {
    echartWidth() {
      return {
        width: this.lineData.length > 0 ? `${this.lineData.length * 10}px` : ''
      }
    },
    renderedMarkdown() {
      return this.mdInstance.render(this.detailData.requestNote || "");
    },

    state() {
      if (this.detailData.taskStatus === 2) {
        return true;
      } else {
        return false;
      }
    },
  },
  created() {
    this.mdInstance = new markdownIt()

    this.alarm = {
      ...this.alarm,
      monitorName: this.detailData.taskName,
      monitorId: this.$route.query.id
    }
  },
  methods: {
    ...utils,
    handleChange(v) {
      this.quota = v
      this.$nextTick(() => {
        this.handOption()
      })
    },
    isAdd(num) {
      return Number(num.replace('%', '')) > 0
    },
    getStyle(num) {
      return getBackgroundStyle(num)
    },
    tabChangge(key) {
      this.tabKey = key
    },
    getUIUrl(pipId, instanceId) {
      const origin = location.origin
      this.UIUrl = origin + `/pipelineCenter/preview/${pipId}?instanceId=${instanceId}`
    },
    getDetailInfo(id) {
      this.loading = true;
      getInferserviceInfoById(id).then(res => {
        const {code, data, msg} = res
        if (code === 0) {
          this.$nextTick(() => {
            this.detailData = data
            this.initialized = true;
          })
        }
      }).finally(() => {
        this.$nextTick(() => {
          this.loading = false
        });
      });
    },
    getAccessUrlList(id) {
      let param = {taskId: id};
      getAppUrlList(param).then(res => {
        const {code, data, msg} = res
        if (code === 0) {
          this.accessUrls = data;
        }
      })
    },
    async getOnlineData(taskId) {
      const arr = [{
        title: '匹配消息数',
        value: 'matchedMsgCnt'
      }, {
        title: '处理成功消息数',
        value: 'handleSuccessMsgCnt'
      }, {
        title: '处理失败消息数',
        value: 'handleFailedMsgCnt'
      }, {
        title: '处理图片总数',
        value: 'handleTotalImgCnt'
      }, {
        title: '处理图片成功总数',
        value: 'handleSuccessImgCnt'
      }, {
        title: '处理图片失败总数',
        value: 'handleFailedImgCnt'
      }]
      const res = await getOnlineData({taskId})
      if (res.code !== 0) return false
      this.optionTop = {
        color: ["#c12e34", "#e6b600", "#0098d9", "#2b821d", "#005eaa", "#339ca8", "#cda819", "#32a487"],
        xAxis: {
          type: 'category',
          data: res.data.map(item => item.calTime)
        },
        yAxis: {
          name: '指标',
          type: 'value'
        },
        legend: {
          show: true,
          bottom: 10
        },
        tooltip: {
          show: true,
          trigger: 'axis'
        },
        series: arr.map(item => {
          return {
            name: item.title,
            data: res.data.map(d => d[item.value]),
            type: 'line',
            smooth: true
          }
        })
      }
    },
    handOption() {
      const legendData = this.quotaList.map(obj => obj.label)
      const xAxisData = this.lineData.map(obj => obj.time)
      const seriesData = this.quotaList.map(obj => {
        return {
          name: obj.label,
          type: "line",
          data: this.lineData.map(item => item[obj.key])
        }
      })
      this.option = getLineOption(legendData, xAxisData, seriesData)

      const legendData2 = this.lineData[0]?.categorys || []
      const xAxisData2 = xAxisData
      const seriesData2 = legendData2.map(legend => {
        return {
          name: legend,
          type: "line",
          data: this.lineData.map(item => {
            const {matrix = []} = item
            const categoryitem = matrix.find(obj => obj.category === legend)
            return categoryitem ? categoryitem[this.quota.key] : 0
          })
        }
      })
      this.byCodeOption = getLineOption(legendData2, xAxisData2, seriesData2, this.quota.label)
    },
    getStatisticsAndMatrix(id) {
      this.echartLodaing = true
      const params = {
        fromDate: this.selectTime[0],
        toDate: this.selectTime[1],
        id,
      }
      // 获取两个线图
      getStatisticsById(params).then(res => {
        const {code, data = {}, msg} = res
        if (code === 0) {
          this.lineData = Object.keys(data).map(item => {
            return {
              time: item,
              ...data[item]
            }
          })
          this.$nextTick(() => {
            this.handOption()
            this.echartLodaing = false
          })
        } else {
          this.echartLodaing = false
        }
      })
      // 获取矩阵
      getunionMatrixById(params).then(res => {
        const {code, msg} = res
        const head = res?.data?.head || []
        const matrix = res?.data?.matrix || []
        if (code === 0) {
          this.matrixColumns = getMatrixColumns(head)
          this.matrixData = matrix.map((item, index) => {
            return {
              ...item,
              key: index,
              precisionRate: `${(item.precisionRate * 100).toFixed()}%`,
              recallRate: `${(item.recallRate * 100).toFixed()}%`,
            }
          })
          this.echartLodaing = false
        } else {
          this.echartLodaing = false
        }
      })
    },
    toExcel() {
      const id = this.$route.query.id
      const url = `/api/v1/applicationcenter/inferenceTaskPredictResult/exportExcel/${id}/${this.selectTime[0]}/${this.selectTime[1]}`
      this.loading = true
      downloadFile(url)
      this.loading = false
    },
    timeOnChange(date, dateString) {
      if (date.length === 2) this.startTime = ''
      this.mode = null
      this.selectTime = dateString
    },
    calendarChange(date, dateString) {
      if (date.length === 2) {
        this.startTime = ''
      } else {
        this.startTime = date[0]
      }
    },
    radioChange() {
      const checkDate = date.find(item => item.key === this.mode)
      this.selectTime = checkDate.value
    },
    disabledDate(current) {
      if (!this.startTime) {
        return current > moment(new Date())
      }
      const time = moment(this.startTime)
      return current && (current > moment(new Date()) || (current < time.subtract(1, 'months') || current > time.add(2, 'months')))
    },
    async getDataFlowData(id) {
      const nameList = {
        receive: '消息源（收）',
        match: '调度平台',
        parse: 'CSV解析',
        adc: '算法',
        mes: '消息源（发）'
      }
      const params = {
        beginDate: this.selectTime[0],
        endDate: this.selectTime[1],
        id,
      }
      const res = await getDataFlow(params)
      if (res.code !== 0) return false
      this.dataFlowData = res.data.map(item => {
        return {
          fail: item?.fail,
          error: item?.error,
          value: item.num,
          time: item.cost,
          timeout: item?.timeout,
          name: nameList[item.type]
        }
      })
      this.dataFlowOption = {
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            const time = params.data.time > 1000 ? (params.data.time / 1000) + '秒' : params.data.time + '毫秒'
            let number = ''
            if (params.data.fail !== undefined) {
              number = `数目(成功/失败)：${params.value}/${params.data.fail} 错误数：${params.data.error} 超时数：${params.data.timeout}  平均耗时：${time}`
            } else {
              number = `数目：${params.value}   平均耗时：${time}`
            }
            return number
          }
        },
        series: [{
          name: '数据流监控',
          type: 'funnel',
          right: '30%',
          label: {
            show: true,
            position: 'inside'
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1
          },
          emphasis: {
            label: {
              fontSize: 20
            }
          },
          data: this.dataFlowData
        }, {
          itemStyle: {
            opacity: 0
          },
          orient: 'vertical',
          label: {
            formatter: (params) => {
              const time = params.data.time > 1000 ? (params.data.time / 1000) + '秒' : params.data.time + '毫秒'
              let number = ''
              if (params.data.fail !== undefined) {
                number = `数目(成功/失败)：${params.value}/${params.data.fail} 错误数：${params.data.error} 超时数：${params.data.timeout}  平均耗时：${time}`
              } else {
                number = `数目：${params.value}   平均耗时：${time}`
              }
              return number
            },
            position: 'right'
          },
          type: 'funnel',
          right: '25%',
          data: this.dataFlowData
        }]
      }
    },

    changeStatus() {
      if (!this.startEnable(this.detailData.infesvrState) && !this.stopEnable(this.detailData.infesvrState)) {
        return false;
      }
      const action = this.startEnable(this.detailData.infesvrState) ? '启动' : '停止';
      Modal.confirm({
        title: `确认${action}服务`,
        content: `你确定要${action}服务吗？`,
        onOk: () => {
          this.loading = true;
          (
              this.startEnable(this.detailData.infesvrState) ?
                  startInferserviceByIdWithVersion(this.detailData.id, this.detailData.currVersion) :
                  stopInferserviceById(this.detailData.id)
          ).then((res) => {
            const {code, msg, data} = res;
            if (code === 0) {
              this.$message.success("更改成功！");
              this.detailData.infesvrState = data.state;
            } else {
              this.$message.error(msg);
            }
          }).catch(err => {
            this.$message.error(err);
          }).finally(() => {
            this.loading = false;
          });
        },
        onCancel() {
          // Noop
        }
      });

    },

    copyUrl() {
      this.$message.success('复制成功！');
    },
    handleVersionUpdate(tp, e) {
      if (tp === 'modify::config') {
        this.$nextTick(() => {
          this.getDetailInfo(this.detailData.id);
        });
      } else if(tp === "modify::configAndRun") {
        this.$nextTick(() => {
          this.detailData.infesvrState = e;
        });
      }
    },
    refreshedStatus(newDetail) {
      if (this.detailData.id === newDetail.id) {
        this.detailData = newDetail;
      }
    }
  },
  watch: {
    selectTime(val) {
      const {id} = this.$route.query
      this.getStatisticsAndMatrix(id)
      this.getDataFlowData(id)
    },

    detailData(val) {
      this.alarm = {
        ...this.alarm,
        monitorName: val.taskName,
        monitorId: this.$route.query.id
      },
          this.loginfo = {
            ...this.loginfo,
            taskName: val.taskName,
            taskId: this.$route.query.id,
          }
    }
  }
}
</script>

<style scoped lang="less">
.header {
  width: 100%;
  height: 200px;

  &-title {
    font-size: 22px;
    color: #000000;
    font-weight: bold;
    float: left;
  }

  &-btn {
    margin-right: 10px;

    &-left {
      float: left;
    }

    &-right {
      float: right;
    }
  }

  &-row {
    padding-top: 20px;

    .col {
      font-size: 12px;
    }
  }
}

.content {
  padding-bottom: 20px;

  .task-top {
    display: flex;

    &-left {
      flex: 3;

      .detail {
        margin-top: 10px;
      }

      .statistics {
        margin-bottom: 20px;
        font-size: 14px;
        color: #09102f;
        font-weight: bold;
      }

      .meddle {
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;

        .split {
          width: 48%;
          background-color: #f2f3f4;
          padding: 20px;
          display: flex;
          flex-direction: column;
          margin: 5px 1%;
        }

        .meddle-content {
          display: flex;
          justify-content: space-between;
        }

        .meddle-header {
          font-size: 14px;
          font-weight: 400;
          color: #09102f;
          margin-bottom: 10px;
        }

        .img-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .img-header {
          font-size: 24px;
          color: #09102f;
          font-weight: 500;
        }

        .red-color {
          color: #f6222d;
        }

        .green-color {
          color: #53c41b;
        }
      }
    }

    &-right {
      flex: 5
    }
  }

  /deep/ .ant-calendar-picker {
    margin: 20px;
  }

  .tabs-content {
    /deep/ .ant-tabs-nav .ant-tabs-tab:first-child {
      padding-left: 0;
    }

    /deep/ .ant-tabs-nav .ant-tabs-tab {
      padding-left: 20px;
      padding-right: 0;
      // padding-top: 16px;
      padding-bottom: 4px;
      margin-right: 0;
      font-size: 16px;
      line-height: 22px;
      font-weight: 600;
    }

    /deep/ .ant-tabs-bar {
      border-bottom: 0;
      height: 47px;
      line-height: 47px;
    }

    /deep/ .ant-tabs-ink-bar {
      display: none !important;
      width: 0 !important;
    }

    /deep/ .ant-tabs-content {
      display: none;
    }

    .time-select {
      .ant-calendar-picker {
        margin: 0 0 0 10px;
      }
    }
  }

  .data-box {
    height: calc(100vh - 450px);
    min-height: 500px;

    /deep/ .ant-spin-nested-loading {
      height: 100%;

      /deep/ .ant-spin-spinning {
        max-height: 100% !important;
      }

      .ant-spin-container {
        height: 100%;

        .data-content {
          height: 100%;
          border: 1px solid #E6E7EA;
          overflow-x: auto;
          overflow-y: hidden;

          .select-params {
            position: absolute;
            right: 12px;
            top: 12px;
          }

          .ant-table-wrapper {
            margin: 0;
            height: 100%;

            .ant-table td {
              white-space: nowrap;
            }
          }

          .isNum {
            height: 53px;
            line-height: 53px;
            padding-left: 16px;
          }
        }
      }
    }
  }
}

// markdown文档容器
.document-container {
  height: 70vh;
  overflow: auto;

  code {
    color: #fd7e14 !important;
  }
}
</style>
