<template>
  <div ref="container">
    <a-row :gutter="6">
      <a-col :span="24">
        <a-card :bordered="false">
          <v-chart
              class="v-chart"
              ref="chartsRequest"
              :loading="isLoading"
              :option="requestMetricsOption"
              :opts="{replaceMerge: 'series'}"
              :debounce-wait="1000"
          />
        </a-card>
        <a-card :bordered="false">
          <v-chart
              class="v-chart"
              ref="chartsQPS"
              :loading="isLoading"
              :option="requestQPSOption"
              :opts="{replaceMerge: ['series', 'toolbox']}"
              :debounce-wait="1000"
          />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>
<script>
import merge from "lodash/merge";
import debounce from "lodash/debounce";
import VChart from "@/components/Echarts5";
import * as monitorApi from "@/api/monitor";
import {requestMetricsOption, requestQPSOption} from "./constants";
import moment from "moment";
import isEqual from "lodash/isEqual";

export default {
  name: "RequestModule",
  components: {
    VChart
  },
  props: {
    searchOption: {
      type: Object,
      required: true
    },
  },
  data() {
    return {
      percentageSeries: [],
      responseTimeSeries: [],
      requestQPSSeries: [],
    }
  },
  computed: {
    requestMetricsOption() {
      return merge({}, requestMetricsOption, {
        series: this.requestMetricsSeries,
      });
    },
    requestQPSOption() {
      return merge({}, requestQPSOption, {
        series: this.requestQPSSeries,
      });
    },
    requestMetricsSeries() {
      return [...this.responseTimeSeries, ...this.percentageSeries];
    },
    requestParametersForRequestMetrics() {
      const [start, end] = this.searchOption.dateRange;
      const secondDiff = moment(end).diff(moment(start), 'second');
      const minDiff = moment(end).diff(moment(start), 'minute');
      const hourDiff = moment(end).diff(moment(start), 'hour');
      let step = "SECOND";
      let pattern = "YYYY-MM-DD HHmmss";
      if (secondDiff > 500 && minDiff <= 500) {
        step = "MINUTE";
        pattern = "YYYY-MM-DD HHmm";
      } else if (minDiff > 500 && hourDiff < 500) {
        step = "HOUR"
        pattern = "YYYY-MM-DD HH";
      } else if (hourDiff >= 500) {
        step = "DAY"
        pattern = "YYYY-MM-DD";
      }

      return {
        start: start.format(pattern),
        end: end.format(pattern),
        version: this.searchOption.version,
        serviceId: this.searchOption.serviceName,
        step,
      };
    },
    isLoading() {
      return this.requestMetricsSeries.length === 0;
    },
  },
  mounted() {
    this.doQuery();
    window.addEventListener("resize", this.resize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resize);
  },
  watch: {
    searchOption: {
      handler(val, oldVal) {
        if (!isEqual(val, oldVal)) {
          this.doQuery();
        }
      },
      deep: true,
    }
  },
  methods: {
    doQuery: debounce(async function () {
      this.$emit("query-start", moment().format("YYYY-MM-DD HH:mm:ss"));
      try {
        return await Promise.allSettled([
          this.queryServicePercentileRange(),
          this.queryServiceSuccessRageRange(),
          this.queryQPSRange(),
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
      }
    }, 1000),
    queryServicePercentileRange: async function () {
      const res = await monitorApi.serviceMetricsQuery(
          {
            metricName: "percentile",
            ...this.requestParametersForRequestMetrics
          }
      );
      if (res.data && res.data.length > 0) {
        const data = res.data;
        const responseTimeSeries = [];
        for (let i = 0; i < data.length; i++) {
          const series = {
            yAxisIndex: 1,
            data: [],
            type: 'bar',
            tooltip: {
              valueFormatter: function (value) {
                return `${value} ms`;
              }
            },
          };
          const item = data[i];
          series.name = item.attributes["metricName"];
          const values = item.values;
          for (let j = 0; j < values.length; j++) {
            const value = values[j];
            series.data.push({
              value: [moment(value.timestamp, "x").format("YYYY-MM-DD HH:mm:ss"), value.value.amount],
              format: value.value.format,
            });
          }
          responseTimeSeries.push(series);
        }
        this.responseTimeSeries = responseTimeSeries;
      } else {
        this.responseTimeSeries = [];
      }
    },
    queryServiceSuccessRageRange: async function () {
      const res = await monitorApi.serviceMetricsQuery(
          {
            metricName: "success-rate",
            ...this.requestParametersForRequestMetrics
          }
      );

      if (res.data && res.data.length > 0) {
        const data = res.data;
        const percentageSeries = [];
        for (let i = 0; i < data.length; i++) {
          const series = {
            yAxisIndex: 0,
            data: [],
            type: 'line',
            symbol: "circle",
            smooth: true,
            tooltip: {
              valueFormatter: function (value) {
                return `${value} %`
              }
            },
          };
          const item = data[i];
          series.name = item.attributes["metricName"];
          const values = item.values;
          for (let j = 0; j < values.length; j++) {
            const value = values[j];
            series.data.push({
              value: [moment(value.timestamp, "x").format("YYYY-MM-DD HH:mm:ss"), value.value.amount],
              format: value.value.format,
            });
          }
          percentageSeries.push(series);
        }
        this.percentageSeries = percentageSeries;
      } else {
        this.percentageSeries = [];
      }
    },
    queryQPSRange: async function () {
      const res = await monitorApi.serviceMetricsQuery(
          {
            metricName: "service-cpm",
            ...this.requestParametersForRequestMetrics
          }
      );
      if (res.data && res.data.length > 0) {
        const data = res.data;
        const qpsSeries = [];
        for (let i = 0; i < data.length; i++) {
          const series = {
            yAxisIndex: 0,
            data: [],
            type: 'line',
            symbol: "circle",
            smooth: false,
            tooltip: {
              valueFormatter: function (value) {
                return `${value} (call/min)`
              }
            },
          };
          const item = data[i];
          series.name = item.attributes["metricName"];
          const values = item.values;
          for (let j = 0; j < values.length; j++) {
            const value = values[j];
            series.data.push({
              value: [moment(value.timestamp, "x").format("YYYY-MM-DD HH:mm:ss"), value.value.amount],
              format: value.value.format,
            });
          }
          qpsSeries.push(series);
        }
        this.requestQPSSeries = qpsSeries;
      } else {
        this.requestQPSSeries = [];
      }
    },
    resize: debounce(function resize() {
      for (let $refsKey in this.$refs) {
        if ($refsKey.startsWith("charts")) {
          this.$refs[$refsKey] && this.$refs[$refsKey].resize();
        }
      }
    }, 200),
  },
}
</script>
<style scoped lang="less">
div.v-chart {
  width: 100%;
  height: 400px;
}
</style>