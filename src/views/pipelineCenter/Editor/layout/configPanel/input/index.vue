<template>
  <div>
    <el-row type="flex" align="middle" class="pading-side-3 config-row" v-if="isNode">
      <el-col :span="6">名称</el-col>
      <el-col :span="18">
        {{ nodeData._label }}
      </el-col>
    </el-row>
    <el-row type="flex" align="middle" class="pading-side-3 config-row"
      v-if="isNode && !['start', 'end'].includes(nodeData.name)">
      <el-col :span="6">设为断点</el-col>
      <el-col :span="18">
        <a-switch v-model="nodeData._breakpoint" size="small" @change="doSetBreakpoint"></a-switch>
      </el-col>
    </el-row>
    <template v-if="isNode">
      <switch-panel v-if="nodeData.name === 'Switch'" ref="switchPanel"></switch-panel>
      <!-- 使用弹框方式配置，这里先屏蔽 -->
      <!-- <template v-else>
        <form-row v-for="(item, index) in nodeData.items" :item="item" hasInherit></form-row>
        <form-row v-for="(item, index) in nodeData.inits" :item="item" :hasInherit="false"></form-row>
      </template> -->

    </template>
    <!-- 边的信息展示 -->
    <template v-if="isEdge">
      <edge-panel></edge-panel>
    </template>
  </div>
</template>

<script>
import { useNodeData, useCell } from "@pipeline/Editor/store/index.js";
// import FormRow from "./fromRow.vue";
import { ref, computed } from "vue";
import SwitchPanel from "./switch.vue";
import EdgePanel from "./edge.vue";
import { setBreakpoint } from "@pipeline/Editor/common/cell.js";
export default {
  components: {
    // FormRow,
    SwitchPanel,
    EdgePanel,
  },
  setup() {
    const nodeData = useNodeData();
    const cell = useCell()
    const formData = ref({})
    const isNode = computed(() => {
      return typeof (cell.value.isNode) === "function" ? cell.value.isNode() : false
    })
    const isEdge = computed(() => {
      return typeof (cell.value.isEdge) === "function" ? cell.value.isEdge() : false
    })
    const doSetBreakpoint = (value) => {
      setBreakpoint(cell.value, value)
    }
    return {
      nodeData: nodeData,
      cell,
      formData,
      isNode,
      isEdge,
      doSetBreakpoint,
    }
  }
}
</script>

<style lang="less" scoped>
@import "~@pipeline/Editor/layout/baseStyle.less";
</style>