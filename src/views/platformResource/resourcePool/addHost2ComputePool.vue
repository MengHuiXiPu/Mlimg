<template>
  <div>
    <a-modal
        v-model:visible="visible"
        title="添加主机到资源池"
        :width="800"
        @ok="handleSubmit"
        @cancel="handleCancel"
    >
    <!-- 搜索条件 -->
    <a-form layout="inline" :model="hostSearchForm" ref="hostSearchFormRef">
      <a-form-item label="主机IP">
        <a-input v-model="hostSearchForm.ip" placeholder="请输入" />
      </a-form-item>
      <a-form-item label="主机状态">
        <a-select v-model="hostSearchForm.status" placeholder="请选择" style="width: 120px">
          <a-select-option :value="null">全部</a-select-option>
          <a-select-option :value="1">正常</a-select-option>
          <a-select-option :value="0">异常</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="主机类型">
        <a-select v-model="hostSearchForm.type" placeholder="请选择" style="width: 120px">
          <a-select-option value="">全部</a-select-option>
          <a-select-option value="cpu">CPU类型</a-select-option>
          <a-select-option value="gpu">GPU类型</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="fetchHostData">查询</a-button>
        <a-button @click="resetHostForm">重置</a-button>
      </a-form-item>
    </a-form>

    <!-- 数据表格 -->
    <a-table
        :columns="hostColumns"
        :dataSource="hosts"
        :pagination="hostPagination"
        rowKey="id"
        :rowSelection="rowSelection"
        @change="handleHostTableChange"
    />
    </a-modal>
  </div>


</template>
<script>
import {getUnAssignedHost, addHosts2ComputePoll  } from "@/api/system/platformResource";
export default {
  data() {
    return {
      visible: false, // 控制弹窗显示
      selectedHostIds: [], // 存储选中的主机ID
      poolId: null, // 父页面传递的资源池ID
      // 主机管理数据
      hostSearchForm: {
        ip: "",
        status: null,
        type: "",
      },
      hostResourcePools: {},
      hostResourcePoolsLoading: false,
      hosts: [],
      hostIds:[],
      hostPagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        showQuickJumper: true,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50", "100"],
        showTotal: (total) => `共 ${total} 条`,
      },
      hostColumns: [
        { title: "主机IP", dataIndex: "ip", key: "ip" },
        { title: "主机名称", dataIndex: "name", key: "name" },
        {
          title: "主机状态",
          dataIndex: "status",
          key: "status",
          customRender: (text) => {
            return {
              children: text === 1 ? "正常" : "异常",
              style: {
                color: text === 0 ? "red" : "inherit",
              },
            };
          },
        },
        { title: "主机类型", dataIndex: "type", key: "type" },
        { title: "主机资源规格", dataIndex: "specification", key: "specification" },
        { title: "主机所属资源池", dataIndex: "belongPoll", key: "belongPoll" },
        { title: "备注", dataIndex: "remark", key: "remark" },
      ],
      rowSelection: {
        onChange: (selectedRowKeys) => {
          this.selectedHostIds = selectedRowKeys; // 更新选中的主机ID
        },
      },
    };
  },
  methods: {
    showModal (record) {
      this.poolId = record.id; // 从父页面获取资源池ID
      this.visible = true
      this.hostSearchForm = {ip: "", status: null, type: ""};
      this.hostPagination.current = 1;
      this.fetchHostData();
    },
    async handleSubmit() {
      try {
        if (this.selectedHostIds.length === 0) {
          this.$message.warning("请至少选择一台主机！");
          return;
        }
        const params = {
          poolId: this.poolId,
          hostIds: this.selectedHostIds,
        };
        const res = await addHosts2ComputePoll(params);
        if (res.code === 200) {
          this.$message.success("主机已成功添加到资源池！");
          this.visible = false; // 关闭弹窗
          this.$emit("fetchResourcePools"); // 通知父组件刷新资源池数据
        } else {
          this.$message.error("添加主机到资源池失败：" + res.msg);
        }
      } catch (error) {
        console.error("表单验证失败或接口调用失败：", error);
        this.$message.error("算力资源池添加失败，请重试！");
      }
    },
    // 取消操作
    handleCancel() {
      this.visible = false; // 关闭弹窗
      console.log("取消操作");
    },
    async fetchHostData() {
      const params = {
        size: this.hostPagination.pageSize,
        current: this.hostPagination.current,
      };

      // 仅添加非空查询条件
      if (this.hostSearchForm.ip) params.ip = this.hostSearchForm.ip.trim();
      if (this.hostSearchForm.status !== null) params.status = this.hostSearchForm.status;
      if (this.hostSearchForm.type) params.type = this.hostSearchForm.type;

      const res = await getUnAssignedHost(params);
      if (res.code === 200) {
        this.hosts = res.data.hosts || [];
        this.hostPagination.total = res.data.page.total || 0;
      }
    },
    resetHostForm() {
      this.hostSearchForm = {ip: "", status: null, type: ""};
      this.hostPagination.current = 1;
      this.fetchHostData();
    },
    handleHostTableChange(pagination) {
      this.hostPagination.current = pagination.current;
      this.hostPagination.pageSize = pagination.pageSize;
      this.fetchHostData();
    },
  },
};


</script>