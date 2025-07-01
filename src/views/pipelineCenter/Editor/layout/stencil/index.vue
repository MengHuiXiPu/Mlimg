<template>
  <div class="stencil-container scrollbar">
    <el-tabs v-model="activeKey">
      <el-tab-pane label="  算子  " name="operator">
        <div class="stecil-search">
          <a-input-search placeholder="算子检索" @search="handleSearch" @change="handleDebounceSearch" />
        </div>
        <div class="stecil-content">
          <div class="stecil-group" v-for="(opGroup, key) in operatorsMap" :key="key">
            <h3 class="group-title" @click="handleGroupClick(opGroup)">
              <i :class="opGroup.expanded ? 'el-icon-remove-outline' : 'el-icon-circle-plus-outline'"></i>
              {{ key }}
            </h3>
            <el-collapse-transition>
              <ul class="group-content" v-show="opGroup.expanded">
                <li v-for="(operator, opIndex)  in opGroup.opList" :key="opIndex" class="operator-Item"
                  :data-shape="operator.shape" :data-type="operator.type" :data-size="operator.size" draggable
                  @dragend="handleDragEnd($event, operator)">
                  <img :src="require('../../assets/operator.svg')" class="node-icon" />
                  {{ operator.label }}
                </li>
              </ul>
            </el-collapse-transition>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="算子组" name="operatorGroup">
        <div class="stecil-search">
          <a-input-search placeholder="算子组检索" @search="handleSearch" @change="handleDebounceSearch" />
        </div>
        <div class="stecil-content">
          <div class="stecil-group" v-for="(opGroup, key) in operatorGroupsMap" :key="key">
            <h3 class="group-title" @click="handleGroupClick(opGroup)">
              <i :class="opGroup.expanded ? 'el-icon-remove-outline' : 'el-icon-circle-plus-outline'"></i>
              {{ key }}
            </h3>
            <el-collapse-transition>
              <ul class="group-content" v-show="opGroup.expanded">
                <li v-for="(operator, opIndex)  in opGroup.opList" :key="opIndex" class="operator-Item"
                  :data-shape="operator.shape" :data-type="operator.type" :data-size="operator.size" draggable
                  @dragend="handleDragEnd($event, operator)">
                  <img :src="require('../../assets/group.svg')" class="node-icon" />
                  {{ operator.label }}
                </li>
              </ul>
            </el-collapse-transition>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    <i class="el-icon-refresh refresh-btn" title="刷新数据" @click="fetchList"></i>
  </div>
</template>
<script>
import { ref, onMounted } from "vue";
import Operator from "@/api/operator";
import { useGraph, useGetState } from "@pipeline/Editor/store/index.js";
import cloneDeep from "lodash/cloneDeep";
import debounce from "lodash/debounce";
import { addNodeToGraph } from "@pipeline/Editor/common/graph.js";
import { Message } from "element-ui";
export default {
  name: "Stencil",
  setup() {
    const operatorsMap = ref([])  //算子列表(用于页面展示的，比如关键字检索后的结果更新到此变量)
    const operatorGroupsMap = ref([])  //算子组列表(用于页面展示的，比如关键字检索后的结果更新到此变量)
    const loading = ref(false)
    let allOperatorsMap = {}   //接口返回的全量算子
    let allOperatorGroupMap = {}  // 接口返回的全量算子组
    const graph = useGraph();
    // const pipelineType = useGetState("pipelineType")
    const activeKey = ref("operator")
    const methods = {
      handleDragEnd(e, item) {
        if (item.name === "start") { // 判断是否已存在开始节点，存在的话不能再添加
          const startNode = graph.value.getNodes().find(item => item.data.name === 'start')
          if (startNode) return Message.warning(`已存在${item.label}节点`)
        }
        if (item.name === "end") {
          const endNode = graph.value.getNodes().find(item => item.data.name === 'end')
          if (endNode) return Message.warning(`已存在${item.label}节点`)
        }
        // 添加节点到画布
        addNodeToGraph(e, item)
      },
      handleGroupClick(group) {
        group.expanded = !group.expanded
      },
      // 检索算子或算子组
      handleSearch(keyword) {
        keyword = keyword.trim();
        const result = {}
        const target = activeKey.value === "operator" ? allOperatorsMap : allOperatorGroupMap
        if (keyword) {
          Object.keys(target).forEach((groupName) => {
            const KEYWORD = keyword.toUpperCase();
            const resOpList = target[groupName].opList.filter(item => item.label.toUpperCase().includes(KEYWORD))
            if (resOpList.length) {
              result[groupName] = {
                ...target[groupName],
                expanded: true,
                opList: resOpList,
              }
            }
          })
          activeKey.value === "operator" && (operatorsMap.value = result)
          activeKey.value === "operatorGroup" && (operatorGroupsMap.value = result)
        } else {
          activeKey.value === "operator" && (operatorsMap.value = cloneDeep(allOperatorsMap))
          activeKey.value === "operatorGroup" && (operatorGroupsMap.value = cloneDeep(allOperatorGroupMap))
        }
      },
      handleDebounceSearch: debounce(function (event) {
        methods.handleSearch(event.target?.value)
      }, 300),
      async fetchList() {
        try {
          loading.value = true;
          await getOperatorList();
          await getOperatorGroupList();
          loading.value = false;
        }catch {
          loading.value = false
        }
      }
    }
    // 获取算子列表, 并根据typeName分组
    const getOperatorList = async () => {
      const params = {
        pageNo: 1,
        limit: 10000,
        status: 1,  //解析正常的算子
        operatorType: 0,
      }
      const res = await Operator.getOperatorList(params)
      allOperatorsMap = buildDataMap(res.data?.records)
      operatorsMap.value = cloneDeep(allOperatorsMap);
      // operatorsMap.value = grouped;
    }
    // 获取算子组列表
    const getOperatorGroupList = async () => {
      const params = {
        pageNo: 1,
        limit: 10000,
        status: 1,  //解析正常的算子
        operatorType: 1,
      }
      const res = await Operator.getOperatorList(params)
      allOperatorGroupMap = buildDataMap(res.data?.records)
      operatorGroupsMap.value = cloneDeep(allOperatorGroupMap)
    }
    // 组装算子/算子组数据，按照typeName分组，返回{typeName: []}对象
    const buildDataMap = (records = []) => {
      const nodes = records.map(item => {
        return {
          ...item.frontendSetting,
          label: item.listDisplayName, //取外层的listDisplayName覆盖frontendSetting中的label，(里层的是算法zip宝的名称)
          // 乱起八遭的重复字段，参考的以前的字段取值逻辑，都取外层的
          operatorType: item.operatorType,
          opGroupId: item.opGroupId,
          operatorId: item.id,
          rpaLabelingId: item.rpaLabelingId,
          typeId: item.typeId,
          typeName: item.typeName || '未命名分组',
          remark: item.remark,
          //接口默认返回null，这里进行重置
          conditionDataSetting: (item.conditionDataSetting || [{
            "type": 1,
            "valueLow": "",
            "compareValue": "",
            "logic": 1
          }]).map(item => ({
            ...item,
            _compareValue: item.compareValue ? item.compareValue.split("_") : []
          }))
        };
      })
      // 改为根据typeName分组
      const grouped = {};
      nodes.forEach((item) => {
        if (!grouped[item.typeName]) {
          grouped[item.typeName] = {
            expanded: true, // 默认展开状态
            opList: [],
            img: item.group.img || ''
          };
        }
        grouped[item.typeName].opList.push(item);
      });
      return grouped
    }
    methods.fetchList()
    return {
      activeKey,
      operatorsMap,
      operatorGroupsMap,
      ...methods
    }
  }
}


</script>

<style lang="less" scoped>
.stencil-container {
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", Segoe UI Symbol, "Noto Color Emoji";
  overflow: auto;
  height: 100%;

  &::v-deep .el-tabs__header {
    margin: 0;

    .el-tabs__nav-wrap {
      padding-left: 25px;
    }
  }

  .stecil-search {
    padding: 8px 5px 5px;
  }
  .refresh-btn {
    position: absolute;
    right: 10px;
    top: 15px;
    cursor: pointer;
  }

  .stecil-content {
    color: #666;
    font-size: 12px;

    .group-title {
      cursor: pointer;
      background: #ededed;
      height: 32px;
      line-height: 32px;
      padding: 0 5px 0 5px;
      box-sizing: border-box;
      font-size: 13px;
      color: #666;
      margin: 0;
      font-weight: 700;
      user-select: none;
      margin: 3px 0;

      &:hover {
        color: #444;
      }

      i {
        font-size: 16px;
        // font-weight: 500;
        color: #444;
        margin-right: 5px;
      }
    }

    .group-content {
      padding: 0 5px 5px 15px;
      margin: 0;

      .operator-Item {
        color: #666;
        height: 26px;
        line-height: 26px;
        padding-left: 5px;
        // border-radius: 4px;
        border: 1px solid rgba(0, 0, 0, 0);
        list-style-type: none;
        transition: all 0.2s;

        &:hover {
          // color: #444;
          border: 1px solid #f5f4f4;
          border-radius: 4px;
          // cursor: move;
          // transform: scale(0.9);
          color: #333;
        }

        .node-icon {
          height: 16px;
          vertical-align: text-bottom;
        }
      }
    }
  }
}
</style>