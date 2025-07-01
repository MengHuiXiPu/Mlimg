<template>
  <div>
    <block-item title="循环条件设置" description="当条件符合要求时，将跳出循环执行；支持设置多个条件">
      <el-form label-position="top" label-width="80px" size="mini" :model="nodeData.conditionDataSetting"
        :rules="formRules">
        <template v-for="(condition, idx) in nodeData.conditionDataSetting">
          <el-row>
            <el-radio style="margin-bottom: 0;">{{ `条件${idx + 1}` }}</el-radio>
            <!-- <a-icon type="close" style="cursor: pointer;" @click="doDeleteCondition(condition, idx)" /> -->
            <el-button class="el-icon-delete" @click="doDeleteCondition(condition, idx)" title="移除当前条件" size="small"
              type="text" :disabled="nodeData.conditionDataSetting.length < 2"></el-button>
          </el-row>
          <el-row :gutter="0" class="form-row">
            <el-form-item v-for="(item, index) in conditionStruct" :label="item.displayName || item.varName"
              class="form-item" :prop="item.varName">
              <template #label>
                <span class="label-text" :title="item.description">{{ item.displayName || item.varName }}
                  <a-tooltip title="参数只能选择，While循环内节点的输出参数" v-if="item.varName === 'compareValue'">
                    <a-icon type="question-circle-o" style="vertical-align: 2px;" />
                  </a-tooltip>
                </span>
              </template>
              <!--  -->
              <el-cascader v-model="condition._compareValue" :options="allCellData"
                v-if="item.varName === 'compareValue'"></el-cascader>
              <!-- <el-input-number v-model="condition.valueLow" :step="item.step || 1" size="mini"
                v-if="item.varName === 'valueLow'">
              </el-input-number> -->
              <!-- <el-select placeholder="请选择" v-model="condition.logic" size="mini" v-else-if="item.varName === 'logic'">
                <el-option v-for="option in item.options" :key="option.value" :label="`${option.label}`"
                  :value="option.value">
                </el-option>
              </el-select> -->
              <el-input v-model="condition.valueLow" size="mini" v-else-if="item.varName === 'valueLow'"></el-input>
              <el-select placeholder="请选择" v-model="condition.type" size="mini" v-else-if="item.varName === 'type'">
                <el-option v-for="option in item.options" :key="option.value" :label="`${option.label}`"
                  :value="option.value">
                </el-option>
              </el-select>
            </el-form-item>
            <!-- 最后一个条件不需要展示条件之间的关系 -->
            <el-form-item :label="conditionLogic.displayName || conditionLogic.varName" class="form-item"
              :prop="conditionLogic.varName" v-if="nodeData.conditionDataSetting.length - 1 > idx">
              <el-select placeholder="请选择" v-model="condition.logic" size="mini">
                <el-option v-for="option in conditionLogic.options" :key="option.value"
                  :label="`${option.description || option.label}`" :value="option.value">
                </el-option>
              </el-select>
            </el-form-item>
          </el-row>
        </template>
      </el-form>
    </block-item>
    <el-row style="text-align: center;"><el-button type="text" @click="doAddCondition">添加新条件</el-button></el-row>
  </div>
</template>

<script>
import blockItem from '@pipeline/components/business/blockItem.vue';
import { useNodeData, useCell, useGraph } from "@pipeline/Editor/store/index.js";
import { computed, onMounted, ref, } from "vue";
import { isWhileNode } from '@pipeline/Editor/common/cell.js';
// import Emitter from "@pipeline/Editor/util/channel.js";
export default {
  data() {
    return {
      formData: {

      },
      formRules: {
        // type: [
        //   { required: true, message: '请选择循环条件类型', trigger: 'change' }
        // ],
        // valueLow: [
        //   { required: true, message: '请输入比较值', trigger: 'blur' }
        // ],
        // compareValue: [
        //   { required: true, message: '请输入比较值', trigger: 'blur' }
        // ],
        // logic: [
        //   { required: true, message: '请选择逻辑关系', trigger: 'change' }
        // ]
      },
      // 条件结果示例
      // conditions: [{
      //     "type": 1,
      //     "valueLow": 1,
      //     "compareValue": "1_a",
      //     "logic": 1
      //   }],
    }
  },
  props: {
    cell: {
      type: Object,
      default: () => ({})
    },
  },
  methods: {
    doDeleteCondition(cond, index) {
      this.nodeData.conditionDataSetting.splice(index, 1)
    },
    doAddCondition() {
      this.nodeData.conditionDataSetting.push({
        "type": 1,
        "valueLow": "",
        "compareValue": "",
        _compareValue: [],
        "logic": 1
      })
    }
  },
  components: {
    blockItem,
  },
  setup(props) {
    const nodeData = useNodeData();
    const graph = useGraph();
    const allCellData = ref([]);
    const buildAllCellData = () => {
      // 获取while节点的所有子节点
      const allChildCell = (props.cell.getChildren() || []).filter(item => {
        return item.isNode();
      })
      // 组装成el-Calendar所需要的数据格式
      return allChildCell.map(cell => {
        const data = cell.getData();
        const { id, label, name, _label, outputs } = data
        return {
          value: String(id),
          // name,
          label: _label,
          children: outputs.map(output => {
            const { varName, varType, displayName } = output
            return {
              value: varName,
              label: displayName || varName,
              varType,
              children: Boolean(output.split) ? output.struct.map(sitem => {
                // sitem._varType = sitem.varType === null ? 'any' : sitem.varType
                return {
                  value: sitem.varName,
                  label: sitem.displayName || sitem.varName,
                  // disabled: Boolean(legalType !== 'any' && sitem._varType !== 'any' && sitem._varType !==legalType)
                }
              }) : null
            }
          })
        }
      })
    }
    // 条件的形状
    const conditionStruct = computed(() => {
      return (props.cell.getData().conditions || []).filter(item => item.varName !== "logic")
    })
    const conditionLogic = computed(() => {
      return (props.cell.getData().conditions || []).filter(item => item.varName === "logic")[0] || {}
    })
    onMounted(() => {
      // 初始化数据
      allCellData.value = buildAllCellData()
      // graph.value.on("change:data", ({ node}) => {
      //   console.log('data:changed', node)
      //   if(isWhileNode(node)) {
      //   }
      // })
      graph.value.on("node:change:children", ({ node }) => {
        console.log('children:changed', node)
        if (isWhileNode(node)) {
          allCellData.value = buildAllCellData()
        }
      })
    })
    return {
      allCellData,
      conditionStruct,
      conditionLogic,
      nodeData,
    }
  }
}
</script>

<style lang="less" scoped>
.form-row {
  display: flex;
  flex-wrap: wrap;
  margin: 0;
}

.form-item {
  flex: 0 0 30%;
  /* 每个表单项占 30% 的宽度 */
  box-sizing: border-box;
  /* 包含 padding 和 border */
  padding-right: 10px;
  margin-bottom: 10px;

  &::v-deep .el-input-number--mini {
    width: auto;
    // width: 140px;
  }

  &::v-deep .el-form-item__label {
    margin-bottom: 0;
    padding: 0 0 5px;
  }
}

.form-item:nth-child(3n) {
  padding-right: 0;
  /* 每行最后一个表单项不需要右侧 padding */
}

.label-text {
  display: inline-block;
  max-width: 100px;
  /* 根据需求设置最大宽度 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  /* 对齐方式 */
}
</style>