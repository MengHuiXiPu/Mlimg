<template>
  <div>
    <el-row class="pading-side-3 vertical-center">
      <el-col :span="6" class="struct-row"> 起始节点：</el-col>
      <el-col :span="18">
        {{ edgeData.source.label }}
      </el-col>
    </el-row>
    <el-row class="pading-side-3 vertical-center">
      <el-col :span="6" class="struct-row"> 目标节点：</el-col>
      <el-col :span="18">
        {{ edgeData.target.label }}
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { useCell, useNodeData } from "@pipeline/Editor/store/index.js";
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
// import FormRow from "./fromRow.vue";
// import cloneDeep from "lodash/cloneDeep";
export default {
  name: "EdgePanel",
  components: {
  },
  data() {
    return {

    }
  },
  setup() {
    const cell = useCell();
    // const nodeData = useNodeData();
    const edgeData = computed(() => {
      const source = cell.value.getSourceNode()
      const sourceData = source.getData()
      const target = cell.value.getTargetNode()
      const targetData = target.getData()
      return {
        source: sourceData,
        target: targetData
      }
    })
    return {
      cell,
      edgeData,
    }
  }
}
</script>

<style lang="less" scoped>
@import "~@pipeline/Editor/layout/baseStyle.less";
</style>