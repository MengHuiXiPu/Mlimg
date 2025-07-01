<template>
  <div class="item-panel">
    <a-collapse v-model="activeKey" :bordered="false">
      <template #expandIcon="props">
          <!-- <a-icon type="caret-right" :rotate="props.isActive ? 90 : 0" /> -->
          <!-- square -->
          <!-- <i :class="props.isActive ? 'el-icon-circle-remove-outline' : 'el-icon-circle-plus-outline'"/> -->
          <a-icon :type="props.isActive ? 'minus': 'plus'" />
          <!-- <span></span> -->
        </template>
        <a-collapse-panel :key="key"  v-for="(value, key) in groupedItems" >
          <template #header>
            <span class="pannel-type-icon" v-if="value.img" :style="{ background: 'url(' + value.img + ')' }"></span>
            <span>{{key}}</span>
          </template>
          <li 
            v-for="(item, itemIndex) in value.items" 
            :key="itemIndex"
            class="getItem"
            :data-shape="item.shape"
            :data-type="item.type"
            :data-size="item.size"
            draggable
            @dragstart="handleDragstart"
            @dragend="handleDragEnd($event, item)"
          >
            <!-- <span class="pannel-type-icon" v-if="item.image"  :style="{ background: 'url(' + item.image + ')' }"></span> -->
            <img :src="require('../Flow/nodeIcon.svg')" class="node-icon"/>
            {{ item.label }}
          </li>
        </a-collapse-panel>
      </a-collapse>
      <!-- agent组件生成 -->
      <agent @finish="doAddOperator"></agent>
    </div>
</template>

<script>
import eventBus from "../../utils/eventBus";
import Operator from "@/api/operator";
import {conditionPoints, evenlyDistributeVarName, getItemInfo} from '../../utils'
import Agent from "../Agent/index.vue"
export default {
  components: {
    Agent,
  },
  data() {
    return {
      activeKey: '',
      page: null,
      command: null,
      offsetX: 0,
      offsetY: 0,
      list: [],   // 全部算子列表
      groupedItems: {},  // 分组算子列表
      operatorGroupList: [], //全部算子组列表
      agentOperator: {},  //mock agent生成的算子
    };
  },
  created() {
    this.init();
    this.bindEvent();
  },
  methods: {
    groupItems() {
      // Grouping the list items based on `item.group` property
      const grouped = {};
      this.list.forEach((item) => {
        if (!grouped[item.group.name]) {
          grouped[item.group.name] = {
            isExpanded: true, // 默认展开状态
            items: [],
            img: item.group.img
          };
        }
        // 此处不添加，agent mock完成后将该算子添加到列表
        if(item.label == '模板分割') {
          this.agentOperator = item
          return
        }
        grouped[item.group.name].items.push(item);
      });
      this.groupedItems = grouped;
      // 默认展开所有列表
      // this.activeKey = Object.keys(grouped)
    },
    init() {
      // 获取算子列表
      Operator.getOperatorList({
        pageNo: 1,
        limit: 10000,
        // operatorType: 0,
      })
      .then((res) => {
        const nodes = res.data.records.map(item => {
          if(item.frontendSetting.group.name == "logic") {
            return {
              ...item.frontendSetting,
              operatorType: item.operatorType,
              opGroupId: item.opGroupId,
              operatorId: item.id,
              rpaLabelingId: item.rpaLabelingId,
              shape: "customDiamond",
              ...conditionPoints(item.frontendSetting.name)
            };
          } else {
            return {
              ...item.frontendSetting,
              operatorType: item.operatorType,
              opGroupId: item.opGroupId,
              operatorId: item.id,
              rpaLabelingId: item.rpaLabelingId,
              inPoints: evenlyDistributeVarName(0, item.frontendSetting.items, 'varName'),
              outPoints: evenlyDistributeVarName(1, item.frontendSetting.outputs, 'varName'),
            };
          }
        })
        this.list = nodes;
        this.groupItems()
      });

      // 获取算子组列表
      // Operator.getOperatorList({
      //   pageNo: 1,
      //   limit: 100,
      //   operatorType: 1,
      // })
      // .then((res) => {
      //   // console.log(res, "获取算子组列表结果");
      //   this.operatorGroupList = res.data.records;
      //   console.log(this.operatorGroupList, "获取算子组列表结果");
      // });
    },
    handleDragstart(e) {
      // 拖拽开始，记录拖拽的偏移量
      this.offsetX = e.offsetX;
      this.offsetY = e.offsetY;
    },
    handleDragEnd(e, item) {
      if(e.x && e.x < 290) return //因为左侧算子panel absolute定位，造成视觉上没有拖拽算子到画布时也会在画布上生成算子节点的bug，bugid：ADCP-801
      const jsonString = JSON.stringify(item);
      // 拖拽的当前算子数据
      let data = JSON.parse(jsonString);
      data.offsetX = this.offsetX;
      data.offsetY = this.offsetY;
      // alert(this.page)
      if (this.page) {
        const graph = this.page.graph;
        // const size = e.target.dataset.size.split("*");
        const xy = graph.getPointByClient(e.x, e.y);
        data.x = xy.x;
        data.y = xy.y;
        data.size = item.size;
        data.type = "node";
        this.command.executeCommand("add", [data]);
      }
    },
    // 拖拽算子组
    handleDragGroupEnd(e, item) {
      const jsonString = JSON.stringify(item);
      // 拖拽的当前算子组数据
      let data = JSON.parse(jsonString);
      data.offsetX = this.offsetX;
      data.offsetY = this.offsetY;
      // alert(this.page)
      if (this.page) {
        const graph = this.page.graph;
        // const size = e.target.dataset.size.split("*");
        const xy = graph.getPointByClient(e.x, e.y);
        data.x = xy.x;
        data.y = xy.y;
        data.size = item.size;
        data.type = "group";
        this.command.executeCommand("add", [data]);
      }
    },
    bindEvent() {
      eventBus.$on("afterAddPage", page => {
        this.page = page;
        this.command = page.command;
      });
    },
    // 将agent生成的算子添加到算子列表
    doAddOperator(data = {}) {
      this.groupedItems['我的算子'].items.push(this.agentOperator)
      // 展开我的算子分组
      if(this.activeKey.includes('我的算子')) return
      this.activeKey.push('我的算子')
    }
  }
};
</script>

<style>

.groupItems {
  list-style: none;
  padding: 0;
  margin-top: 1px;
}
.getItem {
  color: #333 !important;
  font-size: 15px;
}
</style>
<style lang="less" scoped>
@import "../../../common.less";
.item-panel {
  ::v-deep .ant-collapse-header {
    // padding: 8px 16px 8px 40px;
    padding: 0 0 0 40px;
    margin: 5px 15px 5px 0;
    font-weight: 500;
    border: 1px solid @base-bg-color-gray;
    height: 36px;
    line-height: 36px;
    background-color: @dark-bg-color-gray;
  }
  ::v-deep .ant-collapse {
    background-color: transparent;
    .ant-collapse-item {
      border-bottom: none;
    }
    .ant-collapse-content-box{
      padding: 2px 16px;
    }
  }
} 
.itempannel li {
  color: rgba(0, 0, 0, 0.65);
  border-radius: 4px;
  width: 100%;
  height: 28px;
  line-height: 26px;
  padding-left: 8px;
  border: 1px solid rgba(0, 0, 0, 0);
  list-style-type: none;
  margin: 5px 0;
  background-color: @base-bg-color-gray;
  .node-icon {
    height: 16px;
  }
}
.itempannel li:hover {
  // background: #f7f9fb;
  border: 1px solid #ced4d9;
  cursor: move;
}
.itempannel .pannel-type-icon {
  width: 20px;
  height: 20px;
  display: inline-block;
  vertical-align: middle;
  margin-right: 4px;
  margin-left: 4px;
  background-size: contain;
}
.operatorGroupListDiv {
  margin-top: 500px;
}
</style>
