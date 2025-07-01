<template>
  <div resource-detail>
    <!-- 算力资源表格 -->
    <a-row :gutter="2" class="alarm-row">
      <a-col :span="3">
        <span style="font-size: 16px; font-weight: bold">算力资源</span>
      </a-col>
      <a-col :span="21">
        <a-table :columns="columnsCalculate" :data-source="dataCalculate"/>
      </a-col>
    </a-row>

    <!-- 存储资源表格 -->
    <a-row :gutter="2" class="alarm-row">
      <a-col :span="3">
        <span style="font-size: 16px; font-weight: bold">存储资源</span>
      </a-col>
      <a-col :span="21">
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
      </a-col>
    </a-row>
  </div>
</template>

<script>
// import axios from 'axios';

import {getPersonalProjectById} from "@/api/project";

export default {
  name: "ResourceDetail",
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
        },
        {
          title: '已使用情况',
          dataIndex: 'usedQuota',
          key: 'usedQuota',
        },
      ],
      // 存储资源表格数据
      dataResource: [],
    };
  },
  created() {
    this.fetchProjectData();
  },
  methods: {
    async fetchProjectData() {
      try {
        // 调用接口获取数据
        // const response = await axios.get('/projects/getPersonalProjectById');
        const response = await getPersonalProjectById();
        const projectData = response;
        this.dataCalculate.push(projectData.personalPowerResourceDto);
        this.dataResource.push(projectData.personalStorageResourceDto);
        this.loading = false;

      } catch (error) {
        console.error('获取项目数据失败:', error);
      }
    },
  },
};

</script>

<style lang="less" scoped>
.alarm-row {
  margin-bottom: 24px;
}
</style>



