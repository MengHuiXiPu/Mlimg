<template>
  <div class="toolbar dataset-search-form space-between">
    <!-- <a-row> -->
      <!-- <a-col :span="21"> -->
        <el-form :inline="true" :model="formData" size="small" ref="refSearchForm" @submit.native.prevent @keyup.enter.native="handleSearch">
          <el-form-item label="类型" prop="dlTagType">
            <el-select v-model="formData.dlTagType" placeholder="请选择" clearable @change="handleSearch">
              <el-option v-for="item in dlTagTypeOpt" :key="item.value" :label="item.text" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="名称" prop="dlName">
            <el-input v-model="formData.dlName" placeholder="请输入" clearable></el-input>
          </el-form-item>
          <el-form-item label="创建人" prop="createBy">
            <el-input v-model="formData.createBy" placeholder="请输入" clearable></el-input>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择" clearable @change="handleSearch">
              <el-option v-for="item in statusList" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="标签" prop="dlType">
            <el-select v-model="formData.dlType" placeholder="请选择" clearable @change="handleSearch">
              <el-option v-for="item in dlTypeList" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="$event=>handleSearch($event)">查询</el-button>
            <el-button type="primary" plain @click="handleSearch($event, true)">重置</el-button>
          </el-form-item>
        </el-form>
      <!-- </a-col> -->
      <!-- <a-col :span="3"> -->
        <span style="margin-bottom: 24px;">
          <el-button type="primary" @click="emitParentMethods('handCreate')" size="small">新建</el-button>
          <el-button v-if="!cardMode"  icon="el-icon-s-grid" @click="emitParentMethods('toggleStyle', true)" type="warning" circle title="表格风格" size="small"></el-button>
          <el-button v-else  icon="el-icon-bank-card" @click="emitParentMethods('toggleStyle', false)" type="warning" circle title="卡片风格" size="small"></el-button>
        </span>
      <!-- </a-col> -->
    <!-- </a-row> -->
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { DLTYPELIST, DSSTATUSLISTFRONT } from "./enum.js"
export default {
  data() {
    return {
      dlTypeList: DLTYPELIST,
      // 状态列表， 与rowDataStatus对应
      // rowDataStatus: ['解析中', '正常', '解析失败', '创建中', '复制中', '拆分中', '解析图片...', '转换中', '上传中', '转换失败'],
      statusList: DSSTATUSLISTFRONT,
      formData: {
        dlName: '',
        dlTagType: "", //数据集类型
        dlType: "", //标签
        status: "",
        createBy: "",
      }
    }
  },
  inject: ['parentInstance'],
  props: {
    formData: {
      type: Object,
      default: () => ({})
    },
    cardMode: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    // 接收值
    ...mapGetters([
      'dlTagTypeOpt',
    ]),
  },
  methods: {
    emitParentMethods(methodName, args) {
      // debugger
      this.parentInstance[methodName](args)
      // this.$parent[methodName](args)
    },
    handCreate() {
      this.$emit("handCreate")
    },
    handleSearch(event, reset) {
      if (reset) {
        this.$refs.refSearchForm.resetFields()
      }
      this.$emit("search")
    },
  },
}
</script>

<style lang="less" scoped>
.dataset-search-form {
  &::v-deep {
    .el-input,
    .el-select {
      max-width: 8.2vw;
    }
  }
}
</style>