<template>
  <div project-resource>
    <!-- 算力资源表格 -->
    <a-row :gutter="2" class="alarm-row">
      <a-col :span="3">
        <span style="font-size: 16px; font-weight: bold">算力资源</span>
      </a-col>
      <a-col :span="21">
        <a-spin :spinning="loading">
          <a-table :columns="columnsCalculate" :data-source="dataCalculate">
            <!-- 操作列 -->
            <template slot="operation" slot-scope="text, record">
              <a-button type="link" @click="showModal(record)">修改</a-button>
            </template>
          </a-table>
        </a-spin>
      </a-col>
    </a-row>

    <!-- 存储资源表格 -->
    <a-row :gutter="2" class="alarm-row">
      <a-col :span="3">
        <span style="font-size: 16px; font-weight: bold">存储资源</span>
      </a-col>
      <a-col :span="21">
        <a-spin :spinning="loading">
          <a-table :columns="columnsResource" :data-source="dataResource">
            <!-- 自定义渲染存储类型列 -->
            <template slot="storageResourceType" slot-scope="text">
              {{ text === 0 ? 'NAS存储' : text }}
            </template>
            <!-- 自定义渲染存储配额列 -->
            <template slot="storageQuota" slot-scope="text">
              {{ text }} GB
            </template>
            <!-- 自定义渲染已使用情况列 -->
            <template slot="usedQuota" slot-scope="text">
              {{ text }} GB
            </template>
          </a-table>
        </a-spin>
      </a-col>
    </a-row>

    <!-- 修改功能模块使用配置的弹框 -->
    <a-modal
        title="修改功能模块使用配置"
        :visible="visible"
        @ok="handleOk"
        @cancel="handleCancel"
    >
      <a-form-model :model="form" layout="vertical">
        <a-form-model-item label="功能模块使用配置">
          <a-select v-model="form.moduleConfig" mode="multiple" placeholder="请选择功能模块使用配置">
            <a-select-option value="数据中心">数据中心</a-select-option>
            <a-select-option value="训练中心">训练中心</a-select-option>
            <a-select-option value="服务中心">服务中心</a-select-option>
          </a-select>
        </a-form-model-item>
      </a-form-model>
    </a-modal>
  </div>
</template>

<script>
// import axios from 'axios';
import {getProjectById, updateModuleConfig} from "@/api/project";

export default {
  name: "ProjectResource",
  data() {
    return {
      // 算力资源表格列配置
      columnsCalculate: [
        {
          title: '资源名称',
          dataIndex: 'powerResourceName',
          key: 'powerResourceName',
        },
        {
          title: '资源配额大小',
          dataIndex: 'quota',
          key: 'quota',
        },
        {
          title: '功能模块使用配置',
          dataIndex: 'moduleConfig',
          key: 'moduleConfig',
        },
        {
          title: '操作',
          key: 'operation',
          scopedSlots: { customRender: 'operation' }, // 添加操作列
        }
      ],
      // 算力资源表格数据
      dataCalculate: [],

      // 存储资源表格列配置
      columnsResource: [
        {
          title: '资源名称',
          dataIndex: 'storageResourceName',
          key: 'storageResourceName',
        },
        {
          title: '存储类型',
          dataIndex: 'storageResourceType',
          key: 'storageResourceType',
          scopedSlots: { customRender: 'storageResourceType' }, // 添加自定义渲染
        },
        {
          title: '存储配额',
          dataIndex: 'storageQuota',
          key: 'storageQuota',
          scopedSlots: { customRender: 'storageQuota' }, // 添加自定义渲染
        },
        {
          title: '已使用情况',
          dataIndex: 'usedQuota',
          key: 'usedQuota',
          scopedSlots: { customRender: 'usedQuota' }, // 添加自定义渲染
        },
      ],
      // 存储资源表格数据
      dataResource: [],

      // 弹框相关数据
      visible: false,
      form: {
        moduleConfig: [],
      },
      currentRecord: null,

      // 加载状态
      loading: false,
      id: 0,
    };
  },
  mounted() {
    // 路由跳转携带参数
    this.id = this.$route.query.id;
    if (!this.id){
      // 全局变量项目变更
      this.id = this.currentProjectId
    }
    this.$store.commit('SET_CURRENT_PROJECT', this.id);
    this.fetchProjectData();
  },
  computed: {
    dataCalculate(newValue, oldValue) {
      console.log(`count changed from ${oldValue} to ${newValue}`);
    },
    currentProjectId () {
      return this.$store.getters.currentProjectId
    }
  },
  watch:{
    currentProjectId(newVal, oldVal){
      this.id = newVal
      this.fetchProjectData();
    }
  },
  methods: {
    async fetchProjectData() {
      this.loading = true; // 设置加载状态为 true
      try {
        // 调用接口获取数据
        // const response = await axios.get('/projects/getProjectById', {
        //   params: { id: this.id }, // 默认传参 id=2
        // });
        const response = await getProjectById(this.id);
        const projectData = response;

        // 处理 projectComputingPowerResourceDtoList
        const groupedData = this.groupAndMergeComputingResources(projectData.projectComputingPowerResourceDtoList || []);
        this.dataCalculate = groupedData;

        // 处理 projectStorageResourceDtoList
        this.dataResource = (projectData.projectStorageResourceDtoList || []).map(item => ({
          id: item.id,
          storageResourceName: item.storageResourceName,
          storageResourceType: item.storageResourceType,
          storageQuota: item.storageQuota, // 确保是数值类型
          usedQuota: item.usedQuota, // 确保是数值类型
        }));

      } catch (error) {
        console.error('获取项目数据失败:', error);
      } finally {
        this.loading = false; // 设置加载状态为 false
      }
    },
    groupAndMergeComputingResources(resources) {
      const grouped = {};

      resources.forEach(item => {
        const key = item.powerResourceName;

        if (!grouped[key]) {
          grouped[key] = {
            id: item.id,
            powerResourceName: key,
            quota: '',
            moduleConfig: '',
          };
        }

        let quota = '';
        let id = '';
        if (item.cpuQuota === 0 && item.memoryQuota === 0) {
          quota = `${item.gpuModel}* ${item.gpuQuota}`;
        } else {
          if((item.gpuModel===null || item.gpuModel==='') && item.gpuQuota===0){
            quota = `${item.cpuQuota}Core ${item.memoryQuota}GB`;
          }else{
            quota = `${item.cpuQuota}Core ${item.memoryQuota}GB ${item.gpuModel}* ${item.gpuQuota}`;
          }
        }

        if (grouped[key].quota) {
          grouped[key].quota += `, ${quota}`;
        } else {
          grouped[key].quota = quota;
        }

        if (item.moduleConfig && item.moduleConfig !== '') {
          if (grouped[key].moduleConfig) {
            grouped[key].moduleConfig += `, ${item.moduleConfig}`;
          } else {
            grouped[key].moduleConfig = item.moduleConfig;
          }
        }
      });

      return Object.values(grouped);
    },
    showModal(record) {
      this.currentRecord = record;
      // 将 moduleConfig 字符串转换为数组
      this.form.moduleConfig = record.moduleConfig ? record.moduleConfig.split('、').filter(config => config) : [];
      this.visible = true;
    },
    async handleOk() {
      try {
        // 将 moduleConfig 数组转换为字符串
        const moduleConfigString = this.form.moduleConfig.join('、');

        // 调用修改接口
        // const response = await axios.post('/projects/updateModuleConfig', {
        //   id: 2, // 默认传参 id=2
        //   moduleConfig: moduleConfigString,
        // });
        console.log("this.currentRecord.id = ", this.currentRecord.id)
        console.log("this.currentRecord = ", this.currentRecord)
        const response = await updateModuleConfig({
            id: this.currentRecord.id,
            moduleConfig: moduleConfigString,
          })


        if (response) {
          // 更新当前记录的 moduleConfig
          if (this.currentRecord) {
            this.currentRecord.moduleConfig = moduleConfigString;

            // 更新 dataCalculate 中对应记录的 moduleConfig
            const index = this.dataCalculate.findIndex(item => item.powerResourceName === this.currentRecord.powerResourceName);
            if (index !== -1) {
              this.dataCalculate[index].moduleConfig = moduleConfigString;
            }
          }

          // 刷新页面数据
          this.fetchProjectData();
        } else {
          console.error('修改功能模块使用配置失败:', response.message);
        }
      } catch (error) {
        console.error('修改功能模块使用配置失败:', error);
      } finally {
        this.visible = false;
      }
    },
    handleCancel() {
      this.visible = false;
    },
  },
};

</script>

<style lang="less" scoped>
.alarm-row {
  margin-bottom: 24px;
}
</style>
