<template>
  <div class="page-content systemInfo">
    <a-header
      :showSearch="false"
      :showNew="false"
      :showReload="false"
      :auth="{ add: 'dataMrg-list-add' }"
      :showPageHeader="false"
      pageTitle="硬件信息详情"
      newText="新建"
    />
    <a-spin :spinning="loading">
      <div class="systemInfo-item">
        <h4 class="name">基础信息</h4>
        <div class="content">
          <a-descriptions :column="{ xs: 1, sm: 2, md: 3}" size="small">
            <a-descriptions-item label="主机名">{{ detailData.name }}</a-descriptions-item>
            <a-descriptions-item label="IP地址">{{ detailData.sshHost }}</a-descriptions-item>
            <a-descriptions-item label="系统版本">{{ detailData.osInfo }}</a-descriptions-item>
          </a-descriptions>
        </div>
      </div>
      <div class="systemInfo-item monitor">
        <h4 class="name">硬件资源监控</h4>
        <div class="range">
          <a-select v-model="rangeTime" @change="getMonitorData">
            <a-select-option v-for="item in rangeList" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-select-option>
          </a-select>
        </div>
        <div class="content">
          <div class="chart" v-for="(item, index) in monitorOption" :key="index">
            <echart
              :styleObj="'100%'"
              :option="item"
            />
          </div>
        </div>
      </div>
      <div class="systemInfo-item task">
        <h4 class="name">任务信息</h4>
        <a-button class="reload" @click="getTaskList"><a-icon type="reload"></a-icon></a-button>
        <div class="content">
          <div class="content-item" v-for="(task, index) in taskNameList" :key="index">
            <a-collapse>
              <a-collapse-panel :key="task.id" :header="`${task.name} (${taskList[task.id] ? taskList[task.id].length : 0})`">
                <a-list size="small" :bordered="false" :data-source="taskList[task.id]">
                  <a-list-item slot="renderItem" slot-scope="item" @click="linkTask(item, task.path)">
                    {{ item.taskName }}
                  </a-list-item>
                </a-list>
              </a-collapse-panel>
            </a-collapse>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>
<script>
import { Echart } from "@/components"
import system from "@/api/system"
import moment from "moment"
export default {
  name: "systemInfo",
  components: {
    Echart
  },
  data () {
    return {
      rangeList: [{
        label: '5分钟',
        value: 0,
        timeNodes: 5,
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
      rangeTime: 0,
      detailData: {
        name: 'AI-1',
        sshHost: '192.168.0.1',
        osInfo: 'Centos 7.0'
      },
      monitorData: [],
      monitorOption: [],
      loading: false,
      option: {
        color: ["#00adff", "#2b821d", "#c12e34", "#e6b600", "#0098d9", "#339ca8", "#cda819", "#32a487"],
        legend: {
          show: false
        },
        yAxis: {
          type: 'value',
          max: 100
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
      taskNameList: [{
        name: '模型训练任务',
        id: 'model',
        path: '/train/model/detail/'
      }, {
        name: '在线推理任务',
        id: 'task',
        path: '/application/catalog/detail'
      }, {
        name: '离线评估任务',
        id: 'forecast',
        path: '/train/offline/detail/'
      }, {
        name: '离线回放任务',
        id: 'replay',
        path: '/application/offlineBack/detail'
      }, {
        name: '自动标注任务',
        id: 'automark',
        path: '/dataCenter/dataMrg/detail'
      }, {
        name: '开单任务',
        id: 'kdtask',
        path: '/application/billing/detail'
      }, ],
      taskList: {},
      setTime: null
    }
  },
  beforeRouteEnter (to, from, next) {
    next((vm) => {
      vm.getData()
    })
  },
  mounted () {
    this.loading = true
  },
  beforeDestroy () {
    clearTimeout(this.setTime)
  },
  beforeRouteLeave (to, from, next) {
    clearTimeout(this.setTime)
    next()
  },
  methods: {
    getData () {
      this.getDetailData()
      this.getMonitorData()
      this.getTaskList()
    },
    async getDetailData () {
      this.loading = true
      const res = await system.monitor.getSystemInfo({ ip: this.$route.query.hostIp })
      this.loading = false
      if (res.code !== 0) return false
      this.detailData = res.data
    },
    async getMonitorData () {
      const { timeNodes, timeUnit } = this.rangeList.filter(item => {
        return item.value === this.rangeTime
      })[0]
      const params = {
        hostIp: this.$route.query.hostIp,
        timeUnit,
        timeNodes
      }
      const res = await system.monitor.getHostInfoDetail(params)
      this.loading = false
      if (res.code !== 0) return false
      clearTimeout(this.setTime)
      this.setTime = setTimeout(this.getMonitorData, 60000)
      const dateAxis = res.data.HostsInfo.map(item => {
        return moment(item.createTime).format('YYYY-MM-DD HH:mm:ss')
      })
      const cpuUsageRate = res.data.HostsInfo.map(item => {
        return (item.cpuUsageRate * 100).toFixed(2)
      })
      const memUsageRate = res.data.HostsInfo.map(item => {
        return (item.memUsageRate * 100).toFixed(2)
      })
      const gpuUsageRate = Object.values(res.data.HostsGpuInfo).map(gpu => {
        return gpu.map(item => {
          return (item.gpuUsageRate * 100).toFixed(2)
        })
      })
      const gpuMemUsageRate = Object.values(res.data.HostsGpuInfo).map(gpu => {
        return gpu.map(item => {
          return (item.gpuMemUsageRate * 100).toFixed(2)
        })
      })
      let gpuList = []
      gpuUsageRate.forEach((item, index) => {
        gpuList.push(...[{
          name: `gpu${index}使用率(%)`,
          dateAxis,
          data: item
        }, {
          name: `gpu${index}显存使用率(%)`,
          dateAxis,
          data: gpuMemUsageRate[index]
        }])
      })
      this.monitorData = []
      this.monitorData.push(...[{
        name: 'CPU使用率(%)',
        dateAxis,
        data: cpuUsageRate
      }, {
        name: '内存使用率(%)',
        dateAxis,
        data: memUsageRate
      }, ...gpuList])
      this.monitorOption = this.monitorData.map(item => {
        const { time, data, name } = item
        return {
          ...this.option,
          title: {
            text: name,
            textStyle: {
              fontSize: 14
            }
          },
          xAxis: {
            type: 'category',
            data: dateAxis
          },
          series: [{
            type: 'line',
            smooth: true,
            symbol: 'none',
            name,
            data
          }]
        }
      })
      this.loading = false
    },
    async getTaskList () {
      this.loading = true
      this.taskList = []
      const res = await system.monitor.getTaskList({ hostIp: this.$route.query.hostIp })
      this.loading = false
      if (res.code !== 0) return false
      this.taskList = res.data
    },
    linkTask (task, path) {
      const query = {
        id: task.id
      }
      if (task.id === 'model') query.modelType = '1'
      if (task.id === 'automark') query.dlType = '1'
      // this.$router.push({
      //   path,
      //   query
      // })
    }
  }
}
</script>

<style scoped lang="less">
.systemInfo{
  .content {
    background: #fff;
    border-radius: 16px;
    padding: 12px;
  }
  &-item{
    padding: 20px 0 0px 0;
    position: relative;
    .name{
      font-size: 18px;
    }
    /deep/ .ant-descriptions-item{
      padding-bottom: 0!important;
      &-label{
        font-size: 16px!important;
        color:rgba(9,16,47,1)!important;
      }
      &-content{
        font-size: 16px!important;
        color:rgba(9,16,47,1)!important;
      }
    }
    &.monitor{
      .range{
        position: absolute;
        right: 35px;
        top: 20px;
      }
      .content{
        overflow: hidden;
        .chart{
          height: 30vh;
          float: left;
          width: 50%;
        }
      }
    }
    &.task{
      margin-bottom: 20px;
      position: relative;
      .reload{
        position: absolute;
        right: 42px;
        top: 10px;
      }
      .content{
        overflow: hidden;
        display: flex;
        flex-wrap: wrap;
        &-item{
          width: 33%;
          float: left;
          padding: 10px;
          /deep/ .ant-collapse{
            background: #fff;
            .ant-collapse-content{
              background: #fff;
              .ant-collapse-content-box{
                padding: 5px 15px;
                .ant-list-item{
                  // cursor: pointer;
                  // color: #2f54eb;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>