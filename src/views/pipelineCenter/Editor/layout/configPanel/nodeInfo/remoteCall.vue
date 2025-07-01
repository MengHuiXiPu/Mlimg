<template>
  <div class="block-item-container">
    <h5 class="title">远程调用算子配置
      <!-- <a-tooltip :title="descObj.desc">
        <a-icon type="question-circle-o" style="vertical-align: 2px;" />
      </a-tooltip> -->
    </h5>
    <el-form size="small" :model="nodeData.special" class="remote-invoke-config-form">
      <el-form-item label="是否开启：">
        <a-switch v-model="nodeData.special.isRemote" size="small"></a-switch>
      </el-form-item>
      <el-form-item label="调用地址：">
        <el-input v-model="nodeData.special.remoteAddr" :placeholder="`请输入调用地址`" style="width: 150px;"
          :disabled="!nodeData.special.isRemote"></el-input>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  props: {
    nodeData: {
      type: Object,
      default: () => ({})
    },
  },
}
</script>

<style lang="less" scoped>
@import "./style.less";

.remote-invoke-config-form {

  &::v-deep .el-form-item--small.el-form-item,
  .el-form-item--small.el-form-item {
    margin-bottom: 0px;
  }
}
</style>