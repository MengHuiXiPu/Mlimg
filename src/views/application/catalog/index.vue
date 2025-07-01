<template>
  <div class="page-content">
    <div class="toolbar space-between">
      <el-form :inline="true" :model="searchFormData" size="small" ref="refSearchForm">
        <el-form-item label="服务名称" prop="name"
                      :rules="[{type: 'string', pattern: /^[a-z-_0-9\u4e00-\u9fa5]+$/i, message: '非法字符', trigger: 'blur' }]">
          <el-input v-model="searchFormData.name" placeholder="请输入" clearable/>
        </el-form-item>
        <el-form-item label="创建人" prop="createdBy"
                      :rules="[{type: 'string', pattern: /^[a-z-_0-9\u4e00-\u9fa5]+$/i, message: '非法字符', trigger: 'blur' }]">
          <el-input v-model="searchFormData.createdBy" placeholder="请输入" clearable/>
        </el-form-item>
        <el-form-item label="服务状态" prop="status">
          <el-select v-model="searchFormData.status" placeholder="请选择"
                     :rules="[{type: 'integer', message: '非法', trigger: 'blur' }]" class="search-status">
            <el-option :value="-1" label="全部状态"/>
            <el-option-group
                v-for="group in canSelectedStatus"
                :key="group.label"
                :label="group.label"
            >
              <el-option
                  v-for="item in group.options"
                  :key="item.key"
                  :label="item.label"
                  :value="item.value">
              </el-option>
            </el-option-group>

          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handSearch">查询</el-button>
          <el-button type="primary" plain @click="handReload">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <a-table
        v-resize
        :rowKey="(record) => record.id"
        :columns="columns"
        :data-source="tableData"
        @change="tableDataChange"
        :loading="loading"
        :pagination="pagination.total > 10 ? pagination : false"
    >
      <template #name="text, record" :title="text">
        <a @click="toDetail(record)">
          {{ record.infesvrName }}
        </a>
      </template>
      <template #currVersionInfo="text, record" :title="text">
        {{ record.currVersionInfo?.versionName || '--' }}
      </template>
      <template #source="text, record" :title="text">
        {{ record.currVersionInfo?.appType === 0 ? "模型仓库" : "方案中心" }}
      </template>
      <template #configInfo="text, record" :title="text">
        {{ resourceSpecFormat(record.currVersionInfo?.simpleConfigInfo) }}
      </template>
      <template #taskStatusName="record">
        <run-state :state="record.infesvrState" :inferservice-id="record?.id" @refreshed="handleRowRefreshed"/>
      </template>
      <template #updateTime="record">
        {{ record.updateTime | moment }}
      </template>
      <template #createTime="record">
        {{ record.createTime | moment }}
      </template>
      <template #operate="record, text, index">
            <span>
              <a :disabled="!startEnable(record?.infesvrState)" @click="startTask(record)">启动服务</a>
              <a-divider type="vertical"/>
              <a :disabled="!stopEnable(record?.infesvrState)" @click="stopTask(record)">停止服务</a>
              <a-divider type="vertical"/>
              <a :disabled="isIntermediateState(record?.infesvrState) || isLockedRunningState(record?.infesvrState)" @click="handleDeployConfig(record)">部署配置</a>
              <a-divider type="vertical"/>
              <a-dropdown :trigger="['click']">
              <a
                  class="ant-dropdown-link"
                  @click="(e) => e.preventDefault()"
                  style="margin-left: 5px"
              >
                更多
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="2">
                    <a :disabled="!switchEnable(record?.infesvrState, record)"
                       @click="versionSwitch(record)">版本切换</a>
                  </a-menu-item>
                  <a-menu-item key="3">
                    <a :disabled="!rollbackEnable(record?.infesvrState, record)"
                       @click="versionRollback(record)">版本回滚</a>
                  </a-menu-item>
                  <a-menu-item key="4">
                    <a :disabled="!deletedEnable(record?.infesvrState, record)" @click="handleDelete(record, index)">删除任务</a>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
            </span>
      </template>
      <template #createTimeFilter="{ confirm, clearFilters }"
                style="padding: 10px">
        <div>
          <a-range-picker
              v-model="createTimeFilter"
              :show-time="{ format: 'HH:mm:ss' }"
              format="YYYY-MM-DD HH:mm:ss"
              :placeholder="['开始时间', '结束时间']"
              @ok="() => filterCreateTime(confirm)"
          />
          <a-button
              type="primary"
              size="small"
              @click="filterClearCreateTime(clearFilters)"
          >重置
          </a-button>
        </div>
      </template>
      <template #updateTimeFilter="{ confirm }">
        <div style="padding: 10px">
          <a-range-picker
              v-model="updateTimeFilter"
              :show-time="{ format: 'HH:mm:ss' }"
              format="YYYY-MM-DD HH:mm:ss"
              :placeholder="['开始时间', '结束时间']"
              @ok="() => filterUpdateTime(confirm)"
          />
          <a-button
              type="primary"
              size="small"
              @click="filterClearUpdateTime(clearFilters)"
          >重置
          </a-button>
        </div>
      </template>
    </a-table>
    <deploy-config-on-base
        :visible="deployConfigVisible"
        @confirm="handleDeployConfigOk"
        @cancel="handleDeployConfigCancel"
        @confirm:run="handleDeployConfigOkAndRun"
    />
    <deploy-config-on-switch
        :row-data="table.operatingRowRecord"
        :visible.sync="versionSwitchVisible"
        @confirm="versionSwitchOk"
        @cancel="versionSwitchCancel"
    />
    <deploy-config-on-start
        :row-data="table.operatingRowRecord"
        v-if="startTaskVisible"
        @confirm="startTaskOk"
        @cancel="startTaskCancel"
    />
    <roll-back
        :row-data="table.operatingRowRecord"
        v-if="versionRollbackVisible"
        :visible.sync="versionRollbackVisible"
        @confirm="versionRollbackOk"
        @cancel="versionRollbackCancel"
    />
  </div>
</template>
<script>
import {mixinHeader} from "@/utils/mixin";
import {getParams} from "@/utils/util";
import splitPane from "vue-splitpane";
import {
  editApplicationcenterName,
  editApplicationcenter,
  inferenceTaskStartOrStop,
  changeTaskStatusToAll,
  listInferserviceInfo,
  deleteInferserviceById,
  addConfigForInferserviceVersion,
  stopInferserviceById,
  startInferserviceByIdWithVersion,
  switchInferserviceById, restartInferserviceById,
} from "@/api/appCenter";
import taskLog from "./taskLog";
import moveNode from "./moveNode";
import bus from "@/utils/bus";
import moment from "moment";
import StepLayout from "@/components/StepLayout";
import DeployConfigOnBase from "./widgets/DeployConfigOnBase.vue";
import DeployConfigOnSwitch from "./widgets/DeployConfigOnSwitch.vue";
import DeployConfigOnStart from "./widgets/DeployConfigOnStart.vue";
import RollBack from "./widgets/RollBack.vue";
import * as utils from "./utils";
import createTree from "@/components/tree/createTree";
import RunState from "./widgets/RunState";

import {RunningStateEnum} from "@/views/application/catalog/constants";
import isEmpty from "lodash/isEmpty";


export default {
  name: "CataLog",
  mixins: [mixinHeader],
  components: {
    tree: () => ({component: import("@/components/tree")}),
    addEditDialog: () => ({component: import("./addEditDialog")}),
    addEditDialogGroup: () => ({component: import("./addEditDialogGroup")}),
    addFormTask: () => ({component: import("./addFormTask")}),
    "split-pane": splitPane,
    taskLog,
    moveNode,
    StepLayout,
    createTree,
    DeployConfigOnBase,
    DeployConfigOnSwitch,
    DeployConfigOnStart,
    RunState,
    RollBack,
  },
  data() {
    return {
      canSelectedStatus: RunningStateEnum.VALUES.filter(el => el !== RunningStateEnum.DELETED).reduce((pv, cv) => {
        const group = (pv[cv.group] = (pv[cv.group] || {
          key: cv.group,
          label: cv.group,
        }));
        (group.options = (group.options || [])).push(
            {
              key: cv.code,
              value: cv.code,
              label: cv.description
            }
        );
        return pv;
      }, {}),
      loading: false,
      changeModeVisible: false,
      deployConfigVisible: false,
      versionSwitchVisible: false,
      versionRollbackVisible: false,
      startTaskVisible: false,
      renameVisible: false,
      flags: {
        startButtonDisabled: false,
        stopButtonDisabled: false,
      },
      dlTagTypeFilter: {},
      tableData: [],
      tabActiveKey: 0,
      // columns: ,
      total: 0,
      changeUploadVisible: false,
      // 表单数据
      rowData: {
        file: null,
        taskName: "",
        storedDirId: "",
        storedDirName: "",
        description: "",
      },
      versionList: [],
      rules: {
        taskName: [
          {
            required: true,
            message: "请选择文件",
            trigger: "blur",
          },
        ],
        storedDirName: [
          {required: true, message: "请选择存放目录!", trigger: "change"},
        ],
      },
      treeData: [],
      pagination: {
        total: 0,
        pageSize: 10,
        current: 1,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "30", "50"],
        showTotal: function (total) {
          return `共 ${total} 条`;
        },
        searchFilter: {},
      },
      treeApi: {
        search: "getAppTaskTreeList",
        add: "savaAppTaskTreeList",
        edit: "editAppTaskTreeList",
        delete: "deleteAppTaskTreeList",
      },
      tabList: [
        {key: 0, name: "任务列表"},
        {key: 1, name: "任务组", auth: "task-list"},
      ],
      search: "",
      name: "",
      mode: "",
      allData: {},
      makeAllType: false,
      statusList: [
        {
          text: "未配置",
          value: "未配置",
          id: 0,
        },
        {
          text: "未启动",
          value: "下线",
          id: 1,
        },
        {
          text: "已启动",
          value: "上线",
          id: 2,
        },
        {
          text: "服务启动中",
          value: "服务启动中",
          id: 3,
        },
        {
          text: "服务异常终止",
          value: "服务异常终止",
          id: 4,
        },
      ],
      runningMode: [
        {
          text: "正式模式",
          value: "正式模式",
          id: 1,
        },
        {
          text: "测试模式",
          value: "测试模式",
          id: 2,
        },
      ],
      createTimeFilter: [],
      updateTimeFilter: [],
      filterType: {
        taskStatus: null,
        taskMode: null,
        createStartTime: null,
        createEndTime: null,
        updateStartTime: null,
        updateEndTime: null,
      },
      filter: {},
      uid: null,
      searchFormData: {
        name: '',
        createdBy: '',
        status: -1,
      },

      //部署配置
      deployConfig: {
        previousVersion: 'v0.2',
        currentVersion: 'v0.3',
        switchVersion: null,

        totalCore: 48,
        totalMemory: 128,
        CardType: 'P100',
        vram: 32,
        totalCardQty: 4,
        availableCore: 24,
        availableMemory: 64,
        availableVram: 32,
        availableCardQty: 2,

        resourcePool: null,
        resourceType: null,
        resourceSpn: null,
        fixedQuota: null,
        customQuota: {
          core: null,
          memory: null,
          card: null,
          vram: null
        },
        quotaQty: null,
        dataSource: null
      },
      radioStyle: {
        display: 'block',
        height: '30px',
        lineHeight: '30px',
      },

      // add by liuzhi
      table: {
        operatingRowRecord: {},
      },
      startVersionId: null,
    };
  },
  watch: {},
  computed: {
    columns() {
      return [
        {
          title: (
              <div>{this.tabActiveKey === 0 ? "服务名称" : "任务组名称"}</div>
          ),
          key: "infesvrName",
          ellipsis: true,
          scopedSlots: {customRender: "name"},
          width: "15%",
        },
        {
          title: "当前版本",
          width: 75,
          key: "currVersionInfo",
          scopedSlots: {customRender: "currVersionInfo"},
        },
        {
          title: "版本数量",
          width: 75,
          dataIndex: "versionCount",
        },
        {
          title: "服务状态",
          align: "center",
          key: "taskStatusName",
          // filters: this.statusList,
          // filterMultiple: false,
          width: 90,
          scopedSlots: {customRender: "taskStatusName"},
        },
        {
          title: "来源",
          width: 75,
          key: "source",
          scopedSlots: {customRender: "source"},
        },
        {
          title: "资源规格",
          width: 75,
          key: "configInfo",
          scopedSlots: {customRender: "configInfo"},
        },
        {
          title: "创建人",
          width: 75,
          dataIndex: "createBy",
        },
        {
          title: "创建时间",
          scopedSlots: {
            customRender: "createTime",
            //filterDropdown: "createTimeFilter",
          },
          filtered: this.filter.createStartTime && this.filter.createEndTime,
          // filterDropdownVisible: true,
          width: 180,
          key: "createTime",
          // align:  "center"
        },
        {
          title: "修改时间",
          scopedSlots: {
            customRender: "updateTime",
            //filterDropdown: "updateTimeFilter",
          },
          filtered: this.filter.updateStartTime && this.filter.updateEndTime,
          // filterDropdownVisible: true,
          width: 180,
          key: "updateTime",
          // align:  "center"
        },
        {
          title: "操作",
          key: "operate",
          width: 90,
          scopedSlots: {customRender: "operate"},
          align: "center",
        },
      ];
    },
  },
  beforeDestroy() {
    bus.$off("reloadTask");
  },
  mounted() {
    bus.$on("reloadTask", () => {
      this.getDataList({isFirst: true});
    });
    this.getDataList();
  },
  methods: {
    ...utils,
    toDetail(rowData) {
      this.$router.push({
        path: "/application/catalog/detail",
        query: {
          id: rowData.id,
        },
      });
    },
    handReload() {
      this.$refs.refSearchForm.resetFields();
      this.handSearch();
    },
    handSearch() {
      this.pagination.current = 1;
      this.$refs.refSearchForm.validate((valid) => {
        if (valid) {
          this.getData(undefined, {
            infesvrName: this.searchFormData.name || null,
            infesvrState: this.searchFormData.status > -1 ? this.searchFormData.status : null,
            createBy: this.searchFormData.createdBy || null,
          });
        } else {
          return false;
        }
      });
    },
    getDataList(params) {
      this.getData(params);
      // this.setTimer(this.getData, params, 15 * 1000)
    },
    async getData(param, searchFilter = {}) {
      if (isEmpty(searchFilter)) {
        this.$refs.refSearchForm.resetFields();
      }
      const params = getParams(param, this, "catalog");
      if (param?.isFirst) {
        delete params.nodeId;
        delete params.nodeCode;
      }
      params.nodeId = 0;
      Object.assign(params, {...this.filterType, ...searchFilter});
      const responseData = await listInferserviceInfo(params);
      if (responseData.code === 0) {
        this.loading = false;
        this.uid = responseData.msg || null;
        this.tableData = responseData.data.records;
        this.pagination.total = responseData.data.total;
        this.pagination.searchFilter = searchFilter;
        this.total = responseData.data.total;
        clearTimeout(this.timer);
        if (this.tableData.filter((item) => item.taskStatus === 3).length > 0) {
          this.setTimeOut(this.getData, param, 15 * 1000);
        }
      }
    },
    tableDataChange(pagination, filters) {
      this.filter = JSON.parse(JSON.stringify(filters));
      const {createStartTime, createEndTime, updateStartTime, updateEndTime} =
          filters;
      this.filterType = {
        taskStatus:
            filters?.taskStatusName && filters.taskStatusName.length > 0
                ? this.statusList.filter(
                    (item) => filters.taskStatusName[0] === item.value
                )[0].id
                : null,
        taskMode:
            filters?.taskModelName && filters.taskModelName.length > 0
                ? this.runningMode.filter(
                    (item) => filters.taskModelName[0] === item.value
                )[0].id
                : null,
        createStartTime,
        createEndTime,
        updateStartTime,
        updateEndTime,
      };
      this.getData({
        pageSize: pagination.pageSize,
        pageIndex: pagination.current,
      }, pagination.searchFilter);
      this.pagination.pageSize = pagination.pageSize;
      this.pagination.current = pagination.current;
    },
    async handleModeOk() {
      const params = {
        taskModel: this.mode,
        id: this.allData.configId,
      };
      const data = await editApplicationcenter(params);
      if (data.code === 0) {
        this.getDataList({
          taskName: this.taskName,
          pageSize: this.pagination.pageSize,
          pageIndex: this.pagination.current,
        });
        this.$message.success("修改成功！");
      }
      this.changeModeVisible = false;
    },
    async handleRenameOk() {
      const data = await editApplicationcenterName({
        id: this.allData.id,
        taskName: this.name,
      });
      if (data.code === 0) {
        this.getDataList({
          pageSize: this.pagination.pageSize,
          pageIndex: this.pagination.current,
        });
        this.$message.success("修改成功！");
      }
      this.renameVisible = false;
    }, //确认重命名时触发
    async handleChange(rowData, index) {
      const {configId, id, taskStatus} = rowData;
      if (taskStatus === 4) {
        return false;
      }
      const params = {
        configId,
        taskId: id,
      };
      // 任务状态为1，当前是下线状态，可以上线
      const type =
          taskStatus === 1 ? "inferenceTaskStart" : "inferenceTaskStop";
      const data = await inferenceTaskStartOrStop(type, params);
      if (data.code === 0) {
        this.getDataList({
          pageSize: this.pagination.pageSize,
          pageIndex: this.pagination.current,
        });
        this.$message.success("修改成功！");
      }
    },
    handleDelete(rowData, index) {
      const that = this;
      this.$confirm({
        content: `确定要删除 ${rowData.infesvrName} 吗?`,
        cancelText: "取消",
        okText: "确定",
        onOk() {
          deleteInferserviceById(rowData.id).then((res) => {
            if (res.code === 0) {
              that.$message.success("删除成功!");
              if (that.tableData.length === 1 && that.pagination.total !== 1)
                that.pagination.current--;
              that.getDataList({
                pageSize: that.pagination.pageSize,
                pageIndex: that.pagination.current,
              });
            }
          });
        },
        onCancel() {
        },
      });
    },
    async makeAllFun(type) {
      this.makeAllType = false;
      this.loading = true;
      const getData = type
          ? changeTaskStatusToAll.startAllTask
          : changeTaskStatusToAll.stopAllTask;
      const res = await getData();
      this.loading = false;
      if (res.code !== 0) return false;
      this.$message.success("操作成功");
      this.getDataList({isFirst: true});
    },
    beforeUpload(file) {
      this.rowData.taskName = file.name.split(".")[0];
      this.rowData.file = file;
      return false;
    },
    filterCreateTime(confirm) {
      const startTime = moment(this.createTimeFilter[0]).format(
          "YYYY-MM-DD hh:mm:ss"
      );
      const endTime = moment(this.createTimeFilter[1]).format(
          "YYYY-MM-DD hh:mm:ss"
      );
      this.$set(this.filter, "createStartTime", startTime);
      this.$set(this.filter, "createEndTime", endTime);
      this.tableDataChange(this.pagination, this.filter);
      confirm();
    },
    filterUpdateTime(confirm) {
      const startTime = moment(this.updateTimeFilter[0]).format(
          "YYYY-MM-DD hh:mm:ss"
      );
      const endTime = moment(this.updateTimeFilter[1]).format(
          "YYYY-MM-DD hh:mm:ss"
      );
      this.$set(this.filter, "updateStartTime", startTime);
      this.$set(this.filter, "updateEndTime", endTime);
      this.tableDataChange(this.pagination, this.filter);
      confirm();
    },
    filterClearCreateTime(clearFilters) {
      this.$set(this.filter, "createStartTime", null);
      this.$set(this.filter, "createEndTime", null);
      this.tableDataChange(this.pagination, this.filter);
      clearFilters();
    },
    filterClearUpdateTime(clearFilters) {
      this.$set(this.filter, "updateStartTime", null);
      this.$set(this.filter, "updateEndTime", null);
      this.tableDataChange(this.pagination, this.filter);
      clearFilters();
    },
    handleDeployConfig(rowData) {
      this.allData = {...rowData};
      this.$nextTick(() => {
        this.table.operatingRowRecord = rowData;
        this.deployConfigVisible = true
      });
    },
    handleDeployConfigOk(config) {
      const {id, currVersion} = this.table.operatingRowRecord;
      if (!id) this.$message.error('服务id异常！');
      if (!currVersion) this.$message.error('版本id异常！');
      this.deployConfigVisible = false;
      this.loading = true;
      addConfigForInferserviceVersion(id, currVersion, config)
          .then((res) => {
            const {code, msg} = res;
            if (code === 0) {
              this.$message.success('配置成功');
            } else {
              this.$message.error(msg);
            }
            if (this.tableData.length === 1 && this.pagination.total !== 1)
              this.pagination.current--;
            this.getDataList({
              pageSize: this.pagination.pageSize,
              pageIndex: this.pagination.current,
            });
          })
          .catch((err) => {
            this.$message.error(err)
          })
          .finally(() => {
            this.loading = false;
          });
    },
    handleDeployConfigOkAndRun(config) {
      const {id, currVersion} = this.table.operatingRowRecord;
      if (!id) this.$message.error('服务id异常！');
      if (!currVersion) this.$message.error('版本id异常！');
      this.deployConfigVisible = false;
      this.loading = true;
      // 服务运行中进行部署配置则说明是进行了重启加配置
      /** @type {Promise} **/
      let promise;
      if (this.isRunningState(this.table.operatingRowRecord?.infesvrState)) {
        promise = restartInferserviceById(id, config);
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
                const index = this.tableData.findIndex(val => val.id === id);
                if (index > -1) {
                  this.tableData[index].infesvrState = state;
                }
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
    versionSwitch(rowData) {
      this.$nextTick(() => {
        this.versionSwitchVisible = true
        this.table.operatingRowRecord = rowData;
      });
    },
    versionRollback(rowData) {
      this.table.operatingRowRecord = rowData;
      this.versionRollbackVisible = true;
    },
    versionSwitchOk(form) {
      this.loading = true;
      switchInferserviceById({...form}).then(
          (res) => {
            const {code, msg} = res;
            if (code === 0) {
              this.$message.success("切换服务中");
            } else {
              this.$message.error(`切换失败：${msg}`);
            }
            if (this.tableData.length === 1 && this.pagination.total !== 1)
              this.pagination.current--;
            this.getDataList({
              pageSize: this.pagination.pageSize,
              pageIndex: this.pagination.current,
            });
          }
      ).finally(
          () => {
            this.loading = false;
          }
      );
    },
    versionSwitchCancel(reason) {
      console.log(reason);
    },
    versionRollbackOk({infesvrId, fromVersionId, toVersionId}) {
      this.loading = true;
      switchInferserviceById({infesvrId, oldVersionId: fromVersionId, newVersionId: toVersionId}).then(
          (res) => {
            const {code, msg} = res;
            if (code === 0) {
              this.$message.success("回滚服务中");
            } else {
              this.$message.error(`回滚失败：${msg}`);
            }
            if (this.tableData.length === 1 && this.pagination.total !== 1)
              this.pagination.current--;
            this.getDataList({
              pageSize: this.pagination.pageSize,
              pageIndex: this.pagination.current,
            });
          }
      ).finally(
          () => {
            this.loading = false;
          }
      );
    },
    versionRollbackCancel() {
    },
    startTask(record) {
      this.table.operatingRowRecord = record;
      this.startTaskVisible = true;
    },
    startTaskOk({id, versionId, config}) {
      this.loading = true;
      this.startTaskVisible = false;
      startInferserviceByIdWithVersion(id, versionId, config).then(
          (res) => {
            const {code, msg} = res;
            if (code === 0) {
              this.$message.success("启动服务中");
            } else {
              this.$message.error(`启动失败：${msg}`);
            }
            if (this.tableData.length === 1 && this.pagination.total !== 1)
              this.pagination.current--;
            this.getDataList({
              pageSize: this.pagination.pageSize,
              pageIndex: this.pagination.current,
            });
          }
      ).finally(
          () => {
            this.loading = false;
          }
      );
    },
    startTaskCancel() {
      this.startTaskVisible = false
    },
    stopTask(record) {
      this.$confirm({
        title: '停止服务',
        content: '服务正在运行中，请确认是否停止服务？服务停止后，服务将无法被使用',
        okText: '确认',
        cancelText: '取消',
        onOk: () => {
          this.loading = true;
          stopInferserviceById(record.id).then((res) => {
            const {code, msg} = res;
            if (code === 0) {
              this.$message.success("执行停止中");
            } else {
              this.$message.error(`停止失败：${msg}`);
            }
            if (this.tableData.length === 1 && this.pagination.total !== 1)
              this.pagination.current--;
            this.getDataList({
              pageSize: this.pagination.pageSize,
              pageIndex: this.pagination.current,
            });
          }).finally(() => this.loading = false)
        },
        onCancel() {
          // 在这里执行取消后的逻辑
        },
      });
    },
    handleRowRefreshed(newRow) {
      const index = this.tableData.findIndex(val => val.id === newRow?.id);
      if (index > -1) {
        this.$set(this.tableData, index, newRow);
      }
    }
  },
};
</script>

<style scoped lang="less">
@import "~@/config/theme.less";

.toolbar {
  &::v-deep .el-select .el-input {
    width: 80px;
  }

  &::v-deep .input-with-select .el-input-group__prepend {
    background-color: #fff;
  }
}

/deep/ .step-content .rightOffline {
  background-color: transparent !important;
}

.mainContent {
  padding: 0;
}

.content {
  display: flex;
  flex: 1;

  .left {
    width: 200px;
    border-right: 2px solid #e6e7ea;
    padding-left: 12px;
    padding-right: 12px;
    max-height: calc(100vh - 160px);
    overflow: auto;
  }

  .right {
    flex: 1;
  }
}

.new-row {
  position: absolute;
  top: 0px;
  right: 0px;
}

.search-header {
  margin-bottom: 10px;
}

.slot-name {
  margin-left: 20px;
  display: flex;

  .name {
    text-align: center;
    margin-right: 10px;
    line-height: 32px;
    color: #09102f;
  }

  .ant-input,
  .ant-select {
    width: 350px;
  }
}

.redColor {
  color: red;
}

.blueColor {
  color: blue;
}

/deep/ .splitter-pane.vertical.splitter-paneR {
  min-height: 100%;
  height: auto;
  border-left: 1px solid rgba(0, 0, 0, 0.2);
}

/deep/ .vue-splitter-container {
  min-height: calc(100vh - 168px);
}

.search-status /deep/ .el-input {
  width: 120px !important;
}

</style>
