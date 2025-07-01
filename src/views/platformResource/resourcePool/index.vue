<template>
  <div>
    <!-- 页签切换 -->
    <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
      <a-tab-pane key="computePoolManagement" tab="算力池管理">
        <!-- 搜索条件 -->
        <a-form layout="inline" :model="poolSearchForm" ref="poolSearchFormRef">
          <a-form-item label="资源池名称">
            <a-input v-model="poolSearchForm.name" placeholder="请输入"/>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleFetchResourcePools">查询</a-button>
            <a-button @click="resetPoolForm">重置</a-button>
          </a-form-item>
        </a-form>

        <!-- 新建按钮 -->
        <div style="text-align: right; margin-bottom: 16px;">
          <a-button type="primary" @click="handCreate">新建算力资源池</a-button>
        </div>

        <a-table :columns="columns" :rowKey="row => row?.id" :data-source="datasource" :bordered="true" :pagination="pagination">
        <span slot="operation" slot-scope="record,text,index">
        <a @click="() => handleEdit(record)" style="margin-left: 10px">编辑</a>
        <a @click="handleDelete(record, index)" style="margin-left: 10px">删除</a>
        <a @click="handleAddHosts2ComputePool(record)" style="margin-left: 10px">添加主机到资源池</a>

        </span>
          <template #expandedRowRender="record">
            <a-table :columns="innerColumns"
                     :data-source="record?.nodes"
                     :pagination="innerPagination" >
              <template #operation="rowData">
                <a @click="handleRemove(record, rowData)" style="margin-left: 10px">移出资源池</a>
              </template>
            </a-table>
          </template>
        </a-table>

        <edit-compute-pool ref="editComputePool" @fetchResourcePools="fetchResourcePools"></edit-compute-pool>
        <add-host2-compute-pool ref="addHost2ComputePool"
                                @fetchResourcePools="fetchResourcePools"></add-host2-compute-pool>
      </a-tab-pane>
      <a-tab-pane key="storagePoolManagement" tab="存储池管理">
        <!-- 搜索条件 -->
        <a-form layout="inline" :model="storagePoolSearchForm" ref="storagePoolSearchFormRef">
          <a-form-item label="资源池名称">
            <a-input v-model="storagePoolSearchForm.name" placeholder="请输入"/>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleFetchStoragePools">查询</a-button>
            <a-button @click="resetStoragePoolForm">重置</a-button>
          </a-form-item>
        </a-form>
        <!-- 新建按钮 -->
        <div style="text-align: right; margin-bottom: 16px;">
          <a-button type="primary" @click="handCreateStoragePools">新建存储资源池</a-button>
        </div>

        <!-- 数据表格 -->
        <a-table
            :columns="storagePoolColumns"
            :dataSource="storagePools"
            :pagination="storagePoolPagination"
            rowKey="id"
            @change="handleStoragePoolTableChange"
        >
        <span slot="operation" slot-scope="record,text,index">
        <a @click="() => handleStoragePoolEdit(record)" style="margin-left: 10px">编辑</a>
        <a @click="handleStoragePoolDelete(record, index)" style="margin-left: 10px">删除</a>
        </span>
        </a-table>
        <edit-storage-pool ref="editStoragePool" @fetchStoragePools="fetchStoragePools"></edit-storage-pool>

      </a-tab-pane>
    </a-tabs>
  </div>
</template>
<script>
import {
  getResourcePools,
  deleteComputePool,
  removeHostFromComputePool,
  queryStoragePool,
  deleteStoragePool,
  queryComputePoolIsUsed,
  queryHostCanRemove,
  queryStoragePoolIsUsed,
} from "@/api/system/platformResource";
import moment from "moment";
import {newImage} from "@/api/imageManage";

export default {
  components: {
    editComputePool: () => ({component: import('./editComputePool')}),
    editStoragePool: () => ({component: import('./editStoragePool')}),
    addHost2ComputePool: () => ({component: import('./addHost2ComputePool')})
  },
  data() {
    return {
      // 存储每个资源池的分页状态
      innerPagination: {
        //分页
        showSizeChanger: true, //是否分页
        curPageSizeIndex: 0,
        pageSize: 10, //一页显示多少条
        total: 0, //总条数
        current: 1, //当前显示页面
        pageSizeOptions: ['5', '10', '20'],
        showTotal: (total) => `共计 ${total}条`, //显示总数
        onShowSizeChange: (current, pagesize) => {
          this.innerPagination.current = current
          this.innerPagination.pageSize = pagesize
        },
        onChange: (current, pageSize) => {
          this.innerPagination.current = current
        },
      },
      activeTab: "computePoolManagement", // 默认显示主机管理页
      // 主机管理数据
      poolSearchForm: {
        name: "",
      },
      datasource: [],
      inndata: [],
      expandedRowKeys: [],
      pagination: {
        //分页
        showSizeChanger: true, //是否分页
        curPageSizeIndex: 0,
        pageSize: 10, //一页显示多少条
        total: 0, //总条数
        current: 1, //当前显示页面
        pageSizeOptions: ['10', '20', '30'],
        showTotal: (total) => `共计 ${total}条`, //显示总数
        onShowSizeChange: (current, pagesize) => {
          this.pagination.current = current
          this.pagination.pageSize = pagesize
          this.fetchResourcePools()
        },
        onChange: (current, pageSize) => {
          this.pagination.current = current
          this.fetchResourcePools()
        },
      },
      loading: false, // 表格加载状态
      columns: [
        {title: "算力资源池名称", dataIndex: "name", key: "name",ellipsis: true},
        {title: "资源池描述", dataIndex: "description", key: "description",ellipsis: true, customRender: (text) => text || "无描述"},
        {title: "算力资源池总量", dataIndex: "totalResources", key: "totalResources"},
        {title: "算力资源池分配量", dataIndex: "availableResources", key: "availableResources"},
        {title: "创建人", dataIndex: "creator", key: "creator"},
        {
          title: "创建时间",
          dataIndex: "createTime",
          key: "createTime",
          customRender: (text) => (text ? moment(text).format("YYYY-MM-DD HH:mm:ss") : "无"),
        },
        {
          title: "操作",
          key: "operation",
          scopedSlots: {customRender: "operation"},
        },
      ],
      innerColumns: [
        {title: "主机名称", dataIndex: "name", key: "name",ellipsis: true},
        {title: "主机IP", dataIndex: "ip", key: "ip"},
        {title: "主机资源规格", dataIndex: "resources", key: "resources"},
        {
          title: "操作",
          key: "operation",
          scopedSlots: {customRender: "operation"},
        },
      ],

      //存储模块的参数定义
      storagePoolSearchForm:{
        name: "",
      },
      storagePools: [],
      storagePoolColumns: [
        { title: "存储资源池名称", dataIndex: "name", key: "name",ellipsis: true},
        { title: "资源池描述", dataIndex: "description", key: "description", ellipsis: true, customRender: (text) => text || "无描述"},
        { title: "存储总量", dataIndex: "totalResources", key: "totalResources", customRender: (text) => `${text || 0} GB` },
        { title: "已分配额度", dataIndex: "assignedResources", key: "assignedResources", customRender: (text) => `${text || 0} GB` },
        { title: "创建人", dataIndex: "creator", key: "creator"},
        {
          title: "创建时间",
          dataIndex: "createTime",
          key: "createTime",
          customRender: (text) => (text ? moment(text).format("YYYY-MM-DD HH:mm:ss") : "无"),
        },
        {
          title: "操作",
          key: "operation",
          scopedSlots: {customRender: "operation"},
        },
      ],
      storagePoolPagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        showQuickJumper: true,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50", "100"],
        showTotal: (total) => `共 ${total} 条`,
        onShowSizeChange: (current, pagesize) => {
          this.storagePoolPagination.current = current
          this.storagePoolPagination.pageSize = pagesize
          this.fetchStoragePools()
        },
        onChange: (current, pageSize) => {
          this.storagePoolPagination.current = current
          this.fetchStoragePools()
        },
      },
    }
  },

  mounted() {
    this.fetchResourcePools();
  },
  methods: {
    // 获取算力资源池列表
    async fetchResourcePools(isNewQuery = false) {
      this.loading = true;
      this.expandedRowKeys = []
      if (isNewQuery) {
        this.pagination.current = 1;
      }
      try {
        const params = {
          size: this.pagination.pageSize,
          current: this.pagination.current,
        };
        // 仅添加非空查询条件
        if (this.poolSearchForm.name) params.name = this.poolSearchForm.name.trim();
        const res = await getResourcePools(params);
        if (res.code === 200) {
          this.datasource = res.data.pools.map((pool) => ({
            ...pool,
          }));
          this.pagination.total = res.data.page.total || 0;
        } else {
          this.datasource = [];
          console.error("获取资源池列表失败：", res.msg || "未知错误");
        }
      } catch (error) {
        this.datasource = [];
        console.error("获取资源池列表失败：", error);
      } finally {
        this.loading = false;
      }
    },
    handleFetchResourcePools(){
      this.fetchResourcePools(true);
    },
    resetPoolForm() {
      this.poolSearchForm = {name: ""};
      this.expandedRowKeys = []
      this.handleFetchResourcePools();
    },
    getInnerData(expanded, record) {
      this.expandedRowKeys = []
      this.datasource.find((item, index) => {
        if (item === record) {
          this.expandedRowKeys.push(index);
        }
      })
      if (expanded) {
        this.inndata = [];
        this.inndata = record.nodes.map((pool) => ({
          ...pool,
        }));
      }
    },
    // 新建算力资源池
    handCreate() {
      this.$refs.editComputePool.showModal()
    },
    handleEdit(record) {
      this.$refs.editComputePool.showModal(record)
    },
    handleAddHosts2ComputePool(record) {
      this.$refs.addHost2ComputePool.showModal(record)
    },
    async handleDelete(record, index) {
      console.log("record.id", record.id);

      // 调用 queryComputePoolIsUsed 接口，检查算力资源池是否被引用
      const checkRes = await queryComputePoolIsUsed({ id: record.id });
      if (checkRes.code === 200 && checkRes.data === true) {
        // 如果算力资源池已被引用，弹出确认框
        this.$confirm({
          title: "无法删除",
          content:
              "该算力资源池已被项目配置，无法直接删除，若需删除，请先去修改项目资源池的配置。",
          okText: "确定",
          cancelButtonProps: { style: { display: "none" } }, // 隐藏取消按钮
          onOk: () => {
            console.log("用户已确认无法删除");
          },
        });
        return; // 直接返回，不执行后续删除逻辑
      }

      // 弹出确认框
      this.$confirm({
        title: `确定要删除 ${record.name} 吗?`,
        content: "仔细确认是否删除该算力资源池，请谨慎操作！",
        cancelText: "取消",
        okText: "确定",
        onOk: async () => {
          try {
            // 调用删除接口
            const res = await deleteComputePool(record.id);
            if (res.code === 200) {
              this.$message.success("删除成功");
              // 如果当前页只有一条数据且不是第一页，删除后回到上一页
              if (this.datasource.length === 1 && this.pagination.current > 1) {
                this.pagination.current--;
              }
              // 刷新资源池列表
              await this.fetchResourcePools();
            } else {
              this.$message.error(res.msg || "删除失败，请重试！");
            }
          } catch (error) {
            console.error("删除失败：", error);
            this.$message.error("删除失败，请重试！");
          }
        },
        onCancel() {
          console.log("取消删除操作");
        },
      });
    },
    async handleRemove(record, nodeRecord) {
      // 获取主机 ID 和资源池 ID
      const hostId = nodeRecord.id; // 主机 ID
      const poolId = nodeRecord.pid; // 资源池 ID
      try {
        // 调用 queryHostCanRemove 接口，判断主机是否可以移除
        const checkRes = await queryHostCanRemove({ hostId, poolId });
        if (checkRes.code === 200 && checkRes.data === false) {
          // 如果主机不能移除，弹出确认框提示用户
          this.$confirm({
            title: "无法移除主机",
            content: "该主机已有任务在运行，无法直接删除，请先清理运行任务后再操作。",
            okText: "确定",
            cancelButtonProps: { style: { display: "none" } }, // 隐藏取消按钮
            onOk: () => {
              console.log("用户已确认无法移除主机");
            },
          });
          return; // 直接返回，不执行后续移除逻辑
        }
      } catch (error) {
        console.error("检查主机是否可移除失败：", error);
        this.$message.error("检查主机状态失败，请稍后重试！");
        return; // 如果接口调用失败，终止操作
      }

      // 弹出确认框
      this.$confirm({
        title: `确定要移除主机 ${record.name} 吗?`,
        content: "移除操作不可撤销，请谨慎操作！",
        cancelText: "取消",
        okText: "确定",
        onOk: async () => {
          try {
            // 调用移除接口
            const params = {
              hostId,
              poolId,
            };
            const res = await removeHostFromComputePool(params);
            if (res.code === 200 && res.data.status === 200) {
              this.$message.success("主机已成功移出资源池！");
              // 刷新资源池列表
              this.fetchResourcePools();
            } else {
              this.$message.error(res.msg || "移除失败，请重试！");
            }
          } catch (error) {
            console.error("移除失败：", error);
            this.$message.error("移除失败，请重试！");
          }
        },
        onCancel() {
          console.log("取消移除操作");
        },
      });
    },
    getData(record) {
      console.log(record);
    },
    // 页签切换
    handleTabChange(key) {
      this.activeTab = key;
      if (key === "computePoolManagement") {
        this.fetchResourcePools(); // 切换到主机管理时查询主机数据
      } else if (key === "storagePoolManagement") {
        this.fetchStoragePools();
      }
    },

    //存储资源池---------------------

    async fetchStoragePools(isNewQuery = false) {
      if (isNewQuery) {
        this.storagePoolPagination.current = 1;
      }
      const params = {
        size: this.storagePoolPagination.pageSize,
        current: this.storagePoolPagination.current,
      };
      // 仅添加非空查询条件
      if (this.storagePoolSearchForm.name && this.storagePoolSearchForm.name.trim() !== "") {
        params.name = this.storagePoolSearchForm.name.trim();
      }
      const res = await queryStoragePool(params);
      if (res.code === 200) {
        this.storagePools = res.data.storages || [];
        this.storagePoolPagination.total = res.data.page.total || 0;
      }
    },
    handleFetchStoragePools(){
      this.fetchStoragePools(true);
    },
    resetStoragePoolForm() {
      this.storagePoolSearchForm = {name: ""};
      this.handleFetchStoragePools();
    },
    handCreateStoragePools(){
      this.$refs.editStoragePool.showModal()
    },
    handleStoragePoolEdit(record){
      this.$refs.editStoragePool.showModal(record)
    },
    async handleStoragePoolDelete(record, index) {
      try {
        // 调用接口判断资源池是否被项目引用
        const isReferencedResponse = await queryStoragePoolIsUsed({id: record.id}); // 假设 queryStoragePoolIsUsed 接口需要传入资源池的 ID
        if (isReferencedResponse.code === 200 && isReferencedResponse.data === true) {
          // 如果资源池被项目引用，弹出提示框
          this.$confirm({
            title: "删除存储资源池",
            content: "该存储资源池已被项目配置，无法直接删除。若需删除，请先去修改项目存储资源池的配置。",
            okText: "确定",
            cancelText: "取消",
            onOk: () => {
            },
            onCancel: () => {
              // this.$message.info("已取消删除操作。");
            },
          });
        } else {
          // 如果资源池未被项目引用，弹出确认框
          this.$confirm({
            title: "删除存储资源池",
            content: "仔细确认是否删除该存储资源池，请谨慎操作！",
            okText: "确定",
            cancelText: "取消",
            onOk: async () => {
              try {
                // 调用删除接口
                console.log("record.id",record.id)
                const response = await deleteStoragePool(record.id);
                if (response.code === 200) {
                  this.$message.success("存储资源池删除成功！");
                  // 删除成功后刷新列表或更新数据
                  this.storagePools.splice(index, 1); // 假设存储池列表存储在 this.storagePools 中
                } else {
                  this.$message.error("存储资源池删除失败：" + response.msg);
                }
              } catch (error) {
                console.error("删除存储资源池失败：", error);
                this.$message.error("删除存储资源池失败，请重试！");
              }
            },
            onCancel: () => {
              // this.$message.info("已取消删除操作。");
            },
          });
        }
      } catch (error) {
        console.error("操作失败：", error);
        this.$message.error("操作失败，请重试！");
      }
    }

  },
}
</script>
<style scoped>
</style>
