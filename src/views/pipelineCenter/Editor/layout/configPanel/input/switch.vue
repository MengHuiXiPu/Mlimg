<template>
  <div>
    <form-row v-for="(item, index) in nodeData.items" :item="item" hasInherit :key="item.varName"></form-row>
    <!--switch的init配置  -->
    <template v-if="nodeData.inits[0]">
      <el-row v-for="(struct, structIndex) in nodeData.inits[0].structs" class="pading-side-3 vertical-center"
        :key="structIndex">
        <el-col :span="6" class="struct-row"
          :title="nodeData.inits[0].description || nodeData.inits[0].displayName || nodeData.inits[0].varName">
          <p class="single-line-ellipsis">{{ nodeData.inits[0].displayName || nodeData.inits[0].varName }}</p>
          <p class="struct-index">{{ `分支(${structIndex + 1})` }}</p>
        </el-col>
        <el-col :span="18" class="struct-border">
          <el-row class="vertical-center">
            <el-col :span="22">
              <form-row v-for="(structItem, index) in struct" :item="structItem" :hasInherit="false"
                :key="structItem.varName"></form-row>
            </el-col>
            <el-col :span="2">
              <el-button icon="el-icon-plus" type="text" block size="mini" @click="doAddCondition(struct)"
                title="点击+增加case"></el-button>
              <el-button icon="el-icon-minus" type="text" block size="mini"
                @click="doDeleteCondition(struct, structIndex)" style="margin-left: 0;" title="点击-删除case"
                :disabled="nodeData.inits[0].structs.length <= 1"></el-button>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script>
import { useCell, useNodeData } from "@pipeline/Editor/store/index.js";
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import FormRow from "./fromRow.vue";
import { addSwitchPort } from "@pipeline/Editor/common/cell.js";
import cloneDeep from "lodash/cloneDeep";
export default {
  name: "SwitchPanel",
  components: {
    FormRow,
  },
  data() {
    return {
      inits: [
        {
          "varName": "lstCondiParas",
          "varType": "LISTS",
          "displayName": null,
          "controlType": "struct",
          "value": null,
          "description": null,
          "struct": [
            {
              "varName": "iOperType",
              "varType": "int",
              "displayName": "comparison operation",
              "controlType": "dropdown",
              "value": 1,
              "description": "comparison operation",
              "struct": null,
              "maxValue": null,
              "minValue": null,
              "options": [
                {
                  "label": "TVM_LG_CODE_COMPARE_TYPE_EQUAL",
                  "description": "Logic Code: Equal Comparison",
                  "value": 1
                },
                {
                  "label": "TVM_LG_CODE_COMPARE_TYPE_NOT_EQUAL",
                  "description": "Logic Code: NOT Equal Comparison.",
                  "value": 2
                },
                {
                  "label": "TVM_LG_CODE_COMPARE_TYPE_GREATER_EQUAL",
                  "description": "Logic Code: Greate Equal Comparison.",
                  "value": 3
                },
                {
                  "label": "TVM_LG_CODE_COMPARE_TYPE_LESS_EQUAL",
                  "description": "Logic Code: Less Equal Comparison.",
                  "value": 4
                },
                {
                  "label": "TVM_LG_CODE_COMPARE_TYPE_GREATER",
                  "description": "Logic Code: Greate Comparison.",
                  "value": 5
                },
                {
                  "label": "TVM_LG_CODE_COMPARE_TYPE_LESS",
                  "description": "Logic Code: Less Comparison.",
                  "value": 6
                },
                {
                  "label": "TVM_LG_CODE_COMPARE_TYPE_IN_RANGE",
                  "description": "Logic Code: In_Range Comparison.",
                  "value": 7
                },
                {
                  "label": "TVM_LG_CODE_COMPARE_TYPE_OUT_RANGE",
                  "description": "Logic Code: Out_Range Comparison.",
                  "value": 8
                }
              ],
              "fileOption": null,
              "inheritNodeId": null,
              "inheritVariable": null,
              "inheritNodeIds": null,
              "inheritVariables": null,
              "split": null,
              "step": null,
              "needLabeling": null,
              "labelingType": null,
              "modelId": null,
              "hide": 0
            },
            {
              "varName": "varThdLow",
              "varType": "any",
              "displayName": "compare low threshold set",
              "controlType": "textInput",
              "value": "",
              "description": "compare low threshold set",
              "struct": null,
              "maxValue": null,
              "minValue": null,
              "options": null,
              "fileOption": null,
              "inheritNodeId": null,
              "inheritVariable": null,
              "inheritNodeIds": null,
              "inheritVariables": null,
              "split": null,
              "step": null,
              "needLabeling": null,
              "labelingType": null,
              "modelId": null,
              "hide": 0
            },
            {
              "varName": "varThdHigh",
              "varType": "any",
              "displayName": "compare high threshold set",
              "controlType": "textInput",
              "value": "",
              "description": "compare high threshold set",
              "struct": null,
              "maxValue": null,
              "minValue": null,
              "options": null,
              "fileOption": null,
              "inheritNodeId": null,
              "inheritVariable": null,
              "inheritNodeIds": null,
              "inheritVariables": null,
              "split": null,
              "step": null,
              "needLabeling": null,
              "labelingType": null,
              "modelId": null,
              "hide": 0
            }
          ],
          "maxValue": null,
          "minValue": null,
          "options": null,
          "fileOption": null,
          "inheritNodeId": null,
          "inheritVariable": null,
          "inheritNodeIds": null,
          "inheritVariables": null,
          "split": 1,
          "step": null,
          "needLabeling": null,
          "labelingType": null,
          "modelId": null,
          "hide": null
        }
      ]
    }
  },
  setup() {
    const cell = useCell();
    const nodeData = useNodeData();
    // const atomInit = computed(() => nodeData.value.inits);
    let atomStruct = null;
    const methods = {
      /**
       * @description: 添加case条件分支
       * @param {*} struct 
       */
      doAddCondition(struct) {
        // 处理配置项
        const newStruct = cloneDeep(struct)
        nodeData.value.inits[0].structs.push(newStruct)
        const idx = nodeData.value.inits[0].structs.length;
        // 节点上添加port
        addSwitchPort(cell.value, {
          // id: `${uniqueNumericId()}`,
          text: idx,
          data: {
            struct: newStruct
          }
        })
        const ports = cell.value.getPorts()
        // 新增后使接线桩可见
        ports.forEach(port => {
          cell.value.setPortProp(port.id, 'attrs/circle/style/visibility', 'visible')
        })
      },
      /**
       * @description 删除case 条件分支
       * @param {*} struct 要删除的struct
       * @param {*} structIndex  要删除的struct索引
       */
      doDeleteCondition(struct, structIndex) {
        // 移除对应的接线桩
        let ports = cell.value.getPorts()
        const currentPort = ports.find(p => p.attrs?.text?.text == structIndex + 1)
        // const port = cell.value.getPort(structIndex + 1)
        cell.value.removePort(currentPort)
        // 移除structs中对应的struct
        nodeData.value.inits[0].structs.splice(structIndex, 1)
        // 重新获取最新ports
        ports = cell.value.getPorts()
        // 为所有port从新按照strct的数量设置序号text
        ports.filter(p => p.group === 'bottom').forEach((p, index) => {
          cell.value.setPortProp(p.id, 'attrs/text/text', index + 1)
        })
      },
    }
    onMounted(() => {
      atomStruct = cloneDeep(nodeData.value.inits[0]?.struct)
      if (Array.isArray(nodeData.value.inits[0]?.structs)) { //已配置过该switch

      } else { //初始化来配置switch
        nodeData.value.inits[0].structs = [nodeData.value.inits[0].struct]
      }
    })
    onBeforeUnmount(() => {
    })
    return {
      cell,
      nodeData,
      ...methods,
    }
  }
}
</script>

<style lang="less" scoped>
@import "~@pipeline/Editor/layout/baseStyle.less";

.struct-row {
  p {
    margin-bottom: 5px;
    cursor: default;
  }

  .struct-index {
    text-align: center;
    font-size: 12px;
  }
}
</style>