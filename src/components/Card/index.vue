<template>
<!--  'active': data.isSelected-->
  <div :class="{'card': true, 'hidden': isHidden, 'firstTop': index == 0, 'big-card': cardStyle,}" @click="handleSelected">
    <div class="header">
      <div class="left">
        <a-checkbox v-model="data.isSelected" v-if="isSelect" style="margin-right: 5px" :disabled="disabled"></a-checkbox>
        <a-tooltip placement="topLeft" :title="data.dlName">
        <h2 class="text">{{data.dlName}} </h2>
        </a-tooltip>
        <!-- <div class="status">{{rowDataStatus[data.status - 1]}} </div> -->
        <!-- 标注中的状态显示 -->
        <!-- <template v-if="data.status === 2 && data.autoMarkTaskStatus === 1">
          <div class="status-normal">{{`${ data.autoMarkImgFinishCount }/${ data.autoMarkImgCount }`}}</div>
        </template>
        <template v-else> -->
          <span v-if="rowDataStatus[data.status - 1] === '异常'">
            <div class="status-abnormal">
              {{ rowDataStatus[data.status - 1] }}
            </div>
          </span>
          <span v-else-if="data.modelSchedule && data.status === 8">
            <!-- data.modelSchedule 为null和数字字符串 100代表训练完成, 与后端约定好的，只有当数据集转化过程中这个字段才会有值-->
            <div class="status-normal" v-if="data.modelSchedule !== '100'">
                {{ `转换${data.modelSchedule}%` }}
            </div>
            <div class="status-normal" v-else>
                {{ `转换完成` }}
            </div>
          </span>
          <span v-else-if="rowDataStatus[data.status - 1] === '解析中'">
            <div class="status-normal">
              {{ `解析${parseNum(data)}` }}
            </div>
          </span>
          <span v-else>
            <div class="status-normal">
              {{ rowDataStatus[data.status - 1] }}
            </div>
          </span>
        <!-- </template> -->
      </div>
      <a-dropdown v-if="moreOption">
        <div @click.stop class="moreBtn ant-dropdown-link"><i class="el-icon-more"></i></div>
        <a-menu slot="overlay">
          <a-menu-item :disabled="isTransformDataset || disabledItem"  @click="$parent.handleEdit(data)">
            编辑
          </a-menu-item>
          <a-menu-item
              :disabled="disabledItem || [1,4,8].includes(data.status)"
              @click="handleDelete"
          >
            删除
          </a-menu-item>
          <!-- 暂停（继续）训练：当模型开始训练后且训练进度没到100   -->
          <a-menu-item
              v-if="data.status === 2 && data.sampleNum !== 0"
              v-action:dataMrg-list-edit
              :disabled="disabledItem || data.autoMarkTaskStatus === 1"
              @click="$parent.callAutoAnnotation(data)"
          >
            自动标注
          </a-menu-item>
          <a-menu-item
              :disabled="disabledItem || data.autoMarkTaskStatus !== 1"
              v-action:dataMrg-list-edit>
            <a-popconfirm
                title="该数据集正在进行自动标注,若强行终止,将导致部分数据未被标注"
                ok-text="终止"
                cancel-text="取消"
                @confirm="$parent.stopAutoAnnotation(data)"
            >
              <span>停止标注</span>
            </a-popconfirm>
          </a-menu-item>
          <!-- <a-menu-item>
            <a href="javascript:;" :disabled="disabledItem" @click="$parent.removeAllLabel(data)">清空标注</a>
          </a-menu-item>
          <a-menu-item>
            <a href="javascript:;" :disabled="disabledItem" @click="$parent.showMoveNode(data)">移动节点</a>
          </a-menu-item> -->
          <!-- <a-menu-item :disabled="data.status !== 2 || disabledItem" @click="$parent.showPushData(data)">
            追加数据
          </a-menu-item> -->
          <!-- <a-menu-item>
            <a :disabled="data.shareType == 3 || disabledItem" href="javascript:;" @click="$parent.showTransformModal(data)">测试集目录结构转换</a>
          </a-menu-item>
          <a-menu-item>
            <a href="javascript:;" :disabled="disabledItem" @click="$parent.showBlurModal(data)">模糊阈值计算</a>
          </a-menu-item>
          <a-menu-item>
            <a :disabled="data.dlTagType !== '分类' || disabledItem" href="javascript:;" @click="$parent.changeDataType(data, 2)">转换目标检测(XML)</a>
          </a-menu-item>
          <a-menu-item>
            <a :disabled="data.dlTagType !== '分类' || disabledItem" href="javascript:;" @click="$parent.changeDataType(data, 1)">转换目标检测(JSON)</a>
          </a-menu-item>-->
          <!-- <a-menu-item>
            <a :disabled="data.dlTagType !== '分类' || disabledItem" href="javascript:;" @click="$parent.changeDataType(data, 1, '目标检测')">转换成目标检测(状态)</a>
          </a-menu-item>
          <a-menu-item>
            <a :disabled="data.dlTagType === '分类' || disabledItem" href="javascript:;" @click="$parent.changeDataType(data, 1, '分类')">转换成分类(状态)</a>
          </a-menu-item>  -->
          <a-menu-item :disabled="data.dlTagType !== '其他' || data.status !== 2 || disabledItem" @click="$parent.callDatasetTypeSet(data)">
            类型设置
          </a-menu-item>
          <a-menu-item :disabled="data.dlTagType !== '分割' || data.status !== 2 || disabledItem"  @click="$parent.doConvert(data)">
            <!-- <a :disabled="data.dlTagType !== '分割' || disabledItem" href="javascript:;" @click="$parent.doConvert(data)">转换成分类</a> -->
            转换数据集
          </a-menu-item> 
          <a-menu-item :disabled="data.status !== 2 || disabledItem" @click="$parent.shareModel(data)">
            设置共享
          </a-menu-item>
        </a-menu>
      </a-dropdown>
    </div>
    <div class="content">
      <div class="parameter">
        <div class="item" v-if="data.dlTagType">{{data.dlTagType}}</div>
        <div class="item" v-if="data.class || data.totalCategories">{{data.class || data.totalCategories}} 类</div>
        <div class="item" v-if="data.sampleNum">{{data.totalPictures}} 张</div>
        <div class="item" v-if="data.tagRatio">{{data.tagRatio}}</div>
        <div class="item" v-if="false">参数</div>
      </div>
      <div class="image">
        <el-image :src="imageSource" lazy>
          <div slot="error" class="image-slot" style="width: 100%; height: 100%;">
            <img style="width: 100%; height: 100%;" :src="require('@/assets/images/place.gif')" alt="">
          </div>
        </el-image>
        <!-- 标注中时，展示标注进度百分比 -->
        <a-progress :percent="caclAnnotationPercent(data)" size="small" status="active" class="annotation-progress" v-if="data.status === 2 && data.autoMarkTaskStatus === 1"/>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Card",
  data() {
    return {
      rowDataStatus: ['解析中', '正常', '解析失败', '创建中', '复制中', '拆分中', '解析图片...', '转换中', '上传中', '转换失败'],
    }
  },
  computed: {
    imageSource() {
      if (this.data.cover) {
        // 如果 data.cover 存在，添加前缀后返回
        return `data:image/jpeg;base64,${this.data.cover}`;
      } else {
        // 如果 data.cover 不存在，使用占位图像
        return require("@/assets/images/place.gif");
      }
    },
    disabledItem() {
      return false
      if (this.data.createBy === this.$store.state.user.user.username || this.$store.state.user.user.username === "admin") {
        return false
      }
      return true
    },
    isTransformDataset() {
      return this.data.forecastId !== null;
    }
  },
  props: {
    data: {
      type: Object,
      default: {}
    },
    isHidden: Boolean,
    index: Number,
    isSelect: {
      type: Boolean,
      default: false
    },
    selectState: {
      type: Boolean,
      default: false
    },
    cardStyle: {
      type: Boolean,
      default: false
    },
    moreOption: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  mounted() {
    // console.log("data+++++++++: ", this.data);
  },
  methods: {
    caclAnnotationPercent(data) {
      if (data.autoMarkImgFinishCount == null || data.autoMarkImgFinishCount == 0) {
        return 0;
      }
      return parseFloat((data.autoMarkImgFinishCount / data.autoMarkImgCount * 100).toFixed(2));
    },
    handleSelected() {
      this.$emit("toSingleDataDetail", this.data)
    },
    handleDelete() {
      this.$parent.handleDelete(this.data, this.index)
    },
    autoLabel() {
      this.$parent.handleDelete(this.data)
    },
    parseNum(data) {
      if (data.parseTotalPictures == null
        || data.totalPictures == null
        || data.totalPictures == 0
        || data.parseTotalPictures == 0)
        return '0%';
      return `${parseFloat((data.parseTotalPictures / data.totalPictures * 100).toFixed(2))}%`
    },
    // onChange(e) {
    //   console.log(`Card checked = ${e.target.checked}`);
    //   if(e.target.checked) {
    //     this.$emit("changeSelected", this.data);
    //   }else{
    //     this.$emit("removeSelected", this.data);
    //   }
    // }
  }
}
</script>
<style>
@media (min-width: 1600px) {
  .dataCard > .card {
    width: 24% !important;
  }
}
</style>

<style lang="less" scoped>
@import "~@/config/theme.less";
.active {
  border: 1px solid @cardALBorderColor!important;
}
.card {
  box-sizing: border-box;
  border: 2px solid transparent;
  width: 32%;
  height: 210px;
  border-radius: @borderRadiusBig;
  background: #daeaff;
  padding: 8px;
  display: flex;
  flex-direction: column;
  min-width: 280px;
  cursor: pointer;
  &.hidden {
    opacity: 0;
  }
  &:hover {
    border-color: #3d41ff;
  }
  .header {
    width: 100%;
    height: 36px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    .left {
      flex: 1;
      display: flex;
      align-items: center;
      height: 40px;
      margin-right: 8px;
      .text {
        font-size: 16px;
        line-height: 40px;
        margin: 0;
        font-weight: 600;
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        width: 0;
      }
      .status-abnormal {
        width: 80px;
        height: 30px;
        line-height: 30px;
        background: #f03607;
        margin-left: 8px;
        border-radius: 15px;
        text-align: center;
        color: white;
        font-size: 14px;
      }
      .status-normal {
        width: 80px;
        height: 30px;
        line-height: 30px;
        background: #0ea01e;
        margin-left: 8px;
        border-radius: 15px;
        text-align: center;
        color: white;
        font-size: 14px;
      }
    }
    .moreBtn {
      margin-right: 8px;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #a0cfff;
      text-align: center;
      line-height: 30px;
      cursor: pointer;
    }
  }
  .content {
    flex: 1;
    display: flex;
    .parameter {
      height: 100%;
      .item {
        width: 90px;
        height: 30px;
        margin-bottom: 8px;
        background: #c3cbd6;
        color: #4346f1;
        text-align: center;
        border-radius: 15px;
        line-height: 30px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
    }
    .image {
      flex: 1;
      height: 95%;
      margin-left: 12px;
      position: relative;
      .el-image {
        width: 100%;
        height: 130px;
        border-radius: 4px;
        img {
          border-radius: 4px;
        }
      }
      .annotation-progress {
        position: absolute;
        width: 90%;
        top: 40%;
        left: 20px;
      }
    }
  }
}
.big-card {
  width: 90%;
}
</style>