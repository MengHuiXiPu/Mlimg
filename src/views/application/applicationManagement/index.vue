<template>
  <div class="page-content">
    <div class="toolbar space-between">
      <el-form :inline="true" :model="searchFormData" size="small" ref="refSearchForm" @submit.native.prevent>
        <el-form-item label="名称" prop="name">
          <el-input v-model="searchFormData.name" placeholder="请输入" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handSearch">查询</el-button>
          <el-button type="primary" plain @click="handReload">重置</el-button>
        </el-form-item>
      </el-form>
      <div style="margin-bottom: 18px;">
        <el-button type="primary" @click="handCreate">新建应用</el-button>
      </div>
    </div>
    <a-table :columns="columns" :data-source="tableData" v-resize :loading="loading" :rowKey="(record) => record.id"
      :pagination="pagination.total > 10 ? pagination : false" @change="handleTableChange">
      <span slot="name" slot-scope="text, records">
        <span :class="records.enable === 0 ? 'disabled' : 'application-name'" :title="text"
          @click="toApplicationDetail(records)">{{ text }}</span>
      </span>
      <span slot="createTime" slot-scope="text, records">
        {{ formatTime(records.createTime) }}
      </span>
      <span slot="updateTime" slot-scope="text, records">
        {{ formatTime(records.updateTime) }}
      </span>
      <span slot="action" slot-scope="records">
        <a @click="() => handleEdit(records)" style="margin-right: 5px">编辑</a>
        <a-popconfirm :title="`是否${records.enable === 0 ? '启用' : '禁用'}该应用`" ok-text="确定" cancel-text="取消"
          @confirm="handleBan(records)">
          <a>{{ records.enable === 0 ? "启用" : "禁用" }}</a>
        </a-popconfirm>
      </span>
    </a-table>
    <addApplicationDialog ref="addApplicationDialog" :type="type" @add-application="handleOk" />
  </div>
</template>

<script>
import {
  getApplicationManagementList,
  updateApplicationManagementItem,
} from "@/api/appCenter.js";
import { formatDateTime } from "@/utils/base.js";
import addApplicationDialog from "./addApplicationDialog.vue";

export default {
  name: "applicationManagement",
  components: {
    addApplicationDialog,
  },
  data() {
    return {
      loading: false,
      tableData: [],
      columns: [
        {
          title: "应用名称",
          dataIndex: "name",
          scopedSlots: { customRender: "name" },
          width: "20%",
        },
        {
          title: "应用编号",
          dataIndex: "number",
          width: "15%",
        },
        {
          title: "创建人",
          dataIndex: "createBy",
          width: "120px",
        },
        {
          title: "创建时间",
          dataIndex: "createTime",
          scopedSlots: { customRender: "createTime" },
          width: "120px",
        },
        {
          title: "修改时间",
          dataIndex: "updateTime",
          scopedSlots: { customRender: "updateTime" },
          width: "120px",
        },
        {
          title: "操作",
          scopedSlots: { customRender: "action" },
          width: "180px",
          align: "right",
        },
      ],
      pagination: {
        total: 0,
        pageSize: 10,
        current: 1,
        showTotal: function (total) {
          return `共 ${total} 条`;
        },
      },
      // 对话框标题类型 1 新建 2 编辑
      type: 1,
      searchFormData: {
        name: "",
      },
    };
  },
  methods: {
    getTableData(params = {}) {
      const { name = "" } = this.searchFormData
      this.loading = true;
      params = {
        ...params,
        limit: 10,
        pageNo: this.pagination.current,
        keyword: name.trim(),
      };
      getApplicationManagementList(params)
        .then((res) => {
          if (res?.code === 0) {
            this.tableData = res?.data?.records || [];
            this.pagination.total = res?.data?.total;
          }
        })
        .catch((err) => {
          this.$message.error(
            err?.response?.data?.msg || err?.response?.data?.message
          );
        })
        .finally(() => {
          this.loading = false;
        });
    },
    // 时间转化
    formatTime(time) {
      return formatDateTime(new Date(time), "yyyy-MM-dd HH:mm:ss");
    },
    // 分页切换
    handleTableChange(pagination, filters, sorter) {
      this.pagination.current = pagination.current;
      this.getTableData();
    },
    // 新增
    handCreate() {
      this.type = 1;
      this.$refs.addApplicationDialog.showModal();
    },
    // 查询
    handSearch() {
      this.pagination.current = 1;
      this.getTableData();
    },
    handReload() {
      this.$refs.refSearchForm.resetFields();
      this.pagination.current = 1;
      this.getTableData();
    },
    // 跳转至详情页面
    toApplicationDetail(record, $event) {
      if (record.enable === 0) {
        event.preventDefault();
        return;
      }
      let bread = {
        ...this.$route.meta,
        path: this.$route.path,
        // 应用管理-应用名称，只在面包屑使用
        appName: record.name
      };
      localStorage.setItem("bread", JSON.stringify(bread));
      this.$router.push({
        path: "/application/applicationManagement/detail",
        query: { appId: record.id },
      });
    },
    // 编辑
    handleEdit(record) {
      this.type = 2;
      this.$refs.addApplicationDialog.showModal();
      this.$refs.addApplicationDialog.getData(record);
    },
    // 启用禁用
    handleBan(record) {
      updateApplicationManagementItem({
        id: record.id,
        enable: record.enable === 0 ? 1 : 0,
      })
        .then((res) => {
          if (res?.code === 0) {
            this.getTableData();
          }
        })
        .catch((err) => {
          this.$message.error(
            err?.response?.data?.msg || err?.response?.data?.message
          );
        });
    },
    // 新增或编辑操作
    handleOk(value) {
      const params = {
        enable: value.enable === 1 ? 1 : 0,
        id: value.appId,
        name: value.name || "",
        number: value.number || "",
      }
      updateApplicationManagementItem(params)
        .then((res) => {
          if (res?.code === 0) {
            this.$refs.addApplicationDialog.hideModal();
            this.$refs.addApplicationDialog.handleCancel();
            this.$message.success(this.type === 1 ? "新增成功" : "修改成功");
            this.getTableData();
          }
        })
        .catch((err) => {
          this.$message.error(
            err?.response?.data?.msg || err?.response?.data?.message
          );
        });
    },
  },
  mounted() {
    this.getTableData();
  },
};
</script>

<style lang="less" scoped>
.disabled {
  cursor: not-allowed;
}

.application-name {
  color: #00f;
  cursor: pointer;
}
</style>
