<template>
  <div class="page-content page-content-height">
    <el-tabs v-model="tabActiveKey" @tab-click="tabOnChange" style="width: 250px;">
      <el-tab-pane label="通用算法" name="1"></el-tab-pane>
      <el-tab-pane label="业务算法" name="2"></el-tab-pane>
      <el-tab-pane label="基础算法" name="3"></el-tab-pane>
    </el-tabs>
    <div class="toolbar space-between">
      <el-form :inline="true" :model="searchFormData" size="small" ref="refSearchForm" @keyup.enter.native="handSearch">
        <el-form-item label="类型" prop="algorithmType">
          <el-select v-model="searchFormData.algorithmType" placeholder="请选择" clearable>
            <el-option :value="item.nodeName" v-for="item in algorithmTypeList" :key="item.id" :label="item.nodeName"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="searchFormData.name" placeholder="请输入" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handSearch">查询</el-button>
          <el-button type="primary" plain @click="handReload">重置</el-button>
        </el-form-item>
      </el-form>
      <div style="margin-bottom: 18px;">
        <el-button type="primary" @click="handCreate">新建算法</el-button>
        <el-button v-if="!cardMode"  icon="el-icon-s-grid" @click="cardMode = true" type="warning" circle title="表格风格"></el-button>
        <el-button v-else  icon="el-icon-bank-card" @click="cardMode = false" type="warning" circle title="卡片风格"></el-button>
      </div>
    </div>
    <!-- 切换显示card或table -->
    <!-- <div class="mode-icon-wrap">
      <el-button v-if="!cardMode"  icon="el-icon-s-grid" style="padding: 0 15px;outline: none;" @click="cardMode = true" :type="cardMode ? '':'primary'" v-tooltip.to="'表格风格'"></el-button>
      <el-button v-else  icon="el-icon-bank-card" style="padding: 0 15px;outline: none;" @click="cardMode = false" :type="cardMode ? 'primary': ''" v-tooltip.to="'卡片风格'"></el-button>
    </div> -->
    <div class="content" 
      v-loading="loading && pageSize == 1" 
      :infinite-scroll-disabled="isbottom || loading" 
      v-infinite-scroll="loadbottom" 
      element-loading-text="拼命加载中"
      element-loading-background="rgba(255, 255, 255, 0.5)"
    >
      <div class="main" v-if="tableData.length || loading">
        <div v-if="cardMode" class="card-wrap">
          <Card v-for="item in tableData" :key="item.id" :data="item" @handleClick="toMirrorDetail"></Card>
          <Card :data="tableData[0]" :isHidden="true" v-if="ishidden[0] == 4 && (ishidden[1] == 2 || ishidden[1] == 3)" ></Card>
          <Card :data="tableData[0]" :isHidden="true" v-if="ishidden[0] == 4 && ishidden[1] == 2"></Card>
          <Card :data="tableData[0]" :isHidden="true" v-if="ishidden[0] == 3 && ishidden[1] == 2"></Card>
        </div>
        <a-table v-resize :columns="columns" :data-source="tableData"  :rowKey="record => record.id" :pagination="false" v-else>
          <span slot="imageName" slot-scope="text,record">
            <span  class="image-name"  :title="text" @click="toMirrorDetail(record)">{{ text }}</span>
          </span>
          <span slot="createTime" slot-scope="text">  {{ text | moment }}</span>
          <span slot="updateTime" slot-scope="text">  {{ text | moment }}</span>
          <span slot="imageStatus" slot-scope="text">
            <a-tag :color="imageStatusMap.get(text)[1]">{{ imageStatusMap.get(text)[0] }}</a-tag>
          </span>
          <span slot="operate" slot-scope="record,text,index">
            <a v-action:image-list-edit @click="() => handleEdit(record)" :disabled="disabledItem(record)">编辑</a>
            <a v-action:image-list-delete @click="handleDelete(record, index)" style="margin-left: 10px;margin-right: 10px;" :disabled="disabledItem(record)">删除</a>
            <a-dropdown>
              <a @click="e => e.preventDefault()">更多</a>
              <a-menu slot="overlay">
                <a-menu-item @click="shareModel(record)" :disabled="disabledItem(record)">设置共享</a-menu-item>
                <!-- <a-menu-item @click="onExportMirror(record)">算法导出</a-menu-item> -->
              </a-menu>
            </a-dropdown>
          </span>
        </a-table>
      </div>
      <el-empty :image-size="200" v-else></el-empty>
      <p style="text-align: center; line-height: 16px; color: black;" v-if="tableData.length && loading && pageSize != 1">加载中...</p>
      <p style="text-align: center;" v-if="isbottom && tableData.length > 12">没有更多了</p>
    </div>
    <component :is="dialogName"
               :ref="dialogName"
               :parentData.sync="parentData"
               :dataSetTitle="dataSetTitle"
               :tagTypeOpt.sync="tagTypeOpt"
               :pagination="pagination"
               @getDataList="getDataList"></component>
    <div v-if="tabActiveKey=='4'">
        <Step1 ref="step"></Step1>
    </div>
    <!-- 设置共享 -->
    <share-modal ref="refShareModal" v-if="showShareDialog" :visible.sync="showShareDialog"></share-modal>
  </div>
</template>
<script>
import { getTargetType } from "@/api/dataCenter"
import { getParams } from '@/utils/util'
import CanvasSelect from './components/CanvasSelect'//这里不加花括号
import Step1 from './components/Step1'
import splitPane from "vue-splitpane"
import { NoData } from "@/components"
import addBusinessDialog from './components/AddBusinessDialog'
import addEditDialog from './components/AddEditDialog'
import addModelDialog from './components/AddModelDialog'
import {
  getImageManageList,
  deleteImageManage,
  getImageManageById,
  imageVersion,
  checkImageModel,
  mirrorExport
} from "@/api/imageManage"
import moment from 'moment'
import shareModal from "@/components/business/share/index.vue";
export default {
  name: "Mirror",
  components: {
    Card: () => ({ component: import('@/components/CardAL/index.vue') }),
    tree: () => ({ component: import('@/components/tree') }),
    addModelDialog,
    addEditDialog,
    addBusinessDialog,
    "split-pane": splitPane,
    CanvasSelect,
    Step1,
    NoData,
    shareModal,
  },
  data() {
    return {
      algorithmTypeList: [], //算法分类列表
      cardMode: true,
      pageSize: 1,
      screenWidth: document.documentElement.clientWidth,
      loading: false,
      tagTypeOpt: [],
      dlTagTypeFilter: {},
      tableData: [],
      columns: [
        {
          title: '算法名称',
          dataIndex: "imageName",
          key: "imageName",
          ellipsis: true,
          scopedSlots: { customRender: "imageName" },
          width: '15%'
        },
        {
          title: "版本号",
          dataIndex: "versionLabel",
          ellipsis: true,
          key: "versionLabel",
          scopedSlots: { customRender: "versionLabel" },
          width: 75
        },
        {
          title: "镜像",
          dataIndex: "newImageName",
          ellipsis: true,
          key: "newImageName",
          width: '15%'
        },
        {
          title: "算法类型",
          dataIndex: "tagType",
          key: "tagType",
          width: 100
          // filters: this.tagTypeOpt,
          // filterMultiple: false
        },
        {
          title: "创建人",
          dataIndex: "createBy",
          key: "createBy",
          width: 80
        },
        {
          title: "创建时间",
          dataIndex: "createTime",
          key: "createTime",
          scopedSlots: { customRender: "createTime" },
          width: 150
        }, {
          title: "更新时间",
          dataIndex: "updateTime",
          key: "updateTime",
          scopedSlots: { customRender: "updateTime" },
          width: 150
        },
        {     //0-创建中，1-正常，2-异常
          title: "状态",
          dataIndex: "imageStatus",
          key: "imageStatus",
          scopedSlots: { customRender: "imageStatus" },
          width: 60
        },
        {
          title: "操作",
          dataIndex: "",
          key: "x",
          scopedSlots: { customRender: "operate" },
          width: 130,
          align: 'center'
        }
      ],
      dataSetVisible: false,
      dataSetTitle: "",
      parentData: {},
      pagination: {
        total: 0,
        pageSize: 10,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "30", "50"],
        showTotal: function (total) {
          return `共 ${total} 条`
        }
      },
      expandedRowKeys: [],
      treeApi: {
        search: "getImageMrgTreeList",
        add: "savaImageMrgTreeList",
        edit: "editImageMrgTreeList",
        delete: "deleteImageMrgTreeList"
      },
      statusList: ['创建中', '正常', '异常'],
      tabActiveKey: "1",
      search: "",
      dialogName: '',
      total: 0,
      currentTreeData: null,
      imageStatusMap: new Map([
        [0, ['创建中', 'blue']],
        [1, ['正常', 'green']],
        [2, ['异常', 'red']]
      ]),
      showShareDialog: false,  //设置共享modal
      searchFormData: {
        name: '',
        algorithmType: '',
      }
    }
  },
  mounted() {
    if (this.$route.params.add) {
      if (this.$route.params.type === 'business') {
        this.dialogName = 'addBusinessDialog'
        this.tabActiveKey = '2'
      } else {
        this.dialogName = 'addEditDialog'
      }
      this.$nextTick(() => {
        this.handCreate()
      })
    } else {
      this.dialogName = 'addEditDialog'
    }
    this.getTargetTypeData()
    this.getDataList({ isFirst: true, tagType: this.searchFormData.algorithmType })
    window.addEventListener('resize', this.getScreenWidth)
  },
  created() {
    // 查询算法类型列表
    getTargetType().then(res => {
      this.algorithmTypeList = res.data || []
    })
  },
  destroyed() {
    window.removeEventListener('resize', this.getScreenWidth)
  },
  computed: {
    isbottom() {
      return this.total <= this.tableData.length
    },
    ishidden() {
      if (this.screenWidth >= 1350) {
        let num = this.tableData.length % 4
        return [4, num]
      } else {
        let num = this.tableData.length % 3
        return [3, num]
      }
    }
  },
  methods: {
    handSearch() {
      this.pagination.current = 1
      this.getDataList()
    },
    handReload() {
      this.$refs.refSearchForm.resetFields()
      this.pagination.current = 1
      this.handSearch()
    },
    loadbottom() {
      const { name, algorithmType } = this.searchFormData
      this.getDataList({
        pageSize: 10,
        pageIndex: this.pageSize + 1,
        dlType: this.tabActiveKey,
        type: "bottom",
        tagType: algorithmType,
        search: name,
      })
    },
    getScreenWidth() {
      this.screenWidth = document.body.offsetWidth;
    },
    async getTargetTypeData() {
      const data = await getTargetType()
      if (data.code === 0) {
        this.tagTypeOpt = data.data.map(element => {
          return {
            text: element.nodeName,
            value: element.nodeName
          }
        })
        data.data.forEach(element => {
          this.dlTagTypeFilter[element.id] = element.nodeName
        })
        this.algorithmTypeList = data.data || []
      }
    },
    tabOnChange(key) {
      this.pageSize = 1
      if (this.tabActiveKey === '1') {
        this.dialogName = 'addEditDialog'
      } else {
        this.dialogName = 'addBusinessDialog'
      }
      if (this.tabActiveKey === '3') {
        this.dialogName = 'addModelDialog'
      }
      this.getDataList({ isFirst: true, tagType: this.searchFormData.algorithmType })
    },
    async handCreateVersion(record) {
      const data = await getImageManageById(record.sourceVersionId)
      this.parentData = JSON.parse(JSON.stringify(data.data))
      this.parentData.isVersion = true
      this.parentData.id = ''
      this.$set(this.parentData, 'isVersion', true)
      this.dataSetTitle = '新建算法版本'
      this.$nextTick(() => {
        this.$refs[this.dialogName].showDialog()
      })
    },
    handCreate() {
      // if (this.tabActiveKey === '3') {
      //   console.log(this.$refs['step'])
      //   this.$refs['step'].progress = 1
      //   this.$store.commit('setBasicData', {
      //           id: null,
      //           templateName: null,
      //           nodeId: null,
      //           classId: null,
      //           eqpId: null
      //       });
      //       return 
      // }
      this.parentData = {
        dlName: "",
        dlRealDir: "",
        tagType: "",
        dlDescribe: "",
        dsType: 1,
        storedDirId: "",
        c11nType: '0',
        storedDirName: "",
        algorithmFetchType: 1,
        imageType: this.tabActiveKey
      }
      if (this.tabActiveKey === '1') {
        this.dataSetTitle = "新建通用算法"
        this.parentData.algorithmFetchType = 2
        this.dialogName = 'addEditDialog'
      } else {
        this.dataSetTitle = "新建业务算法"
        this.parentData.algorithmFetchType = 2
        this.dialogName = 'addBusinessDialog'
      }
      if (this.tabActiveKey === '3') {
        this.parentData.algorithmFetchType = 2
        this.dataSetTitle = "新建预训练模型"
        this.dialogName = 'addModelDialog'
      }
      this.$nextTick(() => {
        this.$refs[this.dialogName] && this.$refs[this.dialogName].showDialog()
      })
    },
    getDataList(params) {
      if (params?.dataType === 'select') this.currentTreeData = { ...params }
      this.getData(params)
      // this.setTimer(this.getData, params, 15 * 1000)
    },
    async getData(param) {
      const params = getParams(param, this, "mirror")
      if (param?.isFirst) {
        params.nodeId = 0
        params.nodeCode = ''
      }
      // 添加查询表单查询参数
      const { name, algorithmType } = this.searchFormData
      params.imageName = name
      params.tagType = algorithmType

      params.limit = 20
      params.addType = 0    //算法管理这里固定写死0(后端业务变更，加以区分要求)
      const responseData = await getImageManageList(params)
      this.pageSize = params.pageNo
      if (responseData.code === 0) {
        this.loading = false
        if (params.pageNo !== 1) {
          this.tableData = [...this.tableData, ...responseData.data.records].map(item => {
            item.children = item.versionCounts > 1 ? [] : undefined
            return item
          })
        } else {
          this.tableData = responseData.data.records.map(item => {
            item.children = item.versionCounts > 1 ? [] : undefined
            return item
          })
        }
        // this.tableData = responseData.data.records.map(item => {
        //   item.children = item.versionCounts > 1 ? [] : undefined
        //   return item
        // })
        this.pagination.total = responseData.data.total
        this.total = responseData.data.total
        // if (param?.isFirst) {
        //   this.total = responseData.data.total
        // } else {
        //   // getImageManageList({
        //   //   imageType: this.tabActiveKey
        //   // }).then(res => {
        //   //   this.total = res.data.total
        //   // })
        // }
        this.expandedRowKeys = []
        this.$refs.tree?.reloadData(this.currentTreeData)
        clearTimeout(this.timer)
        if (this.tableData.filter(item => item.imageStatus === 0).length > 0) {
          // this.setTimeOut(this.getData, param, 15 * 1000)
        }
      }
    },
    async getChildren(expanded, record) {
      if (!expanded) {
        this.expandedRowKeys = []
        return false
      } else {
        this.expandedRowKeys.push(record.id)
      }
      // 当状态为展开时，获取当前算法的所有版本
      this.loading = true
      const res = await imageVersion.getImageVersionList({ sourceVersionId: record.sourceVersionId })
      this.loading = false
      if (res.code !== 0) return false
      record.children = res.data.filter(item => {
        return item.id !== item.sourceVersionId
      })
    },
    tableDataChange(pagination, filters, sorter) {
      this.getDataList({
        pageSize: pagination.pageSize,
        pageIndex: pagination.current,
        search: this.searchFormData.name,
        tagType: filters?.tagType ? filters.tagType[0] : ""
      })
      this.pagination.pageSize = pagination.pageSize
      this.pagination.current = pagination.current
    },
    toMirrorDetail(rowData) {
      // if (rowData.imageStatus !== 1) return false
      this.$router.push({
        path: "/train/mirror/detail",
        query: { id: rowData.id, key: this.tabActiveKey }
      })
    },
    async handleEdit(rowData) {
      const data = await getImageManageById(rowData.id)
      this.parentData = JSON.parse(JSON.stringify(data.data))
      this.dataSetTitle = "编辑算法"
      if (this.tabActiveKey === '1') {
        this.dataSetTitle = "编辑通用算法"
        this.dialogName = 'addEditDialog'
      } else {
        this.dataSetTitle = "编辑业务算法"
        this.dialogName = 'addBusinessDialog'
      }
      if (this.tabActiveKey === '3') {
        this.dataSetTitle = "编辑预训练模型"
        this.dialogName = 'addModelDialog'
      }
      this.$nextTick(() => {
        this.$refs[this.dialogName].showDialog()
      })
    },
    renderTaskList(taskList) {
      const task = taskList.map(item => {
        return <p>
          <span class="taskName">{item.modelName}({item.versionLabel})</span>
          <span class="taskVersion">{item.modelType}</span>
          <span class="taskTag">{item.tagType}</span>
          <span class="taskTime">{moment(item.createTime).format('YYYY-MM-DD HH:mm:ss')}</span>
        </p>
      })
      return <div class="task">
        <h4>当前算法关联以下模型，请先删除下列模型再删除该算法：</h4>
        <div class="taskList">
          <p>
            <span class="taskName">模型名称</span>
            <span class="taskVersion">模型类型</span>
            <span class="taskTag">类别</span>
            <span class="taskTime">发布时间</span>
          </p>
          {task}
        </div>
      </div>
    },
    async onExportMirror(record) {
      try {
        const id = record.id
        this.loading = true
        const res = await mirrorExport.compression({ id })
        this.loading = false
        if (res.code !== 0) return false
        if (!res.data) return false
        let link = document.createElement("a");
        link.style.display = "none";
        link.href = `/api/v1/algorithm/imageManageInfo/downCalculate?zipFilePath=${escape(res.data)}`;
        // link.setAttribute("download", name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // 下载完成移除元素
      } catch (err) {
        console.error(err)
        this.loading = false
      }
    },
    async handleDelete(rowData, index) {
      let taskList = []
      const res = await checkImageModel(rowData.id)
      if (res.code === 0) {
        taskList = res.data
      }
      const content = taskList.length === 0 ? "此操作将永久删除，请确认是否删除?" : this.renderTaskList(taskList)
      this.$confirm({
        title: taskList.length === 0 ? `确定要删除 ${rowData.imageName} 吗?` : '提示',
        content,
        cancelText: '取消',
        okText: '确定',
        okButtonProps: {
          props: { disabled: taskList.length !== 0 },
        },
        width: 600,
        onOk: () => {
          deleteImageManage(rowData.id)
            .then(res => {
              if (res.code === 0) {
                // that.tableData.splice(index, 1)
                this.$message.success("删除成功!")
                if (this.tableData.length === 1 && this.pagination.total !== 1) this.pagination.current--
                this.getDataList({
                  pageNo: this.pagination.current,
                  limit: this.pagination.pageSize,
                  imageType: this.tabActiveKey,
                  tagType: this.searchFormData.algorithmType
                })
              }
            })
        },
        onCancel() { }
      })
    },
    // 是否可被删除/编辑，照搬cardAl中的逻辑
    disabledItem(data) {
      return false
      if (data.createBy === this.$store.state?.user?.user?.username || this.$store.state?.user?.user?.username === "admin") {
        return false
      }
      return true
    },
    // 设置共享
    async shareModel(record) {
      this.showShareDialog = true
      await this.$nextTick()
      await this.$refs.refShareModal.invokeModal({ data: record, type: 'algorithm' })
      // 刷新列表
      this.getDataList({ isFirst: true, tagType: this.searchFormData.algorithmType })
    }
  }
}
</script>

<style lang="less" scoped>
.page-content {
  display: flex;
  flex-direction: column;
  .mode-icon-wrap {
    height: 30px;
    display: flex;
    flex-direction: row-reverse;
    padding: 0 15px 10px 0;
  }
  .content {
    overflow: auto;
    width: 100%;
    flex: 1;
    background: #fff;
    border-radius: 16px;
    // padding: 12px;
    &::-webkit-scrollbar {
      cursor: pointer;
      width: 8px;
      height: 8px;
      background-color: #fff;
    }
    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.3);
      border-radius: 6px;
      border: solid transparent;
      cursor: pointer;
    }
    &::-webkit-scrollbar-track {
      background-color: #fff;
    }
    .card-wrap {
      justify-content: space-between;
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      padding: 12px;
    }
  }
}
/deep/ .splitter-pane.vertical.splitter-paneR {
  min-height: 100%;
  height: auto;
  border-left: 1px solid rgba(0, 0, 0, 0.2);
}
/deep/ .vue-splitter-container {
  min-height: calc(100vh - 168px);
}
.taskList {
  overflow-y: auto;
  max-height: 250px;
  & > p > * {
    display: inline-block;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .taskName {
    width: 42%;
  }
  .taskTime {
    width: 26%;
  }
  .taskVersion,
  .taskTag {
    width: 15%;
  }
}
</style>
