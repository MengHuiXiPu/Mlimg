<template>
  <a-modal v-model="visible" :title="groupCellData.name" @ok="handleOk" @cancel="handleCancel" width="70%"
    :getContainer="getContainer" class="config-modal" okText="确定" :keyboard="false">
    <div id="op-group-container">

    </div>
  </a-modal>
</template>

<script>
import { initGroupView } from "@pipeline/Editor/common/graph.js";
// import { matchRequestMethod } from "@pipeline/Editor/common/request.js";
import Operator from "@/api/operator";
export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // 算子组数据
    groupCellData: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  methods: {
    getContainer() {
      return document.getElementById('pipeline-container')
    },
    handleCancel() {
      this.$emit("update:visible", false)
    },
    handleOk() {
      this.$emit("update:visible", false)
    },
    queryData() {
      Operator.getOperatorGroupTemplateInfoById(this.groupCellData.opGroupId).then((res) => {
        if (res.code === 0) {
          const targetEle = document.getElementById('op-group-container')
          initGroupView(targetEle, res.data.graph)
        }
      })
    }
  },
  mounted() {
    this.queryData()
  }
}
</script>

<style lang="less" scoped>
#op-group-container {
  width: 100%;
  height: 60vh;
}
</style>