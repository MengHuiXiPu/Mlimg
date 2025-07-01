<template>
  <div class="directoryConfig">
    <a-header
      :auth="{ add: 'directory-list-add' }"
      :tab-list="tabList"
      :tab-active-key="tabActiveKey"
      :showUpload="tabActiveKey === '2'"
      :showSearch="!['1', '7'].includes(tabActiveKey)"
      @tab-change="tabOnChange"
      @create="handCreate"
      @reload="handReload"
      @upload="handUpload"
      @search="handSearch"
    ></a-header>
    <div class="directory" v-if="tabActiveKey === '1'">
      <a-table
        :columns="directoryColumns"
        :data-source="directoryTableData"
        :loading="dataLoading"
        :pagination="false"
        :rowKey="(record) => record.id">
        <span slot="dataIndex" slot-scope="text, record, index">{{ level[index] + '级' }}</span>
        <span slot="action" slot-scope="text, record, index">
          <a v-action:directory-list-edit @click="edit(record)" style="margin-right: 5px">编辑</a>
          <a-popconfirm
            :title="`确定删除 ${record.name} 么?`"
            ok-text="确定"
            cancel-text="取消"
            @confirm="deleteItem(record)"
          >
            <a v-action:directory-list-delete :disabled="index !== directoryTableData.length - 1">删除</a>
          </a-popconfirm>
        </span>
      </a-table>
    </div>
    <div class="data" v-else-if="tabActiveKey === '2'">
      <a-table
        :scroll="{y: 560}"
        v-if="dataColumns.length > 0"
        :columns="dataColumns"
        :loading="dataLoading"
        :data-source="dataTableData"
        :rowKey="(record) => record.recordId"
        :pagination="dataPagination"
        @change="handleChange"
      >
        <span slot="action" slot-scope="text, record">
          <a v-action:directory-list-edit @click="edit(record)" style="margin-right: 5px">编辑</a>
          <a-popconfirm
            title="确定删除该条数据么?"
            ok-text="确定"
            cancel-text="取消"
            @confirm="deleteItem(record)"
          >
            <a v-action:directory-list-delete>删除</a>
          </a-popconfirm>
        </span>
      </a-table>
    </div>
    <div class="messageSource" v-else-if="tabActiveKey === '3'">
      <a-table
        v-if="messageCloumns.length > 0"
        :columns="messageCloumns"
        :data-source="messageDataList"
        :pagination="dataPagination.total > 10 ? dataPagination : false"
        :loading="dataLoading"
        @change="handleChange"
        :rowKey="(record) => record.id">
        <span slot="subSourceId" slot-scope="text">
          {{ dsNasTypesOption.filter(item => item.id === text)[0] ? dsNasTypesOption.filter(item => item.id === text)[0].dsName : '' }}
        </span>
        <span slot="pubSourceId" slot-scope="text">
          {{ dsNasTypesOption.filter(item => item.id === text)[0] ? dsNasTypesOption.filter(item => item.id === text)[0].dsName : '' }}
        </span>
        <span slot="createTime" slot-scope="text">
          {{ text | moment }}
        </span>
        <span slot="action" slot-scope="text, record">
          <a v-action:directory-list-edit @click="edit(record)" style="margin-right: 5px">编辑</a>
          <!-- <a-popconfirm
            title="确定删除么?"
            ok-text="确定"
            cancel-text="取消"
            @confirm="deleteItem(record)"
          >
            <a>删除</a>
          </a-popconfirm> -->
          <a v-action:directory-list-delete @click="deleteItem(record)">删除</a>
        </span>
      </a-table>
    </div>
    <div class="fileSource" v-else-if="tabActiveKey === '4'">
      <a-table
        v-if="fileCloumns.length > 0"
        v-resize
        :columns="fileCloumns"
        :data-source="fileDataList"
        :pagination="dataPagination.total > 10 ? dataPagination : false"
        :loading="dataLoading"
        @change="handleChange"
        :rowKey="(record) => record.id">
        <span slot="action" slot-scope="text, record">
          <a v-action:directory-list-edit @click="edit(record, type)" style="margin-right: 5px">编辑</a>
          <!-- <a-popconfirm
            title="确定删除么?"
            ok-text="确定"
            cancel-text="取消"
            @confirm="deleteItem(record)"
          >
            <a>删除</a>
          </a-popconfirm> -->
          <a v-action:directory-list-delete @click="deleteItem(record)">删除</a>
        </span>
      </a-table>
    </div>
    <div class="imageSource" v-else-if="tabActiveKey === '5'">
      <a-table
        v-if="imageCloumns.length > 0"
        :columns="imageCloumns"
        :data-source="imageDataList"
        :pagination="dataPagination.total > 10 ? dataPagination : false"
        :loading="dataLoading"
        @change="handleChange"
        :rowKey="(record) => record.id">
        <span slot="createTime" slot-scope="text">
          {{ text | moment }}
        </span>
        <span slot="action" slot-scope="text, record">
          <a v-action:directory-list-edit @click="edit(record)" style="margin-right: 5px">编辑</a>
          <a-popconfirm
            :title="`确定删除 ${record.name} 么?`"
            ok-text="确定"
            cancel-text="取消"
            @confirm="deleteItem(record)"
          >
            <a v-action:directory-list-delete>删除</a>
          </a-popconfirm>
        </span>
      </a-table>
    </div>
    <div class="taskGroup" v-else-if="tabActiveKey === '6'">
      <a-table
        v-if="imageCloumns.length > 0"
        :columns="taskGroupCloumns"
        :data-source="taskGroupList"
        :pagination="dataPagination.total > 10 ? dataPagination : false"
        :loading="dataLoading"
        @change="handleChange"
        :rowKey="(record) => record.id">
        <span slot="action" slot-scope="text, record">
          <a v-action:directory-list-edit @click="edit(record)" style="margin-right: 5px">编辑</a>
          <a-popconfirm
            :title="`确定删除 ${record.name} 么?`"
            ok-text="确定"
            cancel-text="取消"
            @confirm="deleteItem(record)"
          >
            <a v-action:directory-list-delete>删除</a>
          </a-popconfirm>
        </span>
      </a-table>
    </div>
    <div class="productAxis" v-else>
      <a-table
        v-resize
        :columns="productAxisCloumns"
        :data-source="productAxisList"
        :pagination="dataPagination.total > 10 ? dataPagination : false"
        :loading="dataLoading"
        @change="handleChange"
        :rowKey="(record) => record.id">
        <span slot="action" slot-scope="text, record">
          <a v-action:directory-list-edit @click="edit(record)" style="margin-right: 5px">编辑</a>
          <a-popconfirm
            :title="`确定删除 ${record.productName} 么?`"
            ok-text="确定"
            cancel-text="取消"
            @confirm="deleteItem(record)"
          >
            <a v-action:directory-list-delete>删除</a>
          </a-popconfirm>
        </span>
      </a-table>
    </div>
    <create-data ref="createData" @addDirectory="getDataList" :directoryTableData="directoryTableData" />
    <create-directory ref="createDirectory" @addDirectory="getDataList" />
    <create-message ref="createMessage" @addDirectory="getInferenceDataSourceConfList" />
    <create-file ref="createFile" @addDirectory="getInferenceFileSourceConfList" />
    <create-image ref="createImage" @addDirectory="getImageSourceList" />
    <create-task-group ref="createTaskGroup" @addDirectory="getTaskGroupList" />
    <create-product-axis ref="createProductAxis" @addDirectory="getProductAxisList" />
    <a-modal
      :visible="showUpload"
      title="导入数据"
      :maskClosable="false"
      @cancel="showUpload = false">
      <p>请按模板填写导入数据信息，并上传导入</p>
      <template slot="footer">
        <a-upload
          :before-upload="uploadFile"
          accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          :showUploadList="false">
          <a-button type="primary" :loading="loading">导入</a-button>
        </a-upload>
        <a-button type="primary" @click="downLoadFile" style="margin-left: 10px">
          下载模板
        </a-button>
      </template>
    </a-modal>
  </div>
</template>

<script>
import moment from 'moment'
import { mixinHeader } from "@/utils/mixin"
import { downloadFile } from '@/utils/util'
import {
  inferenceCatalogConfList,
  inferenceCatalogConfInfo,
  inferenceCatalogInfoDelete,
  inferenceCatalogInfoList,
  inferenceCatalogImport,
  messageSource,
  fileSource,
  getdDataSourceInfo,
  imageSource,
  taskGroupConfig,
  productAxis,
  inferenceCatalogInfoFilterList
} from "@/api/appCenter"
export default {
  name: "DirectoryConfig",
  mixins: [mixinHeader],
  components: {
    createData: () => ({ component: import('./components/createData') }),
    createDirectory: () => ({ component: import('./components/createDirectory') }),
    createFile: () => ({ component: import('./components/createFile') }),
    createMessage: () => ({ component: import('./components/createMessage') }),
    createImage: () => ({ component: import('./components/createImage') }),
    createTaskGroup: () => ({ component: import('./components/createTaskGroup') }),
    createProductAxis: () => ({ component: import('./components/createProductAxis') })
  },
  data () {
    return {
      level: ['一', '二', '三', '四', '五', '六', '七', '八'],
      moduleList: ['createDirectory', 'createData', 'createMessage', 'createFile', 'createImage', 'createTaskGroup', 'createProductAxis'],
      tabActiveKey: '1',
      createDirectoryShow: false,
      createDataShow: false,
      showUpload: false,
      dataLoading: false,
      dataPagination: {
        total: 0,
        pageSize: 10,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "30", "50"],
        showTotal: function (total) {
          return `共 ${total} 条`
        }
      },
      tabList: [
        { key: "1", name: "目录配置" },
        { key: "2", name: "数据录入" },
        { key: '3', name: '消息源配置' },
        { key: '4', name: '文件源配置' },
        { key: '5', name: '捞图源配置' },
        { key: '6', name: '任务组配置' },
        { key: '7', name: '产品坐标' }
      ],
      dsNasTypesOption: [],
      directoryTableData: [],
      dataTableData: [],
      // dataColumns: [],
      directoryColumns: [
        {
          key: 'dataIndex',
          dataIndex: 'dataIndex',
          title: '目录级别',
          scopedSlots: { customRender: "dataIndex" },
          ellipsis: true,
          // align: 'center'
        }, {
          key: 'name',
          dataIndex: 'name',
          title: '目录名称',
          ellipsis: true,
          // align: 'center'
        }, {
          key: 'value',
          dataIndex: 'value',
          title: '解析来源',
          ellipsis: true,
          // align: 'center'
        }, {
          key: 'action',
          dataIndex: 'action',
          title: '操作',
          scopedSlots: { customRender: "action" },
          align: 'right'
        }
      ],
      messageCloumns: [
        {
          key: 'name',
          dataIndex: 'name',
          title: '消息源名称',
          ellipsis: true,
          // align: 'center'
        }, {
          key: 'subSourceId',
          dataIndex: 'subSourceId',
          title: '输入源',
          scopedSlots: { customRender: "subSourceId" },
          ellipsis: true,
          // align: 'center'
        }, {
          key: 'pubSourceId',
          dataIndex: 'pubSourceId',
          title: '输出源',
          scopedSlots: { customRender: "pubSourceId" },
          ellipsis: true,
          // align: 'center'
        }, {
          key: 'createTime',
          dataIndex: 'createTime',
          title: '创建时间',
          ellipsis: true,
          scopedSlots: { customRender: "createTime" },
          // align: 'center'
        }, {
          key: 'action',
          dataIndex: 'action',
          title: '操作',
          scopedSlots: { customRender: "action" },
          align: 'right'
        }
      ],
      fileCloumns: [
        {
          key: 'name',
          dataIndex: 'name',
          title: '文件源名称',
          ellipsis: true,
          // align: 'center'
        }, {
          key: 'csvReadPath',
          dataIndex: 'csvReadPath',
          title: 'CSV文件路径解析规则',
          ellipsis: true,
          // align: 'center',
          // width: 100
        }, {
          key: 'imgReadPath',
          dataIndex: 'imgReadPath',
          title: '图片路径解析规则',
          ellipsis: true,
          // align: 'center'
        }, {
          key: 'csvJudgePath',
          dataIndex: 'csvJudgePath',
          title: 'OP判CODE路径解析规则',
          ellipsis: true,
          // align: 'center'
        }, {
          key: 'action',
          dataIndex: 'action',
          title: '操作',
          scopedSlots: { customRender: "action" },
          align: 'right',
          width: 100
        }
      ],
      imageCloumns: [{
        key: 'name',
        dataIndex: 'name',
        title: '捞图源名称',
        ellipsis: true,
        // align: 'center'
      }, {
        key: 'messageSourceName',
        dataIndex: 'messageSourceName',
        title: '消息源',
        scopedSlots: { customRender: "messageSourceName" },
        ellipsis: true,
        // align: 'center'
      }, {
        key: 'fileSourceName',
        dataIndex: 'fileSourceName',
        title: '文件源',
        scopedSlots: { customRender: "fileSourceName" },
        ellipsis: true,
        // align: 'center'
      }, {
        key: 'action',
        dataIndex: 'action',
        title: '操作',
        scopedSlots: { customRender: "action" },
        align: 'right'
      }],
      taskGroupCloumns: [{
        key: 'name',
        dataIndex: 'name',
        title: '图片类型',
        ellipsis: true,
        // align: 'center'
      }, {
        key: 'rule',
        dataIndex: 'rule',
        title: '图片名称匹配',
        ellipsis: true,
        // align: 'center'
      }, {
        key: 'action',
        dataIndex: 'action',
        title: '操作',
        scopedSlots: { customRender: "action" },
        align: 'right'
      }],
      messageDataList: [],
      fileDataList: [],
      imageDataList: [],
      taskGroupList: [],
      productAxisList: [],
      productAxisCloumns: [{
        key: 'productName',
        dataIndex: 'productName',
        title: '产品名称',
        ellipsis: true,
        // align: 'center'
      }, {
        key: 'productSpecName',
        dataIndex: 'productSpecName',
        title: '产品类别',
        ellipsis: true,
        // align: 'center'
      }, {
        key: 'processOperationName',
        dataIndex: 'processOperationName',
        title: '站点',
        ellipsis: true,
        align: 'right'
      }, {
        key: 'eqpType',
        dataIndex: 'eqpType',
        title: '机台',
        ellipsis: true,
        // align: 'center'
      }, {
        key: 'axisX',
        dataIndex: 'axisX',
        title: 'X坐标',
        ellipsis: true,
        align: 'right'
      }, {
        key: 'axisY',
        dataIndex: 'axisY',
        title: 'Y坐标',
        ellipsis: true,
        align: 'right'
      }, {
        key: 'action',
        dataIndex: 'action',
        title: '操作',
        scopedSlots: { customRender: "action" },
        align: 'right'
      }],
      searchName: ''
    }
  },
  computed: {
    dataColumns () {
      return this.directoryTableData.map(key => {
        return {
          key: key.name,
          dataIndex: key.name,
          title: key.name,
          // align: 'center',
          filters: this.unique(this.dataTableData.map(item => {
            return item[key.name] || ''
          })),
          // onFilter: (value, record) => record[key.name] === value,
          ellipsis: true
        }
      }).concat([{
        key: 'action',
        dataIndex: 'action',
        title: '操作',
        scopedSlots: { customRender: "action" },
        align: 'right'
      }])
    }
  },
  mounted () {
    this.getDataList()
  },
  methods: {
    unique (arr) {
      const newArr = []
      arr.forEach(item => {
        if (newArr.indexOf(item) === -1) {
          newArr.push(item)
        }
      })
      return newArr.sort().map(item => {
        return {
          text: item,
          value: item
        }
      })
    },
    tabOnChange (key) {
      this.tabActiveKey = key
      this.dataLoading = false
      this.dataPagination = {
        total: 0,
        pageSize: 10,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "30", "50"],
        showTotal: function (total) {
          return `共 ${total} 条`
        }
      }
      this.handReload()
    },
    async getDataList (params) {
      await this.getInferenceCatalogConfList(params)
      if (!params) this.getInferenceCatalogInfoList(params)
    },
    handCreate () {
      if (this.tabActiveKey === '1') {
        if (this.directoryTableData.length >= 8) {
          this.$message.warning('当前最多支持八级目录')
          return false
        }
      }
      this.$refs[this.moduleList[this.tabActiveKey - 1]].showModal()
    },
    // 点击分页等
    handleChange (pagination, filters, sorter) {
      this.dataPagination.pageSize = pagination.pageSize
      this.dataPagination.current = pagination.current
      switch (this.tabActiveKey) {
      case '1':
        break;
      case '2':
        // this.dataFilterList = JSON.parse(JSON.stringify(pagination))
        // this.getDataTableFilter(pagination)
        break;
      case '3':
        this.getInferenceDataSourceConfList({
          limit: pagination.pageSize,
          pageNo: pagination.current,
          name: this.searchName
        })
        break;
      case '4':
        this.getInferenceFileSourceConfList({
          limit: pagination.pageSize,
          pageNo: pagination.current,
          name: this.searchName
        })
        break;
      case '5':
        this.getImageSourceList({
          limit: pagination.pageSize,
          pageNo: pagination.current,
          name: this.searchName
        })
        break;
      case '6':
        this.getTaskGroupList({
          limit: pagination.pageSize,
          pageNo: pagination.current,
          name: this.searchName
        })
        break;
      case '7':
        this.getProductAxisList({
          limit: pagination.pageSize,
          pageNo: pagination.current,
          name: this.searchName
        })
        break;
      }
    },
    handSearch (params) {
      this.searchName = params
      switch (this.tabActiveKey) {
      case '1':
        break;
      case '2':
        this.getInferenceCatalogInfoList({
          params: this.searchName
        })
        break;
      case '3':
        this.getInferenceDataSourceConfList({
          limit: this.dataPagination.pageSize,
          pageNo: 1,
          name: this.searchName
        })
        break;
      case '4':
        this.getInferenceFileSourceConfList({
          limit: this.dataPagination.pageSize,
          pageNo: 1,
          name: this.searchName
        })
        break;
      case '5':
        this.getInferenceFileSourceConfList({
          limit: this.dataPagination.pageSize,
          pageNo: 1,
          name: this.searchName
        })
        break;
      case '6':
        this.getTaskGroupList({
          limit: this.dataPagination.pageSize,
          pageNo: 1,
          name: this.searchName
        })
        break;
      case '7':
        this.getProductAxisList({
          limit: this.dataPagination.pageSize,
          pageNo: 1,
          productName: this.searchName
        })
        break;
      }
    },
    handReload () {
      switch (this.tabActiveKey) {
      case '1':
      case '2':
        this.getDataList()
        break;
      case '3':
        this.getInferenceDataSourceConfList()
        break;
      case '4':
        this.getInferenceFileSourceConfList()
        break;
      case '5':
        this.getImageSourceList()
        break;
      case '6':
        this.getTaskGroupList()
        break;
      case '7':
        this.getProductAxisList()
        break;
      }
    },
    async getInferenceCatalogConfList (params) {
      this.dataLoading = true
      const res = await inferenceCatalogConfList()
      if (res.code === 0) {
        this.dataLoading = false
        this.directoryTableData = res.data.records
      }
    },
    async getInferenceCatalogInfoList (params) {
      this.dataLoading = true
      if (!params?.params) this.searchName = ''
      const res = await inferenceCatalogInfoList(params)
      if (res.code === 0) {
        this.dataLoading = false
        this.dataTableData = res.data
      }
    },
    async getDataTableFilter (filter) {
      const params = {
        params: Object.values(filter).flat().join()
      }
      this.dataLoading = true
      const res = await inferenceCatalogInfoFilterList(params)
      if (res.code !== 0) return false
      this.dataLoading = false
      this.dataTableData = res.data
    },
    async getInferenceDataSourceConfList (params) {
      this.dataLoading = true
      const data = await getdDataSourceInfo({ dsTypes: 'RV,KAFKA' })
      if (data.code === 0) {
        this.dsNasTypesOption = data.data
        const res = await messageSource.inferenceDataSourceConfList(params)
        if (res.code === 0) {
          this.dataLoading = false
          this.messageDataList = res.data.records
          this.dataPagination.total = res.data.total
        }
      }
    },
    async getInferenceFileSourceConfList (params) {
      this.dataLoading = true
      const res = await fileSource.inferenceFileSourceConfList(params)
      if (res.code === 0) {
        this.dataLoading = false
        this.fileDataList = res.data.records
        this.dataPagination.total = res.data.total
      }
    },
    async getImageSourceList (params) {
      this.dataLoading = true
      const res = await imageSource.getDataList(params)
      if (res.code === 0) {
        this.dataLoading = false
        this.imageDataList = res.data.records
        this.dataPagination.total = res.data.total
      }
    },
    async getTaskGroupList (params) {
      this.dataLoading = true
      const res = await taskGroupConfig.getDataList(params)
      if (res.code === 0) {
        this.dataLoading = false
        this.taskGroupList = res.data.records
        this.dataPagination.total = res.data.total
      }
    },
    async getProductAxisList (params) {
      this.dataLoading = true
      const res = await productAxis.getDataList(params)
      if (res.code === 0) {
        this.dataLoading = false
        this.productAxisList = res.data.records
        this.dataPagination.total = res.data.total
      }
    },
    edit (record, type) {
      this.$refs[this.moduleList[this.tabActiveKey - 1]].showModal(record)
    },
    async deleteItem (record) {
      let taskList = []
      switch (this.moduleList[this.tabActiveKey - 1]) {
      case 'createDirectory':
        inferenceCatalogConfInfo(record.id, 'delete').then(res => {
          this.$message.success('删除成功')
          this.getDataList()
        })
        break
      case 'createData':
        const params = {
          recordId: record.recordId
        }
        inferenceCatalogInfoDelete(params).then(res => {
          if (res.code === 0) {
            this.$message.success('删除成功')
            this.getDataList()
          }
        })
        break
      case 'createMessage':
        this.dataLoading = true
        const messageRes = await messageSource.getMessageDataSourceTaskList({
          id: record.id
        })
        this.dataLoading = false
        if (messageRes.code !== 0) return false
        taskList = Object.keys(messageRes.data).filter(item => messageRes.data[item]).length === 0 ? [] : messageRes.data
        const messageContent = taskList.length === 0 ? `此操作将永久删除，请确认是否删除?` : this.renderTaskList(taskList)
        this.$confirm({
          title: taskList.length === 0 ? `确定要删除 ${record.name} 吗?` : '提示',
          content: messageContent,
          cancelText: '取消',
          okText: '确定',
          width: 600,
          okButtonProps: {
            props: { disabled: taskList.length !== 0 },
          },
          onOk: () => {
            messageSource.getInferenceDataSourceConf(record.id, 'delete').then((res) => {
              if (res.code === 0) {
                this.$message.success('删除成功')
                if (this.messageDataList.length === 1 && this.dataPagination.total !== 1) this.dataPagination.current--
                this.getInferenceDataSourceConfList({
                  pageNo: this.dataPagination.current,
                  limit: this.dataPagination.pageSize
                })
              }
            })
          },
          onCancel () {}
        })
        break
      case 'createFile':
        this.dataLoading = true
        const fileRes = await fileSource.getFileDataSourceTaskList({
          id: record.id
        })
        this.dataLoading = false
        if (fileRes.code !== 0) return false
        taskList = Object.keys(fileRes.data).filter(item => fileRes.data[item]).length === 0 ? [] : fileRes.data
        const fileContent = taskList.length === 0 ? `此操作将永久删除，请确认是否删除?` : this.renderTaskList(taskList)
        this.$confirm({
          title: taskList.length === 0 ? `确定要删除 ${record.name} 吗?` : '提示',
          content: fileContent,
          cancelText: '取消',
          okText: '确定',
          width: 600,
          okButtonProps: {
            props: { disabled: taskList.length !== 0 },
          },
          onOk: () => {
            fileSource.getInferenceFileSourceConf(record.id, 'delete').then((res) => {
              if (res.code === 0) {
                this.$message.success('删除成功')
                if (this.fileDataList.length === 1 && this.dataPagination.total !== 1) this.dataPagination.current--
                this.getInferenceFileSourceConfList({
                  pageNo: this.dataPagination.current,
                  limit: this.dataPagination.pageSize
                })
              }
            })
          },
          onCancel () {}
        })
        break
      case 'createImage':
        imageSource.deleteImageSource(record.id).then(res => {
          if (res.code === 0) {
            this.$message.success('删除成功')
            this.getImageSourceList()
          }
        })
        break
      case 'createTaskGroup':
        taskGroupConfig.deleteTaskGroupConfig(record.id).then(res => {
          if (res.code === 0) {
            this.$message.success('删除成功')
            this.getTaskGroupList()
          }
        })
        break
      case 'createProductAxis':
        productAxis.delData(record.id).then(res => {
          if (res.code === 0) {
            this.$message.success('删除成功')
            this.getProductAxisList()
          }
        })
        break
      default: return false
      }
    },
    renderTaskList (taskList) {
      const task1 = taskList.onlineTaskRelyedInfos ? taskList.onlineTaskRelyedInfos.map(item => {
        return <p>
          <span class="taskName">{ item.taskName }</span>
          <span class="taskType">推理任务</span>
          <span class="taskTime">{ moment(item.publishTime).format('YYYY-MM-DD HH:mm:ss') }</span>
        </p>
      }) : ''
      const task2 = taskList.offlineTaskRelyedInfos ? taskList.offlineTaskRelyedInfos.map(item => {
        return <p>
          <span class="taskName">{ item.reRunTaskName }</span>
          <span class="taskType">离线回放</span>
          <span class="taskTime">{ moment(item.createTime).format('YYYY-MM-DD HH:mm:ss') }</span>
        </p>
      }) : ''
      return <div class="task">
        <h4>当前配置被以下任务依赖，请先删除下列任务再删除该配置：</h4>
        <div class="taskList">
          <p>
            <span class="taskName">名称</span>
            <span class="taskName">类型</span>
            <span class="taskTime">发布时间</span>
          </p>
          { task1 }
          { task2 }
        </div>
      </div>
    },
    handUpload () {
      this.showUpload = true
    },
    uploadFile (file) {
      const formData = new FormData()
      formData.append('file', file)
      this.loading = true
      inferenceCatalogImport(formData).then(res => {
        if (res.code === 0) {
          this.$message.success('导入成功')
          this.getDataList()
          this.showUpload = false
        }
        this.loading = false
      })
      return false
    },
    downLoadFile () {
      downloadFile('/api/v1/applicationcenter/inferenceCatalogInfo/export')
    }
  }
}
</script>

<style lang="less" scoped>
/deep/ .taskList{
  overflow-y: auto;
  max-height: 250px;
  &>p>*{
    display: inline-block;
    width: 33%
  }
}
</style>
