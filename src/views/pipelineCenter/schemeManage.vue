<template>
  <div class="content-box">
    <div class="toolbar space-between">
      <el-form :inline="true" :model="searchFormData" size="small" ref="searchForm" @keyup.enter.native="handleSearch">
        <el-form-item label="名称" prop="name">
          <el-input v-model="searchFormData.name" placeholder="请输入" clearable></el-input>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="searchFormData.status" placeholder="请选择" clearable>
            <el-option v-for="(item, index) in statusTextList" :label="item" :value="index" :key="index"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button type="primary" plain @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
      <div style="margin-bottom: 18px;">
        <el-button type="primary" @click="showImportSchemeDialog = true">导入方案</el-button>
        <el-button type="primary" @click="copyOrCreateScheme(false)">新建方案</el-button>
      </div>
    </div>
    <a-table :columns="columns" :data-source="schemeList" :pagination="pagination" @change="handleTableChange"
      :loading="loading" :rowKey="(record) => record.id" ref="shareTable">
      <template slot="name" slot-scope="text, record">
        <el-tooltip effect="dark" :content="record.name" placement="top">
          <a type="link" @click="goViewer(record)" :disabled="record.pipelineType == 1">{{ record.name
            }}</a>
        </el-tooltip>
      </template>
      <template slot="status" slot-scope="text, record">
        <!-- 发布失败时显示错误信息 -->
        <a-popover overlayClassName="modelSchedule" placement="left" v-if="record.status == 3">
          <template slot="content">
            <a-alert message="发布异常" :description="record.errMsg" type="error" show-icon />
          </template>
          <span><a-badge :status="badgeStatus[record.status]" />{{ statusTextList[record.status] }}</span>
        </a-popover>
        <span v-else><a-badge :status="badgeStatus[record.status]" />{{ statusTextList[record.status] }}</span>
      </template>
      <template slot="remark" slot-scope="text, record">
        <!-- <el-tooltip effect="dark" :content="record.name" placement="top"> -->
        <span class="name-ellipsis" :title="text"> {{ record.remark || "--" }}</span>
        <!-- </el-tooltip> -->
      </template>
      <template slot="action" slot-scope="text, record">
        <div style="display: flex; align-items: center">
          <!-- pipelineType: 0 普通方案  1: 算法方案 -->
          <!-- <a  type="link" :class="{'aButton-style': true,  'mr-8': true,}" @click="openFormModal(record.id)"  v-if="record.pipelineType != 1">表单设计</a> -->
          <!-- 按钮名称由配置改为新建测试 -->
          <!-- <a type="link" :class="{ 'aButton-style': true, 'mr-8': true, }" @click="openConfigModal(record)"
            :disabled="record.pipelineType == 0">配置</a> -->
          <!-- <a type="link" :class="{'aButton-style': true,'mr-8': true, }" @click="openConfigListModal(record)" v-if="record.pipelineType == 1">配置记录</a> -->
          <!-- <a type="link" :class="{'aButton-style': true,'mr-8': true, }" @click="runScheme(record)" v-if="record.pipelineType == 1" :disabled="!record.pipelineInferTaskConfigId">运行</a> -->
          <a type="link" class="aButton-style mr-8" disabled>保存为算子组</a>
          <a type="link" class="aButton-style mr-8" @click="goEditor(record)"
            :disabled="record.pipelineType == 1">编辑</a>
          <!-- <a type="link" :class="{'aButton-style': true,  'mr-8': true,}" @click="exportScheme(record)"  v-if="record.pipelineType == 1">导出</a> -->
          <a-popconfirm placement="top" ok-text="Yes" cancel-text="No" @confirm="deleteItem(record.id)">
            <template slot="title">
              <div>确定要删除此条记录么？</div>
            </template>
            <a type="link" class="aButton-style mr-8" :disabled="record.isDeletable == 0">删除</a>
          </a-popconfirm>
          <a-dropdown>
            <a @click="e => e.preventDefault()">更多</a>
            <a-menu slot="overlay">
              <a-menu-item @click="openFormModal(record.id)" :disabled="record.pipelineType == 1"> 表单设计</a-menu-item>
              <a-menu-item @click="openConfigModal(record)" :disabled="record.pipelineType == 0">配置</a-menu-item>
              <a-menu-item @click="openConfigListModal(record)" :disabled="record.pipelineType == 0">配置记录</a-menu-item>
              <a-menu-item @click="runScheme(record)" :disabled="record.pipelineType == 0">运行</a-menu-item>
              <a-menu-item @click="openPublishModal(record.id, record.name)">发布</a-menu-item>
              <!-- <a-menu-item @click="exportScheme(record)">导出</a-menu-item> -->
              <a-menu-item @click="copyOrCreateScheme(true, record)"
                :disabled="record.pipelineType == 1">复制</a-menu-item>
              <!-- <a-menu-item @click="openPipelineModal(record.id)" :disabled="record.pipelineType == 1">老编辑器</a-menu-item> -->
              <!-- <a-menu-item @click="goEditor(record)" :disabled="record.pipelineType == 1">编辑</a-menu-item> -->
            </a-menu>
          </a-dropdown>
        </div>
      </template>
    </a-table>
    <a-modal :title="isShowForCopy ? '方案复制' : '新建解决方案'" :visible="isShow" :closable="false" :maskClosable="false"
      :keyboard="false" :destroyOnClose="true" :confirmLoading="addLoading" @ok="handleOk" @cancel="handleCancel">
      <a-form-model ref="schemeForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" layout="horizontal"
        :model="rowData" :rules="rules">
        <a-form-model-item label="方案名称" prop="name">
          <a-input v-model="rowData.name" />
        </a-form-model-item>
        <a-form-model-item label="描述" prop="remark">
          <a-textarea v-model="rowData.remark" :auto-size="{ minRows: 2, maxRows: 4 }" />
        </a-form-model-item>
      </a-form-model>
    </a-modal>
    <PipelineModal :is-show.sync="dialogPipelineVisible" :pipelineId="pipelineId" />
    <FormGenerate :is-show.sync="dialogFormVisible" :pipelineId="formId" />

    <AddPublishDialog :is-show.sync="isPublishShow" :pipeline-template-id="pipelineId"
      :pipeline-template-name="pipelineName" />
    <!-- 导入方案modal -->
    <import-scheme :visible.sync="showImportSchemeDialog" v-if="showImportSchemeDialog"
      @refreshList="getSchemeData"></import-scheme>
    <!-- 方案配置 -->
    <scheme-config :visible.sync="showConfigModal" v-if="showConfigModal" ref="schemeConfig"
      @refreshList="getSchemeData"></scheme-config>
    <!-- 方案配置列表 -->
    <scheme-config-list :visible.sync="showConfigListModal" v-if="showConfigListModal"
      ref="schemeConfigList"></scheme-config-list>
  </div>
</template>

<script>
import Operator from "@/api/operator";
import PipelineModal from "./components/pipelineModal.vue";
import FormGenerate from "./components/formGenerate";
import AddPublishDialog from "./components/AddPublishDialog";
import tool from "./tool.js";
import { downloadFile } from "@/utils/utils";
import importScheme from "./components/importScheme.vue";
import schemeConfig from "./components/schemeConfig.vue";
import schemeConfigList from "./components/schemeConfigListInfo.vue";
import moment from 'moment';
// 状态，0-未发布，1-发布中，2-已发布，3-发布失败
const statusTextList = ["未发布", "发布中", "已发布", "发布失败"];
const badgeStatus = ["default", "processing", "success", "error"];

export default {
  components: {
    PipelineModal,
    FormGenerate,
    AddPublishDialog,
    importScheme,
    schemeConfig,
    schemeConfigList,
  },
  name: "schemeManage",
  props: {
    sortable: {
      type: Object,
      default: function () {
        return { prop: "", order: "" };
      },
    },
  },
  mixins: [tool],

  data() {
    const checkName = async (rule, value, callback) => {
      if (!value || !value.trim()) {
        return callback(new Error("当前值不能为空"));
      } else if (!/^[a-zA-Z0-9-_\u4e00-\u9fa5.]+$/.test(value)) {
        return callback(new Error("只能输入字母、数字、汉字、下划线、.和中杠"));
      }
    };
    return {
      isShow: false, // 新增方案弹窗
      showImportSchemeDialog: false,
      dialogPipelineVisible: false, // pipeline的弹窗
      dialogFormVisible: false, // 配置vForm的弹窗
      showConfigModal: false,
      showConfigListModal: false,
      columns: [
        {
          title: "名称",
          dataIndex: "name",
          key: "name",
          scopedSlots: { customRender: "name" },
          ellipsis: true,
        }, {
          title: "方案描述",
          dataIndex: "remark",
          key: "remark",
          scopedSlots: { customRender: "remark" },
          ellipsis: true,
        }, {
          title: "方案状态",
          dataIndex: "status",
          key: "status",
          scopedSlots: { customRender: "status" },
        },
        {
          title: "创建用户",
          dataIndex: "createBy",
          key: "createBy",
        }, {
          title: "创建时间",
          dataIndex: "createTime",
          key: "createTime",
          ellipsis: true,
          customRender: function (text) {
            return moment(text).format("YYYY-MM-DD HH:mm:ss");
          },
        }, {
          title: "更新时间",
          dataIndex: "updateTime",
          key: "updateTime",
          ellipsis: true,
          customRender: function (text) {
            return moment(text).format("YYYY-MM-DD HH:mm:ss");
          },
        },

        {
          title: "操作",
          dataIndex: "action",
          key: "action",
          width: "230px",
          scopedSlots: { customRender: "action" },
        },
      ],
      schemeList: [],
      pathList: [],
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: [10, 20, 30, 40, 50],
      },
      loading: false,
      addLoading: false,
      rowData: {
        name: "",
        remark: "",
      },
      rules: {
        name: [
          {
            required: true,
            message: "Please input scheme name",
            trigger: ["blur", "change"],
          },
          {
            validator: checkName,
            trigger: ["blur", "change"],
          },
        ],
        remark: [],
      },
      pipelineId: null,
      formId: null,
      isPublishShow: false,
      pipelineName: "",
      isShowForCopy: false,  //因为复制与新建共用的弹窗，所以需要区分
      currentRecord: {},
      searchFormData: {
        name: "",
        status: "",
      },
      statusTextList,
      badgeStatus,

    };
  },
  methods: {
    // 运行算法方案
    runScheme(record) {
      // this.$message.warning('to do ...')
      const loading = this.$GLoading('方案执行中...')
      Operator.schemeRunConfig(record.id).then(res => {
        if (res.code == 0) {
          this.$message.success("运行成功")
        }
      }).finally(() => { loading.close() })
    },
    // 复制算法方案
    copyOrCreateScheme(isShowForCopy, record) {
      this.isShowForCopy = isShowForCopy
      this.currentRecord = record || {}
      this.isShow = true
    },
    // 配置算法方案的参数
    openConfigModal(record) {
      this.showConfigModal = true
      this.$nextTick(() => {
        this.$refs.schemeConfig.init(record)
      })
    },
    // 查看配置列表
    openConfigListModal(record) {
      this.showConfigListModal = true;
      this.$nextTick(() => {
        this.$refs.schemeConfigList.getConfigListData(record);
      })
    },
    openPublishModal(id, name) {
      this.pipelineId = id;
      this.pipelineName = name;
      this.isPublishShow = true;
    },
    goEditor(record) {
      // this.$router.push({
      //   path: `/pipelineCenter/editor/${record.id}`,
      //   query: { type: "scheme", id: record.id, name: record.name }
      // })
      this.$router.push({
        path: `/pipelineCenter/editor`,
        query: { type: "scheme", id: record.id }
      })
    },
    goViewer(record) {
      this.$router.push({
        path: `/pipelineCenter/viewer/${record.id}`,
        query: { type: "scheme", name: record.name }
      })
    },
    openPipelineModal(id) {
      this.pipelineId = id;
      this.dialogPipelineVisible = true;
      console.log(this.pipelineId);
    },
    openFormModal(id) {
      this.formId = id;
      this.dialogFormVisible = true;
    },
    handleOk() {
      this.$refs["schemeForm"].validate(async (valid) => {
        if (valid) {
          try {
            const data = Object.assign({}, this.rowData);
            if (this.isShowForCopy) {
              data.id = this.currentRecord.id
            }
            this.addLoading = true;
            const method = this.isShowForCopy ? Operator.copyPipelineTemplate : Operator.createPipelineTemplate
            const res = await method(data)
            this.addLoading = false;
            if (res.code != 0) {
              this.$message.warning(res.msg);
            } else {
              this.handleCancel();
              this.getSchemeData();
              if (!this.isShowForCopy && res.data?.id) {  //新建时 直接打开新建方案的算子流程}
                this.goEditor(res.data)
              }
            }
          } catch (e) {
            console.error(e)
            this.addLoading = false
          }
        }
      });
    },
    handleCancel() {
      this.$refs["schemeForm"].resetFields();
      this.isShow = false;
    },
    deleteItem(id) {
      Operator.deletePipelineTemplate(id).then((res) => {
        if (res.code != 0) return
        // 删除之后的页码数
        const totalPage = Math.ceil((this.pagination.total - 1) / this.pagination.pageSize);
        this.pagination.current = totalPage < this.pagination.current ? totalPage : this.pagination.current;
        this.pagination.current = this.pagination.current < 1 ? 1 : this.pagination.current;
        this.$message.success("删除成功");
        // 刷新列表
        this.getSchemeData();
      });
    },
    handleTableChange(pagination, filters, sorter) {
      // 处理分页变化的逻辑
      this.pagination.current = pagination.current;
      // 这里可以调用后端接口获取新的数据
      this.getSchemeData();
    },
    handleSearch() {
      this.pagination.current = 1;
      this.getSchemeData(this.searchFormData);
    },
    getSchemeData(params = {}) {
      const { name = "", status = "" } = params
      this.loading = true;
      Operator.getPipelineTemplateList({
        pageNo: this.pagination.current,
        limit: this.pagination.pageSize,
        name: name,
        status,
      })
        .then((res) => {
          this.loading = false;
          this.schemeList = res.data.records;
          this.pagination.total = res.data.total;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    // 算法方案导出
    exportScheme(record) {
      // ?Authorization=${getToken()}
      if (record.pipelineType == 0) {  //普通方案
        const loading = this.$GLoading('资源准备中...')
        Operator.schemePipeLineExport(record.id).then(res => {
          let url = window.URL.createObjectURL(res);
          let link = document.createElement("a");
          link.style.display = "none";
          link.href = url;
          link.setAttribute("download", `${record.name}.zip`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link); // 下载完成移除元素
          window.URL.revokeObjectURL(url); // 释放掉blob对象
        }).catch(err => {
          this.$message.error(err.response?.statusText)
        }).finally(() => {
          loading.close()
        })
      } else { //上传的算法方案
        window.open(`${location.origin}/api/v1/pipelinecenter/pipelineTemplateInfo/exportAlgo/${record.id}`)
      }
    },
    resetForm() {
      this.$refs.searchForm.resetFields();
      this.handleSearch()
    },
  },
  created() {
  },
  mounted() {
    this.getSchemeData();
  },
};
</script>

<style lang="scss" scoped>
.content-box {
  position: relative;
}

::v-deep .ant-pagination-item-active a {
  color: #1890ff;
  background-color: #fff;
}

.flex {
  display: flex;
}

.vertical-center {
  align-items: center;
}

.name-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
  /* 根据需要设置最大宽度 */
  cursor: pointer;
}

a.aButton-style {
  //color: #1890ff !important;
  font-size: 14px;

  &.disabled-link {
    color: rgba(0, 0, 0, 0.25) !important;
    /* 改变颜色表示禁用状态 */
    text-decoration: none;
    /* 移除下划线 */
    cursor: not-allowed;
    /* 禁用点击事件 */
  }
}

.btn-style {
  border-radius: 8px;
  padding: 0 24px;
  height: 42px;
}

.mr-8 {
  margin-right: 8px;
}

/* 在你的样式表中添加这些样式来让对话框全屏显示 */
.ant-dialog-body {
  height: calc(100vh - 48px);
  /* 减去标题栏的高度 */
  padding: 0 !important;
  /* 可以去除内边距 */
}
</style>