<template>
  <div class="content-box">
    <div class="historyInfo contentMain">
      <div class="left">
        <div class="info">检测结果展示</div>
        <div style="width: 600px">
          <img
            style="width: 100%; cursor: pointer"
            :src="infoData.imgUrl || defaultPhone"
            @click="handleImgCilck"
          />
        </div>
      </div>
      <div class="right">
        <div class="info" v-if="value === 2">历史记录查询</div>
        <div class="info" v-else>检测结果信息</div>
        <!-- 时间选择 -->
        <div class="datePicker" v-if="value === 2">
          <a-date-picker
            v-model="startValue"
            :disabled-date="disabledStartDate"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="开始时间"
            @openChange="handleStartOpenChange"
          />
          <a-date-picker
            v-model="endValue"
            :disabled-date="disabledEndDate"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="结束时间"
            :open="endOpen"
            @openChange="handleEndOpenChange"
          />
        </div>

        <div style="display: flex">
          <div style="flex: 1">
            <a-table
              :columns="columns"
              :data-source="infoData.statsData"
              :pagination="false"
              :rowKey="(record) => record.id"
            >
              <a slot="name" slot-scope="text">{{ text }}</a>
            </a-table>
            <!-- 目前没有日志，后续可能会加入, 实时信息可能有日志、历史信息暂时没日志 -->
            <div class="logInfo">暂无日志...</div>
          </div>
          <!-- 时间列表 -->
          <a-list
            style="width: 200px; margin-left: 5px"
            v-if="value === 2"
            item-layout="vertical"
            :data-source="monitorData"
            size="small"
            :pagination="pagination"
            @click="handleListItemClick"
          >
            <a-list-item
              slot="renderItem"
              slot-scope="item, index"
              :key="index"
              :value="index"
              :class="{ active: activeItem == index }"
            >
              {{ formatDate(item.create_time, "yyyy-MM-dd HH:mm:ss") }}
            </a-list-item>
          </a-list>
        </div>
      </div>
    </div>
    <div class="demo-image__preview">
      <el-image-viewer
        v-if="showViewer && infoData.imgUrl"
        :initialIndex="initialIndex"
        :on-close="closeViewer"
        :url-list="[infoData.imgUrl]"
      />
    </div>
  </div>
</template>
<script>
import ElImageViewer from "element-ui/packages/image/src/image-viewer";
import { format } from "date-fns";
import { debounce } from "lodash";

export default {
  name: "tableData",
  components: {
    ElImageViewer,
  },
  props: {
    value: {
      type: Number,
      default: 0,
    },
    monitorData: {
      type: Array,
      default: [],
    },
    infoData: {
      type: Object,
      default: {},
    },
    loading: {
      type: Boolean,
      default: false,
    },
    pagination: {
      type: Object,
      default: {},
    },
  },
  data() {
    return {
      showViewer: false,
      initialIndex: 0, //图片预览初始图片index，
      startValue: null, // 开始时间
      endValue: null, // 结束时间
      endOpen: false,
      columns: [
        {
          title: "类别",
          dataIndex: "category",
          key: "category",
        },
        {
          title: "正常",
          dataIndex: "OK",
          key: "OK",
        },
        {
          title: "异常",
          dataIndex: "NOT_OK",
          key: "NOT_OK",
        },
      ],
      activeItem: 0,
    };
  },
  methods: {
    disabledStartDate(startValue) {
      const endValue = this.endValue;
      if (!startValue || !endValue) {
        return false;
      }
      return startValue.valueOf() > endValue.valueOf();
    },
    disabledEndDate(endValue) {
      const startValue = this.startValue;
      if (!endValue || !startValue) {
        return false;
      }
      return startValue.valueOf() >= endValue.valueOf();
    },
    handleStartOpenChange(open) {
      if (!open) {
        this.endOpen = true;
      }
    },
    handleEndOpenChange(open) {
      this.endOpen = open;
    },
    handleImgCilck() {
      this.showViewer = true;
    },
    closeViewer() {
      this.showViewer = false;
    },
    formatDate(date, formatString) {
      return format(new Date(date), formatString);
    },
    handleListItemClick(event) {
      const index = +event.target.getAttribute("value");
      if (index >= 0 && this.activeItem !== index) {
        this.activeItem = index;
        this.$parent.getStatsTableData(
          this.monitorData[this.activeItem]?.tvm_modules
        );
        this.$parent.getImage(this.monitorData[this.activeItem]?.tvm_modules);
      }
    },
  },
  computed: {
    defaultPhone() {
      return require("@/assets/images/place.gif");
    },
  },
  watch: {
    value(val) {
      this.startValue = null;
      this.endValue = null;
    },
    startValue: debounce(function (val) {
      if (this.startValue === null && this.endValue === null) {
        this.$emit("time-change", {});
      }
      this.activeItem = 0;
    }, 2000),
    endValue: debounce(function (val) {
      if (this.startValue && this.endValue) {
        this.$emit("time-change", {
          startTime: +new Date(this.startValue),
          endTime: +new Date(val),
        });
      }
      if (this.startValue === null && this.endValue === null) {
        this.$emit("time-change", {});
      }
      this.activeItem = 0;
    }, 2000),
  },
};
</script>
<style scoped lang="less">
.historyInfo {
  display: flex;
  margin-top: 20px;
  padding: 20px;
  .info {
    margin-bottom: 5px;
    color: #000;
    font-size: 16px;
  }
  .right {
    display: flex;
    margin-left: 20px;
    flex: 1;
    flex-direction: column;
    .datePicker {
      display: flex;
      justify-content: space-between !important;
      margin-bottom: 10px;
    }
    .logInfo {
      width: 100%;
      height: 200px;
      padding: 20px;
      border: 1px solid #ccc;
    }
  }
}
.active {
  background-color: #d9d9d9;
}
/deep/ .ant-list {
  margin-bottom: 5px;
}
/deep/ .ant-list-item {
  border: 1px solid #e8e8e8;
  padding: 5px 20px;
  cursor: pointer;
}
</style>
