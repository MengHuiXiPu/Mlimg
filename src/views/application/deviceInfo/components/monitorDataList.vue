<template>
  <div class="page-content">
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
          <a style="color: #333 !important">
            {{ breadInfo.title ?? "" }}
          </a>
        </el-breadcrumb-item>
        <el-breadcrumb-item
          :to="{ path: breadInfo.appPath, query: { appId: $route.query.appId } }"
          v-if="breadInfo.appName && breadInfo.appPath"
        >
          <a style="color: #333 !important">
            {{ breadInfo.appName ?? "" }}
          </a>
        </el-breadcrumb-item>
        <el-breadcrumb-item v-if="$route.meta.title"
          >{{ $route.meta.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <a-header
      :auth="{ add: 'monitor-list-add' }"
      pageTitle="设备监控详情"
      faName="monitorDataList"
      :tab-list="tabList"
      :tab-active-key="value"
      @tab-change="tabOnChange"
      :isShowBread="false"
      :showReload="false"
      :showSearch="false"
      :showNew="false"
    ></a-header>
    <div
      class="main"
      element-loading-text="拼命加载中"
      element-loading-background="rgba(255, 255, 255, 0.5)"
      v-loading="loading"
    >
      <monitorInfo
        ref="mointorInfo"
        :monitorData="monitorData"
        :pagination="pagination"
        :infoData="infoData"
        :value="value"
        @time-change="handleTimeChange"
      ></monitorInfo>
    </div>
  </div>
</template>
<script>
import { getTransferRecordList } from "@/api/cloud.js";
import { getResultList, getLatestResult } from "@/api/appCenter.js";
import { getInferTaskImage } from "@/api/appCenter.js";
import ImageLoader from "@/utils/imageLoader";
import monitorInfo from "./monitorInfo";

export default {
  components: {
    monitorInfo,
  },
  name: "monitorResult",
  data() {
    return {
      tabList: [
        {
          name: "实时信息",
          key: 1,
        },
        {
          name: "历史记录",
          key: 2,
        },
      ],
      value: 1,
      monitorData: [], // 监控数据
      imageLoader: null,
      loading: false,
      inferTaskId: null, // 任务ID
      infoData: {}, // 子页面展示的数据，图片和正常异常数据
      timer: null,
      dateObj: {}, // 子组件时间对象
      pagination: {
        onChange: (page) => {
          this.pagination.current = page;
          this.getData({
            ...this.dateObj,
            pageNo: this.pagination.current,
            limit: 10,
          });
          this.$refs.mointorInfo.activeItem = 0;
        },
        pageSize: 10,
        total: 0,
        current: 1,
        simple: true,
      },
      breadInfo: "",
    };
  },
  beforeDestroy() {
    this.timer && clearTimeout(this.timer);
  },
  methods: {
    tabOnChange(e) {
      this.value = e;
      this.monitorData = [];
      this.getData();
    },
    async getInferTaskId() {
      const params = {
        deviceId: this.$route.query.deviceId, //目标设备id
        recordType: 0, // 0 文件记录  1命令记录
        pageNo: 1,
        limit: 10, //limit 1即可，但因为传1接口报错，后端限制了必须>10， 将就着用吧
      };
      const res = await getTransferRecordList(params);
      if (res.code == 0 && Array.isArray(res?.data?.records)) {
        if (res.data.records.length) {
          this.inferTaskId = res.data.records[0].inferTaskId;
          this.getData();
        }
      }
    },
    getData(params = {}) {
      this.timer && clearTimeout(this.timer);
      if (this.inferTaskId === null) return;
      this.loading = true;
      const request = this.value === 2 ? getResultList : getLatestResult;
      // 获取历史记录
      request(this.inferTaskId, params)
        .then((res) => {
          if (res.code == 0) {
            this.monitorData =
              this.value === 2 ? res?.data?.records : [res?.data];
            this.pagination.total = res?.data?.total || 0;
            // this.monitorData = Array.isArray(this.monitorData) ? this.monitorData[0]?.tvm_modules : []; // 历史记录和实时数据都是取的第一个对象的数据
            // 实时数据的话，只有一个数据
            const tvm_modules = this.monitorData[0]?.tvm_modules;
            if (tvm_modules) {
              this.getStatsTableData(tvm_modules);
              this.getImage(tvm_modules);
            } else {
              this.infoData = [];
              this.$set(this.infoData, "imgUrl", "");
            }
          }
        })
        .finally(() => {
          this.loading = false;
          // 实时数据的话 10S 刷新一次, 如果没有任务ID的话就不刷新
          if (request === getLatestResult && this.inferTaskId) {
            this.timer = setTimeout(() => {
              this.getData();
            }, 10000);
          }
        });
    },
    // 查看历史记录触发的事件，dataObj 里面是起始时间和结束时间
    handleTimeChange(dateObj) {
      this.dateObj = dateObj;
      this.pagination.current = 1;
      this.getData(dateObj);
    },
    // 根据传入的任务结果对象获取类别和正常异常数据
    getStatsTableData(obj) {
      const stats = {};
      const output = obj["1497_BoardDetPost"]?.output?.lstRetDatas;
      if (Array.isArray(output) && output) {
        output.forEach(([status, type]) => {
          stats[type] = stats[type] || { OK: 0, NOT_OK: 0 };
          if (status === "OK") {
            stats[type].OK++;
          } else {
            stats[type].NOT_OK++;
          }
        });
      }
      const statsData = Object.keys(stats).map((type, index) => ({
        key: index,
        category: type,
        OK: stats[type].OK,
        NOT_OK: stats[type].NOT_OK,
      }));
      this.$set(this.infoData, "statsData", statsData);
    },
    // 根据传入的结果对象获取图片
    getImage(obj) {
      const originImageUrl = obj["1697_ImageROI"]?.output?.imgOut?.data;
      if (originImageUrl) {
        getInferTaskImage({
          id: this.inferTaskId,
          imgPath: originImageUrl,
        }).then((res) => {
          let imgUrl = window.URL.createObjectURL(res);
          this.$set(this.infoData, "imgUrl", imgUrl);
        });
      }
    },
  },
  created() {
    this.imageLoader = new ImageLoader();
    this.getInferTaskId();
    this.breadInfo = localStorage.getItem("bread")
      ? JSON.parse(localStorage.getItem("bread"))
      : {};
  },
};
</script>
<style scoped lang="less">
.bread {
  padding: 4px 20px;
  padding-left: 0;
  margin-top: 20px;
}
.main {
  width: 100%;
  background: #fff;
  border-radius: 16px;
}
/deep/ .ant-tabs-bar {
  display: none;
}
</style>
