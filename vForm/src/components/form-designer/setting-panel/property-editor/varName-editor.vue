<template>
  <el-form-item>
    <span slot="label">算子变量 </span>
    <el-select
      filterable
      v-model="optionModel.variableVal"
      style="width: 100%"
      @change="handleChange"
    >
      <el-option
        v-for="(ft, ftIdx) in variableOptions"
        :key="ftIdx"
        :label="ft.varName"
        :value="ft.varName"
      >
      </el-option>
    </el-select>
  </el-form-item>
</template>

<script>
export default {
  name: "varName-editor",
  props: {
    designer: Object,
    selectedWidget: Object,
    optionModel: Object,
  },
  data() {
    return {
      baseUrl: "",
      variableOptions: [],
    };
  },
  watch: {
    "selectedWidget.type": {
      handler(val) {
        this.filterOption(val)
      }
    },
  },
  mounted() {
    this.filterOption(this.selectedWidget.type)
    // console.log(this.selectedWidget);
    // console.log(this.designer.vueInstance.globalDsv);
    // console.log(this.designer);
    // console.log(this.designer.formWidget.getSelectedWidgetRef());
  },
  methods: {
    filterOption(type) {
      const variableOptions =
        this.designer.vueInstance.globalDsv.variableOptions;
        console.log(variableOptions)
        console.log(type)
      if (type === "image") {
        this.variableOptions = variableOptions.filter(
          (ele) => typeof ele.value === "string" && ele.value.includes("blob:")
        );
      } else {
        this.variableOptions = variableOptions.filter(
          (ele) => typeof ele.value !== "string" || !ele.value.includes("blob:")
        );
      }
    },
    handleChange(varName) {
      const ele = this.variableOptions.find(ele => ele.varName === varName) || {}
      const formWidgetRef = this.designer.formWidget.getSelectedWidgetRef()
      if (this.selectedWidget.type === "image") {
          formWidgetRef.setWidgetOption("uploadURL", ele.value);
          formWidgetRef.setLabel(varName)
      } else {
        formWidgetRef.setWidgetOption("textContent", varName + ': ' + ele.value)
      }
      // console.log(this.selectedWidget);
    },
  },
};
</script>

<style scoped>
</style>
