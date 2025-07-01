<template>
  <div class="content-box">
    <div class="table-header">
      <a-button
        type="primary"
        class="btn-style mr-8"
        @click="isAddRPAShow = true"
      >
        新建RPA项目
      </a-button>
      <a-input-search
        v-model="keyword"
        placeholder="请输入需要搜索的内容"
        class="mr-8"
        style="width: 260px"
        @search="onSearch"
      />
    </div>
    <a-table
      :columns="columns"
      :data-source="rpaList"
      :pagination="pagination"
      @change="handleTableChange"
      :loading="loading"
      :rowKey="(record) => record.id"
      ref="shareTable"
    >
      <template slot="name" slot-scope="text, record">
        <div class="flex vertical-center">
          <el-tooltip effect="dark" :content="record.name" placement="top">
            <span class="name-ellipsis">{{ record.name }} </span>
          </el-tooltip>
        </div>
      </template>
      <span slot="createTime" slot-scope="text">  {{ text | moment }}</span>
      <span slot="updateTime" slot-scope="text">  {{ text | moment }}</span>
      <template slot="remark" slot-scope="text, record">
        <el-tooltip effect="dark" :content="record.name" placement="top">
          <span class="name-ellipsis">
            {{ record.remark || "--" }}
          </span>
        </el-tooltip>
      </template>

      <template slot="action" slot-scope="text, record">
        <div style="display: flex; align-items: center">
          <!-- <a
            type="link"
            :class="{
              'aButton-style': true,
              'mr-8': true,
            }"
            @click="openRpaModal(record.id, 'isAddOpShow')"
            >绑定算子组</a
          > -->
          <a
            type="link"
            :class="{
              'aButton-style': true,
              'mr-8': true,
            }"
            @click="openRpaModal(record.id, 'isAnnotatorShow')"
            >进行标注</a
          >
          <a-popconfirm
            placement="top"
            ok-text="Yes"
            cancel-text="No"
            @confirm="deleteItem(record.id)"
          >
            <template slot="title">
              <div>确定要删除此条记录么？</div>
            </template>
            <a
              type="link"
              :class="{
                'aButton-style': true,
                'mr-8': true,
              }"
              >删除</a
            >
          </a-popconfirm>
        </div>
      </template>
    </a-table>
    <a-modal
      title="新建RPA项目"
      :visible="isAddRPAShow"
      :closable="false"
      :mask="false"
      :maskClosable="false"
      :keyboard="false"
      :destroyOnClose="true"
      @ok="handleOk"
      @cancel="handleRPAFormCancel"
    >
      <a-form-model
        ref="RPAForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        layout="horizontal"
        :model="rowData"
        :rules="RPAFormRules"
      >
        <a-form-model-item label="RPA项目名称" prop="name">
          <a-input v-model="rowData.name" />
        </a-form-model-item>
        <a-form-model-item label="描述" prop="remark">
          <a-textarea
            v-model="rowData.remark"
            :auto-size="{ minRows: 2, maxRows: 4 }"
          />
        </a-form-model-item>
      </a-form-model>
    </a-modal>
    <RpaModal :is-show.sync="isAnnotatorShow" :rpa-id="rpaCurrentId" />
  </div>
</template>

<script>
import Operator from "@/api/operator";
import RPA from "@/api/rpa";
import RpaModal from "./components/rpaModal.vue";
import tool from "./tool.js";

const statusMap = ["创建中", "正常", "异常"];
export default {
  name: "Sharing",
  props: {
    sortable: {
      type: Object,
      default: function () {
        return { prop: "", order: "" };
      },
    },
  },
  components: {
    RpaModal,
  },
  mixins: [tool],
  data() {
    return {
      keyword: "",
      statusMap,
      loading: false,
      isAddRPAShow: false,
      
      isAnnotatorShow: false,
      rpaCurrentId: null,
      RPAFormRules: {
        name: [
          {
            required: true,
            message: "Please input your RPA name",
            trigger: "blur",
          },
        ],
      },
      
      rowData: {
        name: "",
        remark: "",
      },
      
      columns: [
        {
          title: "名称",
          dataIndex: "name",
          key: "name",
          scopedSlots: { customRender: "name" },
        },
        {
          title: "创建用户",
          dataIndex: "createBy",
          key: "createBy",
        },{
          title: "创建时间",
          dataIndex: "createTime",
          key: "createTime",
          scopedSlots: { customRender: "createTime" },
        },{
          title: "更新时间",
          dataIndex: "updateTime",
          key: "updateTime",
          scopedSlots: { customRender: "updateTime" },
        },
        {
          title: "描述",
          dataIndex: "remark",
          key: "remark",
          scopedSlots: { customRender: "remark" },
          ellipsis: true,
        },
        {
          title: "操作",
          dataIndex: "action",
          key: "action",
          width: "200px",
          scopedSlots: { customRender: "action" },
        },
      ],
      rpaList: [],
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: [10, 20, 30, 40, 50],
      },
      loading: false,
    };
  },
  methods: {
    openRpaModal(id, modalType) {
      this.rpaCurrentId = id;
      this[modalType] = true;
    },
    handleOk() {
      this.$refs["RPAForm"].validate((valid) => {
        if (valid) {
          const data = Object.assign({}, this.rowData);
          RPA.rpaProjectCreate(data)
            .then((res) => {
              if (res.code != 0) {
                this.$message.warning(res.msg);
              } else {
                this.handleRPAFormCancel();
                this.getRpaList();
                if(res.data?.id) {
                  this.openRpaModal(res.data?.id, 'isAnnotatorShow')
                }
              }
            })
            .catch((e) => {
              console.log(e);
            });
        }
      });
    },
    handleRPAFormCancel() {
      this.$refs["RPAForm"].resetFields();
      this.isAddRPAShow = false;
    },
    
    deleteItem(id) {
      RPA.deleteRpaItem(id).then(() => {
        this.$message.success("删除成功");
        // 删除之后的页码数
        const totalPage = Math.ceil((this.pagination.total - 1) / this.pagination.pageSize);
        this.pagination.current = totalPage < this.pagination.current ? totalPage : this.pagination.current;
        this.pagination.current = this.pagination.current < 1 ? 1 : this.pagination.current;
        // 刷新列表
        this.getRpaList();
      });
    },
    handleTableChange(pagination, filters, sorter) {
      // 处理分页变化的逻辑
      console.log("Pagination change:", pagination);
      this.pagination.current = pagination.current;
      // 这里可以调用后端接口获取新的数据
      this.getRpaList();
    },
    onSearch(value) {
      this.keyword = value;
      this.pagination.current = 1;
      this.getRpaList();
    },
    getRpaList() {
      this.loading = true;
      RPA.getRpaList({
        // Operator.getPipelineTemplateList({
        pageNo: this.pagination.current,
        limit: this.pagination.pageSize,
        name: this.keyword,
      })
        .then((res) => {
          this.loading = false;
          console.log(res, "获取分享列表结果");
          this.rpaList = res.data.records;
          this.pagination.total = res.data.total;
        })
        .finally(() => {
          this.loading = false;
        });
    },
  },
  mounted() {
    this.getRpaList();
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
  max-width: 250px; /* 根据需要设置最大宽度 */
  cursor: pointer;
}
a.aButton-style {
  //color: #1890ff !important;
  font-size: 14px;
  &.disabled-link {
    color: rgba(0, 0, 0, 0.25) !important; /* 改变颜色表示禁用状态 */
    text-decoration: none; /* 移除下划线 */
    cursor: not-allowed; /* 禁用点击事件 */
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