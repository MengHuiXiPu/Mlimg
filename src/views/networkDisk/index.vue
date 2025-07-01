<template>
  <div class="page-content">
    <!-- <a-tabs v-if="tabList.length > 1" v-model="activeKey">
      <a-tab-pane
        v-for="item in tabList.filter(
          (tab) =>
            !tab.auth ||
            ($store.state.request.btnAuth &&
              $store.state.request.btnAuth !== null &&
              $store.state.request.btnAuth.includes(tab.auth))
        )"
        :key="item.key"
        :tab="item.name"
      />
    </a-tabs> -->
    <el-tabs v-model="activeKey" style="width: 250px;">
      <el-tab-pane :label="item.name" :name="item.key" v-for="item in tabList" :key="item.key"></el-tab-pane>
    </el-tabs>
    <component :is="activeKey" class="content-style" />

    <!-- 将上传组件全局注册 -->
    <!-- <global-uploader/> -->
  </div>
</template>

<script>
import FileTable from "./fileTable.vue";
// import DatasetMgt from "./datasetMgt.vue";
import Sharing from "./sharing.vue";
import PublicSharing from "./publishSharing.vue";
// import globalUploader from '@/components/ShowFile/components/SimpleUploader/globalUploader.vue'
export default {
  components: {
    FileTable,
    // DatasetMgt,
    Sharing,
    PublicSharing
    // globalUploader
  },
  data() {
    return {
      tabList: [
        // { key: "DatasetMgt", name: "数据集管理" },
        { key: "FileTable", name: "个人数据" },
        { key: "Sharing", name: "共享数据" },
        { key: "PublicSharing", name: "公共数据" },
      ],
      activeKey: 'FileTable',
    };
  },
  methods: {
  },
  mounted () {
    // console.log(this.$route)
  }
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
  // overflow: auto;
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