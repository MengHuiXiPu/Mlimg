<template>
  <div class="content-box">
    <!-- <div class="table-header">
      <a-button
        v-show="selectedKeys.length >= 1"
        type="primary mr-8"
        class="btn-style"
        @click="batchSharing()"
      >
        {{ checkAllSelectedItemsShared ? "取消共享" : "设置共享" }}
      </a-button>
      <a-button
        v-show="selectedKeys.length >= 1"
        type="primary"
        class="btn-style"
        @click="batchDelete()"
      >
        删除
      </a-button>
    </div> -->
    <!-- 用于还原支持选择逻辑配置
    :row-selection="{
        selectedRowKeys: selectedKeys,
        onChange: onSelectChange,
      }" -->
    <a-table :columns="columns" :data-source="operatorList" :pagination="pagination" @change="handleTableChange"
      :loading="loading" :rowKey="(record) => record.id" ref="shareTable">
      <template slot="name" slot-scope="text, record">
        <div class="flex vertical-center">
          <!-- <el-tooltip effect="light" :content="record.listDisplayName" placement="top"> -->
          <span class="name-ellipsis common-link" @click="routeToDetail(record)" :title="record.listDisplayName || record.name">
          {{ record.listDisplayName || record.name}} </span>
          <!-- </el-tooltip> -->
        </div>
      </template>
      <!-- 自定义 状态列 表头 -->
      <span slot="customStatusHeader"> 状态
        <a-popover placement="topLeft" trigger="hover">
          <template slot="content">
            <p class="p-bottom-05em">正常：算子正常可被使用</p>
            <p style="margin-bottom: 0;">异常：算子创建异常，无法被使用</p>
            <!-- <p class ="p-bottom-05em">创建中：算子正在创建中</p> -->
          </template>
          <a-icon type="question-circle" class="table-question-icon" />
        </a-popover>
      </span>
      <template slot="status" slot-scope="text, record">
        <span>{{ statusMap[record.status] }}</span>
        <!-- 异常标识及原因 -->
        <a-popover overlayClassName="modelSchedule" placement="left" v-if="record.status == 2">
          <template slot="content">
            <a-alert message="异常算子" :description="record.errMsg" type="error" show-icon />
          </template>
          <svg-icon type="danger" style="font-size: 18px;margin-left: 5px;cursor: pointer;"></svg-icon>
        </a-popover>
      </template>
      <!-- <template slot="remark" slot-scope="text, record">
        <el-tooltip effect="dark" :content="record.remark || '--'" placement="top-start">
          <span>{{ record.remark || "--" }} </span>
        </el-tooltip>
      </template> -->
      <!-- <span slot="updateTime" slot-scope="text">  {{ text | moment }}</span> -->
      <template slot="action" slot-scope="text, record">
        <div style="display: flex; align-items: center">
          <a type="link" :class="{ 'aButton-style': true, 'mr-8': true, }" @click="updateOperator(record)"
            :disabled="record.status != 2">重新上传</a>
          <a-popconfirm placement="top" ok-text="Yes" cancel-text="No" @confirm="setSharing(record)">
            <template slot="title">
              <div> {{ `确定${record.isPublic ? "取消" : "设置为"}共享状态么？` }}</div>
            </template>
            <a type="link" :class="{ 'aButton-style': true, 'mr-8': true, }">{{ record.isPublic ? "取消共享" : "设置共享" }}</a>
          </a-popconfirm>
          <a-popconfirm placement="top" ok-text="Yes" cancel-text="No" @confirm="deleteItem(record.id)">
            <template slot="title">
              <div>确定要删除此条记录么？</div>
            </template>
            <a type="link" :class="{ 'aButton-style': true, 'mr-8': true, }" :disabled="record.isDeletable == 0">删除</a>
          </a-popconfirm>
          <a v-if="record.frontendSetting && record.frontendSetting.supportRemote" type="link" :class="{
            'aButton-style': true,
            'mr-8': true,
          }" @click="publishOperator(record)">发布</a>
        </div>
      </template>
    </a-table>
    <a-modal :visible="showPublishOperator" title="发布算子" width="720px" v-if="showPublishOperator" @ok="tryPublish"
      @cancel="showPublishOperator = false" :confirm-loading="publishBtnLoading">
      <PublishInfo ref="publishInfo" :form.sync="publishInfoForm" />
    </a-modal>
    <create-operator :isShow.sync="isShow" v-if="isShow" ref="refCreateOperator"
      @reloadData="reloadData"></create-operator>
  </div>
</template>

<script>
import Operator from "@/api/operator";
import PublishInfo from "@/views/pipelineCenter/components/PublishInfo.vue";
import createOperator from "@pipeline/operatorManage/createOperator.vue";
import moment from 'moment';
const statusMap = ["创建中", "正常", "异常"];   //与数据库状态编码 0 1 2对应
export default {
  components: {
    PublishInfo,
    createOperator,
  },
  name: "Sharing",
  props: {
    sortable: {
      type: Object,
      default: function () {
        return { prop: "", order: "" };
      },
    },
  },
  data() {
    return {
      statusMap,
      loading: false,
      isShow: false,
      showPublishOperator: false,
      publishBtnLoading: false,
      currentOperator: {}, // 当前要发布的算子
      publishInfoForm: {  //发布模型表单的formdata
        taskName: "",
        storedDirName: "",
        description: "",
        storedDirId: "",

      },
      columns: [
        {
          title: "算子ID",
          dataIndex: "id",
          key: "id",
          width: '100px'
        }, {
          title: "算子名称",
          width: "15%",
          key: "name",
          scopedSlots: { customRender: "name" },
          ellipsis: true,
        },
        {
          title: "类型",
          dataIndex: "typeName",
          key: "typeName",
        }, {
          title: "算子描述",
          dataIndex: "remark",
          key: "remark",
          // scopedSlots: { customRender: "remark" },
          ellipsis: true,
          customRender: (text, data) => {
            return text || "--";
          }
        },
        {
          title: "创建用户",
          dataIndex: "createBy",
          key: "createBy",
        },
        {
          // title: "状态",
          dataIndex: "status",
          key: "status",
          slots: { title: 'customStatusHeader' },
          scopedSlots: { customRender: "status" },
        }, {
          title: "创建时间",
          dataIndex: "createTime",
          key: "createTime",
          customRender: function (text) {
            return moment(text).format("YYYY-MM-DD HH:mm:ss");
          },
          ellipsis: true,
        },
        // {
        //   title: "更新时间",
        //   dataIndex: "updateTime",
        //   key: "updateTime",
        //   scopedSlots: { customRender: "updateTime" },
        // },
        {
          title: "操作",
          dataIndex: "action",
          key: "action",
          width: "240px",
          scopedSlots: { customRender: "action" },
        },
      ],
      operatorList: [],
      rowContextData: null, //每一项数据
      selectedKeys: [],
      selectedItems: [],
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: [10, 20, 30, 40, 50],
      },
    };
  },
  computed: {
    checkAllSelectedItemsShared() {
      return (
        this.selectedKeys.length >= 1 &&
        this.selectedItems.every((item) => item.isPublic)
      );
    },
  },
  methods: {
    /**
     * @public
     * @description 新建算子
     */
    createOperator() {
      this.isShow = true;
      this.$nextTick(() => {
        // 重置表单数据
        this.$refs.refCreateOperator.initState()
      })
    },
    updateOperator(record) {
      this.isShow = true;
      this.$nextTick(() => {
        // 添加表单数据
        this.$refs.refCreateOperator.initState(record)
      })
    },
    deleteItem(id) {
      Operator.deleteOperator(id).then((res) => {
        if (res.code == 0) {
          this.$message.success("删除成功");
          // 刷新列表
          this.getOperatorData();
        }
      })
    },
    handleTableChange(pagination, filters, sorter) {
      // 处理分页变化的逻辑
      this.pagination.current = pagination.current;
      // 这里可以调用后端接口获取新的数据
      this.getOperatorData();
    },
    /**
     * @public
     * @param {*} param0 
     */
    onSearch({ name, status }) {
      this.pagination.current = 1;
      this.getOperatorData({
        name,
        status,
      });
    },
    // 设置共享
    setSharing(record) {
      console.log(record);
      Operator.setPipelineSharing({
        ids: [record.id],
        isPublic: record.isPublic ? 0 : 1,
      }).then(() => {
        this.$message.success("设置成功");
        this.getOperatorData();
      });
    },
    onSelectChange(selectedRowKeys, selectedRows) {
      this.selectedKeys = selectedRowKeys;
      this.selectedItems = selectedRows;
    },
    batchSharing() {
      Operator.setPipelineSharing({
        ids: this.selectedKeys,
        isPublic: this.checkAllSelectedItemsShared ? 0 : 1,
      }).then(() => {
        this.$message.success("设置成功");
        this.selectedKeys = [];
        this.selectedItems = [];
        this.getOperatorData();
      });
    },
    batchDelete() {
      this.selectedKeys.forEach((item) => {
        this.deleteItem(item);
      });
    },
    getOperatorData(params = {}) {
      this.loading = true;
      Operator.getOperatorList({
        pageNo: this.pagination.current,
        limit: this.pagination.pageSize,
        name: params.name || '',
        status: params.status,
        operatorType: 0, // 类型为 算子类型
      }).then((res) => {
        this.loading = false;
        this.operatorList = res.data?.records || [];
        this.pagination.total = res.data.total;
      })
        .finally(() => {
          this.loading = false;
        });
    },
    reloadData() {
      this.pagination.current = 1
      this.getOperatorData()
    },
    publishOperator(record) {
      this.currentOperator = record;
      this.showPublishOperator = true;
    },
    tryPublish() {
      this.$refs.publishInfo.$refs.ruleForm.validate(async (valid) => {
        if (!valid) {
          return false;
        } else {
          const data = this.publishInfoForm
          this.publishBtnLoading = true
          const { id, modelName, versionLabel } = this.currentOperator
          // return this.$message.warning("to do ...")
          Operator.publishOperator(id, {
            storedDirName: data.storedDirName,
            storedDirId: data.storedDirId,
            description: data.description,
            taskName: data.taskName,
            modelName: modelName,
            modelVersion: versionLabel,
            publishType: 1, //"发布类型: 1: 应用中心 2: 体验中心",
            taskType: 0 //"任务类型(应用中心使用 (0-普通任务，1-分组任务))"
          }).then(res => {
            if (res.code == 0) {
              this.$message.success("发布成功，请到【应用中心】->【任务管理】查看")
              this.showPublishOperator = false
            }
          }).finally(() => { this.publishBtnLoading = false })
        }
      })
    },
    routeToDetail(record) {
      const name = record.listDisplayName || record.name
      // 因为这里后端没有提供查询算子详情内容的接口，产品又要求能同时打开多个详情页面，这里使用sessionStorage来存储所有打开的算子详情记录，通过id来区分
      if (sessionStorage.getItem("operatorDetailMap")) {
        const map = JSON.parse(sessionStorage.getItem("operatorDetailMap"))
        map[record.id + name] = record
        sessionStorage.setItem("operatorDetailMap", JSON.stringify(map))
      } else {
        const map = {}
        map[record.id + name] = record
        sessionStorage.setItem("operatorDetailMap", JSON.stringify(map))
      }
      this.$router.push({
        // name: "OperatorDetail",
        path: `/pipelineCenter/operatorManage/opDetail/${record.id}`,
        query: {
          name,
        }
      })
    }
  },
  // 销毁时候清除sessionStorage
  // beforeDestroy() {
  //   sessionStorage.removeItem("operatorDetailMap")
  // },
  async mounted() {
    this.getOperatorData();
  },
};
</script>

<style lang="scss" scoped>
.content-box {
  position: relative;

  .table-header {
    position: absolute;
    top: -56px;
    right: 0;
  }
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
</style>
