<template>
  <div class="analysis">
    <a-spin :spinning="loading">
      <a-card class="analysis-top">
        <div class="analysis-top-global-control">
          <span>全局置信度阈值(0 - 1.1)</span>
          <a-slider
            v-model="globalValue"
            :min="0"
            :max="1.1"
            :step="0.0001"
            style="marginLeft: 16px;width: 200px"
            @afterChange="changeGlobal" />
          <a-input-number
            v-model="globalValue"
            :min="0"
            :max="1.1"
            :step="0.0001"
            :precision="4"
            @blur="changeGlobal"
          />
          <div class="setting">
            <a style="margin-right: 10px" @click="exportData">阈值导出</a>
            <a-popconfirm
              title="确认设置默认最佳阈值么?"
              ok-text="保存到任务"
              cancel-text="保存到模型"
              @confirm="setting(1)"
              @cancel="setting(2)"
            >
              <a-button type="primary">设置为默认最佳阈值</a-button>
            </a-popconfirm>
            <a-tooltip placement="topLeft">
              <template slot="title">
                可将当前的阈值设置为模型的默认最佳阈值，一个模型只可设置一个最佳阈值，多次设置会前向覆盖
              </template>
              <span><a-icon type="question-circle" /></span>
            </a-tooltip>
          </div>
        </div>
        <div class="analysis-top-global-info">
          <a-list :grid="{ column: 8, gutter: 20 }" :data-source="infoData">
            <a-list-item slot="renderItem" slot-scope="item">
              <a-statistic :value="item.suffix ? (item.value * 100).toFixed(2) : item.value" :suffix="item.suffix">
                <span slot="title">
                  {{ item.name }}
                  <a-tooltip placement="top">
                    <template slot="title">
                      {{ item.tooltip }}
                    </template>
                    <span v-if="item.tooltip"><a-icon type="question-circle" /></span>
                  </a-tooltip>
                </span>
              </a-statistic>
            </a-list-item>
          </a-list>
        </div>
      </a-card>
      <a-card class="analysis-bottom">
        <a-table
          :columns="columns"
          :data-source="tableData"
          :pagination="false"
          :rowKey="record => record.code"
          :scroll="{ y: 'calc(100vh - 495px)' }"
        >
          <span slot="coverageTitle">
            <span>覆盖率</span>
            <a-tooltip placement="top">
              <template slot="title">
                覆盖率（A类别）：（阈值>=设定的阈值的总数且预测值为A ）/ 预测值为A的总数
              </template>
              <span><a-icon type="question-circle" /></span>
            </a-tooltip>
          </span>
          <span slot="defaultAccuracyTitle">
            <span>默认准确率</span>
            <a-tooltip placement="top">
              <template slot="title">
                默认准确率（A类别）：（预测值与真实值都为A的总数 ） / （预测值为A的总数）
              </template>
              <span><a-icon type="question-circle" /></span>
            </a-tooltip>
          </span>
          <span slot="measureAccuracy">
            <span>测算准确率(%)</span>
            <a-tooltip placement="top">
              <template slot="title">
                测算准确率（A类别）：（预测值与真实值都为A的总数 且 阈值>=设定的阈值） / （预测值为A的总数 且阈值>=设定的阈值）
              </template>
              <span><a-icon type="question-circle" /></span>
            </a-tooltip>
          </span>
          <span slot="measureRecallRate">
            <span>测算召回率</span>
            <a-tooltip placement="top">
              <template slot="title">
                测算召回率（A类别）：（预测值与真实值都为A的总数 且 阈值>=设定的阈值）/ （真实值为A的总数 且 阈值>=设定的阈值）
              </template>
              <span><a-icon type="question-circle" /></span>
            </a-tooltip>
          </span>
          <span slot="accuracyChange" slot-scope="text,record">
            <span :style="{
              color: (record.defaultAccuracy - record.measureAccuracy / 100) > 0 ?
                'red' : ((record.defaultAccuracy - record.measureAccuracy / 100) === 0 ? '' : 'green')
            }">
              {{ (Math.abs(record.measureAccuracy / 100 - record.defaultAccuracy) * 100).toFixed(2) + '%' }}
              <a-icon type="arrow-up" v-if="(record.defaultAccuracy - record.measureAccuracy / 100) < 0" />
              <a-icon type="arrow-down" v-if="(record.defaultAccuracy - record.measureAccuracy / 100) > 0" />
            </span>
          </span>
          <span slot="recallRateChange" slot-scope="text,record">
            <span :style="{
              color: (record.defaultRecallRate - record.measureRecallRate) > 0 ?
              'red' :  ((record.defaultRecallRate - record.measureRecallRate) === 0 ? '' : 'green')
            }">
              {{ (Math.abs(record.defaultRecallRate - record.measureRecallRate) * 100).toFixed(2) + '%' }}
              <a-icon type="arrow-up" v-if="(record.defaultRecallRate - record.measureRecallRate) < 0" />
              <a-icon type="arrow-down" v-if="(record.defaultRecallRate - record.measureRecallRate) > 0" />
            </span>
          </span>
          <span slot="measureAccuracyChange" slot-scope="text,record">
            <a-slider
              @afterChange="changeMeasureAccuracyValue(record)"
              v-model="record.measureAccuracy"
              :min="0"
              :step="1"
              :max="100"
              style="margin: 15px 5% 15px 0;width: 60%;float: left;" />
            <a-input-number
              @blur="changeMeasureAccuracyValue(record)"
              v-model="record.measureAccuracy"
              :min="0"
              :max="100"
              :step="0.01"
              :precision="2"
              style="margin: 5px 0;width: 35%;float: left;"
            />
          </span>
          <span slot="operate" slot-scope="record">
            <a-slider
              @afterChange="changeValue(record)"
              v-model="record.codePreSet"
              :min="0"
              :step="0.0001"
              :max="1.1"
              style="margin: 15px 5% 15px 0;width: 60%;float: left;" />
            <a-input-number
              @blur="changeValue(record)"
              v-model="record.codePreSet"
              :min="0"
              :max="1.1"
              :step="0.0001"
              :precision="4"
              style="margin: 5px 0;width: 35%;float: left;"
            />
          </span>
        </a-table>
      </a-card>
    </a-spin>
  </div>
</template>

<script>
import debounce from 'lodash.debounce'
import { OPCode } from '@/api/appCenter'
import { downloadFile } from '@/utils/util'
export default {
  name: "analysis",
  data () {
    return {
      globalValue: 0,
      loading: false,
      columns: [
        {
          title: "类别",
          dataIndex: "code",
          key: "code",
          ellipsis: true,
          scopedSlots: { customRender: "code" },
          align: 'center',
          // width: 85
          sorter: (a, b) => a.code.localeCompare(b.code) 
        },
        {
          title: "样本数",
          dataIndex: "testNumber",
          key: "testNumber",
          align: 'center',
          sorter: (a, b) => a.testNumber - b.testNumber,
          // width: 95
        },
        {
          dataIndex: "coverage",
          key: "coverage",
          align: 'center',
          sorter: (a, b) => a.coverage - b.coverage,
          customRender: (text, record) => {
            return text === null ? '-' : `${(text * 100).toFixed(2)}%`
          },
          slots: { title: 'coverageTitle' },
          // width: 105 
        },
        {
          slots: { title: 'defaultAccuracyTitle' },
          dataIndex: "defaultAccuracy",
          key: "defaultAccuracy",
          align: 'center',
          sorter: (a, b) => a.defaultAccuracy - b.defaultAccuracy,
          customRender: (text, record) => {
            return text === null ? '-' : `${(text * 100).toFixed(2)}%`
          },
          // width: 130
        },
        {
          title: "默认召回率",
          dataIndex: "defaultRecallRate",
          key: "defaultRecallRate",
          align: 'center',
          sorter: (a, b) => a.defaultRecallRate - b.defaultRecallRate,
          customRender: (text, record) => {
            return text === null ? '-' : `${(text * 100).toFixed(2)}%`
          },
          // width: 130
        },
        {
          slots: { title: 'measureAccuracy' },
          dataIndex: "measureAccuracy",
          key: "measureAccuracy",
          align: 'center',
          sorter: (a, b) => a.measureAccuracy - b.measureAccuracy,
          scopedSlots: { customRender: "measureAccuracyChange" },
          width: 200
        },
        {
          slots: { title: 'measureRecallRate' },
          dataIndex: "measureRecallRate",
          key: "measureRecallRate",
          align: 'center',
          sorter: (a, b) => a.measureRecallRate - b.measureRecallRate,
          customRender: (text, record) => {
            return text === null ? '-' : `${(text * 100).toFixed(2)}%`
          }
        },
        {
          title: "准确率变化",
          dataIndex: "accuracyChange",
          key: "accuracyChange",
          align: 'center',
          // width: 98,
          scopedSlots: { customRender: "accuracyChange" },
        },
        {
          title: "召回率变化",
          dataIndex: "recallRateChange",
          key: "recallRateChange",
          align: 'center',
          // width: 98,
          scopedSlots: { customRender: "recallRateChange" },
        },
        {
          title: "置信度阈值设置",
          dataIndex: "",
          key: "x",
          width: 200,
          scopedSlots: { customRender: "operate" },
          align: 'center'
        }
      ],
      tableData: [],
      infoData: [
        {
          name: '准确率',
          type: 'topCorrectRate',
          value: 0,
          suffix: '%',
          tooltip: '准确率(总) = (预测值与真实值一致且阈值 >= 设定的阈值) / (样本总数且阈值 >= 设定的阈值）'
        }, 
        {
          name: '覆盖率',
          type: 'topCoverageRate',
          value: 0,
          suffix: '%',
          tooltip: '覆盖率(总) = (阈值>=设定的阈值的总数) / 样本总数'
        }, {
          name: '样本数',
          type: 'sampleTotal',
          value: 0
        }, {
          name: '准确率最高',
          type: 'csCorrectMaxCode',
          value: ''
        }, {
          name: '准确率最低',
          type: 'csCorrectMinCode',
          value: ''
        }, {
          name: '覆盖率最高',
          type: 'coverageMaxCode',
          value: ''
        }, {
          name: '覆盖率最低',
          type: 'coverageMinCode',
          value: ''
        }
      ]
    }
  },
  props: {
    id: {
      default: 0,
      type: Number
    }
  },
  watch: {
    id: {
      handler () {
        this.getTableData()
      },
      immediate: true
    }
  },
  methods: {
    async setting (saveFlag) {
      let codeSet = {}
      this.tableData.forEach(item => {
        codeSet[item.id] = item.code + ':' +Number((item.codePreSet).toFixed(4))
      })
      const params = {
        forecastId: this.id,
        codeSet,
        saveFlag
      }
      const res = await OPCode.analysis.setCodeQuotaAsBest(params)
      if (res.code !== 0) return false
      this.$message.success('设置成功')
    },
    async getTableData () {
      this.loading = true
      const res = await OPCode.analysis.getData({ mainId: this.id })
      this.loading = false
      if (res.code !== 0) return false
      this.settingAllValue(res.data)
    },
    settingAllValue (data) {
      if (!data.analyseDtoList) return false
      this.tableData = data.analyseDtoList.map(item => {
        return {
          ...item,
          measureAccuracy: item.measureAccuracy * 100 || 0
        }
      }) || []
      this.globalValue = this.tableData.length > 0 ? this.tableData[0].topCodeSet : 0
      if (!data.overView) return false
      this.infoData.forEach(item => {
        Object.keys(data.overView).forEach(el => {
          if (item.type === el) {
            item.value = data.overView[el]
          }
        })
      })
    },
    changeValue: debounce(async function (record) {
      const params = {
        id: record.id,
        codeSet: record.codePreSet,
        forecastId: this.id
      }
      this.loading = true
      const res = await OPCode.analysis.updateSingleData(params)
      this.loading = false
      if (res.code !== 0) return false
      // this.$message.success('修改成功')
      this.settingAllValue(res.data)
    }, 300),
    changeMeasureAccuracyValue: debounce(async function (record) {
      const params = {
        id: record.id,
        measureAccuracyValue: record.measureAccuracy
      }
      this.loading = true
      const res = await OPCode.analysis.setCodeAccuracyValue(params)
      this.loading = false
      if (res.code !== 0) return false
      // this.$message.success('修改成功')
      this.settingAllValue(res.data)
    }, 300),
    changeGlobal: debounce(async function () {
      const params = {
        ids: String(this.tableData.map(item => item.id)),
        codeSet: this.globalValue,
        forecastId: this.id
      }
      this.loading = true
      const res = await OPCode.analysis.updateGlobalData(params)
      this.loading = false
      if (res.code !== 0) return false
      // this.$message.success('修改成功')
      this.settingAllValue(res.data)
    }, 300),
    exportData () {
      this.loading = true
      downloadFile(`/api/v1/applicationcenter/tbReviewTaskResultAnalyse/exportAnalyseResult?mainId=${this.id}`)
      setTimeout(() => {
        this.loading = false
      }, 1000)
    }
  }
}
</script>

<style lang="less" scoped>
.analysis{
  .analysis-top {
    border-radius: 16px;
    background: #fff;
    margin-bottom: 16px;
  }
  &-top{
    /deep/ .ant-card-body{
      padding-top: 5px!important;
    }
    &-global-control{
      line-height: 40px;
      overflow: hidden;
      width: 100%;
      padding: 0 10px;
      border-bottom: 1px solid #ccc;
      &>*{
        float: left;
        margin-right: 10px;
      }
      .setting{
        float: right;
        span{
          margin-left: 10px;
        }
      }
    }
    &-global-info{
      padding: 5px;
      /deep/ .ant-col{
        width: 14.2%;
        .ant-list-item{
          border-right: 1px solid #ccc;
          margin-bottom: 0;
          padding: 10px 5px;
          .ant-statistic{
            .ant-statistic-content{
              text-align: center;
            }
          }
        }
        &:last-child{
          .ant-list-item{
            border-right: none;
          }
        }
      }
    }
  }
  &-bottom{
    margin-top: 10px;
    /deep/ .ant-input-number-handler-wrap{
      display: none;
    }
  }
}
/deep/ .ant-card-body{
  padding-top: 0!important;
  padding: 0;
}
</style>