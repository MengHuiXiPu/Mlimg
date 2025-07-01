<template>
  <div class="inherit-block">
    <el-button icon="el-icon-delete" type="text"></el-button>
    <el-button type="text" @click="openDialog">继承</el-button>

    <a-modal v-model="showDialog" title="选择继承节点" @ok="handleOk" @cancel="handleCancel" :getContainer="getContainer">
      <el-cascader :options="allPreCellData" :props="{ multiple: true }" clearable v-model="inheritData"></el-cascader>
    </a-modal>
  </div>
</template>

<script>
import { useCell, useGraph } from "@pipeline/Editor/store/index.js";
import FormRow from "./fromRow.vue";
import { ref } from "vue";
import { get } from "@vueuse/core";
export default {
  data() {
    return {
      showDialog: false,
      allPreCellData: [],
      inheritData: [],
      state: {}, //状态机
    }
  },
  props: {
    /**
     * 输入端子配置项(items中的配置项)data
     */
    item: {
      type: Object,
      default: () => ({})
    },
  },
  methods: {
    /**
     * @description 
     * @param {*} opItemData  算子节点的输入端子配置项data，用来校验类型匹配及绑定
     * @return Pormise
     */
    invoke(opItemData) {
      this.setDefaultValue(opItemData)

      this.showDialog = true
      this.buildData(opItemData)
      return new Promise((resolve, reject) => {
        this.state = {
          resolve,
          reject
        }
      })
    },
    /**
     * 组装成可被el-cascader使用的数据结构
     */
    buildData(opItemData) {
      // 获取输入端子的类型，与其匹配的输出类型才可被选中
      const legalType = opItemData.varType;  //为any时，不校验，即表示无类型限制，必有值，为null的都是脏数据

      const allPreCell = this.graph.getPredecessors(this.cell)
      this.allPreCellData = allPreCell.map(cell => {
        // 获取cell 的data
        const data = cell.getData()
        // 组装成可被el-cascader使用的数据结构
        return {
          value: data.id || data.name,
          label: data._label,
          children: data.outputs.map(item => {
            return {
              value: item.varName,
              label: item.displayName || item.varName,
              // 结构体类型且可悲拆分继承再添加children
              children: (item.struct && Boolean(item.split)) ? item.struct.map(sitem => {
                return {
                  value: sitem.varName,
                  label: sitem.displayName || sitem.varName,
                  disabled: Boolean(legalType !== 'any' && sitem.varType !== 'any' && sitem.varType !== legalType)
                }
              }) : null,
              disabled: Boolean(legalType && item.varType && item.varType !== legalType)
            }
          })
        }
      })
    },
    openDialog() {
      this.invoke(this.item)
    },
    getContainer() {
      return document.getElementById('pipeline-container')
    },
    // 后台的数据千奇百怪，有null，有空的一维数组，这里set默认值 [[]]
    setDefaultValue(item) {
      if (!item.inheritVariables) {
        item.inheritVariables = [[]]
      }
      if (Array.isArray(item.inheritVariables) && item.inheritVariables.length < 1) {
        item.inheritVariables = [[]]
      }
      if (!Array.isArray(item.inheritNodeIds)) {
        item.inheritNodeIds = []
      }
    },
    handleOk() {
      this.showDialog = false
      // 关闭弹框  resolve state
      // 整合成inheritNodeIds和inheritVariables
      this.state.resolve(this.inheritData)
      console.log(this.inheritData)
    },
    handleCancel() {
      this.showDialog = false
      // 关闭弹框  reject state
      this.state.reject('canceled')
    }
  },
  setup() {
    const cell = useCell();
    const graph = useGraph();
    return {
      cell,
      graph,
    }
  }
}
</script>

<style lang="less" scoped>
.inherit-block {
  & ::v-deep .el-checkbox {
    margin-bottom: 0;
  }
}
</style>
<style>
/* lable标签被人默认设置成8px的margin-bottom,导致显示异常 */
label[class*="el-checkbox"] {
  margin-bottom: 0;
}
</style>