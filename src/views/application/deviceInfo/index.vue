<template>
  <div class="page-content">
    <a-header :auth="{ add: 'dataSoure-list-add' }" :placeholderText="'请输入设备名称'" :show-new="false" @reload="handReload"
      @search="handSearch"
      :isShowBread="false"
      :isShowPageTitle="false"
      :tabList="tabList"
      :tabActiveKey="activeKey"
      @tab-change="onTabClick"></a-header>
    <a-table :columns="columns" :data-source="tableList" :rowKey="(record) => record._id"
      :pagination="pagination" :loading="tableLoading" @change="handleTableChange"
      childrenColumnName="subDevice"
    >
      <span slot="status" slot-scope="value">
        <a-badge :status="DEVICESTATUS.get(value).color" />
        {{ DEVICESTATUS.get(value).name }}
      </span>
      <span slot="isPublic" slot-scope="isPublic">
        <a-tag color="green" v-if="isPublic">是</a-tag>
        <a-tag color="orange" v-else>否</a-tag>
      </span>
      <span slot="createTime" slot-scope="value">
        {{ value | moment }}
      </span>
      <span slot="updateTime" slot-scope="value">
        {{ value | moment }}
      </span>
      <span slot="operate" slot-scope="record,text,index">
        <!-- 仅停止、暂停、上线状态的可以启动 -->
        <a @click="onOperate(record, 'start')"  v-if="record.isMain" :disabled="![0, 2, 3].includes(record.status)">启动</a>
        <!-- 仅正常状态的可以暂停 -->
        <a @click="onOperate(record, 'pause')"  v-if="record.isMain" style="margin-left: 10px" :disabled="![1].includes(record.status)">暂停</a>
        <!-- 仅正常、暂停状态的可以停止 -->
        <a @click="onOperate(record, 'stop')" v-if="record.isMain" style="margin-left: 10px"  :disabled="![1, 2].includes(record.status)">停止</a>
        <a @click="viewMonitor(record)" v-if="record.isMain" style="margin-left: 10px">监控</a>
      </span>
    </a-table>
    <!-- 设置命令参数 -->
    <a-modal v-model="showParamEditor" :title="`设置${currentDevice.name}：${currentDevice.commandName}命令参数`" width="60%" @ok="handleOk">
      <json-editor v-model="jsonParameter"></json-editor>
    </a-modal>
  </div>
</template>

<script>
import { getDeviceList,createCommandTransferRecord } from '@/api/cloud.js'
import { DEVICESTATUS, COMMAND } from '../constant.js'
import JsonEditor from '@/components/JsonEditor'
import { deviceCols } from '../columns.js'
export default {
  name: 'DeviceInfo',
  data() {
    return {
      pagination: {
        pageSize: 10,
        current: 1,
        total: 0
      },
      columns: deviceCols,
      // columns: tableColumns,
      tableLoading: false,
      searchWord: '',
      tableList: [],
      showParamEditor: false,
      currentDevice: {}, //当前操作的设备信息（表格点击行）
      DEVICESTATUS,
      COMMAND,
      jsonParameter: '', // json编辑器绑定
    }
  },
  components: {
    JsonEditor
  },
  props:{
    tabList: {
      type: Array,
      default: [],
    },
    activeKey: {
      type: String,
      default: '',
    }
  },
  methods: {
    handleTableChange(pagination, filters, sorter) {
      this.pagination.current = pagination.current
      this.pagination.pageSize = pagination.pageSize
      this.loadTableList()
    },
    loadTableList() {
      const { pageSize, current } = this.pagination
      this.tableLoading = true
      this.timer && clearTimeout(this.timer)
      getDeviceList({
        limit: pageSize,
        pageNo: current,
        name: this.searchWord.trim(),
        deviceType: '',  //设备类别
        deviceStatus: '', //设备状态
        appId: this.$route?.query?.appId || '',
      }).then(res => {
        if (res.code == 0) {
          this.tableList = res?.data?.records || []
          this.pagination.total = res?.data?.total
          // 修饰tableList 以适应前端需求
          this.tableList.forEach(main => {
            main.isMain = true
            if (main.subDevice && main.subDevice.length) {
              main.subDevice.forEach((sub,idx) => {
                sub.isMain = false;
                // 接口返回的：无id  且name+number可能重复，无法用作表格的key
                // "subDevice": [ {"name": "my","number": "camera0","status": -3 }]
                sub._id = current + sub.name + idx + sub.number
              })
            }
          })
        }
      }).finally(() => {
        this.tableLoading = false
        this.timer = setTimeout(() => {
          this.loadTableList()
        }, 10000) 
      })
    },
    onOperate(row, cmd) {
      // 记录命令信息到currentDevice
      const command = COMMAND.get(cmd)
      row.commandName = cmd
      row.command = command
      this.currentDevice = row
      // 清空jsonParameter
      this.jsonParameter = ""
      this.showParamEditor = true
    },
    // 设置命令参数后，生成命令记录
    async handleOk() {
      const { command, id } = this.currentDevice
      const params = {
        deviceId: id,
        command,
        commandArg: this.jsonParameter 
      }
      const res = await createCommandTransferRecord(params)
      if(res.code === 0) {
        this.$message.success('operation success')
        this.showParamEditor = false
      }
    },
    viewMonitor(row) {
      // 设备监控详情页面有两个面包屑导航，下面path代表应用管理的导航，appPath代表的是每个应用的导航
      let bread = {
        ...JSON.parse(localStorage.getItem("bread")),
        appPath: this.$route.path
      }
      localStorage.setItem("bread", JSON.stringify(bread))
      this.$router.replace({
        path: `/application/deviceInfo/monitor/`,
        query: { appId: this.$route.query.appId, deviceId: row.id } //向详情页传数据
      })
    },
    handReload() {
      // this.searchWord=""
      this.loadTableList()
    },
    handSearch(value) {
      this.pagination.current = 1
      this.searchWord = value
      this.loadTableList()
    },
    onTabClick(e) {
      this.$emit("tab-change", e);
    }
  },
  created() {
    this.loadTableList()
  },
  destroyed() {
    this.timer && clearTimeout(this.timer)
  }
}
</script>

<style lang="less" scoped>
@import '~@/config/theme.less';
/deep/ .ant-table-row-level-1 {
  background-color: @tableBGC1;
}
.paganation-container {
  text-align: right;
  margin-top: 10px;
}
</style>