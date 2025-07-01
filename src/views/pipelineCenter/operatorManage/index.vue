<template>
  <div class="operator-manage">
    <el-tabs v-model="activeKey">
      <el-tab-pane label="算子管理" name="operator">
        <div class="space-between">
          <search-form key="operator" @search="handleSearchOp"></search-form>
          <el-button type="primary" @click="handleCreateOp" class="el-form-item el-form-item--small">新建算子</el-button>
        </div>
        <OperatorTable ref="operatorTable"></OperatorTable>
      </el-tab-pane>
      <el-tab-pane label="算子组管理" name="operatorGroup">
        <OperatorGroupTable ref="operatorGroupTable"></OperatorGroupTable>
      </el-tab-pane>
    </el-tabs>
    <!-- <component :is="activeKey" class="content-style" /> -->
  </div>
</template>

<script>
import OperatorTable from "./operatorTable";
import OperatorGroupTable from "./operatorGroupTable";
import searchForm from "./searchForm.vue";
export default {
  name: "OperatorManage",
  components: {
    OperatorTable,
    OperatorGroupTable,
    searchForm,
  },
  data() {
    return {
      activeKey: "operator",
    };
  },
  methods: {
    // 新建算子组，都是内容改造，以前的东西凑合着用吧
    handleCreateOp() {
      this.$refs.operatorTable.createOperator();
    },
    handleCreateGroup() {
      this.$refs.operatorGroupTable.isShow = true;
    },
    handleImportGroup() {
      // this.$refs.operatorGroupTable.createGroup();
      this.$message.warning("to do...")
    },
    // 检索算子列表
    handleSearchOp(formData = {}) {
      this.$refs.operatorTable.onSearch(formData);
    },
    // 检索算子组列表
    handleSearchOpGroup() {

    }
  },
  created() {

  },
};
</script>

<style lang="less" scoped>
.operator-manage {
  &::v-deep .el-tabs__nav-wrap {
    width: 170px;
  }
}
</style>