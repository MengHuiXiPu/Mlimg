<template>
  <div class="content-box">
    <!-- <div class="table-header">
      <a-button v-show="selectedKeys.length >= 1" type="primary mr-8" class="btn-style" @click="batchSharing()">
        {{ checkAllSelectedItemsShared ? "取消共享" : "设置共享" }}
      </a-button>
      <a-button v-show="selectedKeys.length >= 1" type="primary" class="btn-style" @click="batchDelete()">
        删除
      </a-button>
    </div> -->
    <div class="toolbar space-between">
      <el-form :inline="true" :model="searchFormData" size="small" ref="refSearchForm">
        <el-form-item label="名称" prop="name">
          <el-input v-model="searchFormData.name" placeholder="请输入" clearable></el-input>
        </el-form-item>
        <el-form-item label="类型" prop="typeId">
          <el-select v-model="searchFormData.typeId" placeholder="请选择" clearable>
            <el-option label="全部" :value="''"></el-option>
            <!-- <el-option v-for="item in opTypeList" :key="item.id" :label="item.nodeName" :value="item.id"></el-option> -->
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button type="primary" plain @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
      <div style="margin-bottom: 18px;">
        <!-- <el-button type="primary" @click="isShow = true">新建(旧功能入口)</el-button> -->
        <!-- <el-button type="primary" >导入算子组</el-button> -->
      </div>
    </div>
    <a-table :columns="columns" :data-source="operatorGroupList" :pagination="pagination" @change="handleTableChange"
      :loading="loading" :rowKey="(record) => record.id" ref="shareTable">
      <template slot="name" slot-scope="text, record">
        <span class="name-ellipsis common-link" @click="routeToDetail(record)"
          :title="record.listDisplayName || record.name">
          {{ record.listDisplayName || record.name }}
        </span>
      </template>
      <template slot="action" slot-scope="text, record">
        <div style="display: flex; align-items: center">
          <!-- <a type="link" :class="{ 'aButton-style': true, 'mr-8': true, }"
            @click="openOperatorGroupModal(record.id)">算子流程</a>
          <a-popconfirm placement="top" ok-text="Yes" cancel-text="No" @confirm="setSharing(record)">
            <template slot="title">
              <div>{{ `确定${record.isPublic ? "取消" : "设置为"}共享状态么？` }}</div>
            </template>
            <a type="link" :class="{ 'aButton-style': true, 'mr-8': true, }">{{ record.isPublic ? "取消共享" : "设置共享" }}</a>
          </a-popconfirm> -->
          <a-popconfirm placement="top" ok-text="Yes" cancel-text="No" @confirm="deleteItem(record.id)">
            <template slot="title">
              <div>确定要删除此条记录么？</div>
            </template>
            <a type="link" :class="{ 'aButton-style': true, 'mr-8': true, }" :disabled="record.isDeletable == 0">删除</a>
          </a-popconfirm>
        </div>
      </template>
    </a-table>
    <a-modal title="新建算子组" :visible="isShow" :closable="false" :maskClosable="false" :keyboard="false"
      :destroyOnClose="true" @ok="handleOk" @cancel="handleCancel">
      <a-spin :spinning="addLoading">
        <a-form-model ref="operatorGroupForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" layout="horizontal"
          :model="rowData" :rules="rules">
          <a-form-model-item label="算子组名称" prop="name">
            <a-input v-model="rowData.name" />
          </a-form-model-item>
          <a-form-model-item label="类型" prop="category">
            <a-input v-model="rowData.category" />
          </a-form-model-item>
          <a-form-model-item label="描述" prop="remark">
            <a-textarea v-model="rowData.remark" :auto-size="{ minRows: 2, maxRows: 4 }" />
          </a-form-model-item>
        </a-form-model>
      </a-spin>
    </a-modal>
  </div>
</template>

<script>
import Operator from "@/api/operator";
import tool from "../tool.js";
import moment from 'moment';

export default {
  name: "OperatorGroupTable",
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
    const checkCategory = async (rule, value, callback) => {
      if (!value || !value.trim()) {
        return callback(new Error("当前值不能为空"));
      } else if (!/^[a-zA-Z0-9-_.]+$/.test(value)) {
        return callback(new Error("只能输入字母、数字、下划线、.和中杠"));
      }
    };
    return {
      isShow: false, // 新增方案弹窗
      dialogOperatorGroupVisible: false, // 算子组的弹窗
      columns: [{
        title: "算子组ID",
        dataIndex: "id",
        key: "id",
        width: '100px'
      }, {
        title: "算子组名称",
        dataIndex: "listDisplayName",
        key: "listDisplayName",
        scopedSlots: { customRender: "name" },
        ellipsis: true,
      },
      {
        title: "类型",
        dataIndex: "typeName",
        key: "typeName",
      }, {
        title: "算子组描述",
        dataIndex: "remark",
        key: "remark",
        // scopedSlots: { customRender: "remark" },
        ellipsis: true,
        customRender: (text, data) => {
          return text || "--";
        }
      }, {
        title: "创建用户",
        dataIndex: "createBy",
        key: "createBy",
      }, {
        title: "创建时间",
        dataIndex: "createTime",
        key: "createTime",
        customRender: (text) => {
          return moment(text).format("YYYY-MM-DD HH:mm:ss");
        },
        width: "180px",
      },
      // {
      //   title: "更新时间",
      //   dataIndex: "updateTime",
      //   key: "updateTime",
      //   scopedSlots: { customRender: "updateTime" },
      //   width: "180px",
      // },
      {
        title: "操作",
        dataIndex: "action",
        key: "action",
        width: "130px",
        scopedSlots: { customRender: "action" },
      },
      ],
      operatorGroupList: [],
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
        category: "autor_grp", // 默认值
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
        category: [
          {
            required: true,
            message: "Please input category",
            trigger: ["blur", "change"],
          },
          {
            validator: checkCategory,
            trigger: ["blur", "change"],
          },
        ],
        remark: [],
      },
      formId: null,
      isPublishShow: false,
      pipelineName: "",
      rowContextData: null, //每一项数据
      selectedKeys: [],
      selectedItems: [],
      searchFormData: {
        name: "",
        typeId: "",
      }
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
     */
    createGroup(id) {
      this.$router.push({
        path: `/pipelineCenter/editor/${id}`,
        query: { type: "group", id: id, name: '新建算子组' }
      })
    },
    handleOk() {
      this.addLoading = true;
      this.$refs["operatorGroupForm"].validate((valid) => {
        if (valid) {
          const data = Object.assign({}, this.rowData);
          // data.category = "autor_group"; // 指定为算子组类型
          // 新建算子组
          Operator.createOperatorGroupTemplate(data)
            .then((res) => {
              if (res.code == 0) {
                this.addLoading = false;
                this.handleCancel();
                this.getOperatorGroupData();
                // 直接打开新建算子的算子流程页面
                // this.$message.success("新建成功")
                if (res.data?.id) {
                  this.createGroup(res.data?.id)
                }
              }
            })
            .finally(() => {
              this.addLoading = false;
            });
        }
      });
    },
    // 设置共享
    setSharing(record) {
      console.log(record);
      Operator.setPipelineGroupSharing({
        ids: [record.id],
        isPublic: record.isPublic ? 0 : 1,
      }).then(() => {
        this.$message.success("设置成功");
        this.getOperatorGroupData();
      });
    },
    batchSharing() {
      Operator.setPipelineGroupSharing({
        ids: this.selectedKeys,
        isPublic: this.checkAllSelectedItemsShared ? 0 : 1,
      }).then(() => {
        this.$message.success("设置成功");
        this.selectedKeys = [];
        this.selectedItems = [];
        this.getOperatorGroupData();
      });
    },
    handleCancel() {
      this.$refs["operatorGroupForm"].resetFields();
      this.isShow = false;
    },
    // 删除列表项
    deleteItem(id) {
      // 删除接口
      // 1.需要修改-------------------------------------------------
      Operator.deleteOperatorGroupTemplate(id)
        .then((res) => {
          if (res.code != 0) return
          // 删除之后的页码数
          const totalPage = Math.ceil((this.pagination.total - 1) / this.pagination.pageSize);
          this.pagination.current = totalPage < this.pagination.current ? totalPage : this.pagination.current;
          this.pagination.current = this.pagination.current < 1 ? 1 : this.pagination.current;
          this.$message.success("删除成功");
          // 刷新列表
          this.getOperatorGroupData();
        })
        .catch((err) => {
          if (err) this.$message.warning("删除失败");
        });
    },
    // 多选变化
    onSelectChange(selectedRowKeys, selectedRows) {
      this.selectedKeys = selectedRowKeys;
      this.selectedItems = selectedRows;
    },
    // 多选删除
    batchDelete() {
      console.log(this.selectedKeys);
      this.selectedKeys.forEach((item) => {
        this.deleteItem(item);
      });
    },
    handleTableChange(pagination, filters, sorter) {
      // 处理分页变化的逻辑
      this.pagination.current = pagination.current;
      // 这里可以调用后端接口获取新的数据
      this.getOperatorGroupData();
    },
    handleSearch() {
      this.pagination.current = 1;
      this.getOperatorGroupData({
        name: this.searchFormData.name,
        typeId: this.searchFormData.typeId,
      })
    },
    resetForm() {
      this.$refs.refSearchForm.resetFields()
      this.$nextTick(() => {
        this.handleSearch()
      })
    },
    getOperatorGroupData(params = {}) {
      const { name = "", typeId = "" } = params
      this.loading = true;
      // 后端接口
      // 2.需要修改------------------------------------------------
      Operator.getOperatorGroupTemplateList({
        pageNo: this.pagination.current,
        limit: this.pagination.pageSize,
        name,
        typeId,
      }).then((res) => {
        this.loading = false;
        this.operatorGroupList = res.data?.records
        this.pagination.total = res.data.total;
      })
        .finally(() => {
          this.loading = false;
        });
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
        path: `/pipelineCenter/operatorManage/opGroupDetail/${record.id}`,
        query: {
          name,
        }
      })
    }
  },
  mounted() {
    this.getOperatorGroupData();
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

/* 在你的样式表中添加这些样式来让对话框全屏显示 */
.ant-dialog-body {
  height: calc(100vh - 48px);
  /* 减去标题栏的高度 */
  padding: 0 !important;
  /* 可以去除内边距 */
}
</style>
