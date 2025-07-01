<template>
  <div class="operator-detail-container">
    <el-descriptions :title="opData.listDisplayName || opData.name" :column="4" size="default">
      <el-descriptions-item label="描述">{{ opData.remark }}</el-descriptions-item>
      <el-descriptions-item label="状态">{{ statusMap[opData.status] }}</el-descriptions-item>
      <el-descriptions-item label="创建人">{{ opData.createBy }}</el-descriptions-item>
      <el-descriptions-item label="算子类型">{{ opData.typeName }}</el-descriptions-item>
      <el-descriptions-item label="创建时间"> {{ opData.createTime | moment }}</el-descriptions-item>
      <el-descriptions-item label="更新时间"> {{ opData.updateTime | moment }}</el-descriptions-item>
    </el-descriptions>
    <el-tabs v-model="activeKey" style="margin-top: 30px;">
      <el-tab-pane label="算子详情" name="detail">
        <item-table class="item-table" :items="opData.frontendSetting.items" title="节点输入"> </item-table>
        <item-table class="item-table" :items="opData.frontendSetting.outputs" title="节点输出"></item-table>
        <item-table class="item-table" :items="opData.frontendSetting.inits" title="节点参数"></item-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import itemTable from '@pipeline/components/itemTable.vue';
import Operator from "@/api/operator";
const statusMap = ["创建中", "正常", "异常"]; //与数据库状态编码 0 1 2对应
export default {
  components: {
    itemTable,
  },
  data() {
    return {
      activeKey: 'detail',
      statusMap,
      opData: {}, //算子信息对象，后端无查看算子详情的接口，需从算子列表中传递过来
    }
  },
  computed: {
    // isGroup() {
    //   // 0-普通算子，1-组合算子，2-虚拟组合算子
    //   return this.opData.operatorType != 0
    // }
  },
  methods: {
    initSate(keyId) {
      keyId = keyId || this.$route.params.id + this.$route.query.name
      const operatorDetailMap = sessionStorage.getItem("operatorDetailMap")
      if (operatorDetailMap) {
        const map = JSON.parse(operatorDetailMap)
        this.opData = map[keyId]
      }
      // 后端增加这些信息之前先这样写避免报错
      if (!this.opData.frontendSetting) {
        this.opData.frontendSetting = { inits: [], items: [], outputs: [] }
      }
    }
  },
  created() {
    this.initSate()
  },
}
</script>

<style lang="less" scoped>
.operator-detail-container {
  &::v-deep .el-tabs__nav-wrap {
    width: 60px;
  }

  &::v-deep .isGroup-tabs-style .el-tabs__nav-wrap {
    width: 180px;
  }

  // .el-tabs__nav-wrap::after{

  // }
}

.item-table {
  width: 70%;
}
</style>