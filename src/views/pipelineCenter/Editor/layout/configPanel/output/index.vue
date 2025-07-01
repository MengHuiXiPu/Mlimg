<template>
  <div class="output-wrapper" v-if="isNode">
    <el-table :data="outputData" row-key="_rowkey" border :default-expand-all="expandAll"
      :tree-props="{ children: 'struct' }">
      <el-table-column label="输出名称" show-overflow-tooltip>
        <template slot-scope="{ row, column, $index }">
          <span :title="`${row.description}-${row.varType}`">{{ row.displayName || row.varName }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="value" label="输出值" show-overflow-tooltip>
        <template slot-scope="{ row, column, $index }">
          <image-viewer
            v-if="row.varType == 'raw' && typeof (row.value) === 'string' && (row.value.endsWith('.png') || row.value.endsWith('.jpg'))"
            width="60px" height="30px" :src="imageMap[`${row._rowkey}_${row.varName}`]"
            :url-list="[imageMap[`${row._rowkey}_${row.varName}`]]" objectFit="contain" :appendToBody="false">
          </image-viewer>
          <span v-else>{{ row.value }}</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { set as $set, onMounted, ref, computed, onBeforeMount, onBeforeUnmount } from 'vue';
import { useNodeData, useDebugResult, useGetState, useCell } from "@pipeline/Editor/store/index.js";
// import ImageLoader from '@/utils/imageLoader';\
import ImageViewer from "@/components/ImageViewer/index.js";
import Operator from "@/api/operator";
import Emitter from "@pipeline/Editor/util/channel.js";
import { isWhileNode, isPyNode } from "@pipeline/Editor/common/cell.js";
export default {
  name: 'Output',
  components: {
    ImageViewer,
  },
  setup() {
    const nodeData = useNodeData();
    const imageMap = ref({});
    // 用于渲染的输出数据端子列表，(一个算子有几个输出)
    const outputData = ref([]);
    const pipelineId = useGetState('pipelineId');
    const expandAll = ref(true)
    // 从调试结果中获取
    const debugResult = useDebugResult();
    const cell = useCell()
    const isNode = computed(() => {
      return typeof (cell.value.isNode) === "function" ? cell.value.isNode() : false
    })
    // 一个节点输出先从graph中找到outputs,从里面获取controlType,varType,varName,再根据算子id+名称去tvm_modules中找对应的输出数据，赋值给value
    const getDebugResult = (outputs, parentId) => {
      // 过滤掉hide=1的输出项
      outputs = outputs.filter(item => item.hide !== 1)
      expandAll.value = true
      let targetId = parentId ? `${pipelineId.value}_${parentId}` : pipelineId.value
      // 老的流程库里存的是对象，这里直接return防止报错
      if (!Array.isArray(debugResult.value)) return
      const tvm_modules = debugResult.value.find(item => item.guid == targetId)?.tvm_modules || {}
      const relationKey = `${nodeData.value?.id}_${isWhileNode(nodeData.value) ? nodeData.value?.dynamicGroupName : isPyNode(nodeData.value) ? nodeData.value?.dynamicOperatorName : nodeData.value?.name}`;
      return outputs.map((item, index) => {
        // 根据id+算子名称找到对应算子
        const outputResult = tvm_modules[relationKey]?.output || {}
        const val = outputResult[item.varName]

        const _rowkey = `${item.varName}_${index}`
        $set(item, '_rowkey', _rowkey)

        if (item.varType == 'raw' && typeof (val) === 'string' && (val.endsWith('.png') || val.endsWith('.jpg'))) {
          loadImg(val, item)
        }
        return {
          controlType: item.controlType,
          // expanded: true, //默认展开struct节点
          varType: item.varType,
          varName: item.varName,
          displayName: item.displayName,
          description: item.description,
          _rowkey: _rowkey,    //用作el-table的row-key
          value: item.struct ? "" : val,
          // 为struct各项的value赋值
          // 要根据结果的数量来显示表格有多少行数据
          struct: item.varType === "LISTS" ? (val || []).map((valueItem, valueIndex) => {
            expandAll.value = false
            return {
              varName: valueIndex + 1,
              value: null,
              _rowkey: `${item.varType}_${valueIndex}_LISTS`,
              expanded: false,
              struct: item.struct.map((ssitem, ssindex) => {
                return {
                  ...ssitem,
                  _rowkey: `${item.varType}_${valueIndex}_LISTS_${ssindex}`,
                  value: val[valueIndex][ssindex],
                }
              })
            }
          }) :
            ["LIST", "IMAGE"].includes(item.varType)
              // || (item.struct?.length && item.varType === null) //这里单纯是为了兼容后端没有转换varType的情况
              ? item.struct.map((sitem, sindex) => {
                const structResult = outputResult[item.varName] || {}
                const v = structResult[sitem.varName]
                const _rowkey = `${item.varName}_${index}_${sindex}_struct`
                $set(sitem, '_rowkey', _rowkey)
                if (sitem.varType == 'raw' && typeof (v) === 'string' && (v.endsWith('.png') || v.endsWith('.jpg'))) {
                  loadImg(v, sitem)
                }
                return {
                  ...sitem,
                  value: v,
                  _rowkey,
                }
              }) : null
        }
      })
    }
    const loadImg = async (path, targetItem) => {
      if (!path) return null
      // if (imageMap.value[targetItem.varName]) return imageMap.value[targetItem.varName]
      const res = await Operator.getImage({
        id: pipelineId.value,
        imgPath: path,
      })
      const url = `data:image/jpeg;base64,${res.data}`
      $set(imageMap.value, `${targetItem._rowkey}_${targetItem.varName}`, url)
    }
    const emitParseResult = (cell) => {
      const data = cell.getData() //获取节点上的业务数据
      const parentId = cell.getParent()?.id; //如果点击的是子节点，则获取父节点id，根据才能在输出结果里找到
      outputData.value = getDebugResult(data.outputs, parentId);
    }
    onMounted(() => {
      Emitter.on('cellSelected', ({ cell, isSelected, }) => {
        if (isSelected && cell.isNode()) {
          emitParseResult(cell)
        }
      })
      Emitter.on('update-result-view', emitParseResult)
    })
    onBeforeUnmount(() => {
      Emitter.off('cellSelected')
      Emitter.off('update-result-view')
    })
    // 获取节点输出数据
    return {
      outputData,
      loadImg,
      imageMap,
      isNode,
      expandAll,
    }
  }
}
</script>

<style lang="less" scoped>
.single-line-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.struct-border {
  padding: 4px;
  // border: 1px solid #e9e9e9;
  border: 1px solid #E4E7ED;
}

.struct-icon {
  cursor: pointer;
  position: absolute;
  left: 22%;
  font-size: 18px;
  color: #eeeeee;
}

// 之前的人在user/index.vue中，未加scoped修改了el-table的样式，导致设置size:mini等改小table的方式无效，这里修改样式
.output-wrapper {
  &::v-deep .el-table {
    border-radius: 3px;

    .el-table__header {
      thead {
        color: #606266;
      }

      th {
        background: #d7d7d7;

        &.el-table__cell {
          padding: 5px 0;
        }
      }
    }

    .el-table__body-wrapper {
      .el-table__cell {
        padding: 5px 0;
        // background: #bedcff;
      }
    }
  }
}
</style>