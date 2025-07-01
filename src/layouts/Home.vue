<template>
  <div>
    <a-layout class="home" style="display: flex; flex-direction:row;">
      <a-layout-sider class="layout-sider" ref="layoutSider" style="overflow-y: auto;">
        <div class="system-logo">
          <div class="flex">
            <img
                src="@/assets/ai_logo.png"
                height="40px"
                width="auto"
                alt="system logo" draggable="false" oncontextmenu="return false;"
            /><span v-if="!isCollapse" style="vertical-align: middle; color: #000000">{{ system.name }}</span>
          </div>
        </div>
        <!-- 改为从上边切换，在headerNavBar中 -->
        <!-- <div class="collapse" @click="changeCollapse">
          <a-icon v-if="!isCollapse" type="caret-left" />
          <a-icon v-if="isCollapse" type="caret-right" />
        </div> -->
        <!--          :default-active="$route.path !== '/hello'? $route.path : ''"-->

        <el-menu ref="menu"
                 class="el-menu-vertical-demo"
                 :default-active="$route.path"
                 router
                 unique-opened
                 menu-trigger="click"
                 :collapse="isCollapse">
<!--          @select="handleMenuClick"-->
          <!-- 一级菜单 -->
          <template v-for="menu in menus">
            <el-submenu v-if="menu.children && menu.children.length" :index="menu.name" :key="menu.path">
              <template slot="title">
                <div class="menu-style">
                  <SvgIcon :type="menu?.meta?.icon" class="icon"/>
                  <span>{{ menu?.meta?.title || "无Title" }}</span>
                </div>
              </template>

              <!-- 二级菜单 -->
              <template v-for="item in menu.children">
                <el-menu-item :index="item.path" :key="item.path" :route="{ path: item.path}">
                  <span slot="title">{{ item?.meta?.title || "无Title" }}</span>
                </el-menu-item>
              </template>
            </el-submenu>

            <el-menu-item v-else :index="menu.path" :key="menu.path" :route="{ path: menu.path}" class="firstLevelMenu">
              <div class="menu-style">
                <SvgIcon :type="menu?.meta?.icon" class="icon"/>
                <span slot="title">{{ menu?.meta?.title || "无Title"}}</span>
              </div>
            </el-menu-item>
          </template>
        </el-menu>
        <!-- <div class="global-toolbar">
          <span class="global-toolbar-btn el-icon-message-solid"></span>
          <span class="global-toolbar-btn el-icon-s-tools"></span>
        </div> -->
        <Avatar class="avatarFix"></Avatar>
      </a-layout-sider>
      <a-layout-content class="layout-content" style="overflow: auto; height: 100%">
        <div style="width: 100%; height: 100%; padding: 8px 16px 8px 25px;overflow-y: auto;" class="scrollbar">
          <headerNavBar :isCollapse="isCollapse" @toggleCollapseMenu="changeCollapse"></headerNavBar>
          <!-- 标签页 -->
          <TagsView v-show="$route.name !=='HomeIndex'"/>
          <keep-alive :include="cachedViews">
            <router-view class="layout-content-container" :key="$route.path"/>
          </keep-alive>
        </div>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script>
import { findItemByPath, createUuid } from "@/utils/utils.js"
import system from "@/config/system.js"
import Avatar from "./Avatar"
import headerNavBar from "./components/headerNavBar.vue";
import TagsView from "./TagsView/index.vue";

export default {
  name: 'Home',
  components: {
    Avatar,
    headerNavBar,
    TagsView,
  },
  data() {
    return {
      // 被激活的链接地址
      // activePath: "",
      // 是否收起，false为展开，true收起
      isCollapse: false,
      // Header高度
      headerHeight: 0,
      menuWidth: '@menuWidth',
    }
  },
  mounted() {
    // 获取登录用户信息
    this.$store.dispatch('requireUserInfo')
    this.$store.dispatch('requestSysUids')
    // console.log("this.$route: ", this.$route.path === "/hello");
  },
  computed: {
    cachedViews() {
      return this.$store.state.tagsView.cachedViews
    },
    menus() {
      // console.log("menus: ", this.$store.state.request.menus);
      return this.$store.state.request.menus;
    },
    system() {
      return system
    },
  },
  watch: {
    activePath(newPath, oldPath) {
      // console.log("activePath: ", newPath, oldPath);
      this.$refs.menu.expandPath(newPath);
    }
  },
  methods: {
    createUuid,

    getHeaderHeight(value) {
      this.headerHeight = value;
    },

    changeCollapse() {
      this.isCollapse = !this.isCollapse;
      // console.log('this.$refs["layout-sider"]: ', this.$refs.layoutSider);
      if (this.isCollapse) {
        this.$refs.layoutSider.width = "80px!important";

      } else {
        this.$refs.layoutSider.width = "200px!important";
      }
      // console.log('after this.$refs["layout-sider"]: ', this.$refs.layoutSider);
    }
    // 改变左侧栏的选中栏目
    // change(indexPath) {
    //   this.activePath = indexPath
    // },
  },
}
</script>

<style lang="less">
@import "~@/config/theme.less";
.el-menu--vertical .el-menu--popup {
  min-width: 120px !important;
  padding: 8px !important;
  border-radius: @borderRadiusBig!important;
  background-color: @menuBackgroundColor!important;
}
</style>

<style lang="less" scoped>
//@import '~@/assets/styles/variables.less';
@import "~@/config/theme.less";
.layout-content-container {
  padding: 15px 20px;
  background-color: #ffffff;
  min-height: calc(100vh - 105px);
  border-radius: 0 12px 12px 12px;
}
.home {
  width: 100vw;
  height: 100%;
  min-width: 1280px;
  background-color: @homeBackgroundColor;
  //overflow: auto;
  .layout-sider {
    position: relative;
    border-right: 0;
    overflow-x: hidden;
    padding: 2px;
    overflow-y: auto;
    background-color: @siderBackgroundColor;
    z-index: 1;
    .system-logo {
      //width: 100%;
      //padding: 20px;
      text-align: center;
      margin: 0 auto 8px;
      min-height: 60px;
      color: #000;
      font-size: @logoFontSize;
      font-weight: 700;
      font-family: @fontFamily;
      p {
        margin: 0;
      }
      .red {
        color: #d9001b;
      }
    }
    .menu-style {
      display: flex;
      align-items: center;
      .icon {
        width: 16px !important;
        height: 16px !important;
        margin-right: 8px;
      }
    }
    .collapse {
      position: absolute;
      display: flex;
      justify-content: center;
      align-items: center;
      right: 0px;
      top: 75%;
      width: 20px;
      height: 40px;
      text-align: center;
      vertical-align: middle;
      background-color: @menuBackgroundColor;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
      //transform: translate(50%, -50%);
      //border-radius: 50%;
      //border-top-left-radius: 50%;
      //border-bottom-left-radius: 50%;
      border-radius: 20px 0 0 20px;
      z-index: 99999 !important;
    }
    .el-menu-vertical-demo:not(.el-menu--collapse) {
      //margin-top: 30px;
      //width: 100%;
      width: 180px;
      margin: 0 auto;
      background-color: @menuBackgroundColor;
      color: @menuColor;
      //height: 100%;
      //min-height: 400px;
      .icon {
        width: 16px !important;
        height: 16px !important;
        color: @menuColor;
      }
    }
    .firstLevelMenu {
      color: @menuColor;
      font-size: @menuFirstFontSize;
      font-weight: 700;
    }
    .menu-icon {
      color: @menuColor;
    }
    .avatarFix {
      position: fixed;
      top: 8px;
      transform: translateX(-50%);
      right: 10px;
    }
    .global-toolbar {
      position: fixed;
      top: 18px;
      right: 80px;
      &-btn {
        cursor: pointer;
        font-size: 18px;
        margin: 0 5px;
        color: #606266;
        &:hover {
          opacity: 0.6;
        }
      }
    }
  }

  .layout-content {
    flex: 1;
    padding: 0;
    // padding: 8px 8px 8px 0px;
    & > div {
      border-radius: @borderRadiusBig;
      // background-color: @contentBackgroundColor;
      background-color: @baseLayoutBgColor;
      padding-bottom: 0;
    }
  }
}

/deep/ .home .layout-sider .el-menu--collapse .firstLevelMenu {
  color: #0000ff;
  font-size: 16px !important;
  font-weight: 700;
  width: 44px;
  margin: auto;
  padding-left: 14px !important;
  background-color: transparent !important;
}

/deep/ .home .layout-sider .firstLevelMenu {
  font-size: 16px !important;
}

/deep/ .el-submenu.is-active {
  border-radius: @borderRadiusSmall;
  //background-color: #00f;
  //color: #fff;
}

/deep/ .el-submenu__title {
  height: 44px !important;
  line-height: 44px !important;
  border-radius: @borderRadiusSmall!important;
}

/deep/ .el-menu--collapse .el-submenu__title {
  display: flex !important;
  align-items: center !important;
  width: 44px;
  margin: auto;
  height: 44px;
  border-radius: 8px;
  padding-left: 14px !important;
}
//.layout-header {
//  height: @headerHeight;
//  background-color: @headerPrimaryColor;
//}
/deep/ .el-menu {
  background-color: @menuBackgroundColor;
  font-family: @fontFamily;
  transition: all 0.2s linear;
}

/deep/ .el-submenu__title {
  color: @menuColor;
  font-size: @menuFirstFontSize;
  font-weight: 700;
}
/deep/ .el-menu-item,
.el-submenu__title {
  height: 44px !important;
  line-height: 44px !important;
  list-style: none;
}

/deep/ .el-submenu__icon-arrow {
  margin: 0;
  transform: translateY(-50%);
}

/deep/ .el-submenu .el-menu-item {
  //margin-left: 16px;
  padding-left: 56px !important;
  min-width: 180px;
  border-radius: @borderRadiusSmall;
  height: 38px !important;
}

/deep/ .el-menu-item {
  //width: 180px;
  //height: 44px;
  //box-sizing: border-box;
  color: @menuColor;
  font-size: @menuSecondFontSize;
}

/deep/ .el-menu-item,
.el-submenu__title {
  height: 38px !important;
  color: @menuColor!important;
  font-size: @menuSecondFontSize!important;
}

/deep/ .el-menu-item.is-active {
  color: @itemActiveColor!important;
  background-color: @itemActiveBackgroundColor!important;
  border-radius: @borderRadiusSmall;
}

/deep/ .firstLevelMenu.is-active {
  color: @menuColor!important;
  background-color: transparent !important;
  //background-color: @itemActiveBackgroundColor!important;
  //border-radius: @borderRadiusBig;
}

///deep/ .el-menu-item .firstLevelMenu.is-active {
//  background-color: #ecf5ff;
//}

/deep/ .el-menu-item [class^="el-icon-"] {
  font-size: 16px !important;
  margin-right: 8px;
}

/deep/ .el-menu-item,
.el-submenu__title {
  height: 44px !important;
  line-height: 44px !important;
  border-radius: @borderRadiusSmall;
  display: flex;
  align-items: center;
}

/deep/ .el-menu--collapse {
  width: 64px;
  margin: auto;
}

/deep/ .el-menu--collapse .el-submenu__title {
  display: flex !important;
  align-items: center !important;
}

/deep/ .el-menu--collapse .el-submenu,
.el-menu-item {
  display: flex !important;
  align-items: center !important;
}

//.el-menu--popup {
//  background: @menuBackgroundColor!important;
//  margin: 0!important;
//  width: 180px!important;
//  padding: 0!important;
//  min-width: 180px!important;
//  border-radius: 16px!important;
//}

// 修改弹出层激活的样式
.el-menu--popup > li.is-active {
  color: @itemActiveColor!important;
  background-color: @itemActiveBackgroundColor !important;
}

.el-menu--popup > li {
  //border-bottom: 1px dashed rgba(201, 211, 213, 0.7) !important;
  height: 38px !important;
  color: @menuColor!important;
  width: 120px !important;
  text-align: center;
  min-width: 120px !important;
  border-radius: @borderRadiusSmall!important;
}

/deep/ .el-menu--popup {
  min-width: 120px !important;
  padding: 8px !important;
  border-radius: @borderRadiusBig!important;
  background-color: @menuBackgroundColor!important;
}

/deep/ .ant-layout-sider {
  flex-basis: @menuWidth!important;
  width: @menuWidth!important;
  max-width: @menuWidth!important;
  min-width: @menuWidth!important;
}

.ant-layout.ant-layout-has-sider > .ant-layout,
.ant-layout.ant-layout-has-sider > .ant-layout-content {
  overflow: hidden;
}
</style>

