<template>
  <div>
    <a-spin :spinning="loading">
      <div class="content">
        <a-descriptions class="detail">
          <a-descriptions-item label="任务名称">{{ offlineBackData.replayName }}</a-descriptions-item>
          <!-- <a-descriptions-item label="任务状态">
            {{ detailData.taskStatus === 2 ? '上线' : '下线' }}
          </a-descriptions-item> -->
          <a-descriptions-item label="创建用户">{{ offlineBackData.createBy }}</a-descriptions-item>
          <a-descriptions-item label="创建日期">{{ offlineBackData.createTime | moment }}</a-descriptions-item>
        </a-descriptions>

        <div class="statistics">任务运行统计</div>
        <div class="meddle">
          <div class="split">
            <div class="meddle-header">样本总数</div>
            <div class="img-content">
              <span class="img-header">{{ offlineBackData.handleImgs }}</span>
            </div>
          </div>
          <div class="split">
            <div class="meddle-header">人工判Code图片数</div>
            <div class="img-content">
              <span class="img-header">{{ offlineBackData.checkedImgs }}</span>
            </div>
          </div>
          <div class="split">
            <div class="meddle-header">准确率</div>
            <div class="img-content">
              <span class="img-header">{{ offlineBackData.correctRate }}</span>
            </div>
          </div>

          <div class="split">
            <div class="meddle-header">覆盖率</div>
            <div class="img-content">
              <span class="img-header">{{ offlineBackData.coverRate }}</span>
            </div>
          </div>
        </div>

        <a-tabs class="tabs-content" v-model="tabKey" @change="tabChangge">
          <div class="time-select" slot="tabBarExtraContent">
            <a style="margin-right: 10px" @click="showModal">困难样本制作</a>
            <a style="cursor: pointer" v-if="tabKey === '1'" @click="downLoad">导出Excel</a>
            <span style="cursor: pointer" v-if="tabKey === '2'" @click="downLoadMatrix">
              <a-icon type="download" />
            </span>
          </div>
          <a-tab-pane key="1" tab="Code分布"></a-tab-pane>
          <a-tab-pane key="2" tab="混淆矩阵"></a-tab-pane>
        </a-tabs>
        <div class="data-box" v-if="tabKey === '1'">
          <a-spin :spinning="echartLodaing">
            <div class="data-content">
              <div class="echarts">
                <echart
                  styleObj="100%"
                  v-if="this.offlineBackData.predictDataMap.length > 0"
                  :option="option1"
                />
                <NoData v-else/>
              </div>
              <div class="echarts">
                <echart
                  styleObj="100%"
                  v-if="this.offlineBackData.groundDataMap.length > 0"
                  :option="option2"
                />
                <NoData v-else/>
              </div>
            </div>
          </a-spin>
        </div>
        <div class="data-box" v-if="tabKey === '2'">
          <a-spin :spinning="echartLodaing">
            <div class="data-content" >
              <a-table
                :scroll="{ x: matrixColumns.length * 120 + 'px', y: 'calc(100vh - 478px)' }"
                :pagination="false"
                :columns="matrixColumns"
                :data-source="matrixData"
                v-if="this.matrixData.length > 0"
              >
                <template slot="isNum" slot-scope="text">
                  <div class="isNum" :style="getStyle(text)">{{ text | isNumber }}</div>
                </template>
              </a-table>
              <NoData v-else/>
            </div>
          </a-spin>
        </div>
      </div>
    </a-spin>
    <export-data-set ref="exportDataSet" :paramId="currentOfflineBackId"></export-data-set>
  </div>
</template>

<script>
import { Echart, NoData } from "@/components"
import moment from "moment"
import {
  offlineBack
} from "@/api/appCenter"
import { getBackgroundStyle, getMatrixColumns, downloadFile } from '@/utils/util'
import exportDataSet from './exportDataSet'
export default {
  name: "offlineBackDetail",
  components: {
    Echart,
    NoData,
    exportDataSet
  },
  data () {
    return {
      loading: false,
      echartLodaing: false,
      tabKey: '1',
      lineData: [],
      option: {
        grid: {
          top: 50,
          left: '5%',
          right: '5%',
          bottom: '10%'
        },
        color: ["#0072c6"],
        tooltip: {
          trigger: 'axis'
        }
      },
      option1: {},
      option2: {},
      currentOfflineBackId: null,
      offlineBackData: {
        name: '任务1',
        createTime: 1598671527399,
        createBy: 'null',
        predictDataMap: [],
        groundDataMap: []
      },
      matrixData: [],
      matrixColumns: []
    }
  },
  beforeRouteEnter (to, from, next) {
    const { id, taskId } = to.query
    next(vm => {
      vm.tabKey = '1'
      vm.currentOfflineBackId = id
      vm.getDetailInfo(id)
      vm.getStatisticsAndMatrix(id)
    })
  },
  methods: {
    isAdd (num) {
      return Number(num.replace('%', '')) > 0
    },
    getStyle (num) {
      return getBackgroundStyle(num)
    },
    moment,
    tabChangge (key) {
      this.tabKey = key
    },
    getDetailInfo (id) {
      this.loading = true
      offlineBack.getOfflineBackBaseInfo(id).then(res => {
        const { code, data, msg } = res
        if (code === 0) {
          this.$nextTick(() => {
            this.offlineBackData = data
            this.renderEchartsTop()
            this.renderEchartsBottom()
            this.loading = false
          })
        } else {
          this.loading = false
        }
      })
    },
    renderEchartsTop () {
      const xAxis = this.offlineBackData.predictDataMap.map(item => item.predict)
      const data = this.offlineBackData.predictDataMap.map(item => item.num)
      this.option1 = {
        ...this.option,
        xAxis: {
          type: 'category',
          data: xAxis
        },
        yAxis: {
          type: 'value',
          name: '预测Code分布'
        },
        series: [{
          type: 'bar',
          barWidth: 20,
          label: {
            show: true,
            position: 'top'
          },
          data
        }]
      }
    },
    renderEchartsBottom () {
      const xAxis = this.offlineBackData.groundDataMap.map(item => item.category)
      const data = this.offlineBackData.groundDataMap.map(item => item.sampleTotal)
      this.option2 = {
        ...this.option,
        xAxis: {
          type: 'category',
          data: xAxis
        },
        yAxis: {
          type: 'value',
          name: '人工判Code分布'
        },
        series: [{
          type: 'bar',
          barWidth: 20,
          label: {
            show: true,
            position: 'top'
          },
          data
        }]
      }
    },
    getStatisticsAndMatrix (id) {
      this.echartLodaing = true
      // 获取矩阵
      offlineBack.getOfflineBackMatrix(id).then(res => {
        const { code, msg } = res
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
    downLoadMatrix () {
      const url = '/api/v1/applicationcenter/inferenceReplayTaskConfig/confusionMatrix/exportExcel/' + this.currentOfflineBackId
      downloadFile(url)
    },
    downLoad () {
      const url = '/api/v1/applicationcenter/inferenceReplayTaskConfig/exportReplayById?id=' + this.currentOfflineBackId
      downloadFile(url)
    },
    showModal () {
      this.$refs.exportDataSet.showDialog()
    }
  }
}
</script>

<style scoped lang="less">
.content {
  padding: 15px 20px 20px 20px;
  .detail{
    margin-top: 10px;
  }
  .statistics {
    margin-bottom: 20px;
    font-size: 14px;
    color: #09102f;
    font-weight: bold;
  }
  /deep/.ant-calendar-picker {
    margin: 20px;
  }
  .meddle {
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    .split {
      width: 25%;
      background-color: #f2f3f4;
      padding: 20px;
      display: flex;
      flex-direction: column;
      margin: 10px;
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

  .tabs-content{
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
    /deep/ .ant-tabs-content{
      display: none;
    }

    .time-select{
      .ant-calendar-picker{
        margin: 0 0 0 10px;
      }
    }
  }
  .data-box{
    height: calc(100vh - 435px);
    /deep/ .ant-spin-nested-loading{
      height: 100%;
      /deep/ .ant-spin-spinning{
        max-height: 100%!important;
      }
      .ant-spin-container{
        height: 100%;
        .data-content{
          height: 100%;
          border: 1px solid #E6E7EA;
          overflow-x: auto;
          overflow-y: hidden;
          display: flex;
          flex-direction: column;
          .echarts{
            height: 50%;
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
</style>

