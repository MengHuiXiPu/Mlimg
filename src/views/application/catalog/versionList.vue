<template>
  <a-spin :spinning="loading">
    <a-table
        :columns="columns"
        :data-source="dataSource"
        :rowKey="(record) => record.versionId"
        @change="pageChange"
        :pagination="pagination"
    >
      <template #version="record">
        <div>
          <span>{{ record.versionName }} <a-tag v-if="record?.versionDefault" color="green">当前版本</a-tag>
          </span>
          <span v-if="loadingState(record?.versionStatus)" class="icons"><a-icon type="sync" spin="true"/></span>
        </div>
      </template>
      <template #sourceId="record">
        {{ record.appType === 0 ? "模型仓库" : "方案中心" }}
      </template>
      <template #versionCreateTime="record">
        {{ record.versionCreateTime | moment }}
      </template>
      <template #action="record">
        <a :disabled="isIntermediateState(record?.infesvrState) || isLockedRunningState(record?.infesvrState)" @click="deploy(record)">部署配置</a>
      </template>
    </a-table>
    <deploy-config-on-base :visible="deployConfigVisible" @confirm="handleDeployConfigOk"
                           @cancel="handleDeployConfigCancel" @confirm:run="handleDeployConfigOkAndRun"/>
  </a-spin>

</template>
<script>
import {
  addConfigForInferserviceVersion,
  getInferserviceVersionByIdPage, restartInferserviceById,
  startInferserviceByIdWithVersion, switchInferserviceById
} from "@/api/appCenter"
import DeployConfigOnBase from "./widgets/DeployConfigOnBase.vue";
import {loadingState} from "@/views/application/catalog/utils";
import {
  isRunningState, isIntermediateState, isLockedRunningState
} from "@/views/application/catalog/utils";


const tableColumns = [
  {
    title: '版本号',
    key: '1',
    scopedSlots: {customRender: "version"},
  },
  {
    title: '来源',
    scopedSlots: {customRender: "sourceId"},
  },
  {
    title: '发布人',
    dataIndex: 'versionCreateBy',
  },
  {
    title: '发布时间',
    key: 'versionCreateTime',
    scopedSlots: {customRender: "versionCreateTime"},
  },
  {
    title: '操作',
    key: 'action',
    scopedSlots: {customRender: 'action'},
  },
];
export default {
  name: "versionList",
  components: {
    DeployConfigOnBase
  },
  emits: ["onUpdate"],
  props: {
    detailData: {
      type: Object,
      required: true,
    },
  },
  setup() {
    return {
      loadingState,
    }
  },
  watch: {
    detailData: {
      handler: function () {
        this.pagingVersionInfo(this.pagination.current, this.pagination.pageSize);
      },
      deep: true,
    }
  },
  mounted() {
    this.pagingVersionInfo();
  },
  computed: {},
  data() {
    return {
      loading: false,
      inferserviceInfo: this.detailData,
      columns: tableColumns,
      pagination: {
        pageSize: 10,
        current: 1,
        hideOnSinglePage: true,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "30", "50"],
        showTotal: function (total) {
          return `共 ${total} 条`;
        },
      },
      dataSource: [],
      deployConfigVisible: false,
      table: {
        operatingRowRecord: null
      }
    }
  },
  methods: {
    isRunningState,
    isIntermediateState,
    isLockedRunningState,
    pagingVersionInfo(pageNo = 1, limit = 10) {
      this.loading = true;
      getInferserviceVersionByIdPage(this.inferserviceInfo.id, pageNo, limit).then(res => {
        const {code, data} = res;
        if (code === 0) {
          const {records, total} = data;
          this.dataSource = records;
          this.pagination.total = total;
          this.pagination.current = pageNo;
        } else {
          this.dataSource = [];
        }
      }).finally(() => {
        this.loading = false;
      })
    },
    pageChange(page) {
      this.pagingVersionInfo(page.current, page.pageSize);
    },
    deploy(record) {
      this.deployConfigVisible = true
      this.table.operatingRowRecord = record;
    },
    handleDeployConfigOk(config) {
      const {infesvrId, versionId} = this.table.operatingRowRecord;
      if (!infesvrId) this.$message.error('服务id异常！');
      if (!versionId) this.$message.error('版本id异常！');
      this.deployConfigVisible = false;
      this.loading = true;
      addConfigForInferserviceVersion(infesvrId, versionId, config)
          .then(() => {
            this.$message.success('配置成功')
            this.$emit("onUpdate", "modify::config", config)
          })
          .catch((err) => {
            this.$message.error(err)
          })
          .finally(() => {
            this.loading = false;
          });
    },
    handleDeployConfigOkAndRun(config) {
      this.deployConfigVisible = false;
      const {infesvrId: id, currVersion, versionId, infesvrState} = this.table.operatingRowRecord;
      debugger
      if (!id) {
        this.$message.error('服务id异常！');
        return false;
      }
      if (!currVersion) {
        this.$message.error('版本id异常！');
        return false;
      }
      this.loading = true;
      let promise;
      if (this.isRunningState(infesvrState)) {
        if (currVersion === versionId) {
          promise = restartInferserviceById(id, config);
        } else {
          promise = switchInferserviceById({
            infesvrId: id,
            oldVersionId: currVersion,
            newVersionId: versionId,
            config: config,
          });
        }
      } else {
        promise = startInferserviceByIdWithVersion(id, currVersion, config);
      }
      promise?.then(
          (res) => {
            const {
              code, msg, data: {
                state
              } = {}
            } = res;
            if (code === 0) {
              this.$message.success("部署配置启动中");
              if (state) {
                const index = (this.tableData || []).findIndex(val => val.id === id);
                if (index > -1) {
                  this.tableData[index].infesvrState = state;
                }
                this.$emit("onUpdate", "modify::configAndRun", state);
              }
            } else {
              this.$message.error(`执行失败：${msg}`);
            }
          }
      ).finally(
          () => {
            this.loading = false;
          }
      );
    },
    handleDeployConfigCancel() {
      this.deployConfigVisible = false;
    },
  }
}
</script>
<style scoped>
.icons >>> .anticon-spin {
  margin-left: 6px;
  margin-bottom: 6px;
  color: #00aa00;
}
</style>