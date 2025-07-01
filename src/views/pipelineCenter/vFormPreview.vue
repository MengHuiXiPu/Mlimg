<template>
  <v-form-render ref="vFormRef" />
</template>

<script>
import Operator from "@/api/operator";
import method from "./components/method.js";
export default {
  components: {},
  data() {
    return {
      pipelineId: "",
      instanceId: "",
      timerId: null,
    };
  },
  mixins: [method],
  mounted() {
    this.pipelineId = this.$route.params.id;
    this.instanceId = this.$route.query.instanceId;

    this.getFormJson();
    // this.getResultList()
  },
  beforeDestroy() {
    // 在组件销毁前清除定时器
    window.clearTimeout(this.timerId);
  },
  methods: {
    getFormJson() {
      Operator.getFormJson({
        pipelineId: Number(this.pipelineId),
      }).then((res) => {
        // console.log(res.data.formJson);
        this.getResultList(JSON.parse(res.data.formJson));
      });
    },
    // 获取变量结果，轮询
    getResultList(json) {
      Operator.getResultList(Number(this.instanceId), {
        pageNo: 1,
        limit: 1000,
      }).then((res) => {
        // console.log(res.data.records);
        const record = res.data.records.length
          ? JSON.parse(JSON.stringify(res.data.records[0]))
          : {};
        if (!record.tvm_modules) {
          console.log('result is empty')
          return;
        }
        // console.log(json)
        const variableOptions = this.convertObjectToArray(record.tvm_modules, Number(this.instanceId), 'getInstanceImage');
        setTimeout(() => {
          json.widgetList.forEach((ele) => {
            // console.log(variableOptions)
            // console.log(ele.options.variableVal)
            const findOption =
              variableOptions.find(
                (item) => item.varName === ele.options.variableVal
              ) || {};
            // console.log(findOption);
            if (ele.type === "image") {
              ele.options.uploadURL = findOption.value || "";
            } else {
              ele.options.textContent =
                typeof findOption.value !== "undefined"
                  ? ele.options.variableVal + ": " + findOption.value
                  : "";
            }
          });
          this.$refs.vFormRef.setFormJson(json);
        }, 300);

        this.timerId = setTimeout(this.getResultList, 5000, json);
      });
    },
  },
};
</script>

<style lang="less" scoped>
.bread {
  padding: 4px 20px;
  padding-left: 0;
  margin-top: 20px;
}
</style>