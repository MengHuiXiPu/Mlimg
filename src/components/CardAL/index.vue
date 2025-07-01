<template>
  <div
    :class="[
      'card',
      isHidden ? 'hidden' : '',
      isActive ? 'active' : '',
      radioVisible ? 'radiocard' : '',
      cardStyle ? 'big-card' : '',
    ]"
    @click="handleClick"
  >
    <a-radio class="radio" :checked="isActive" v-if="radioVisible" :disabled="disabledCheck"></a-radio>
    <div>
      <div class="image">
        <img :src="getImage()" alt="" />
      </div>
    </div>
    <div class="article">
      <div class="top">
        <a-tooltip placement="top" :title="data.imageName">
          <h2 class="name">{{ data.imageName }}</h2>
        </a-tooltip>
        <a-tooltip placement="top" :title="data.imagesDescribe">
          <p class="text">{{ data.imagesDescribe || getText() }}</p>
        </a-tooltip>
      </div>
      <div class="bottom" @click.stop v-if="moreOption">
        <a-dropdown>
          <a class="ant-dropdown-link"> 更多 </a>
          <a-menu slot="overlay">
            <a-menu-item
              :disabled="disabledItem"
              v-action:mirror-list-delete
              @click="$parent.handleEdit(data)"
            >
              编辑
            </a-menu-item>
            <a-menu-item
              :disabled="disabledItem"
              v-action:mirror-list-delete
              @click="$parent.handleDelete(data)"
            >
              删除
            </a-menu-item>
            <!-- 暂停（继续）训练：当模型开始训练后且训练进度没到100 -->
            <!-- <a-menu-item
                  v-if="data.id === data.sourceVersionId"
                  v-action:mirror-list-delete
                  @click="$parent.handCreateVersion(data)"
                >
                  新增版本
                </a-menu-item> -->
            <a-menu-item v-action:mirror-list-share @click="$parent.shareModel(data)" :disabled="disabledItem"> 设置共享</a-menu-item>
            <!-- <a-menu-item
              v-action:mirror-list-export
              @click="$parent.onExportMirror(data)"
            >
              算法导出
            </a-menu-item> -->
          </a-menu>
        </a-dropdown>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {};
  },
  props: {
    isHidden: Boolean,
    data: Object,
    radioVisible: {
      type: Boolean,
      default: false,
    },
    defaultDesc: {
      type: String,
      default:
        "目标检测是在图像中找到待检测目标，确定且位置、大小，通过Bbox框来标识结果。",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    cardStyle: {
      type: Boolean,
      default: false,
    },
    moreOption: {
      type: Boolean,
      default: true,
    },
    // 禁用勾选
    disabledCheck: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    disabledItem() {
      return false
      if (this.data.createBy === this.$store.state.user.user.username || this.$store.state.user.user.username === "admin") {
        return false
      }
      return true
    },
  },
  methods: {
    handleClick() {
      if (this.radioVisible) {
        this.$emit("change", this.data);
        return;
      }
      this.$emit("handleClick", this.data);
    },
    onChange(e) {
      console.log(`Card checked = ${e.target.checked}`);
    },
    getImage() {
      if (this.data.tagType == "分类") {
        return require("@/assets/images/p7.png");
      }
      if (this.data.tagType == "目标检测") {
        return require("@/assets/images/p6.png");
      }
      return require("@/assets/images/p8.png");
    },
    getText() {
      if (this.data.tagType == "分类") {
        return "图象分割将图象表示为物理上有意义的连通区域的集合，也就是根据目标与背景的先验知识，对图象中的目标，背景进行标记、定位，然后将目标从背景或其他伪目标中分离出来";
      }
      if (this.data.tagType == "目标检测") {
        return "目标检测是在图像中找到待检测目标，确定且位置、大小，通过Bbox框来标识结果";
      }
      if (this.data.tagType == "语义分割") {
        return "图象分割将图象表示为物理上有意义的连通区域的集合，也就是根据目标与背景的先验知识，对图象中的目标，背景进行标记、定位，然后将目标从背景或其他伪目标中分离出来";
      }
      return "图象分割将图象表示为物理上有意义的连通区域的集合，也就是根据目标与背景的先验知识，对图象中的目标，背景进行标记、定位，然后将目标从背景或其他伪目标中分离出来";
    },
  },
};
</script>
<style>
@media (max-width: 1350px) {
  .main > .card {
    width: 32% !important;
  }
}
</style>
<style lang="less" scoped>
@import "~@/config/theme.less";
a {
  color: #00f;
}
.active {
  border: 1px solid @cardALBorderColor;
}
.big-card {
  width: 90% !important;
}
.card {
  position: relative;
  min-width: 250px;
  margin: 6px 0 6px 0;
  width: 24%;
  height: 165px;
  background: #daeaff;
  border-radius: 16px;
  padding: 12px;
  display: flex;
  align-content: center;
  border: 2px solid transparent;
  box-sizing: border-box;
  flex-direction: unset !important;
  &.radiocard {
    padding-top: 24px;
  }
  .radio {
    position: absolute;
    top: 0;
    left: 16px;
  }
  &:hover {
    border-color: #3d41ff;
  }
  &.hidden {
    opacity: 0;
  }
  .image {
    width: 110px;
    height: 110px;
    //background: skyblue;
    img {
      width: 100%;
      height: 100%;
      border-radius: 8px;
    }
  }
  .article {
    margin-left: 8px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 0;
    .top {
      flex: 1;
      margin-bottom: 8px;
      width: 100%;
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
    .bottom {
      width: 100%;
      color: #3d41ff;
      font-size: 12px;
      cursor: pointer;
      text-align: right;
    }
  }
}
</style>