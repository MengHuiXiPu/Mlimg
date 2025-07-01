/*
 * @Author: lichao.sun 
 * @Date: 2024-04-10 16:58:27 
 * @Last Modified by: lichao.sun
 * @Last Modified time: 2024-04-12 16:43:42
 * @description: 设备下发记录表格
 */
<template>
  <div class="page-content">
    <a-table :columns="columns" :data-source="tableList" :rowKey="(record) => record.id" :pagination="pagination"
      :loading="tableLoading" @change="handleTableChange" :scroll="{y: 400 }">
      <a slot="recordType" slot-scope="recordType" :class="recordType==0 ? '':'cmd-record-title'">{{RECORDTYPE.get(recordType)}}
        <!-- <i class="el-icon-files" slot="recordType" slot-scope="recordType">{{RECORDTYPE.get(recordType)}}</i> -->
      </a>
      <span slot="fileNames" slot-scope="fileNames">
        {{ fileNames.join(',') }}
      </span>
      <span slot="transferStatus" slot-scope="transferStatus">
        <a-tag :color="TRANSFERSTATUS.get(transferStatus).color">{{TRANSFERSTATUS.get(transferStatus).name}}</a-tag>
      </span>
      <span slot="commandStatus" slot-scope="commandStatus"> 
        <a-tag :color="CMDSTATUS.get(commandStatus).color">{{CMDSTATUS.get(commandStatus).name}}</a-tag>
      </span>
      <span slot="createTime" slot-scope="value">
        {{ value | moment }}
      </span>
      <span slot="updateTime" slot-scope="value">
        {{ value | moment }}
      </span>
      <span slot="operate" slot-scope="record,text,index">
        <!-- <a v-action:image-list-edit @click="() => upadteRecord(record)">更新</a>
        <a v-action:image-list-download @click="() => downloadRecord(record)" style="margin-left: 10px">下载</a> -->
        <a-popconfirm
          title="Are you sure delete this record?"
          @confirm="deleteRecord(record)"
        >
          <a v-action:image-list-delete danger>删除</a>
        </a-popconfirm>
      </span>
    </a-table>
  </div>
</template>

<script>
const tableColumns = [{
  title: "记录类型",
  dataIndex: "recordType",
  scopedSlots: { customRender: 'recordType' }
}, {
  title: "目标设备",
  dataIndex: "deviceId",
}, {
  title: "算法应用",
  dataIndex: "inferTaskId",
},  {
  title: "算法应用访问地址",
  dataIndex: "inferTaskUrl"
},{
  title: "下发文件名称",
  dataIndex: "fileNames",
  scopedSlots: { customRender: "fileNames" }
}, {
  title: "下发文件路径",
  dataIndex: "zipUrl"
},{
  title: "下发状态",
  dataIndex: "transferStatus",
  scopedSlots: { customRender: 'transferStatus' }
}, {
  title: "下发信息",
  dataIndex: "transferMsg",
}, {
  title: "命令状态",
  dataIndex: "commandStatus",
  scopedSlots: { customRender: 'commandStatus' }
}, {
  title: '命令参数',
  dataIndex: 'commandArg'
},{
  title: "创建人",
  dataIndex: "createBy"
}, {
  title: "创建时间",
  dataIndex: "createTime",
  scopedSlots: { customRender: "createTime" },
}, {
  title: "修改人",
  dataIndex: "updateBy",
}, {
  title: "修改时间",
  dataIndex: "updateTime",
  scopedSlots: { customRender: "updateTime" }
}, 
// {
//   title: "操作",
//   key: "x",
//   scopedSlots: { customRender: "operate" },
//   align: 'right',
//   width: 150
// }
]
import { getTransferRecordList,removeRecorById } from '@/api/cloud.js'
import { TRANSFERSTATUS,RECORDTYPE, CMDSTATUS } from '../constant.js'
export default {
  name: 'TransferRecords',
  data() {
    return {
      tableList: [],
      pagination: {
        pageSize: 10,
        current: 1,
        total: 0
      },
      columns: tableColumns,
      tableLoading: false,
      searchWord: '',
      TRANSFERSTATUS,
      RECORDTYPE,
      CMDSTATUS
    }
  },
  props: {
    // 设备信息
    device: {
      type: Object,
      default: () => ({})
    },
  },
  methods: {
    handleTableChange(pagination, filters, sorter) {
      this.pagination.current = pagination.current
      this.pagination.pageSize = pagination.pageSize
      this.loadTableList()
    },
    /**
     * @public
     */
    loadTableList() {
      const { pageSize, current } = this.pagination
      this.tableLoading = true
      const params = {
        deviceId: this.device.id, //目标设备id
        // recordType: null, // 0 文件记录  1命令记录
        // inferTaskId: '',//算法应用id
        // fileId: '',//下发文件id
        // fileName: '', //下发文件名称
        // transferStatus: '', //下发状态
        // commandStatus: '', //命令状态
        pageNo: current,
        limit: pageSize
      }
      getTransferRecordList(params).then(res => {
        if (res.code == 0) {
          this.tableList = res?.data?.records || []
          this.pagination.total = res?.data?.total
        }
      }).finally(() => {
        this.tableLoading = false
      })
    },
    deleteRecord(record) {
      this.removeRecorById(record.id).then(() => {
        this.$message.success(`删除${record.id}成功`)
        this.loadTableList()
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.cmd-record-title{
  color: #F56C6C!important;
}
</style>