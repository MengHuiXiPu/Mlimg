<template>
  <div class="page-content">
    <div class="toolbar space-between">
      <el-form :inline="true" :model="searchFormData" size="small" ref="refSearchForm" @submit.native.prevent>
        <el-form-item label="名称" prop="name">
          <el-input v-model="searchFormData.name" placeholder="请输入" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="$event=>handleSearch($event)">查询</el-button>
          <el-button type="primary" plain @click="handleSearch($event, true)">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <template v-if="tabActiveKey === 1">
      <systemParams ref="systemParams" />
    </template>
    <template v-else>
      <nodeConfig ref="nodeConfig" />
    </template>
  </div>
</template>
<script>
import systemParams from './systemParams/index'
import nodeConfig from './nodeConfig/index'
import PHeader from '@/components/PHeader'
export default {
  name: "systemConfig",
  components: {
    systemParams, nodeConfig, PHeader
  },
  data () {
    return {
      loading: false,
      tableData: [],
      searchFormData: {
        name: ''
      },
      // tabList: [
      //   { key: 1, name: "系统参数配置" }
      //   // { key: 2, name: "节点权限配置" }
      // ],
      tabActiveKey: 1
    }
  },
  mounted () {
  },
  methods: {
    // tabOnChange (key) {
    //   this.tabActiveKey = key
    // },
    handCreate () {
      this.$refs.nodeConfig.handleCreate()
    },
    handReload () {
      const component = this.tabActiveKey === 1 ? 'systemParams' : 'nodeConfig'
      this.$refs[component].getDataList()
    },
    handleSearch (event, reset) {
      if(reset) {
        this.$refs.refSearchForm.resetFields()
      }
      const { name= '' } = this.searchFormData
      this.$refs.systemParams.getDataList(name)
    }
  }
}
</script>

<style scoped lang="less">
.page-content {
  .page-content {
    max-height: calc(100vh - 230px);
  }
} 
</style>
