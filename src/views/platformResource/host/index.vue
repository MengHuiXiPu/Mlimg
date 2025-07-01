<template>
  <div>
    <!-- 页签切换 -->
    <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
      <a-tab-pane key="hostManagement" tab="主机管理">
        <!-- 主机管理内容 -->
        <div>
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
            <a-form-item label="所属资源池">
              <a-select v-model="hostSearchForm.computeResourcePoolId" placeholder="请选择" style="width: 150px" :loading="hostResourcePoolsLoading">
                <a-select-option value="">全部</a-select-option>
                <a-select-option v-for="(name, id) in hostResourcePools" :key="id" :value="id">
                  {{ name }}
                </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="handleHostSearch">查询</a-button>
              <a-button @click="resetHostForm">重置</a-button>
              <a-button @click="refreshHost">刷新主机列表</a-button>
            </a-form-item>
          </a-form>

          <!-- 统计概览 -->
          <div class="summary">
            <h3 class="summary-title">合计概览</h3>
            <div class="summary-container">
              <div class="summary-item">主机总数 {{ hostCounts.hostAllCount }} 台</div>
              <div class="summary-item">CPU总数 {{ hostCounts.hostCpuCount }} 台</div>
              <div class="summary-item">GPU总数 {{ hostCounts.hostGpuCount }} 台</div>
              <!-- 动态渲染 GPU 卡型号及数量 -->
              <div
                  class="summary-item"
                  v-for="(value, key) in hostGpuCardCounts"
                  :key="key"
                  :title="`${key} ${value} 张`"
              >
                {{ key }} {{ value }} 张
              </div>
            </div>
          </div>

          <!-- 数据表格 -->
          <a-table
              :columns="hostColumns"
              :dataSource="hosts"
              :pagination="hostPagination"
              rowKey="id"
              @change="handleHostTableChange"
          />
        </div>
      </a-tab-pane>

      <a-tab-pane key="storageManagement" tab="存储资源管理">
        <!-- 存储资源管理内容 -->
        <div>
          <!-- 搜索条件 -->
          <a-form layout="inline" :model="storageSearchForm" ref="storageSearchFormRef">
            <a-form-item label="存储名称">
              <a-input v-model="storageSearchForm.name" placeholder="请输入存储名称" />
            </a-form-item>
            <a-form-item label="存储所属资源池">
              <a-select v-model="storageSearchForm.storageResourcePoolId" placeholder="请选择" style="width: 150px" :loading="storageResourcePoolsLoading">
                <a-select-option value="">全部</a-select-option>
                <a-select-option v-for="(name, id) in storageResourcePools" :key="id" :value="id">
                  {{ name }}
                </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="handleStorageSearch">查询</a-button>
              <a-button @click="resetStorageForm">重置</a-button>
              <a-button @click="refreshPvcInfo">刷新存储列表</a-button>
            </a-form-item>
          </a-form>

          <!-- 统计概览 -->
          <div class="summary">
            <h3 class="summary-title">合计概览</h3>
            <div class="summary-container">
              <div class="summary-item">存储总量 {{ storageCounts.totalCapacity || 0 }} GB</div>
            </div>
          </div>

          <!-- 数据表格 -->
          <a-table
              :columns="storageColumns"
              :dataSource="storages"
              :pagination="storagePagination"
              rowKey="id"
              @change="handleStorageTableChange"
          />
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script>
import { getAllPollComputeIdName, getHostList, getAllPollStorageIdName, getPVCList ,refreshHostInfo ,refreshPvcInfo } from "@/api/system/platformResource";

export default {
  data() {
    return {
      activeTab: "hostManagement", // 默认显示主机管理页

      // 主机管理数据
      hostSearchForm: {
        ip: "",
        status: null,
        type: "",
        computeResourcePoolId: "",
      },
      hostResourcePools: {},
      hostResourcePoolsLoading: false,
      hosts: [],
      hostCounts: {
        hostAllCount: 0,
        hostCpuCount: 0,
        hostGpuCount: 0,
      },
      hostGpuCardCounts: {},
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

      // 存储资源管理数据
      storageSearchForm: {
        name: "",
        storageResourcePoolId: "",
      },
      storageResourcePools: {},
      storageResourcePoolsLoading: false,
      storages: [],
      storageCounts: {
        totalCapacity: 0,
      },
      storagePagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        showQuickJumper: true,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50", "100"],
        showTotal: (total) => `共 ${total} 条`,
      },
      storageColumns: [
        { title: "存储名称", dataIndex: "name", key: "name" },
        { title: "存储总量", dataIndex: "storageCapacity", key: "storageCapacity", customRender: (text) => `${text || 0} GB` },
        { title: "存储所属资源池", dataIndex: "belongPoll", key: "belongPoll" },
        { title: "存储类", dataIndex: "storageClass", key: "storageClass" }, // 新增存储类列
        { title: "备注", dataIndex: "remark", key: "remark" },
      ],
    };
  },
  methods: {
    // 主机管理方法
    async fetchHostResourcePools() {
      this.hostResourcePoolsLoading = true;
      try {
        const res = await getAllPollComputeIdName();
        if (res.code === 200) {
          this.hostResourcePools = res.data || {};
        }
      } finally {
        this.hostResourcePoolsLoading = false;
      }
    },
    // 修改查询按钮的调用方式
    handleHostSearch() {
      this.fetchHostData(true); // 传入 true 表示这是新的查询操作
    },
    async fetchHostData(isNewQuery = false) {
      // 如果是新的查询操作，重置页码为1
      if (isNewQuery) {
        this.hostPagination.current = 1;
      }
      const params = {
        size: this.hostPagination.pageSize,
        current: this.hostPagination.current,
      };

      // 仅添加非空查询条件
      if (this.hostSearchForm.ip) params.ip = this.hostSearchForm.ip.trim();
      if (this.hostSearchForm.status !== null) params.status = this.hostSearchForm.status;
      if (this.hostSearchForm.type) params.type = this.hostSearchForm.type;
      if (this.hostSearchForm.computeResourcePoolId) params.computeResourcePoolId = this.hostSearchForm.computeResourcePoolId;

      const res = await getHostList(params);
      if (res.code === 200) {
        this.hosts = res.data.hosts || [];
        this.hostCounts = res.data.counts || {};
        // 提取 GPU 卡型号及数量
        this.hostGpuCardCounts = Object.keys(this.hostCounts)
            .filter((key) => !["hostAllCount", "hostCpuCount", "hostGpuCount"].includes(key))
            .reduce((acc, key) => {
              acc[key] = this.hostCounts[key];
              return acc;
            }, {});
        this.hostPagination.total = res.data.page.total || 0;
      }
    },
    resetHostForm() {
      this.hostSearchForm = {ip: "", status: null, type: "", computeResourcePoolId: ""};
      this.hostPagination.current = 1;
      this.handleHostSearch();
    },
    refreshHost() {
      // 弹出确认框
      this.$confirm({
        title: "刷新主机列表",
        content: "主机信息更新到最新状态，请确认是否刷新操作。",
        cancelText: "取消",
        okText: "确定",
        onOk: async () => {
          try {
            // 调用刷新主机信息接口
            const res = await refreshHostInfo();
            if (res.code === 200) {
              this.$message.success("主机信息刷新成功！");
              // 如果需要，可以在这里添加刷新页面或其他逻辑
              this.resetHostForm();
            } else {
              this.$message.error(res.msg || "主机信息刷新失败，请重试！");
            }
          } catch (error) {
            console.error("刷新主机信息失败：", error);
            this.$message.error("主机信息刷新失败，请重试！");
          }
        },
        onCancel() {
          console.log("取消刷新操作");
          // this.$message.info("已取消刷新操作");
        },
      });
    },
    handleHostTableChange(pagination) {
      this.hostPagination.current = pagination.current;
      this.hostPagination.pageSize = pagination.pageSize;
      this.fetchHostData();
    },

    // 存储资源管理方法
    async fetchStorageResourcePools() {
      this.storageResourcePoolsLoading = true;
      try {
        const res = await getAllPollStorageIdName();
        if (res.code === 200) {
          this.storageResourcePools = res.data || {};
        }
      } finally {
        this.storageResourcePoolsLoading = false;
      }
    },
    handleStorageSearch() {
      this.fetchStorageData(true);
    },
    async fetchStorageData(isNewQuery = false) {
      if (isNewQuery) {
        this.storagePagination.current = 1;
      }
      const params = {
        size: this.storagePagination.pageSize,
        current: this.storagePagination.current,
      };

      // 仅添加非空查询条件
      if (this.storageSearchForm.name && this.storageSearchForm.name.trim() !== "") {
        params.name = this.storageSearchForm.name.trim();
      }
      if (this.storageSearchForm.storageResourcePoolId) params.id = this.storageSearchForm.storageResourcePoolId;

      const res = await getPVCList(params);
      if (res.code === 200) {
        this.storages = res.data.pvcs || [];
        this.storageCounts.totalCapacity = res.data.counts?.totalCapacity || 0;
        this.storagePagination.total = res.data.page.total || 0;
      }
    },
    refreshPvcInfo(){
      // 弹出确认框
      this.$confirm({
        title: "刷新存储资源列表",
        content: "存储资源更新到最新状态，请确认是否刷新操作。",
        cancelText: "取消",
        okText: "确定",
        onOk: async () => {
          try {
            // 调用刷新主机信息接口
            const res = await refreshPvcInfo();
            if (res.code === 200) {
              this.$message.success("存储资源刷新成功！");
              // 如果需要，可以在这里添加刷新页面或其他逻辑
              this.resetStorageForm();
            } else {
              this.$message.error(res.msg || "存储资源刷新失败，请重试！");
            }
          } catch (error) {
            console.error("刷新存储资源失败：", error);
            this.$message.error("存储资源刷新失败，请重试！");
          }
        },
        onCancel() {
          console.log("取消刷新操作");
          // this.$message.info("已取消刷新操作");
        },
      });
    },
    resetStorageForm() {
      this.storageSearchForm = {name: "", storageResourcePoolId: ""};
      this.storagePagination.current = 1;
      this.handleStorageSearch();
    },
    handleStorageTableChange(pagination) {
      this.storagePagination.current = pagination.current;
      this.storagePagination.pageSize = pagination.pageSize;
      this.fetchStorageData();
    },

    // 页签切换
    handleTabChange(key) {
      this.activeTab = key;
      if (key === "hostManagement") {
        this.fetchHostData(); // 切换到主机管理时查询主机数据
      }else if (key === "storageManagement") {
        this.fetchStorageResourcePools(); // 切换到存储资源管理时查询存储资源池
        this.fetchStorageData(); // 查询存储数据
      }
    },
  },
  mounted() {
    this.fetchHostResourcePools();
    this.fetchHostData(); // 默认只查询主机列表信息
  },
};
</script>

<style>
.summary-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}

.summary-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.summary-item {
  background: #1890ff;
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
  min-width: 120px;
  max-width: 300px;
  word-break: break-word;
  white-space: normal;
}
</style>