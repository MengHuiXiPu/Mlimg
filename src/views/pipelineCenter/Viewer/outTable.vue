<template>
  <div class="block-item-container">
    <h5 class="title">输出参数
      <a-tooltip title="算子的输出参数及类型">
        <a-icon type="question-circle-o" style="vertical-align: 2px;" />
      </a-tooltip>
    </h5>
    <el-table :data="tableData" row-key="varName" border default-expand-all v-bind="$attr" empty-text="暂无数据">
      <el-table-column prop="varName" label="名称" show-overflow-tooltip></el-table-column>
      <el-table-column prop="varType" label="类型" show-overflow-tooltip></el-table-column>
      <!-- <el-table-column prop="value" label="值"></el-table-column> -->
    </el-table>
  </div>
</template>

<script>
export default {
  data() {
    return {

    }
  },
  props: {
    tableData: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    tableData(val) {

    }
  }
}
</script>

<style lang="less" scoped>
@import "./style.less";
</style>