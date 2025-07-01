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
        <a @click="handleUpdateDevInfo(record)"  v-if="record.isMain">更新文件</a>
        <a @click="handleTransfer(record)"  v-if="record.isMain" style="margin-left: 10px">配置下发</a>
        <a @click="viewRecords(record)" v-if="record.isMain" style="margin-left: 5px">下发记录</a>
      </span>
    </a-table>
    <!-- 下发记录 -->
    <a-modal v-model="showTransferRecords" :title="`${currentDevice.name}下发记录`" width="90%">
      <transfer-records :device="currentDevice" ref="transferRecord"></transfer-records>
    </a-modal>
    <!-- 更新设备信息 model -->
    <update-device-info :visible.sync="showUpdateDevInfoModel" :device="currentDevice" @update-success="loadTableList"></update-device-info>
  </div>
</template>

<script>
import { getDeviceList, updatePackageFileRecord } from '@/api/cloud.js'
import { DEVICESTATUS } from '../constant.js'
import transferRecords from "./transferRecords.vue"
import updateDeviceInfo from './updateDeviceInfo.vue'
import { deviceCols } from '../columns.js'
export default {
  name: 'DeviceManagement',
  components: {
    transferRecords,
    updateDeviceInfo
  },
  data() {
    return {
      pagination: {
        pageSize: 10,
        current: 1,
        total: 0
      },
      columns: deviceCols,
      tableLoading: false,
      searchWord: '',
      tableList: [],
      DEVICESTATUS,
      showTransferRecords: false,
      showUpdateDevInfoModel: false, 
      currentDevice: {}
    }
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
      this.timer && clearTimeout(this.timer)
      const { pageSize, current } = this.pagination
      this.tableLoading = true
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
                sub._id = current + sub.name + idx+ sub.number
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
    // 配置下发
    handleTransfer(record) {
      // 配置下发页面有两个面包屑导航，下面path代表应用管理的导航，appPath代表的是每个应用的导航
      let bread = {
        ...JSON.parse(localStorage.getItem("bread")),
        appPath: this.$route.path
      }
      localStorage.setItem("bread", JSON.stringify(bread))
      this.$router.push({
        path: '/application/deviceManagement/configureDelivery',
        query: {
          name: record.name,
          id: record.id
        }
      })
    },
    // 查看设备的下发记录
    viewRecords(record) {
      this.currentDevice = record
      this.showTransferRecords = true
      this.$nextTick(() => {
        this.$refs.transferRecord.loadTableList()
      })
    },
    // 更新设备信息
    handleUpdateDevInfo(record) {
      this.currentDevice = record
      // this.showUpdateDevInfoModel = true
      // 需求变更为更新文件下发
      const params = {
        deviceId: record.id,
      }
      updatePackageFileRecord(params).then(res => {
        if(res.code == 0 && res.success){
          this.$message.success("文件更新下发成功")
        }
      }).catch(err => {
        this.$message.error(err?.response?.msg || err?.response?.message)
      })
    },
    handReload() {
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
.paganation-container {
  text-align: right;
  margin-top: 10px;
}
@import '~@/config/theme.less';
/deep/ .ant-table-row-level-1 {
  background-color: @tableBGC1;
}
</style>