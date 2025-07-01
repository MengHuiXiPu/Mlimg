/*
 * @Author: lichao.sun 
 * @Date: 2024-04-10 13:22:32 
 * @Last Modified by: lichao.sun
 * @Last Modified time: 2024-04-18 18:00:10
 * @description: 算法选择step
 */
<template>
  <step-layout>
    <template slot="left">
      <div class="search">
        <a-input-search placeholder="请输入算法名称" v-model="keyword" style="flex: 1;" @search="onSearch" @change="onSearch" />
      </div>
      <!-- 算法列表 -->
      <div class="algorithm-list scrollbar" :infinite-scroll-disabled="isBottom || loading" v-infinite-scroll="loadBottom"
        element-loading-text="拼命加载中" element-loading-spinner="el-icon-loading"
        element-loading-background="rgba(0, 0, 0, 0.1)" v-loading="loading && pagination.currentPage == 1">
        <div :class="['op-card', currentOp.id === item.id ? 'active-card' : '']" v-for="item in opList" :key="item.id"
          @click="onClickOp(item)">
          <el-radio class="radio" v-model="currentOp.id" :label="item.id" size="medium"></el-radio>
          <img class="logo" :src="getOpLogo(item)" alt="" />
          <div class="article">
            <a-tooltip placement="top" :title="item.taskName">
              <h2 class="name">{{ item.taskName }}</h2>
            </a-tooltip>
            <a-tooltip placement="top" :title="item.modelName">
              <p class="text">{{ item.modelName }}</p>
            </a-tooltip>
            <p class="text">{{ item.taskModelName }}</p>
          </div>
        </div>
        <el-empty :image-size="200" v-if="!loading && opList.length === 0"></el-empty>
        <p style="text-align: center; line-height: 16px; color: #00f;" v-if="loading && currentPage !== 1">加载中...</p>
        <p style="text-align: center;" v-if="isBottom && opList.length !== 0">没有更多了</p>
      </div>
    </template>
    <template slot="right">
      <div class="right-content">
        <div v-show="currentOp.id" class="algorithm-info">
          <p>在线任务名称：<span>{{ currentOp.taskName }}</span></p>
          <p>模型名称：<span>{{ currentOp.modelName }}</span></p>
          <p>资源模式：<span>{{ currentOp.resouceModelName }}</span></p>
          <p>运行模式：<span>{{ currentOp.taskModelName }}</span></p>
          <p>状态： <span>{{ currentOp.taskStatusName }}</span></p>
          <p>算法创建者：<span>{{ currentOp.createBy }}</span></p>
          <p>算法创建时间：<span>{{ formatTimestamp(currentOp.createTime) }}</span></p>
          <p>算法更新时间：<span>{{ formatTimestamp(currentOp.updateTime) }}</span></p>
          <p>算法标签类型：<span>{{ currentOp.tagType }}</span></p>
        </div>
      </div>
    </template>
    <template slot="bottom">
      <div style="height: 40px;line-height:40px;margin-right: 50px;font-size: 18px;" v-if="selectedOperator">
        已选算法：<el-tag > {{ selectedOperator }}</el-tag>
      </div>
      <a-button type="primary" @click="nextStep" class="btnStep">下一步</a-button>
      <a-button style="margin-left: 10px;" @click="cancel" class="btnStep">取消</a-button>
    </template>
  </step-layout>
</template>

<script>
import StepLayout from '@/components/StepLayout/index.vue'
import debounce from 'lodash.debounce'
import { getApplicationcenterList } from "@/api/appCenter";
import { formatTimestamp } from '@/utils/utils'
export default {
  name: 'OpSelector',
  components: {
    StepLayout
  },
  data() {
    return {
      loading: false,
      opList: [],  //算法列表
      pagination: {
        total: 0,
        pageSize: 10,
        currentPage: 1
      },
      keyword: '', //检索关键字
      currentOp: {}
    }
  },
  props: {
    transferData: {
      type: Object,
      default: () => ({})
    },
  },
  computed: {
    // 判断数据是否已全部加载完毕
    isBottom() {
      return this.opList.length >= this.pagination.total
    },
    // 用于展示选中的算法
    selectedOperator() {
      return this.currentOp.taskName || this.transferData.inferTaskId
    }
  },
  methods: {
    formatTimestamp,
    // 算法logo
    getOpLogo(data) {
      if (data.tagType == "分类") {
        return require("@/assets/images/p7.png");
      }
      if (data.tagType == "目标检测") {
        return require("@/assets/images/p6.png");
      }
      return require("@/assets/images/p8.png");
    },
    onSearch: debounce(function () {
      // 清空opList
      this.opList = []
      this.getDataList({ pageSize: 10, pageIndex: 1 })
    }, 300),
    // 加载更多
    async loadBottom() {
      this.pagination.currentPage++
      await this.getDataList({
        pageNo: this.pagination.currentPage,
      })
    },
    // 
    getDataList({ taskType = 0, pageNo = 1 } = params) {
      getApplicationcenterList({
        limit: 10,
        pageNo,
        taskName: this.keyword,
        taskType,
        protocol: 'tcp', //tcp/http
        // nodeId: ''
      }).then(res => {
        if (res.code === 0) {
          this.opList = this.opList.concat(res.data.records)
          this.pagination.total = res.data.total
        }
      })
    },
    // 
    onClickOp(op) {
      this.currentOp = op
    },
    nextStep() {
      if (!this.currentOp.id && !this.transferData.inferTaskId) {
        this.$message.warning('请选择算法')
        return
      }
      // 更新选择的算法到父组件
      this.$emit('collect-data', 'op', this.currentOp)
    },
    cancel() {
      this.$router.back()
    },
  },
  created() {
    this.getDataList({});
  },
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";

.btnStep {
  width: @nextStepWidth;
  height: @nextStepHeight;
  color: @nextStepColor;
  background-color: @nextStepBgc;
  border-radius: @borderRadiusSmall;
}

.search {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.algorithm-list {
  width: 100%;
  margin-top: 20px;
  overflow-y: auto;
  height: calc(100% - 65px);
}

.select-style {
  width: 100%;
}

.right-content {
  //height: 100%;
  overflow-y: auto;
  padding: 20px 20px 0;
  color: @paneTextColor;
  align-items: center;
  display: flex;

  .algorithm-info {
    flex: 3;

    p {
      font-weight: 700;
      font-size: @paneFontSize;

      span {
        font-weight: 400;
      }
    }
  }
}

/deep/ .splitter-pane.vertical.splitter-paneR {
  min-height: 100%;
  height: auto;
  border-left: 1px solid rgba(0, 0, 0, 0.2);
}

/deep/ .vue-splitter-container {
  min-height: calc(100vh - 225px);
}

/deep/ .bottom {
  padding-top: 10px;
}

a {
  color: #00f;
}

.active-card {
  border: 2px solid @cardALBorderColor !important;
}

.op-card {
  position: relative;
  // min-width: 250px;
  margin: 0 auto 10px;
  height: 165px;
  background: #daeaff;
  border-radius: 16px;
  padding: 32px 12px 12px 12px;
  display: flex;
  // align-content: center;
  border: 2px solid transparent;
  box-sizing: border-box;
  // flex-direction: unset !important;

  .radio {
    position: absolute;
    top: 10px;
    left: 16px;
  }

  &:hover {
    border-color: #3d41ff;
  }

  &.hidden {
    opacity: 0;
  }

  .article {
    flex: 1;
    padding: 0 15px;

    .name {
      font-size: 16px;
      color: #333;
      font-weight: 600;
      max-width: 100%;
      width: fit-content;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 4px;
    }

    .text {
      color: #9195a3;
      font-size: 12px;
      max-width: 100%;
      width: fit-content;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 5;
      margin: 0;
    }
  }

  .logo {
    width: 110px;
    height: 110px;
    border-radius: 8px;
  }
}
</style>

