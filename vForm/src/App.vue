<template>
  <div id="app">
    <VFormDesigner
      ref="vfDesignerRef"
      :banned-widgets="bannedWidgets"
      :designer-config="designerConfig"
      :global-dsv="globalDsv"
    >
      <template #customToolButtons>
        <el-button type="text" @click="printFormJson">测试按钮</el-button>
      </template>
    </VFormDesigner>
  </div>
</template>

<script>
import VFormDesigner from "./components/form-designer/index.vue";

export default {
  name: "App",
  components: {
    VFormDesigner,
  },
  data() {
    return {
      bannedWidgets: [
        "input",
        "textarea",
        "number",
        "radio",
        "checkbox",
        "select",
        "time",
        "time-range",
        "date",
        "date-range",
        "switch",
        "rate",
        "color",
        "slider",
        "button",
        "html-text",
        "divider",
        "file-upload",
        "rich-editor",
        "cascader",
        "alert",
        "card",
        "tab",
        "table"
      ],
      designerConfig: {
        resetFormJson: false,
        toolbarMaxWidth: 490,
      },

      //全局数据源变量
      globalDsv: {
        variableOptions: [
          { value: "jpeg", varName: "data.shape[1]" },
          { value: "blob:http://localhost:8008/0bb1ba09-9ce1-45a2-b293-9f4d6f47ec", varName: "data.shape[0]" },
        ]
      },
    };
  },
  methods: {
    printFormJson() {
      console.log(this.$refs.vfDesignerRef.getFormJson());
    },
  },
};
</script>

<style lang="scss">
#app {
  height: 100%;
}
</style>
