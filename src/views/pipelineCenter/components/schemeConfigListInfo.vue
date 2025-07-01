<template>
  <a-modal
    v-model="visible"
    title="配置列表"
    width="1000px"
    @cancel="dialogClose"
    :footer="null"
  >
    <a-table
      :columns="columns"
      :data-source="data"
      :loading="loading"
      :rowKey="(record) => record.id"
      :pagination="this.pagination.total > 10"
    >
      <span
        slot="modelSchedule"
        slot-scope="text, records"
        v-if="records?.offlineForecastDetailInfo?.id"
      >
        <a-progress
          v-if="
            (records.offlineForecastDetailInfo.taskStatus === 1 ||
              records.offlineForecastDetailInfo.taskStatus === 2) &&
            records.offlineForecastDetailInfo.modelSchedule != 0 &&
            records.offlineForecastDetailInfo.modelSchedule != null
          "
          :percent="records.offlineForecastDetailInfo.modelSchedule"
        />
        <a-popover overlayClassName="modelSchedule" placement="left">
          <template slot="content">
            <a-alert
              message="info"
              :description="
                records.offlineForecastDetailInfo.remark || '资源调度中,请稍等'
              "
              type="info"
              show-icon
            />
          </template>
          <a-tag
            v-if="
              records.offlineForecastDetailInfo.taskStatus === 1 &&
              records.offlineForecastDetailInfo.modelSchedule == 0
            "
            style="cursor: pointer"
            :color="'blue'"
            >{{
              records.offlineForecastDetailInfo.remark || "资源调度中"
            }}</a-tag
          >
        </a-popover>

        <a-popover overlayClassName="modelSchedule" placement="left">
          <template slot="content">
            <a-alert
              message="Error"
              :description="
                records.offlineForecastDetailInfo.remark ||
                '未知原因，请联系管理员'
              "
              type="error"
              show-icon
            />
          </template>
          <a-tag
            v-if="records.offlineForecastDetailInfo.taskStatus === 3"
            style="cursor: pointer"
            :color="'red'"
            >异常终止</a-tag
          >
        </a-popover>
        <a-tag
          v-if="records.offlineForecastDetailInfo.taskStatus === 4"
          style="cursor: pointer"
          :color="'red'"
          >手动终止</a-tag
        >
      </span>
      <span slot="modelSchedule" v-else> 暂无进度 </span>
      <template slot="action" slot-scope="text, records">
        <a
          :disabled="
            records.offlineForecastInfoId == null ||
            records.offlineForecastDetailInfo?.taskStatus != 2
          "
          @click="toReport(records)"
          >查看报告</a
        >
      </template>
    </a-table>
  </a-modal>
</template>
<script>
import Operator from "@/api/operator.js";
import { getOfflineById } from "@/api/offlineForecast.js";

export default {
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  beforeDestroy(){
    this.timer && clearTimeout(this.timer);
  },
  data() {
    return {
      timer: null,
      pipelineId: null,
      data: [],
      columns: [
        {
          title: "配置id",
          dataIndex: "id",
        },
        {
          title: "配置名称",
          dataIndex: 'name',
        },
        {
          title: "训练进度",
          scopedSlots: { customRender: "modelSchedule" },
        },
        {
          title: "操作",
          scopedSlots: { customRender: "action" },
        },
      ],
      loading: false,
      pagination: {
        total: 0,
        pageSize: 18,
        current: 1,
        onChange: (page) => {
          this.pagination.current = page;
          this.getConfigListData();
        },
      },
    };
  },
  methods: {
    async getConfigListData(record = {}) {
      this.timer && clearTimeout(this.timer);
      if (record) {
        this.pipelineId = record.id;
      }
      this.loading = true;
      const res = await Operator.schemeGetConfigList({
        pageNo: this.pagination.current,
        limit: this.pagination.pageSize,
        pipelineId: this.pipelineId,
      });
      if (res.code == 0) {
        const promises = res.data?.records.map(async (config) => {
          if (config.offlineForecastInfoId != null) {
            await this.getOffline(config, config.offlineForecastInfoId);
          }
        });
        await Promise.all(promises);
        this.pagination.total = res.data?.total;
        this.data = res.data?.records || [];
      }
      this.loading = false;
    },
    async getOffline(config, id){
      const res1 = await getOfflineById(id);
      if(res1.code) return;
      config["offlineForecastDetailInfo"] = res1.data;
      // modelSchedule 这个数据有的接口返回为 null
      if(res1.data?.taskStatus == 1 && res1.data?.modelSchedule !== null && res1.data?.modelSchedule != 0){
        this.timer = setTimeout(() => {
          this.getOffline(config, id);
        }, 10000);
      }
    },
    dialogClose() {
      this.$emit("update:visible", false);
    },
    // 查看报告
    toReport(record) {
      this.$store.commit("setCurrentOffline", record.id);
      let bread = {
        ...this.$route.meta,
        path: this.$route.path,
      };
      localStorage.setItem("bread", JSON.stringify(bread));
      this.$router.push({
        path: `/train/offline/detail/`,
        query: {
          id: record.offlineForecastInfoId,
          // 这里的modelType 为3，代表需要查看方案的离线评估。
          modelType: 3,
        },
      });
    },
  },
};
</script>

<style scoped lang="less">
@import "~@/config/theme.less";
</style>
