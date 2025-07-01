<template>
  <div class="page-content">
    <div class="toolbar space-between">
      <el-form :inline="true" :model="searchFormData" size="small" ref="refSearchForm" @submit.native.prevent @keyup.enter.native="handSearch">
        <el-form-item label="名称" prop="name">
          <el-input v-model="searchFormData.name" placeholder="请输入" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handSearch">查询</el-button>
          <el-button type="primary" plain @click="handReload">重置</el-button>
        </el-form-item>
      </el-form>
      <div style="margin-bottom: 18px;">
        <el-button type="primary" @click="createModel">新建模型</el-button>
      </div>
    </div>
    <div class="contentMain scrollbar">
      <a-table :columns="columns" :scroll="{y: 550}"
        :data-source="modelList" :rowKey="(record) => record.id"
        :pagination="pagination.total > 10 ? pagination : false" 
        :loading="tableLoading" 
        @change="handleTableChange" v-resize
        childrenColumnName="subList"
      >
        <a :class="{'action-text': true}" href="javascript:;" slot="modelName" slot-scope="text" :title="text">{{ text }}</a>
        <span slot="imageName" slot-scope="text, record" >{{ `${text}(${record.imageVersionLabel})` }}</span>
        <span slot="isPublish" slot-scope="text">
          <a-tag style="cursor: pointer;" :color="'blue'">{{ fmtTaskState(text) }}</a-tag>
        </span>
        <!-- 表格操作列 -->
        <span slot="action" slot-scope="text, record">
          <a @click="publishModel(record)"  style="margin-right: 5px" v-if="!record.subList || !record.subList.length">发布</a>
          <a @click="offlineAssessModel(record)"  style="margin-right: 5px" v-if="!record.subList || !record.subList.length">离线评估</a>
          <a-dropdown v-if="!record.subList || !record.subList.length">
            <a @click="e => e.preventDefault()">更多</a>
            <a-menu slot="overlay">
              <!-- <a-menu-item v-action:offline-list-delete ><span>删除</span></a-menu-item> -->
              <!-- <a-menu-item @click="offlineAssessModel(record)"> 离线评估</a-menu-item> -->
              <a-menu-item @click="lookRecords(record)" :disabled="record.forecastCounts <1"> 评估记录</a-menu-item>
              <a-menu-item @click="shareModel(record)">设置共享</a-menu-item>
              <a-menu-item @click="deleteModel(record)">删除模型</a-menu-item>
              <a-menu-item @click="exportModel(record)">导出</a-menu-item>
            </a-menu>
          </a-dropdown>
        </span>
      </a-table>
    </div>
    <!-- 导入模型 -->
    <create-model :visible.sync ="showCreateModelDialog" v-if="showCreateModelDialog" @refreshList="loadmodelList"></create-model>
    <!-- 模型发布 -->
    <a-modal :visible="showPublishModal" title="新建发布应用" width="720px" v-if="showPublishModal" :maskClosable="false" @ok="tryPublish" @cancel="showPublishModal = false" :confirm-loading="publishBtnLoading">
      <PublishInfo ref="publishInfo" :form.sync="publishInfoForm" />
    </a-modal>
    <!-- 离线评估 -->
    <offline-assess-modal :visible.sync ="showOfflineDialog" v-if="showOfflineDialog" :model="currentModel" @refreshList="loadmodelList"></offline-assess-modal>
    <!-- 离线评估任务记录 -->
    <look-record :visible.sync ="showOfflineRecordDialog" v-if="showOfflineRecordDialog" :model="currentModel"></look-record>
    <!-- 设置共享 -->
    <share-modal ref="refShareModal" v-if="showShareDialog" :visible.sync="showShareDialog"></share-modal>
  </div>
</template>

<script>
import createModel from './createModel.vue';
import { getModelList, releaseModel, releaseModelToAlreadyInfesvr, delModeCheckDepend, delModel, getModelTableList } from "@/api/modelManage.js"
import { modelListColumns } from "./columns.js"
import PublishInfo from "@/views/pipelineCenter/components/PublishInfo.vue";
import offlineAssessModal from "./offlineAssessModal.vue";
import { getImageManageById } from "@/api/imageManage";
import lookRecord from './lookRecord.vue';
import shareModal from "@/components/business/share/index.vue";
import { openDownloadURI } from '@/utils/util'
import moment from 'moment'
export default {
  components: {
    createModel,
    PublishInfo,
    offlineAssessModal,
    lookRecord,
    shareModal
  },
  data() {
    return {
      showCreateModelDialog: false, 
      showShareDialog: false,  //共享modal
      showOfflineDialog: false,   //离线评估modal
      showOfflineRecordDialog: false,  //离线评估任务记录modal
      publishBtnLoading: false,  //发布信息配置 modal
      tableLoading: false,
      modelList: [],
      pagination: {
        pageSize: 10,
        current: 1,
        total: 0
      },
      columns: modelListColumns,

      showPublishModal: false,  //发布modal
      publishInfoForm: {  //发布模型表单的formdata
        taskName: "",
        taskId: "",
        attachToAlreadyInfesvr: "0",
        storedDirName: "",
        description: "",
        versionDescription: "",
        storedDirId: "",
      },
      sourceParam: {},  //对某个模型操作时，模型下资源配置信息
      currentModel: {}, // 对某个模型操作时，模型data  即表格中的record对象
      searchFormData: {
        name: '',
      }
    }
  },
  methods: {
    async shareModel(record) {
      this.showShareDialog = true
      await this.$nextTick()
      await this.$refs.refShareModal.invokeModal({ data: record, type: 'model'})
      this.handReload()
    },
    // 点击发布按钮
    publishModel(record) {
      this.currentModel = record
      this.showPublishModal = true
    },
    // 查看评估记录，先查询当前模型的离线评估任务列表，然后选择某条查看详情
    lookRecords(record) {
      this.currentModel = record
      this.showOfflineRecordDialog = true
    },
    // 调发布接口
    tryPublish() {
      this.$refs.publishInfo.$refs.ruleForm.validate(async (valid) => {
        if (!valid) {
          return false;
        } else {
          const data = this.publishInfoForm
          this.publishBtnLoading = true
          const { id, modelName , versionLabel} = this.currentModel
          // return this.$message.warning("to do ...")
          if(data.attachToAlreadyInfesvr ===  '0') {
            releaseModel({
              modelId: id,
              storedDirId: data.storedDirId,
              description: data.description,
              versionDescription: data.versionDescription,
              taskName: data.taskName,
              modelName: modelName,
              modelVersion: versionLabel,
              publishType: 1, //"发布类型: 1: 应用中心 2: 体验中心",
              taskType: 0 //"任务类型(应用中心使用 (0-普通任务，1-分组任务))"
            }).then(res => {
              if(res.code == 0) {
                this.$message.success("发布成功，请到【应用中心】->【任务管理】查看")
                this.showPublishModal = false
              }
            }).finally(() => { this.publishBtnLoading = false })
          } else {
            releaseModelToAlreadyInfesvr(data.taskId,{
              modelId: id,
              modelName: modelName,
              modelVersion: versionLabel,
              versionDescription: data.versionDescription,
              publishType: 1, //"发布类型: 1: 应用中心 2: 体验中心",
              taskType: 0 //"任务类型(应用中心使用 (0-普通任务，1-分组任务))"
            }).then(res => {
              if(res.code == 0) {
                this.$message.success("发布成功，请到【应用中心】->【任务管理】查看")
                this.showPublishModal = false
              }
            }).finally(() => { this.publishBtnLoading = false })
          }
        }
      })
    },
    // 导出模型
    exportModel(record) {
      openDownloadURI(`/api/v1/traincenter/modelManageInfo/download?id=${record.id}`)
    },
    // 删除选中模型
    async deleteModel(record) {
      let taskList = []
      this.tableLoading = true
      const res = await delModeCheckDepend(record.id).catch(() => { this.tableLoading = false })
      this.tableLoading = false
      if (res?.code === 0) {
        taskList = res.data || []
      }else {
        return
      }
      const content = taskList.length === 0 ? "此操作将永久删除，请确认是否删除?" : this.renderTaskList(taskList)
      this.$confirm({
        title: taskList.length === 0 ? `确定要删除 ${record.modelName} 吗?` : '提示',
        content,
        cancelText: '取消',
        okText: '确定',
        width: 600,
        okButtonProps: {
          props: { disabled: taskList.length !== 0 },
        },
        onOk: () => {
          this.tableLoading = true
          delModel(record.id).then((res) => {
            if (res.code === 0) {
              this.$message.success('删除成功!')
              if (this.modelList.length === 1 && this.pagination.total !== 1) {
                this.pagination.current--
              }
              this.loadmodelList()
            }
          }).finally(() => { this.tableLoading = false })
        },
        onCancel() { }
      })
    },
    renderTaskList(taskList) {
      const task = taskList.map(item => {
        return <p>
          <span class="taskType">{item.typeName}</span>
          <span class="taskName">{item.name}</span>
          <span class="taskTime">{moment(item.createTime).format('YYYY-MM-DD HH:mm:ss')}</span>
        </p>
      })
      return <div class="task">
        <h4>当前模型已关联以下内容，请先删除下列模型组或者任务再删除该模型：</h4>
        <div class="taskList">
          <p>
            <span class="taskType">类型</span>
            <span class="taskName">任务名称</span>
            <span class="taskTime">发布时间</span>
          </p>
          {task}
        </div>
      </div>
    },
    // 离线评估模型
    offlineAssessModel(record) {
      const loading = this.$GLoading("配置信息获取中...")
      // const { computEngineType,coreSize, memorySize, gpuSize, videoMemorySize, gpuMaxSize=100 } = record
      this.currentModel = record
      // 根据模型里的算法id，查询算法对应的超参信息
      getImageManageById(record.imageId).then(res => {
        if(res.code == 0) {
          this.currentModel.algorithmParam = res.data?.algorithmParam || ""
          // 算法的tagType,据此为查询条件来加载数据集列表
          this.currentModel.algorithmTagType = res.data?.tagType
          this.showOfflineDialog = true
        }
      }).finally(()=>{
        loading.close()
      })
      
    },
    handleTableChange(pagination, filters, sorter) {
      this.pagination.current = pagination.current;
      this.pagination.pageSize = pagination.pageSize;
      this.loadmodelList()
    },
    loadmodelList() {
      const { pageSize, current } = this.pagination
      this.tableLoading = true
      getModelTableList({
        modelName: this.searchFormData.name || '',
        pageNo: current,
        limit: pageSize,
        addType: 1
      }).then(res => {
        this.modelList = res?.data?.records || [];
        this.pagination.total = res?.data?.total;
        this.modelList.forEach(model => { //接口返回的subList为空数组时，table组件会渲染展开的+符号，这样可去除
          if(model.subList && model.subList.length < 1) {
            delete model.subList
          }
        })
      }).finally(() => { this.tableLoading = false })
    },
    createModel() {
      this.showCreateModelDialog = true
    },
    handReload() {
      this.$refs.refSearchForm.resetFields()
      this.pagination.current = 1
      this.loadmodelList()
    },
    handSearch() {
      this.pagination.current = 1
      this.loadmodelList()
    },
    fmtTaskState(text) {
      switch (text) {
        case -4:
          return '等待配置';
          break;
        case -3:
          return '算法选择';
          break;
        case -2:
          return '数据选择';
          break;
        case -1:
          return '训练参数配置';
          break;
        case 0:
          return '模型训练';
          break;
        case 1:
          return '未发布';
          break;
        case 2:
          return '已发布';
          break;
        case 3:
          return '等待训练';
          break;
      }
    },
  },
  created() {
    this.loadmodelList()
  }
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
/deep/ .ant-table-row-level-1 {
  background-color: @tableBGC1;
}
.page-content {
  display: flex;
  flex-direction: column;
  .contentMain {
    flex: 1;
    overflow: auto;
  }
}
// 删除模型确认框中模型绑定的任务列表样式
.taskList {
  overflow-y: auto;
  max-height: 250px;
  .taskType,.taskName,.taskTime{
    display: inline-block;
    width: 33%
  }
}
</style>