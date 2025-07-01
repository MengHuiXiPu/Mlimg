<template>
  <a-tree-select
    :value = "internalValue"
    :style="`width: ${width}`"
    :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
    :tree-data="treeData"
    placeholder="请选择目录"
    :load-data="onLoadData"
    @change="hanldeSelected"
    :size="$attrs.size || 'small'"
    v-bind="$attrs"
  />
</template>

<script>
/**
 * 目录下拉选择树组件(整合模型目录和数据集目录后的)
 * 可使用v-model绑定value，也可不使用v-model，通过change事件拿到完整的选中的node数据
 */
import { getModelTreeList } from "@/api/dataCenter.js"
export default {
  name: 'dictSelectTree',
  data() {
    return {
      // 为了可以不使用v-model而存在
      internalValue: this.value,
      treeData: []
    }
  },
  watch: {
    value(newValue) {
      this.internalValue = newValue;
    }
  },
  props: {
    // 对象类型
    value: {
      type: [String, Number],
      default: null
    },
    width: {
      type: String,
      default: '180px'
    },
    // 使用界面存在弹框交互，该弹框里会改动目录树，故存在刷新需求，所以每次focus都要重新加载最新的treedata目录数据
    // focus不需要刷新则配置为false
    // focusReload: {
    //   type: Boolean,
    //   default: true
    // },
  },
  methods: {
    // 初始化时，加载第一层节点
    loadLevel0Data() {
      this.treeData = []
      getModelTreeList({ parentId: "0" }).then(res => {
        if (res.code === 0) {
          // this.treeData = []
          this.$nextTick(() => {
            this.treeData = this._buildTreeNode(res.data)
          })
        }
      })
    },
    // 异步加载子节点
    onLoadData(treeNode) {
      const { id, nodeCode } = treeNode.dataRef
      const query = {
        parentId: id,
        parentCode: nodeCode
      }
      return getModelTreeList(query).then(res => {
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          treeNode.dataRef.children = this._buildTreeNode(data)
          this.treeData = [...this.treeData]
        }
      })
    },
    // 修改接口数据以满足组件tree-data格式
    _buildTreeNode (data = []) {
      return data.map(item => {
        const { nodeName, nodeCode, id, childNodeNum } = item
        return {
          id,
          value: id,
          title: nodeName,
          nodeCode,
          nodeId: id,
          isLeaf: childNodeNum === 0,
        }
      })
    },
    hanldeSelected(value, label, extra) {
      this.internalValue = value;
      const selectObj = value ? extra?.triggerNode?.dataRef || {} : {}
      this.$emit('input', value)
      this.$emit('change', selectObj)
    },
    /**
     * @public
     * 手动清空选中(当不使用v-model时使用)
     */
    clearValue() {
      this.internalValue = null
    },
    // handleFocus() {
      // if(this.focusReload) {
        // this.loadLevel0Data()
      // }
    // }
  },
  created () {
    this.loadLevel0Data()
  }
}
</script>

<style lang="less" scoped>

</style>