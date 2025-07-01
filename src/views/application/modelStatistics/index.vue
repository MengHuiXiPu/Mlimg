<template>
  <div class="modelStatic">
    <div class="modelStatic-top">
      <a-spin :spinning="topLoading">
        <a-form-model
          ref="form"
          :label-col="{ span: 6 }"
          :wrapper-col="{ span: 18 }"
          :model="searchForm"
          :rules="searchFormRule"
        >
          <a-form-model-item
            v-for="(item, name) in directoryTableData"
            :key="name"
            :label="item.label"
          >
            <a-select
              v-model="searchForm[name]"
              mode="multiple"
              allowClear
              showSearch
              :token-separators="[';']"
              :filter-option="filterOption"
              @change="getTaskDataList"
            >
              <a-select-option v-for="option in item.option" :key="option" :value="option">
                {{ option }}
              </a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item label="运行模式">
            <a-select
              v-model="searchForm.runType"
              placeholder="请选择运行模式"
            >
              <a-select-option :value="0">测试模式</a-select-option>
              <a-select-option :value="1">正式模式</a-select-option>
            </a-select>
          </a-form-model-item>
        </a-form-model>
        <a-form-model
          ref="form"
          :col="4"
          :row="20"
          :model="searchForm"
          :rules="searchFormRule"
        >
          <a-form-model-item
            label="任务名称"
            style="flex: 50% 0 0"
          >
            <a-select
              v-model="searchForm.taskId"
              mode="multiple"
              showSearch
              :filter-option="filterOption"
              placeholder="请选择任务"
            >
              <a-select-option
                v-for="item in taskList"
                :key="item.taskId"
                :value="item.taskId"
              >
                {{ item.taskName }}
              </a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item
            label="选择日期"
            prop="time"
            style="flex: 50% 0 0"
          >
            <template v-if="searchForm.dateType === 3">
              <a-month-picker
                v-model="searchForm.startDate"
                :valueFormat="dateList[searchForm.dateType]"
                :disabled-date="(c) => disabledDate(c, 'endDate')"
                placeholder="开始时间"
                class="startDate"
              />
              <a-month-picker
                v-model="searchForm.endDate"
                :valueFormat="dateList[searchForm.dateType]"
                :disabled-date="(c) => disabledDate(c, 'startDate')"
                placeholder="结束时间"
                class="endDate"
              />
            </template>
            <template v-else-if="searchForm.dateType === 2">
              <a-week-picker
                v-model="searchForm.startDate"
                :valueFormat="dateList[searchForm.dateType]"
                :disabled-date="(c) => disabledDate(c, 'endDate')"
                placeholder="开始时间"
                class="startDate"
              />
              <a-week-picker
                v-model="searchForm.endDate"
                :disabled-date="(c) => disabledDate(c, 'startDate')"
                :valueFormat="dateList[searchForm.dateType]"
                placeholder="结束时间"
                class="endDate"
              />
            </template>
            <template v-else>
              <a-date-picker
                v-model="searchForm.startDate"
                :valueFormat="dateList[searchForm.dateType]"
                :disabled-date="(c) => disabledDate(c, 'endDate')"
                placeholder="开始时间"
                class="startDate"
              />
              <a-date-picker
                v-model="searchForm.endDate"
                :valueFormat="dateList[searchForm.dateType]"
                :disabled-date="(c) => disabledDate(c, 'startDate')"
                placeholder="结束时间"
                class="endDate"
              />
            </template>
            <a-select v-model="searchForm.dateType" @change="changeDateType" style="width: 20%">
              <a-select-option :value="3">月</a-select-option>
              <a-select-option :value="2">周</a-select-option>
              <a-select-option :value="1">日</a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item label="阈值设置">
            <a-input-number
              v-model="searchForm.codeConf"
              allow-clear
              :min="0"
              :max="1.1"
              placeholder="请输入阈值"
              style="width: 100%"
            />
          </a-form-model-item>
          <a-form-model-item>
            <a-button
              type="primary"
              @click="searchData"
            >
              查询
            </a-button>
          </a-form-model-item>
        </a-form-model>
      </a-spin>
    </div>
    <div class="modelStatic-bottom">
      <div class="modelStatic-bottom-header">
        <a-radio-group v-model="active" @change="changeActive">
          <a-radio-button :value="1" :disabled="searchFormCopy.taskId && searchFormCopy.taskId.length > 0">站点分析</a-radio-button>
          <a-radio-button :value="2" :disabled="active < 2">模型分析</a-radio-button>
          <a-radio-button :value="3" :disabled="active < 3">Code分析</a-radio-button>
        </a-radio-group>
        <div class="btn">
          <a-button type="primary" @click="exportResult" :disabled="resultDisabled">导出结果</a-button>
          <a-button type="primary" @click="exportRawData" :disabled="!selectModel.itemId" v-show="active === 2">导出RawData</a-button>
        </div>
      </div>
      <div class="modelStatic-bottom-content">
        <template v-if="active === 1">
          <a-table
            :columns="tableColumns"
            :data-source="siteTable"
            :pagination="sitePagination"
            :loading="loading"
            :rowKey="record => record.id"
            :rowClassName="rowSiteClassName"
            :customRow="getSiteCustomRow"
            @change="siteTableDataChange"
          ></a-table>
        </template>
        <template v-else-if="active === 2">
          <a-table
            :columns="tableColumns"
            :data-source="modelTable"
            :pagination="modelPagination"
            :loading="loading"
            :rowKey="record => record.id"
            :rowClassName="rowModelClassName"
            :customRow="getModelCustomRow"
            @change="modelTableDataChange"
          ></a-table>
        </template>
        <template v-else>
          <a-table
            :columns="tableColumns"
            :data-source="codeTable"
            :pagination="codePagination"
            :loading="loading"
            :rowKey="record => record.id"
            :rowClassName="rowCodeClassName"
            :customRow="getCodeCustomRow"
            @change="codeTableDataChange"
          ></a-table>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { downloadFile } from '@/utils/util'
import moment from 'moment'
import {
  getApplicationcenterList,
  modelStatisticsApi
} from '@/api/appCenter'
export default {
  name: 'modelStatistics',
  data () {
    return {
      searchForm: {
        dateType: 1,
        taskId: [],
        runType: 0
      },
      searchFormCopy: {},
      searchSiteForm: {},
      searchFormRule: {},
      searchSiteFormRule: {},
      active: 1,
      siteTable: [],
      tableColumns: [{
        title: 'Item',
        dataIndex: 'item',
        key: 'item',
      }, {
        title: 'Time',
        dataIndex: 'quotaTime',
        key: 'quotaTime',
      }, {
        title: 'AI Move',
        dataIndex: 'aiMove',
        key: 'aiMove',
      }, {
        title: 'AboveConf Move',
        dataIndex: 'aboveConfMove',
        key: 'aboveConfMove',
      }, {
        title: 'Out Move',
        dataIndex: 'outMove',
        key: 'outMove',
      }, {
        title: '覆盖率',
        dataIndex: 'coverage',
        key: 'coverage',
      }, {
        title: 'Sample Move',
        dataIndex: 'sampleMove',
        key: 'sampleMove',
      }, {
        title: 'Sample Match',
        dataIndex: 'sampleMatch',
        key: 'sampleMatch',
      }, {
        title: '准确率',
        dataIndex: 'accuracy',
        key: 'accuracy',
      }, {
        title: 'Turnon Loss Num',
        dataIndex: 'turnonLossNum',
        key: 'turnonLossNum',
      }, {
        title: 'Turnon Loss Rate',
        dataIndex: 'turnonLossRate',
        key: 'turnonLossRate',
      }],
      modelTable: [],
      codeTable: [],
      loading: false,
      sitePagination: {
        total: 0,
        pageSize: 10,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "30", "50"],
        showTotal: function (total) {
          return `共 ${total} 条`
        }
      },
      modelPagination: {
        total: 0,
        pageSize: 10,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "30", "50"],
        showTotal: function (total) {
          return `共 ${total} 条`
        }
      },
      codePagination: {
        total: 0,
        pageSize: 10,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "30", "50"],
        showTotal: function (total) {
          return `共 ${total} 条`
        }
      },
      directoryTableData: {},
      topLoading: false,
      taskList: [],
      dateList: {
        1: 'YYYY-MM-DD',
        2: 'YYYY-w',
        3: 'YYYY-MM'
      },
      selectSite: {},
      selectModel: {},
      selectCode: {},
      queryType: 0
    }
  },
  computed: {
    resultDisabled () {
      let entryCode = ''
      switch (this.active) {
        case 1:
          entryCode = this.siteTable.length > 0
          break
        case 2:
          entryCode = this.modelTable.length > 0
          break
        case 3:
          entryCode = this.codeTable.length > 0
          break
      }
      return !Boolean(entryCode)
    }
  },
  created () {
    this.getDataList()
  },
  methods: {
    async searchData () {
      this.active = 1
      this.selectSite = {}
      this.selectModel = {}
      this.selectCode = {}
      this.searchFormCopy = JSON.parse(JSON.stringify(this.searchForm))
      const { pageSize: limit, current: pageNo } = this.sitePagination
      const params = {
        ...this.searchFormCopy,
        limit,
        pageNo
      }
      Object.keys(this.directoryTableData).forEach(item => {
        let val = ''
        if (this.searchFormCopy[item] && this.searchFormCopy[item].length > 0) {
          val = this.searchForm[item].join()
        } else {
          val = '""'
        }
        params[item] = this.directoryTableData[item].key + '=' + val
      })
      if (this.searchFormCopy.taskId.length > 0) {
        this.$set(this.modelPagination, 'current', 1)
        this.getModelData(1)
        return false
      }
      this.loading = true
      const res = await modelStatisticsApi.searchData(params)
      this.loading = false
      if (res.code !== 0) return false
      this.siteTable = res.data.records || []
      this.$set(this.sitePagination, 'total', res.data.total)
    },
    async getTaskDataList () {
      const obj = {
        factoryName: 'factoryParam',
        productName: 'productParam',
        processOperationName: 'siteParam'
      }
      const params = {
        runType: this.searchForm.runType
      }
      if (Object.keys(this.directoryTableData).some(item => {
        let val = ''
        if (this.searchForm[item] && this.searchForm[item].length > 0) {
          val = this.searchForm[item].join()
        } else {
          val = '""'
        }
        params[obj[item]] = this.directoryTableData[item].key + '=' + val
      })) return false
      this.topLoading = true
      const res = await modelStatisticsApi.getTaskList(params)
      this.topLoading = false
      if (res.code !== 0) return false
      this.taskList = res.data
    },
    exportResult () {
      const entryCodes = ['siteTable', 'modelTable', 'codeTable']
      const data = this[entryCodes[this.active - 1]]
      if (data.length === 0) return false
      const entryCode = data[0].entryCode
      const conditionId = data[0].conditionId
      const url = '/api/v1/applicationcenter/tbQuotaViewDetailInfo/downloadQuotaAnsResult'
      this.loading = true
      downloadFile(`${url}?conditionId=${conditionId}&entryCode=${entryCode}&resultLevel=${this.active}`)
      this.loading = false
    },
    exportRawData () {
      const itemId = this.selectModel.itemId
      const conditionId = this.selectModel.conditionId
      const url = '/api/v1/applicationcenter/tbQuotaViewDetailInfo/downloadTaskOriginResult'
      this.loading = true
      downloadFile(`${url}?conditionId=${conditionId}&itemId=${itemId}`)
      this.loading = false
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
    },
    disabledDate (current, type) {
      if (type === 'startDate') {
        return current && (current > moment(new Date()) || current < moment(this.searchForm[type], this.dateList[this.dateType]))
      } else {
        return current && (current > moment(new Date()) || current > moment(this.searchForm[type], this.dateList[this.dateType]))
      }
    },
    siteTableDataChange (pagination) {
      this.sitePagination.pageSize = pagination.pageSize
      this.sitePagination.current = pagination.current
      this.searchData()
    },
    modelTableDataChange (pagination) {
      this.modelPagination.pageSize = pagination.pageSize
      this.modelPagination.current = pagination.current
      this.getModelData(null, this.modelTable[0].conditionId)
    },
    codeTableDataChange (pagination) {
      this.codePagination.pageSize = pagination.pageSize
      this.codePagination.current = pagination.current
      this.getCodeData()
    },
    async getModelData (queryType, id) {
      if (queryType) this.queryType = queryType
      this.active = 2
      const { pageSize: limit, current: pageNo } = this.modelPagination
      const params = {
        ...this.searchFormCopy,
        taskId: this.searchFormCopy.taskId.join(),
        queryType: this.queryType,
        conditionId: id || this.selectSite.conditionId,
        limit,
        pageNo
      }
      if (this.queryType === 2) {
        const time = ['', 'W', 'M']
        const type = this.searchFormCopy.dateType
        if (type !== 1) {
          params.startDate = this.selectSite.quotaTime.replace(time[type - 1], '-')
          params.endDate = this.selectSite.quotaTime.replace(time[type - 1], '-')
        } else {
          params.startDate = this.selectSite.quotaTime
          params.endDate = this.selectSite.quotaTime
        }
        // if (this.directoryTableData['productName']
        //   && this.searchFormCopy.productName
        //   && this.searchFormCopy.productName.length > 0) {
        //   params.productName = this.directoryTableData['productName'].key + '=' + this.searchFormCopy.productName.join()
        // }
      }
      Object.keys(this.directoryTableData).forEach(item => {
        let val = ''
        if (this.searchFormCopy[item] && this.searchFormCopy[item].length > 0) {
          val = this.searchFormCopy[item].join()
        }
        params[item] = this.directoryTableData[item].key + '=' + val
        if (this.selectSite.item && item === 'processOperationName') {
          params[item] = this.directoryTableData[item].key + '=' + this.selectSite.item
        }
      })
      this.loading = true
      const res = await modelStatisticsApi.searchModelData(params)
      this.loading = false
      if (res.code !== 0) return false
      console.log(res)
      this.modelTable = res.data.records || []
      this.$set(this.modelPagination, 'total', res.data.total)
    },
    async getCodeData () {
      this.active = 3
      const { pageSize: limit, current: pageNo } = this.codePagination
      const { codeConf, dateType, endDate, runType, startDate } = this.searchFormCopy
      const params = {
        codeConf, dateType, endDate, runType, startDate,
        itemId: this.selectModel.itemId,
        conditionId: this.selectModel.conditionId,
        limit,
        pageNo
      }
      const time = ['', 'W', 'M']
      const type = this.searchFormCopy.dateType
      if (type !== 1) {
        params.startDate = this.selectSite.quotaTime.replace(time[type - 1], '-')
        params.endDate = this.selectSite.quotaTime.replace(time[type - 1], '-')
      }
      this.loading = true
      const res = await modelStatisticsApi.searchCodeData(params)
      this.loading = false
      if (res.code !== 0) return false
      if (!res.data.records) return false
      this.codeTable = res.data.records || []
      this.$set(this.codePagination, 'total', res.data.total)
    },
    async getDataList () {
      this.topLoading = true
      const res = await modelStatisticsApi.getCondition()
      this.topLoading = false
      if (res.code !== 0) return false
      this.directoryTableData = res.data
    },
    changeDateType () {
      this.$set(this.searchForm, 'startDate', '')
      this.$set(this.searchForm, 'endDate', '')
    },
    rowSiteClassName (record) {
      return record.id === this.selectSite.id ? 'selected' : ''
    },
    getSiteCustomRow (record) {
      return {
        on: {
          click: () => {
            this.selectSite = JSON.parse(JSON.stringify(record))
          },
          dblclick: () => {
            this.selectSite = JSON.parse(JSON.stringify(record))
            this.$nextTick(() => {
              this.getModelData(2)
              this.$set(this.modelPagination, 'current', 1)
            })
          }
        }
      }
    },
    rowModelClassName (record) {
      return record.id === this.selectModel.id ? 'selected' : ''
    },
    getModelCustomRow (record) {
      return {
        on: {
          click: () => {
            this.selectModel = JSON.parse(JSON.stringify(record))
          },
          dblclick: () => {
            this.selectModel = JSON.parse(JSON.stringify(record))
            this.$nextTick(() => {
              this.$set(this.codePagination, 'current', 1)
              this.getCodeData()
            })
          }
        }
      }
    },
    rowCodeClassName (record) {
      return record.id === this.selectCode.id ? 'selected' : ''
    },
    getTableCustomRow (record) {
      return {
        on: {
          click: () => {
            this.selectCode = JSON.parse(JSON.stringify(record))
          }
        }
      }
    },
  }
}
</script>

<style lang="less" scoped>
.modelStatic{
  &-top{
    margin-bottom: 10px;
    border-bottom: 1px solid #ccc;
    /deep/ .ant-form{
      margin: 0;
      .startDate, .endDate{
        width: 40%;
      }
    }
  }
  &-bottom{
    &-header{
      .btn{
        float: right;
        &>*{
          margin-left: 10px;
        }
      }
    }
    &-content{
      padding: 10px;
      /deep/ .ant-table-row{
        cursor: pointer;
      }
      /deep/ .ant-table-row.selected{
        background: #0072C6;
        color: #fff;
        &:hover td{
          background: #0072C6;
        }
      }
    }
  }
}
</style>