<template>
  <div class="search-form">
    <el-form :inline="true" :model="formData" size="small" ref="searchForm" @keyup.enter.native="handleSearch">
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入" clearable></el-input>
      </el-form-item>
      <el-form-item label="类型" prop="type">
        <el-select v-model="formData.type" placeholder="请选择" clearable>
          <!-- <el-option label="全部" :value="''"></el-option> -->
          <el-option v-for="item in opTypeList" :key="item.id" :label="item.nodeName" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="formData.status" placeholder="请选择" clearable>
          <!-- <el-option label="全部" :value="''"></el-option> -->
          <el-option v-for="item in opStatusList" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>
      </el-form-item>
      <!-- <el-form-item label="创建人">
        <el-input v-model="formData.createBy" placeholder="请输入"></el-input>
      </el-form-item> -->
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button type="primary" plain @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
    <!-- <a-form-model layout="inline" :model="formData" size="small">
      <a-form-model-item label="名称">
        <a-input v-model="formData.fieldA" placeholder="请输入" size="small" />
      </a-form-model-item>
      <a-form-model-item label="类型">
        <a-input v-model="formData.fieldB" placeholder="请选择" size="small" />
      </a-form-model-item>
      <a-form-model-item>
        <a-button type="primary" style="margin-right: 20px;" size="small">查询 </a-button>
        <a-button size="small">重置 </a-button>
      </a-form-model-item>
    </a-form-model> -->
  </div>
</template>

<script>
import Operator from "@/api/operator";
export default {
  data() {
    return {
      opTypeList: [], //算子类型列表
      // ["创建中", "正常", "异常"]
      opStatusList: [
        { label: '创建中', value: 0 },
        { label: '正常', value: 1 },
        { label: '异常', value: 2 },
      ],
      formData: {
        name: '',
        type: '',
        status: '',
        createBy: '',
      }
    }
  },
  methods: {
    handleSearch() {
      this.$emit('search', this.formData)
    },
    resetForm() {
      this.$refs.searchForm.resetFields()
      this.$nextTick(() => {
        this.$emit('search', this.formData)
      })
    },
    queryTypeList() {
      Operator.getOperatorTypeList({
        parentId: 0
      }).then((res) => {
        this.opTypeList = res.data;
      });
    }
  },
  created() {
    this.queryTypeList()
  }
}
</script>

<style lang="less" scoped></style>