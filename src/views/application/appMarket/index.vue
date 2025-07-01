<template>
  <div>
    <div class="toolbar space-between">
      <el-form :inline="true" :model="searchFormData" size="small" ref="refSearchForm" @submit.native.prevent>
        <el-form-item label="名称" prop="name">
          <el-input v-model="searchFormData.name" placeholder="请输入" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="$event=>handleSearch($event)">查询</el-button>
          <el-button type="primary" plain @click="handleSearch($event, true)">重置</el-button>
        </el-form-item>
      </el-form>
      <div style="margin-bottom: 18px;">
        <el-button type="primary" @click="handCreate">新建应用</el-button>
      </div>
    </div>
    <div class="body">
      <div class="app-card-wrap scrollbar">
        <template v-if="appList.length">
          <div class="card" v-for="item in appList" :key="item.id">
            <div class="card-body">
              <aside>
                <img :src="require('@/assets/appLogo.png')" alt="">
                <!-- <span><svg-icon type="appication" /></span> -->
              </aside>
              <article>
                <header>{{ `${item.name}(v${item.versionId})` }}</header>
                <p :title="item.algorithmDescribe">{{ item.algorithmDescribe }}</p>
              </article>
            </div>
            <div class="footer">
              <a type="link" size="small" @click="doUpdateApp(item)">更新</a>
              <a type="link" size="small" @click="doAddAppConfig(item)" style="margin-left: 10px">添加配置</a>
              <!-- <a-button type="link" size="small">发布</a-button> -->
              <!-- <a-button type="link" size="small">导出</a-button> -->
              <a type="link" size="small" @click="doDeleteApp(item)" style="margin-left: 10px">删除</a>
            </div>
          </div>
        </template>
        <a-empty class="empty-info" style="transform: translate(35vw, 0%);" v-else/>
      </div>
      <div class="table-content">
        <!-- v-show="configList.length" -->
        <a-table :columns="columns" :scroll="{y: 450}"
          :data-source="configList" :rowKey="(record) => record.id"
          :pagination="pagination.total > 10 ? pagination : false" 
          :loading="tableLoading" 
          @change="handleTableChange" v-resize
        >
          <span slot="createTime" slot-scope="text">{{ text | moment }}</span>
          <span slot="updateTime" slot-scope="text">{{ text | moment }}</span>
          <!-- <span slot="status" slot-scope="record">
            <a-tag color="#87d068" style="cursor: pointer;" @click="showPublishList(record)"> 已发布</a-tag>
          </span> -->
          <!-- 表格操作列 -->
          <span slot="action" slot-scope="text, record">
            <a type="link" size="small" @click="doEdit(record)" style="margin-left: 10px">编辑</a>
            <a-popconfirm placement="top" ok-text="Yes" cancel-text="No" @confirm="doDeleteConfig(record)">
              <template slot="title">
                <div>确定要删除此条记录么？</div>
              </template>
              <a type="link" size="small" style="margin-left: 10px">删除</a>
            </a-popconfirm>
            <a-dropdown>
              <!-- <a-button type="link" size="small">更多</a-button> -->
              <a type="link" size="small" style="margin-left: 10px">更多</a>
              <a-menu slot="overlay">
                <a-menu-item @click="callPublish(record)">发布</a-menu-item>
                <a-menu-item @click="showPublishList(record)">发布记录</a-menu-item>
              </a-menu>
            </a-dropdown>
          </span>
        </a-table>
      </div>
    </div>
    <!-- 编辑器 -->
    <editor v-if="openEditModal" :visible.sync="openEditModal" ref="refEditor" :configId="currentConfigRecord.id"></editor>
    <!-- 新建应用/编辑应用modal -->
    <create-app :visible.sync="openCreateModal" v-if="openCreateModal" @refreshList="refreshPage" ref="refCreateApp"></create-app>
    <!-- 配置发布(有时间再写通用组件吧，先copy) -->
    <a-modal :visible="showPublishModal" title="新建发布应用" width="720px" 
      v-if="showPublishModal" :maskClosable="false" @ok="handlePublish" @cancel="showPublishModal = false" :confirm-loading="publishBtnLoading"
    >
      <PublishInfo ref="publishInfo" :form.sync="publishInfoForm" dictType="app"/>
    </a-modal>
    <!-- 查看发布记录 -->
    <publish-record v-if="showPublishRecord" :visible.sync="showPublishRecord" ref="refPublishRecord"></publish-record>
  </div>
</template>

<script>
import editor from "./editor/index.vue";
import createApp from "./createApp.vue";
import publishRecord from "./publishRecord.vue";
import { getAppList, deleteAlgorithmApp, saveOrUpdateConfig, getConfigList, deleteConfig, publishApp, getDebugIsSuccess } from "@/api/runtorun.js";
import { useState } from "./editor/hooks/state";
import PublishInfo from "@/views/pipelineCenter/components/PublishInfo.vue";
import { getApplicationcenterList } from "@/api/appCenter.js";
import moment from 'moment'
export default {
  name: 'appMarket',
  components: {
    editor,
    createApp,
    PublishInfo,
    publishRecord,
  },
  data() {
    return {
      appList: [],  //应用列表
      configList: [], //配制记录
      openEditModal: false,   //编辑配置modal
      openCreateModal: false,
      pagination: {
        pageSize: 10,
        current: 1,
        total: 0
      },
      columns: [{
        title: '配置名称',
        dataIndex: "name",
        ellipsis: true,
        width: '15%',
      },{
        title: "算法应用",
        dataIndex: "algorithmName",
        width: 100,
        customRender(text, record) {
          return `${text}(v${record.versionId})`
        }
      },{
        title: "创建时间",
        dataIndex: "createTime",
        scopedSlots: { customRender: "createTime" },
        width: 168,
      },{
        title: "更新时间",
        dataIndex: "updateTime",
        scopedSlots: { customRender: "createTime" },
        width: 168,
      },{
        title: "创建人",
        dataIndex: "createBy",
        width: 120,
      },{
        title: "发布次数",
        dataIndex: 'publishCount',
        width: 60,
      },{
        title: "操作",
        dataIndex: "action",
        scopedSlots: { customRender: "action" },
        width: '90px',
        // align: 'center',
      }],
      currentConfigRecord: {},  //当前配置的record data

      showPublishModal: false,  //发布modal
      publishInfoForm: {  //发布模型表单的formdata
        taskName: "",
        storedDirName: "",
        description: "",
        storedDirId: "",
      },
      publishBtnLoading: false,
      tableLoading: false,
      showPublishRecord: false, //
      searchFormData: {
        name: "",
      }
    }
  },
  methods: {
    // 创建新的配置
    async doAddAppConfig(appData = {}) {
      try {
        const resopnse = await this.$prompt('请输入配置名称', '新建配置记录')
        if(!resopnse?.value) return this.$message.warning('未输入名称， 无法创建配置')
        const params = {
          algorithmId: appData.id,
          name: resopnse.value,
        }
        const appendRes = await saveOrUpdateConfig(params)
        if(appendRes.code == 0) { //刷新
          this.pagination.current = 1
          this.queryConfigList()
          this.$message.success("已保存")
        }
      } catch (error) {
        
      } 
    },
     // 点击发布按钮
    callPublish(record = {}) {
      getDebugIsSuccess(record.id).then(res => {
        if(res.code == 0 && res.data=== true) {
          this.currentConfigRecord = record
          this.publishInfoForm.taskName = this.publishInfoForm.storedDirName = this.publishInfoForm.description = this.publishInfoForm.storedDirId = ""
          this.showPublishModal = true
        }else {
          this.$message.warning("该配置未完成运行调试，不支持发布")
        }
      })
    },
    // 展示某配置的发布记录，以及是否删除
    showPublishList(record) {
      this.showPublishRecord = true
      this.$nextTick(() => {
        this.$refs.refPublishRecord.initState(record)
      })
    },
    // 调发布接口
    handlePublish() {
      this.$refs.publishInfo.$refs.ruleForm.validate(async (valid) => {
        if (!valid) {
          return false;
        } else {
          const { storedDirId, storedDirName,description, taskName} = this.publishInfoForm
          this.publishBtnLoading = true
          const { id } = this.currentConfigRecord
          publishApp({
            algorithmConfigId: id,
            storedDirId,
            storedDirName,
            taskDesc: description,
            taskName: taskName,
            taskType: 0,
            // modelVersion: versionLabel,
            publishType: 1, //"发布类型: 1: 应用中心 2: 体验中心",
            appType: 2 //默认值2，枚举(0-模型任务，1-算子任务，2-runtorun)
          }).then(res => {
            if(res.code == 0) {
              this.$message.success("发布成功，请到【应用中心】->【任务管理】查看")
              this.showPublishModal = false
            }
          }).finally(() => { this.publishBtnLoading = false })
        }
      })
    },
    // 更新算法应用
    async doUpdateApp(item) {
      this.openCreateModal = true
      await this.$nextTick()
      this.$refs.refCreateApp.initState(item)
    },
    // 删除算法应用
    async doDeleteApp(data = {}) {
      // 查询该应用是否存在配置记录
      const configInfo = await getConfigList({
        algorithmId: data.sourceVersionId,
        pageNo: 1,
        limit: 100
      })
      if(configInfo.code !== 0) return
      const configList = configInfo?.data?.records || []
      const content = configList.length === 0 ? "此操作将永久删除，请确认是否删除?" : this._renderConfigList(configList)
      
      this.$confirm({
        title:  configList.length === 0 ?`确定要删除应用${data.name}吗?` : '提示',
        content,
        cancelText: '取消',
        okText: '确定',
        okButtonProps: {
          props: { disabled: configList.length !== 0 },
        },
        width: 600,
        onOk: () => {
          deleteAlgorithmApp(data.sourceVersionId).then(res => {
            if (res.code === 0) {
              this.$message.success('删除成功!')
              this.queryAppList()
            }
          })
        },
        onCancel() { }
      })
    },
    // 渲染某算法关联的配置列表
    _renderConfigList (configList) {
      const task = configList.map(item => {
        return <p>
          <span class="name">{ item.name }</span>
          <span class="algorithmName">{ item.algorithmName }</span>
          <span class="createBy">{ item.createBy }</span>
          <span class="createTime">{ moment(item.createTime).format('YYYY-MM-DD HH:mm:ss') }</span>
        </p>
      })
      return <div class="task">
        <h5>当前算法关联以下配置，请先删除下列配置再删除该算法应用：</h5>
        <div class="configList scrollbar">
          <p>
            <span class="name">配置名称</span>
            <span class="algorithmName">算法应用</span>
            <span class="createBy">创建人</span>
            <span class="createTime">创建时间</span>
          </p>
          { task }
        </div>
      </div>
    },
    // 渲染某条配置记录关联的任务列表
    _renderTaskList (taskList) {
      const task = taskList.map(item => {
        return <p>
          <span class="name">{ item.taskName }</span>
          <span class="algorithmName">{ item.taskStatusName }</span>
          <span class="createBy">{ item.createBy }</span>
          <span class="createTime">{ moment(item.createTime).format('YYYY-MM-DD HH:mm:ss') }</span>
        </p>
      })
      return <div class="task">
        <h5>当前配置关联以下任务，请先删除下列任务再删除该配置记录：</h5>
        <div class="configList scrollbar">
          <p>
            <span class="name">任务名称</span>
            <span class="algorithmName">任务状态</span>
            <span class="createBy">创建人</span>
            <span class="createTime">创建时间</span>
          </p>
          { task }
        </div>
      </div>
    },
    // 删除配置
    async doDeleteConfig(config) {
      this.tableLoading = true
      // 查询该配置存在的发布任务记录
      const taskInfo = await getApplicationcenterList({
        sourceId: config.id,
        pageNo: 1,
        limit: 1000
      }).catch(() => { this.tableLoading = false })
      this.tableLoading = false
      if(taskInfo?.code !== 0) return

      const taskList = taskInfo?.data?.records || []
      const content = taskList.length === 0 ? "此操作将永久删除，请确认是否删除?" : this._renderTaskList(taskList)
      
      this.$confirm({
        title:  taskList.length === 0 ?`确定要删除配置${config.name}吗?` : '提示',
        content,
        cancelText: '取消',
        okText: '确定',
        okButtonProps: {
          props: { disabled: taskList.length !== 0 },
        },
        width: 600,
        onOk: () => {
          deleteConfig(config.id).then(res => {
            if(res.code == 0) {
              this.$message.success("删除成功")
              // 如果是最后一条，且不是第一页
              if(this.configList?.length=== 1 && this.pagination.current> 1) {
                this.pagination.current--
              }
              this.queryConfigList()
            }
          })
        },
        onCancel() { }
      })
      
    },
    async doEdit(record = {}) {
      // await this.queryConfigById(record.id)
      this.currentConfigRecord = record
      this.openEditModal = true
    },
    doOperate(record) {
      this.$message.success("to do ...")
    },
    handleTableChange(pagination, filters, sorter) {
      this.pagination.current = pagination.current
      this.pagination.pageSize = pagination.pageSize
      this.queryConfigList()
    },
    handleSearch(event,reset=false) {
      if(reset) {
        this.$refs.refSearchForm.resetFields()
      }
      this.pagination.current = 1
      this.queryConfigList({
        name: this.searchFormData.name || '',
      })
    },
    handReload() {
      this.pagination.current = 1
      this.queryAppList()
      this.queryConfigList()
    },
    // 新建/导入算法应用
    handCreate() {
      this.openCreateModal = true
    },
    // 查询应用列表
    queryAppList(params = {}) {
      const { algorithmName='' } = params
      // const { current,pageSize } = this.pagination
      getAppList({
        pageSize: 1000,
        pageNo: 1,
        algorithmName
      }).then(res => {
        this.appList = res.data?.records || []
        
      })
    },
    // 查询配置列表
    queryConfigList(params = {}) {
      const { name='' } = params
      const { current = 1, pageSize =10 } = this.pagination
      this.tableLoading = true
      getConfigList({
        limit: pageSize,
        pageNo: current,
        name
      }).then(res => {
        this.configList = res.data?.records || []
        this.pagination.total = res.data.total
      }).finally(() => { this.tableLoading = false })
    },
    // 刷新app和配置列表
    refreshPage() {
      this.queryAppList()
      this.queryConfigList()
    }
  },
  setup(props, {} ) {
    const { configData, setConfigData, queryConfigById } = useState()
    return {
      configData,
      setConfigData,
      queryConfigById,
    }
  },
  created() {
    this.queryAppList()
    this.queryConfigList()
  }
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
.app-card-wrap {
  // max-height: 310px;
  height: 160px;
  overflow-x: auto;
  display: flex;
  justify-content: flex-start;
  flex-wrap: nowrap;
  .card {
    box-sizing: border-box;
    border: 2px solid transparent;
    flex: 0 0 260px;
    // width: 18%;
    height: 130px;
    border-radius: 6px;
    background: @baseLayoutBgColor; //daeaff
    // padding: 8px;
    margin: 10px;
    display: flex;
    flex-direction: column;
    min-width: 200px;
    cursor: pointer;
    &.hidden {
      opacity: 0;
    }
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform:scale(1.001)
    }
    .card-body {
      flex: 1;
      display: flex;
      padding: 10px;
      aside {
        width: 80px;
      }
      article{
        flex: 1;
        color: #333333;
        header{
          font-weight: bold;
          font-weight: 20px;
          margin-bottom: 10px;
        }
        p{
          width: auto;
          word-break: break-all;
          font-size: 12px;
          margin: 0;
          max-height: 40px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2; /* 设置显示的行数 */
          -webkit-box-orient: vertical;
          text-overflow: ellipsis;
          white-space: normal;
        }
      }
    }
    .footer {
      height: 35px;
      line-height: 35px;
      text-align: center;
      border-top: 1px solid #d6d6d6;
      color: #00f;
    }
  }
}
//删除确认框中配置列表的样式
.configList{
  overflow-y: auto;
  max-height: 250px;
  &>p>*{
    display: inline-block;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .name{
    width: 20%
  }
  .createTime{
    width: 30%
  }
  .createBy {
    width: 20%;
  }
  .algorithmName,.taskTag{
    width: 30%;
  }
  a {
    color: #00f;
  }
}
</style>