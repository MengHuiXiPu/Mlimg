<template>
  <div>
    <div class="bread">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/home/index' }">
          首页
        </el-breadcrumb-item>
        <el-breadcrumb-item v-if="breadInfo.parentName">
          <a style="color: #333 !important"
            >{{ breadInfo.parentName ?? "" }}
          </a></el-breadcrumb-item
        >
        <el-breadcrumb-item
          :to="{ path: breadInfo.path }"
          v-if="breadInfo.title"
        >
          <a style="color: #333 !important"
            >{{ breadInfo.title ?? "" }}
          </a></el-breadcrumb-item
        >
        <el-breadcrumb-item v-if="breadInfo.appName">
          {{ breadInfo.appName }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <component
      :is="activeKey"
      :tabList="tabList"
      :activeKey="activeKey"
      @tab-change="handleTabChange"
      class="content-style"
    />
  </div>
</template>

<script>
import DataManagement from "@/views/application/dataManagement/index.vue";
import deviceManagement from "@/views/application/deviceManagement/index.vue";
import deviceInfo from "@/views/application/deviceInfo/index.vue";

export default {
  components: {
    DataManagement,
    deviceManagement,
    deviceInfo,
  },
  data() {
    return {
      tabList: [
        { key: "DataManagement", name: "数据管理" },
        { key: "deviceManagement", name: "设备管理" },
        { key: "deviceInfo", name: "设备监控" },
      ],
      activeKey: "DataManagement",
      breadInfo: "",
    };
  },
  methods: {
    handleTabChange(e) {
      this.activeKey = e;
    },
  },
  mounted() {
    // console.log(this.$route);
  },
  created() {
    this.breadInfo = localStorage.getItem("bread")
      ? JSON.parse(localStorage.getItem("bread"))
      : {};
  },
};
</script>

<style lang="less" scoped>
.bread {
  padding: 4px 20px;
  padding-left: 0;
  margin-top: 20px;
}
.content-style {
  height: calc(100% - 86px);
}
.ant-tabs {
  padding-top: 8px;
}
/deep/ .ant-tabs-bar {
  display: flex;
  align-items: center;
  height: 100%;
}
/deep/ .ant-tabs-nav .ant-tabs-tab {
  /*主要内容标签样式*/
  // padding: 20px 0 4px 20px;
  margin-right: 0;
  font-size: 14px;
  line-height: 42px;
  font-weight: 500;
  font-family: "微软雅黑", sans-serif;
  padding: unset;
  background: #f2f2f2;
  padding: 0px 16px;
  height: 42px;
  margin-right: 16px;
  border-radius: 8px;
  min-width: 116px;
  text-align: center;
  &.ant-tabs-tab-active {
    background: #1990ff;
    color: #fff;
  }
}
/deep/ .ant-tabs-bar {
  border-bottom: 0;
}
/deep/ .ant-tabs-ink-bar {
  display: none !important;
  width: 0 !important;
}
</style>
