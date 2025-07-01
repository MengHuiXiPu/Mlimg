<template>
  <div class="page-content monitor">
    <el-tabs v-model="tabActiveKey" @tab-click="tabOnChange" style="width: 100px;">
      <el-tab-pane label="监控" name="1"></el-tab-pane>
      <el-tab-pane label="告警" name="2"></el-tab-pane>
    </el-tabs>
    <template v-if="tabActiveKey === '1'">
      <div class="monitor-item resources">
        <h4 class="name">硬件资源监控</h4>
        <div class="tablePane">
          <a-table
              :columns="columns"
              :data-source="tableData"
              :loading="loading"
              :pagination="false"
              :rowKey="record => record.id"
              :expandedRowKeys="expandedRowKeys"
              @expand="getChildren"
          >
          <span slot="hostName" slot-scope="text,record">
            <span
                class="image-name"
                :title="text"
                @click="toSystemDetail(record)">{{ text }}</span>
            <p v-if="record.children" style="margin: 0 0 0 22px;">{{ record.hostIp }}</p>
          </span>
            <span slot="active" slot-scope="text, record" v-if="record.children">
            <span v-action:system-change-role class="image-name" @click="changeRole(record)">切换角色</span>
          </span>
          </a-table>
        </div>
      </div>
      <div class="monitor-item target">
        <h4 class="name">指标监控</h4>
        <div class="range">
          <a-select v-model="rangeTime" @change="getTargetData">
            <a-select-option v-for="item in rangeList" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-select-option>
          </a-select>
        </div>
        <div class="chart">
          <echart
            v-if="targetData && targetData.length > 0"
            :styleObj="'100%'"
            :option="targetOption"
          />
          <a-empty v-else></a-empty>
        </div>
      </div>
    </template>
    <template v-else>
      <alarm></alarm>
    </template>
    <changeRole ref="changeRole" @reload="getResourcesData" />
  </div>
</template>
<script>
import { Echart } from "@/components"
import { mixinHeader } from "@/utils/mixin"
import system from "@/api/system"
import moment from "moment"
import changeRole from './components/changeRole'
export default {
  name: "monitor",
  mixins: [mixinHeader],
  components: {
    Echart,
    alarm: () => ({ component: import('./components/alarm') }),
    changeRole
  },
  data () {
    return {
      roleList: ['在线', '离线', '混合'],
      loading: false,
      rangeList: [{
        label: '15分钟',
        value: 0,
        timeNodes: 15,
        timeUnit: 5
      }, {
        label: '1小时',
        value: 1,
        timeNodes: 1,
        timeUnit: 4
      }, {
        label: '6小时',
        value: 2,
        timeNodes: 6,
        timeUnit: 4
      }, {
        label: '1天',
        value: 3,
        timeNodes: 1,
        timeUnit: 3
      }],
      labelList: [{
        name: 'csv不存在的消息数量',
        id: 'csvLostNum'
      }, {
        name: '找不到图片的glass数量',
        id: 'imgLostNum'
      }, {
        name: '超时未返回的glass数量',
        id: 'timeoutNum'
      }, {
        name: '队列中等待的消息数量',
        id: 'queueMsgNum'
      }, {
        name: '未返回结果的图片数量',
        id: 'voidPicNum'
      }],
      // labelList: {
      //   csvLostNum: 'csv不存在的消息数量',
      //   imgLostNum: '找不到图片的消息数量',
      //   timeoutNum: '超时未返回的消息数量',
      //   queueMsgNum: '队列中等待的消息数量',
      //   voidPicNum: '未返回结果的消息数量'
      // },
      rangeTime: 0,
      tableData: [],
      expandedRowKeys: [],
      tabActiveKey: '1',
      columns: [
        {
          title: "名称",
          dataIndex: "hostName",
          key: "hostName",
          ellipsis: true,
          scopedSlots: { customRender: "hostName" },
        }, {
          title: "CPU",
          dataIndex: "usedCpuAmount",
          key: "usedCpuAmount",
          ellipsis: true,
          align: 'center',
          customRender: (text, record) => {
            return (text !== undefined && text !== null) ? `${text + '/' + record.totalCpuAmount} ${record.cpuResUnit}` : ''
          }
        }, {
          title: "内存",
          dataIndex: "usedMemAmount",
          key: "usedMemAmount",
          ellipsis: true,
          align: 'center',
          customRender: (text, record) => {
            return text ? `${text + '/' + record.totalMemAmount} ${record.memResUnit}` : ''
          }
        }, {
          title: "GPU",
          dataIndex: "gpuCardAmount",
          key: "gpuCardAmount",
          ellipsis: true,
          align: 'center',
          customRender: (text, record) => {
            return text !== undefined ? `${text}卡` : ''
          }
        }, {
          title: "显存利用率",
          dataIndex: "usedGpuMemAmount",
          key: "usedGpuMemAmount",
          ellipsis: true,
          align: 'center',
          customRender: (text, record) => {
            return `${record.usedGpuMemAmount + '/' + record.totalGpuMemAmount} ${record.gpuMemResUnit}
              (${record.usedGpuMemAmount ? ((record.usedGpuMemAmount || 0) / record.totalGpuMemAmount * 100).toFixed(2) : 0}%)`
          }
        }, {
          title: "GPU利用率",
          dataIndex: "gpuUsageRate",
          key: "gpuUsageRate",
          ellipsis: true,
          align: 'center',
          customRender: (text, record) => {
            return `${parseFloat((record.gpuUsageRate * 100).toFixed(2))}%` 
          }
        }, {
          title: "运行容器数",
          dataIndex: "runTaskAmount",
          key: "runTaskAmount",
          ellipsis: true,
          align: 'center'
        }, {
          title: "机器类型",
          key: "computedType",
          ellipsis: true,
          align: 'center',
          customRender: (text, record) => {
            if (record.gpuCardAmount) {
              return 'GPU'
            } else if (record.gpuCardAmount === 0) {
              return 'CPU'
            } else {
              return ''
            }
          }
        }, {
          title: <span>角色
            <a-tooltip>
              <template slot="title">
                在线：运行在线类型任务，如在线推理任务;<br/>
                离线：运行离线类型任务，如训练任务、评估任务等;<br/>
                混合：能同时运行两类任务;<br/>
              </template>
              <a-icon type="question-circle"></a-icon>
            </a-tooltip>
          </span>,
          dataIndex: "hostRole",
          key: "hostRole",
          ellipsis: true,
          align: 'center',
          customRender: (text) => {
            return this.roleList[text - 1]
          }
        }, {
          title: "操作",
          dataIndex: "active",
          key: "active",
          ellipsis: true,
          align: 'center',
          scopedSlots: { customRender: "active" },
        }
      ],
      targetOption: {
        color: ["#c12e34", "#e6b600", "#0098d9", "#2b821d", "#005eaa", "#339ca8", "#cda819", "#32a487"],
        yAxis: {
          name: '指标',
          type: 'value'
        },
        legend: {
          show: true,
          bottom: 0
        },
        tooltip: {
          show: true,
          trigger: 'axis',
          axisPointer: {
            type: 'line',
            axis: 'auto'
          }
        },
      },
      targetData: [],
      setTime: null,
      setTargetTime: null,
      targetDataReloadTime: 0
    }
  },
  beforeRouteEnter (to, from, next) {
    next((vm) => {
      vm.getDataList()
    })
  },
  mounted () {
    this.loading = true
  },
  beforeDestroy () {
    clearTimeout(this.setTime)
    clearTimeout(this.setTargetTime)
  },
  beforeRouteLeave (to, from, next) {
    clearTimeout(this.setTime)
    clearTimeout(this.setTargetTime)
    next()
  },
  methods: {
    toSystemDetail (record) {
      let bread = {
        ...this.$route.meta,
        path: this.$route.path
      }
      localStorage.setItem("bread", JSON.stringify(bread))
      this.$router.push({
        path: '/system/monitor/info',
        query: { hostIp: record.hostIp }
      })
    },
    tabOnChange (key) {
      // this.tabActiveKey = key
    },
    getDataList () {
      this.getResourcesData()
      this.getTargetData()
    },
    async getResourcesData () {
      const res = await system.monitor.getHostInfo()
      if (res.code !== 0) return false
      this.tableData = res.data.map(item => {
        return {
          ...item,
          id: item.hostIp,
          children: item.gpuList.map((child, index) => {
            return {
              ...child,
              id: new Date().getTime() + '_' + index
            }
          })
        }
      })
      clearTimeout(this.setTime)
      this.setTime = setTimeout(this.getResourcesData, 60000)
      this.loading = false
    },
    getChildren (expanded, record) {
      if (!expanded) {
        this.expandedRowKeys.splice(this.expandedRowKeys.indexOf(record.id), 1)
        return false
      } else {
        this.expandedRowKeys.push(record.id)
      }
    },
    async getTargetData () {
      const { timeNodes, timeUnit } = this.rangeList.filter(item => {
        return item.value === this.rangeTime
      })[0]
      const params = {
        timeNodes, timeUnit
      }
      const res = await system.monitor.getTargetData(params)
      if (res.code !== 0) return false
      this.targetData = res.data.monitorIndexInfoRecordDtos
      this.targetDataReloadTime = Number(res.data.monitorIndexCycle || 1)
      if (this.targetData) {
        const xAxis = {
          type: 'category',
          data: this.targetData.map(item => {
            return moment(item.createTime).format('YYYY-MM-DD HH:mm:ss')
          })
        }
        const series = this.labelList.map(item => {
          return {
            name: item.name,
            type: 'line',
            smooth: true,
            symbol: 'none',
            data: this.targetData.map(child => {
              return child[item.id] || 0
            })
          }
        })
        this.targetOption = {
          ...this.targetOption,
          xAxis,
          series
        }
      }
      clearTimeout(this.setTargetTime)
      this.setTargetTime = setTimeout(this.getTargetData, this.targetDataReloadTime * 60000)
    },
    changeRole (record) {
      // 切换角色
      console.log(record)
      this.$refs.changeRole.showModal(record)
    }
  }
}
</script>
<style lang="less">
@import '~@/config/theme.less';
.page-content {
  // height: 100%;
  overflow: auto;
  .scrollbar();
  margin-right: 4px;
}
</style>
<style scoped lang="less">
@import '~@/config/theme.less';
/deep/ .ant-table-row-level-1 {
  background-color: @tableBGC1;
}

.monitor{
  &-item{
    padding: 12px;
    position: relative;
    .tablePane {
      border-radius: 16px;
      background-color: #fff;
    }
    &.resources{
      min-height: calc(50vh - 300px);
    }
    &.target{
      height: 50vh;
      margin-bottom: 16px;
      .chart{
        height: 100%;
        background: #fff;
        border-radius: 16px;
      }
    }
    .name{
      font-size: 18px;
    }
    .range{
      position: absolute;
      right: 35px;
      top: 10px;
    }
  }
}
</style>
