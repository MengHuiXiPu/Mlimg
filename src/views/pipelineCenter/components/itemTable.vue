<template>
  <div class="item-table-container">
    <h5 class="title">{{ title }}</h5>
    <el-table :data="items" row-key="varName" border v-bind="$attr" empty-text="暂无数据" size="mini"
      style="margin-left: 25px;" :tree-props="{ children: 'struct', hasChildren: 'hasChildren' }">
      <el-table-column prop="displayName" label="参数名称"></el-table-column>
      <el-table-column prop="varType" label="类型"></el-table-column>
      <el-table-column prop="description" label="参数说明"></el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: '参数列表'
    },
    /**
     * @description : 算子的inits/items/outputs结构配置项
     */
    items: {
      type: Array,
      default: () => ([])
    },
  },
}
</script>

<style lang="less" scoped>
.item-table-container {
  .title {
    color: #333333;
    font-weight: 700;
    font-size: 15px;
    margin: 15px 0;
  }

  &::v-deep .el-table {
    border-radius: unset;

    .el-table__header th.el-table__cell {
      padding: 6px 0;
      background-color: #f2f2f2 !important;
    }
  }
}
</style>