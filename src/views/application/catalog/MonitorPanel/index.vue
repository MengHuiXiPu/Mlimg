<template>
  <div class="panel" ref="panel">
    <a-spin
        :spinning="spinning"
        :tip="spinningTips"
    >
      <search-bar
          v-model="searchModel"
          :version-list="versionList"
      />

      <div class="chart">
        <div
            v-if="searchAllowable"
        >
          <a-card>
            <request-module
                @query-start="() => this.isQuerying++"
                @query-end="() => this.isQuerying--"
                :search-option="{version, dateRange, serviceName}"
            />
          </a-card>
          <a-card>
            <system-module
                @query-start="() => this.isQuerying++"
                @query-end="() => this.isQuerying--"
                :search-option="{version, dateRange, serviceName}"
            />
          </a-card>

        </div>
        <a-empty
            v-else
            :description="false"/>
      </div>

    </a-spin>
  </div>
</template>
<script>
import moment from "moment";

import * as MonitorApi from "@/api/monitor";
import SearchBar from './SearchBar'
import SystemModule from "./SystemModule";
import RequestModule from "./RequestModule.vue";


export default {
  name: "MonitorPanel",
  components: {
    SearchBar,
    SystemModule,
    RequestModule,
  },
  provide: {
    ecTheme: "light",
  },
  props: {
    detailData: {
      type: Object,
      required: true,
    }
  },
  data: function () {
    return {
      searchModel: {
        version: "",
        dateRange: [moment().startOf("days"), moment()],
      },
      serviceInfo: {},
      hasErr: false,
      isQuerying: 0,
      tips: "...",
    }
  },
  computed: {
    spinning() {
      return this.isQuerying > 0;
    },
    spinningTips() {
      return "查询中..."
    },
    searchAllowable() {
      return !this.hasErr && this.versionList.length && this.version && this.dateRange.length;
    },
    version: function () {
      return this.searchModel.version;
    },
    versionList: function () {
      return (this.serviceInfo.versions || []).map(item => ({
        name: item.version,
        value: item.version
      }));
    },
    serviceName: function () {
      return this.serviceInfo.name;
    },
    dateRange() {
      return this.searchModel.dateRange || [];
    },
  },
  mounted() {
    MonitorApi.queryServiceInfoById(this.detailData.id)
        .then(res => {
          this.$nextTick(() => {
            if (res.data) {
              this.serviceInfo = res.data;
              this.searchModel.version = (this.versionList[0] || {}).value || "";
            }
          })
        }).catch(() => {
      this.hasErr = true;
    });
  }
}
</script>


<style scoped lang="less">
div.panel {
  height: 60vh;
  width: 96%;
  margin: 0 auto;

  div.chart {
    width: 100%;
    max-height: 50vh;
    overflow-y: auto;
  }
}
</style>