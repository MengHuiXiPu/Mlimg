<template>
  <div>
    <a-row type="flex" justify="space-between">
      <a-col :span="12">
        <v-chart
            ref="chartsCpuUsage"
            v-if="isEmptyCpuUsage"
            class="v-chart"
            :option="cpuUsageOption"
            :loading="isLoading"
        />
        <a-empty
            v-else
            :description="false"/>
      </a-col>
      <a-col :span="12">
        <v-chart
            ref="chartsMemoryUsage"
            v-if="isEmptyMemoryUsage"
            class="v-chart"
            :option="memoryUsageOption"
            :loading="isLoading"
        />
        <a-empty
            v-else
            :description="false"/>
      </a-col>
    </a-row>
    <a-row>
      <a-col :span="12">
        <v-chart
            ref="chartsIODiskRead"
            v-if="isEmptyIODiskRead"
            class="v-chart"
            :option="diskReadOption"
            :loading="isLoading"
            :opts="{replaceMerge: 'series'}"
        />
        <a-empty
            v-else
            :description="false"/>
        <v-chart
            ref="chartsIODiskWrite"
            v-if="isEmptyIODiskWrite"
            class="v-chart"
            :option="diskWriteOption"
            :loading="isLoading"
            :opts="{replaceMerge: 'series'}"
        />
        <a-empty
            v-else
            :description="false"/>
      </a-col>
      <a-col :span="12">
        <v-chart
            ref="chartsIONetworkRead"
            v-if="isEmptyIONetworkRead"
            class="v-chart"
            :option="networkReadOption"
            :loading="isLoading"
            :opts="{replaceMerge: 'series'}"
        />
        <a-empty
            v-else
            :description="false"/>
        <v-chart
            ref="chartsIONetworkWrite"
            v-if="isEmptyIONetworkWrite"
            class="v-chart"
            :option="networkWriteOption"
            :loading="isLoading"
            :opts="{replaceMerge: 'series'}"
        />
        <a-empty
            v-else
            :description="false"/>
      </a-col>
    </a-row>
  </div>
</template>
<script>
import moment from "moment";
import debounce from "lodash/debounce";
import isEqual from "lodash/isEqual";

import VChart from "@/components/Echarts5";
import * as monitorApi from "@/api/monitor";
import * as utils from "./utils";
import nprogress from "nprogress";

const LADING_FLAGS = {
  CPU_USAGE: 1 << 0,
  MEMORY_USAGE: 1 << 1,
  IO_DISK_READ: 1 << 2,
  IO_DISK_WRITE: 1 << 3,
  IO_NETWORK_READ: 1 << 4,
  IO_NETWORK_WRITE: 1 << 5,
}

export default {
  name: "SystemModule",
  components: {
    VChart,
  },
  props: {
    searchOption: {
      type: Object,
      required: true,
    }
  },
  data() {
    return {
      cpuUsageData: [],
      memoryUsageData: [],
      ioDiskReadData: [],
      ioDiskWriteData: [],
      ioNetworkReadData: [],
      ioNetworkWriteData: [],
      timers: {
        intervals: [],
        timeouts: [],
      }, // 记录timer的id
      updateTimerId: null,
      loading: false,
      activeKey: "1",
    }
  },
  computed: {
    isLoading() {
      return this.loading;
    },
    isEmptyCpuUsage() {
      return this.cpuUsageData.length > 0
    },
    isEmptyMemoryUsage() {
      return this.memoryUsageData.length > 0
    },
    isEmptyIODiskRead() {
      return this.ioDiskReadData.length > 0
    },
    isEmptyIODiskWrite() {
      return this.ioDiskWriteData.length > 0
    },
    isEmptyIONetworkRead() {
      return this.ioNetworkReadData.length > 0
    },
    isEmptyIONetworkWrite() {
      return this.ioNetworkWriteData.length > 0
    },
    searchParams() {
      const [start, end] = this.searchOption.dateRange;
      return {
        start: start.format("X"),
        end: end.format("X"),
        version: this.searchOption.version,
        serviceId: this.searchOption.serviceName,
      }
    },
    cpuUsageOption() {
      return utils.buildOption({
        title: {
          text: 'CPU利用率',
        },
        yAxis: {
          name: 'Percentage (%)',
        },
      }, this.cpuUsageData);
    },
    memoryUsageOption() {
      return utils.buildOption({
        title: {
          text: '内存利用率',
        },
        yAxis: {
          name: 'Percentage (%)',
        },
      }, this.memoryUsageData);
    },
    diskReadOption() {
      return utils.buildOption({
        title: {
          text: '磁盘IO - 读',
          show: true,
        },
        yAxis: {
          name: 'bytes/sec(SI)',
          axisLabel: {
            formatter: function (value) {
              return value > 1024 ? `${(value / 1024).toFixed(2)}MB` : `${value}B`;
            }
          },
        },
      }, this.ioDiskReadData);
    },
    diskWriteOption() {
      return utils.buildOption({
        title: {
          text: '磁盘IO - 写',
          show: true,
        },
        yAxis: {
          name: 'bytes/sec(SI)',
          axisLabel: {
            formatter: function (value) {
              return value > 1024 ? `${(value / 1024).toFixed(2)}MB` : `${value}B`;
            }
          },
        },
      }, this.ioDiskWriteData);
    },
    networkReadOption() {
      return utils.buildOption({
        title: {
          text: '网络IO - 读',
          show: true,
        },
        yAxis: {
          name: 'bytes/sec(SI)',
          axisLabel: {
            formatter: function (value) {
              return value > 1024 ? `${(value / 1024).toFixed(2)}MB` : `${value}B`;
            }
          },
        },
      }, this.ioNetworkReadData);
    },
    networkWriteOption() {
      return utils.buildOption({
        title: {
          text: '网络IO - 写',
          show: true,
        },
        yAxis: {
          name: 'bytes/sec(SI)',
          axisLabel: {
            formatter: function (value) {
              return value > 1024 ? `${(value / 1024).toFixed(2)}MB` : `${value}B`;
            }
          },
        },
      }, this.ioNetworkWriteData);
    },
  },
  watch: {
    searchOption: {
      handler: function (val, oldVal) {
        if (!isEqual(val, oldVal)) {
          this.doQuery();
        }
      },
      deep: true,
    }
  },
  mounted() {
    this.doQuery();
    window.addEventListener("resize", this.resize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resize);
  },
  destroyed() {
    this.timers.intervals.forEach(id => {
      clearInterval(id);
    });
    this.timers.timeouts.forEach(id => {
      clearTimeout(id);
    });
    this.updateTimerId && clearInterval(this.updateTimerId);
  },
  methods: {
    doQuery: debounce(async function (append = false) {
      nprogress.start();
      this.$emit("query-start", moment().format("YYYY-MM-DD HH:mm:ss"));
      try {
        return await Promise.allSettled([
          this.queryCpuUsage(append),
          this.queryMemoryUsage(append),
          this.queryIODiskRead(append),
          this.queryIODiskWrite(append),
          this.queryIONetworkRead(append),
          this.queryIONetworkWrite(append),
        ]);
      } finally {
        this.$nextTick(() => {
          for (let $refsKey in this.$refs) {
            if ($refsKey.startsWith("charts")) {
              this.$refs[$refsKey].dispatchAction({
                type: 'dataZoom',
                start: 0,
                end: 100,
              });
            }
          }
        });
        this.$emit("query-end", moment().format("YYYY-MM-DD HH:mm:ss"));
        nprogress.done();
      }

    }, 1000),
    queryCpuUsage: async function (append = false) {
      const res = await monitorApi.rangeQuery("cpu", "usage", {
        serviceId: "admin",
        ...this.searchParams,
      });
      if (res && res.data && res.data.length > 0) {
        if (!append) {
          this.cpuUsageData = [];
        }
        for (let i = 0; i < res.data.length; i++) {
          const data = res.data[i];
          const lineData = [];
          data.values.forEach(value => {
            let {
              timestamp,
              value: {
                amount,
                format
              }
            } = value;

            let time = moment(timestamp, "X").format("YYYY-MM-DD HH:mm:ss");
            lineData.push({
              name: utils.quantityFormatter({amount, format}),
              value: [
                time,
                amount
              ]
            })
          });

          this.cpuUsageData.push({
            name: data.attributes["instanceId"],
            type: 'line',
            showSymbol: false,
            data: lineData,
          });
        }
      }
    },
    queryMemoryUsage: async function (append = false) {
      const res = await monitorApi.rangeQuery("memory", "usage", {
        serviceId: "admin",
        ...this.searchParams,
      });
      if (res && res.data && res.data.length > 0) {
        if (!append) {
          this.memoryUsageData = [];
        }
        for (let i = 0; i < res.data.length; i++) {
          const data = res.data[i];
          const lineData = [];
          data.values.forEach(value => {
            let {
              timestamp,
              value: {
                amount,
                format
              }
            } = value;

            let time = moment(timestamp, "X").format("YYYY-MM-DD HH:mm:ss");
            lineData.push({
              name: utils.quantityFormatter({amount, format}),
              value: [
                time,
                amount
              ]
            })
          });
          this.memoryUsageData.push({
            name: data.attributes["instanceId"],
            type: 'line',
            showSymbol: false,
            data: lineData,
          });
        }
      }
    },
    queryIODiskRead: async function (append = false) {
      const res = await monitorApi.rangeQuery("io", "disk-read", {
        serviceId: "admin",
        ...this.searchParams,
      });
      if (res && res.data && res.data.length > 0) {
        if (!append) {
          this.ioDiskReadData = [];
        }
        for (let i = 0; i < res.data.length; i++) {
          const data = res.data[i];
          const lineData = [];
          data.values.forEach(value => {
            let {
              timestamp,
              value: {
                amount,
                format
              }
            } = value;

            let time = moment(timestamp, "X").format("YYYY-MM-DD HH:mm:ss");
            lineData.push({
              name: utils.quantityFormatter({amount, format}),
              value: [
                time,
                amount
              ]
            })
          });
          this.ioDiskReadData.push({
            name: data.attributes["instanceId"],
            type: 'line',
            showSymbol: false,
            data: lineData,
          });
        }
      }
    },
    queryIODiskWrite: async function (append = false) {
      const res = await monitorApi.rangeQuery("io", "disk-write", {
        serviceId: "admin",
        ...this.searchParams,
      });
      if (res && res.data && res.data.length > 0) {
        if (!append) {
          this.ioDiskWriteData = [];
        }
        for (let i = 0; i < res.data.length; i++) {
          const data = res.data[i];
          const lineData = [];
          data.values.forEach(value => {
            let {
              timestamp,
              value: {
                amount,
                format
              }
            } = value;

            let time = moment(timestamp, "X").format("YYYY-MM-DD HH:mm:ss");
            lineData.push({
              name: utils.quantityFormatter({amount, format}),
              value: [
                time,
                amount
              ]
            })
          });
          this.ioDiskWriteData.push({
            name: data.attributes["instanceId"],
            type: 'line',
            showSymbol: false,
            data: lineData,
          });
        }
      }
    },
    queryIONetworkRead: async function (append = false) {
      const res = await monitorApi.rangeQuery("io", "network-read", {
        serviceId: "admin",
        ...this.searchParams,
      });
      if (res && res.data && res.data.length > 0) {
        if (!append) {
          this.ioNetworkReadData = [];
        }
        for (let i = 0; i < res.data.length; i++) {
          const data = res.data[i];
          const lineData = [];
          data.values.forEach(value => {
            let {
              timestamp,
              value: {
                amount,
                format
              }
            } = value;

            let time = moment(timestamp, "X").format("YYYY-MM-DD HH:mm:ss");
            lineData.push({
              name: utils.quantityFormatter({amount, format}),
              value: [
                time,
                amount
              ]
            })
          });
          this.ioNetworkReadData.push({
            name: data.attributes["instanceId"],
            type: 'line',
            showSymbol: false,
            data: lineData,
          });
        }
      }
    },
    queryIONetworkWrite: async function (append = false) {
      const res = await monitorApi.rangeQuery("io", "network-write", {
        serviceId: "admin",
        ...this.searchParams,
      });
      if (res && res.data && res.data.length > 0) {
        if (!append) {
          this.ioNetworkWriteData = [];
        }
        for (let i = 0; i < res.data.length; i++) {
          const data = res.data[i];
          const lineData = [];
          data.values.forEach(value => {
            let {
              timestamp,
              value: {
                amount,
                format
              }
            } = value;

            let time = moment(timestamp, "X").format("YYYY-MM-DD HH:mm:ss");
            lineData.push({
              name: utils.quantityFormatter({amount, format}),
              value: [
                time,
                amount
              ]
            })
          });
          this.ioNetworkWriteData.push({
            name: data.attributes["instanceId"],
            type: 'line',
            showSymbol: false,
            data: lineData,
          });
        }
      }
    },
    resize: debounce(function resize() {
      for (let $refsKey in this.$refs) {
        if ($refsKey.startsWith("charts")) {
          this.$refs[$refsKey] && this.$refs[$refsKey].resize();
        }
      }
    }, 200)
  },
}
</script>
<style scoped lang="less">
.v-chart {
  width: 100%;
  height: 300px
}
</style>