<template>
  <div class="card-container" :class="{ 'unActive-card': !isAvailable }">
    <header class="ch" @click="handleClickCard">
      <div class="ch-title" >{{dataObj.dlName}}</div>
      <div class="ch-desc">
        <span class="ch-desc-item">类型：{{dataObj.dlTagType || "-"}}</span>
        <span class="ch-desc-item">样本量：{{dataObj.sampleNum || "-"}}</span>
        <span class="ch-desc-item">标注比例：{{dataObj.tagRatio || "-"}}</span>
      </div>
    </header>
    <div class="cc" @click="handleClickCard">
      <el-image :src="coverImageSrc" lazy class="cc-image-wrap" v-if="coverImageSrc">
        <div slot="error" class="image-slot" style="width: 100%; height: 100%;">
          <img style="width: 100%; height: 100%;" :src="require('@/assets/images/place.gif')" alt="">
        </div>
      </el-image>
      <!-- 数据集创建中 -->
      <svg-icon type="spin" class="parseing-icon" v-if="CREATING_STATUSLIST.includes(dataObj.status)"></svg-icon>
      <!-- 标注中时，展示标注进度百分比 -->
      <a-tooltip :title="dataObj.autoMarkTaskStatusMessage">
        <a-progress :percent="caclAnnotationPercent(dataObj)" size="small" status="active" class="annotation-progress" v-if="dataObj.status === 2 && dataObj.autoMarkTaskStatus === 1"/>
      </a-tooltip>
      <!-- 创建失败时，展示失败原因 -->
      <span v-if="DEFEAT_STATUSLIST.includes(dataObj.status)" class="defeat-reason">
        <span style="color: #F56C6C;font-weight: bold;">创建失败</span>
        <a-popover overlayClassName="modelSchedule" placement="left">
          <template slot="content">
            <a-alert message="数据集创建失败" :description="dataObj.message" type="error" show-icon />
          </template>
          <svg-icon type="danger" style="font-size: 18px;margin-left: 5px;cursor: pointer;"></svg-icon>
        </a-popover>
      </span>
      
    </div>
    <footer class="cf">
      <a @click.stop="parentInstance.callAutoAnnotation(dataObj)" class="common-link" 
        :disabled="hasPermission || dataObj.autoMarkTaskStatus === 1 || dataObj.status !== 2 || dataObj.sampleNum === 0"
      >
        自动标注
      </a>
      <a @click.stop="parentInstance.stopAutoAnnotation(dataObj)" class="common-link" :disabled="hasPermission || dataObj.autoMarkTaskStatus !== 1">停止标注</a>

      <a class="common-link" :disabled="dataObj.status !== 2 || disabledItem || dataObj.autoMarkTaskStatus ===1 "  @click.stop="parentInstance.doConvert(dataObj)">转换数据集</a>
      <a-dropdown>
        <a @click.stop class="moreBtn ant-dropdown-link common-link">更多</a>
        <a-menu slot="overlay">
          <a-menu-item :disabled="isTransformDataset || hasPermission || CREATING_STATUSLIST.includes(dataObj.status) || dataObj.autoMarkTaskStatus ===1 "  @click="parentInstance.handleEdit(dataObj)">编辑</a-menu-item>
          <a-menu-item :disabled="hasPermission || ![2,3,10].includes(dataObj.status) || dataObj.autoMarkTaskStatus === 1" @click="parentInstance.handleDelete(dataObj)">删除</a-menu-item>
          <a-menu-item :disabled="dataObj.dlTagType !== '其他' || dataObj.status !== 2 || hasPermission" @click="parentInstance.callDatasetTypeSet(dataObj)">
            类型设置
          </a-menu-item>
          <a-menu-item :disabled="dataObj.status !== 2 || hasPermission" @click="parentInstance.shareModel(dataObj)">
            设置共享
          </a-menu-item>
        </a-menu>
      </a-dropdown>
    </footer>
  </div>
</template>

<script>
import { CREATING_STATUSLIST, DEFEAT_STATUSLIST } from "../enum.js"
export default {
  data() {
    return {
      // statusList: DSSTATUSLIST,
      CREATING_STATUSLIST, //表示创建中的数据集状态
      DEFEAT_STATUSLIST, //表示创建失败的数据集状态
    }
  },
  props: {
    // 数据集的data
    dataObj: {
      type: Object,
      default: () => ({})
    }
  },
  inject: ["parentInstance"],
  computed: {
    // 封面图片路径
    coverImageSrc() {
      if (this.dataObj.cover) {
        // 如果 data.cover 存在，添加前缀后返回
        return `data:image/jpeg;base64,${this.dataObj.cover}`;
      } else if (this.dataObj.status === 2 && !this.dataObj.cover) {
        // 如果 data.cover 不存在，使用占位图像
        return require("@/assets/images/place.gif");
      } else {
        return ""  //改为不显示图片
      }
    },
    hasPermission() {
      return false
      if (this.dataObj.createBy === this.$store.state.user.user.username || this.$store.state.user.user.username === "admin") {
        return false
      }
      return true
    },
    // 该数据集是否是转换而来(是新建数据集里的那个转换)，是的话不允许编辑？
    isTransformDataset() {
      return this.dataObj.forecastId !== null;
    },
    // status为2的数据集，视为可操作的数据集
    isAvailable() {
      return this.dataObj.status === 2;
    }
  },
  methods: {
    handleClickCard() {
      this.$emit("toSingleDataDetail", this.dataObj)
    },
    caclAnnotationPercent(data) {
      if (data.autoMarkImgFinishCount == null || data.autoMarkImgFinishCount == 0) {
        return 0;
      }
      return parseFloat((data.autoMarkImgFinishCount / data.autoMarkImgCount * 100).toFixed(2));
    },
  },
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
.card-container {
  box-sizing: border-box;
  border: 2px solid transparent;
  width: 24%;
  // height: 170px;
  aspect-ratio: 16 / 9; //固定宽高比 chrome >= 88
  // border-radius: @borderRadiusBig;
  border-radius: 2px;
  background: #daeaff;
  padding: 0px 5px 0 5px;
  margin: 5px;
  display: flex;
  flex-direction: column;
  min-width: 250px;
  &:hover {
    border-color: #3d41ff;
  }
}
// card-header这样的class样式都被傻逼全局污染了
.ch {
  height: 50px;
  cursor: pointer;
  &-title {
    text-align: center;
    font-weight: bold;
    font-size: 14px;
    color: @menuColor;
    height: 26px;
    line-height: 26px;
  }
  &-desc {
    display: flex;
    justify-content: space-around;
    &-item {
      font-size: 12px;
      @media screen and (max-width: 1500px) {
        font-size: 10px;
      }
    }
  }
}
.cc {
  // flex: 1;
  height: calc(100% - 80px);
  padding: 0 20px;
  cursor: pointer;
  &-image-wrap {
    height: 100%;
    width: 100%;
  }
  position: relative;
  .center-area {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  // 创建中的图标
  .parseing-icon {
    .center-area();
    font-size: 50px;
  }
  .defeat-reason {
    .center-area();
  }
  .annotation-progress {
    position: absolute;
    width: 80%;
    top: 40%;
    left: 30px;
    // &::-v-deep .ant-progress-text {
    //   //修改进度text的文本颜色
    // }
  }
}
.cf {
  height: 30px;
  line-height: 30px;
  display: flex;
  justify-content: space-around;
  .common-link {
    font-weight: normal;
  }
  @media screen and (max-width: 1500px) {
    font-size: 12px;
  }
}
.unActive-card {
  // border: 1px solid @cardALBorderColor!important;
  &:hover {
    border-color: #dbdbe0;
  }
  .ch,
  .cc {
    cursor: not-allowed;
    // pointer-events: none;
  }
  .ch-title {
    // color: rgba(0, 0, 0, 0.25);
    color: #333333;
  }
}
</style>