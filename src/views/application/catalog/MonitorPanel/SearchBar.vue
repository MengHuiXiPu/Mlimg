<template>
  <div>
    <a-form layout="inline">
      <a-form-item label="服务版本">
        <a-select
            @change="handleVersionChange"
            v-model="selectedVersion"
            style="min-width: 100px"
        >
          <a-select-option
              v-for="version in versionList"
              :value="version.value"
              :key="version.value">
            {{ version.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="时间段">
        <a-radio-group @change="onClickQuickDate" v-model="quickDateVal">
          <a-radio-button value="today">
            今天
          </a-radio-button>
          <a-radio-button value="nearWeek">
            近7天
          </a-radio-button>
          <a-radio-button value="nearMonth">
            近1个月
          </a-radio-button>
        </a-radio-group>
        <a-range-picker
            :ranges="picker"
            v-model="selectDateRange"
            :show-time="{format: 'HH:mm'}"
            @ok="onOk"
            @openChange="handleOpenChange"
            @change="handleChange"
            :disabled-date="disabledDate"
            :disabled-time="disabledTime"
            format="YYYY/MM/DD HH:mm"
            style="margin: auto auto auto 12px;">
          <template #dateRender="current">
            <div
                class="ant-calendar-date"
                :style="todayStyle(current)"
            >
              {{ current.date() }}
            </div>
          </template>
        </a-range-picker>
      </a-form-item>
    </a-form>
  </div>
</template>

<script>
import moment from "moment/moment";

export default {
  name: "SearchBar",
  model: {
    prop: "modelValue",
    event: "update:modelValue",
  },
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    versionList: {
      type: Array,
      default: () => [],
    }
  },
  data() {
    return {
      selectedVersion: this.modelValue.version,
      selectDateRange: this.modelValue.dateRange,
      quickDateVal: "today",
      changedTimes: 0,
      picker: {
        "今天": () => {
          return [moment().startOf("day"), moment()];
        },
        "最近五分钟": () => {
          return [moment().add(-5, "minutes"), moment()];
        },
        "最近十五分钟": () => {
          return [moment().add(-15, "minutes"), moment()];
        },
        "最近三十分钟": () => {
          return [moment().add(-30, "minutes"), moment()];
        }
      }
    }
  },

  computed: {},
  methods: {
    todayStyle(current) {
      const style = {};
      if (moment().isSame(current, "days")) {
        style.border = '1px solid #1890ff';
        style.borderRadius = '50%';
      }
      return style;
    },
    handleVersionChange: function () {
      this.emitUpdate();
    },
    handleOpenChange(opened) {
      if (opened) {
        this.changedTimes = 0;
      } else {
        if (this.changedTimes > 0) {
          this.emitUpdate();
          this.quickDateVal = "";
        }
      }
    },
    onClickQuickDate(e) {
      switch (e.target.value) {
        case "today":
          this.selectDateRange = this.today();
          break;
        case "nearWeek":
          this.selectDateRange = this.pastDays(7, "days");
          break;
        case "nearMonth":
          this.selectDateRange = this.pastDays(1, "months");
      }
      this.emitUpdate();
    },
    disabledDate(current) {
      return !(current && current <= moment().endOf("days")
          && current >= moment().add(-1, "months").startOf("days"));
    },
    range(start, end) {
      const result = [];
      for (let i = start; i < end; i++) {
        result.push(i);
      }
      return result;
    },
    disabledTime(dates, type) {
      let date;
      if (type === "start") {
        date = (dates[0] || dates);
      } else {
        date = (dates[1] || dates);
      }

      return {
        disabledHours: () => {
          if (moment().isSame(date, "days")) {
            // 注意此处要clone 不然moment对象会被更改从而导致出现问题
            return this.range(Math.ceil(moment().diff(date.clone().startOf("days"), "hours", true)), 24);
          } else if (moment().add(-1, "months").isSame(date, "days")) {
            return this.range(0, moment().add(-1, 'months').diff(date.clone().startOf("days"), "hours"));
          }
          return [];
        },
        disabledMinutes: () => {
          if (moment().isSame(date, "hours")) {
            // 注意此处要clone 不然moment对象会被更改从而导致出现问题
            return this.range(Math.ceil(moment().diff(date.clone().startOf("hours"), "minutes", true)), 60);
          } else if (moment().add(-1, "months").isSame(date, "hours")) {
            return this.range(0, moment().add(-1, 'months').diff(date.clone().startOf("hours"), "minutes"));
          }
          return [];
        },
      };
    },
    onOk: function () {
      this.emitUpdate();
      this.quickDateVal = "";
    },
    handleChange: function () {
      this.changedTimes++;
    },
    emitUpdate() {
      this.$emit("update:modelValue", {
        version: this.selectedVersion,
        dateRange: this.selectDateRange,
      });
    },
    today() {
      return [moment().startOf("days"), moment().startOf("minutes")]
    },
    pastDays(num, type) {
      return [moment().add(-num, type), moment().startOf("minutes")];
    }
  },
  watch: {
    modelValue: {
      handler() {
        this.selectedVersion = this.modelValue.version;
        this.selectDateRange = this.modelValue.dateRange;
      },
      deep: true,
    }
  },
}
</script>


<style scoped>

</style>