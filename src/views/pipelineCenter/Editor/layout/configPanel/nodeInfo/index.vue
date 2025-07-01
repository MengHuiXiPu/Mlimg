<template>
  <div class="node-info-container scrollbar">
    <el-descriptions title="基本信息" :column="1" size="medium">
      <el-descriptions-item label="节点名称">{{ nodeData.name }}</el-descriptions-item>
      <el-descriptions-item label="别名">{{ nodeData.label }}</el-descriptions-item>
      <el-descriptions-item label="类型">{{ nodeData.typeName }}</el-descriptions-item>
      <!-- <el-descriptions-item label="编号">{{ nodeData.id }}</el-descriptions-item> -->
      <el-descriptions-item label="描述">{{ nodeData.remark || "--" }}</el-descriptions-item>
    </el-descriptions>
    <!-- 节点参数 -->
    <in-table :hasInherit="false" :tableData="nodeData.inits"
      v-if="Array.isArray(nodeData.inits) && nodeData.inits.length" key="init"></in-table>
    <!-- 输入参数 -->
    <in-table :tableData="nodeData.items" key="input"> </in-table>
    <!-- while节点配置面板 -->
    <while-config v-if="isWhile" :cell="cell"></while-config>
    <!-- python节点配置面板 -->
    <py-config v-if="isPy" :cell="cell" :nodeData="nodeData" :key="nodeData.id" ref="refPyConfig"></py-config>
    <div class="block-item" v-if="nodeData.name === 'Switch'">
      <h5 class="title">switch分支设置</h5>
      <switch-panel ref="switchPanel"></switch-panel>
    </div>
    <!-- 远程调用算子配置 -->
    <remote-call :nodeData="nodeData" v-if="nodeData.supportRemote"></remote-call>

  </div>
</template>

<script>
import { useNodeData, useCell } from "@pipeline/Editor/store/index.js";
import whileConfig from "./whileConfig.vue";
import pyConfig from "./pyConfig.vue";
import inTable from "./inTable.vue";
import SwitchPanel from "@pipeline/Editor/layout/configPanel/input/switch.vue";
import remoteCall from "./remoteCall.vue";
import { isWhileNode, isPyNode } from "@pipeline/Editor/common/cell.js";
import { computed } from "vue";
export default {
  components: {
    whileConfig,
    inTable,
    SwitchPanel,
    pyConfig,
    remoteCall,
  },
  setup() {
    const nodeData = useNodeData();
    const cell = useCell();
    const isWhile = computed(() => {
      return isWhileNode(nodeData.value)
    })
    const isPy = computed(() => {
      return isPyNode(nodeData.value)
    })
    return {
      nodeData,
      isWhile,
      isPy,
      cell,
    }
  },
}
</script>

<style lang="less" scoped>
.node-info-container {
  overflow: auto;

  &::v-deep {
    .el-descriptions__header {
      margin-bottom: 10px;
    }

    .el-descriptions__title {
      font-size: 15px;
    }

    .el-descriptions-item__label {
      min-width: 20%;
    }
  }

  .block-item {
    .title {
      color: #333333;
      font-weight: 700;
      font-size: 15px;
      margin: 15px 0;
    }
  }
}
</style>