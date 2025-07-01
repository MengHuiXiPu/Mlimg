<template>
  <a-modal
    :visible="isShow"
    wrap-class-name="form-modal"
    :footer="null"
    :mask="false"
    :maskClosable="false"
    :keyboard="false"
    :destroyOnClose="true"
    @cancel="close"
  >
    <v-form-designer
      ref="vfDesigner"
      :banned-widgets="bannedWidgets"
      :designer-config="designerConfig"
      :global-dsv="globalDsv"
      @hook:mounted="vfDesignerMounted"
    >
      <!-- 自定义按钮插槽演示 -->
      <template #customToolButtons>
        <el-button type="text" @click="saveFormJson"
          ><i class="el-icon-finished" />保存</el-button
        >
      </template>
    </v-form-designer>
  </a-modal>
</template>

<script>
import Operator from "@/api/operator";
import method from "./method.js"
export default {
  props: {
    isShow: {
      type: Boolean,
      default: false,
    },
    pipelineId: {
      type: Number,
      default: null,
    },
  },
  mixins: [method],
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
        "table",
      ],
      designerConfig: {
        externalLink: false,

        //是否显示导入JSON按钮
        importJsonButton: false,

        //是否显示导出代码按钮
        exportCodeButton: false,

        //是否显示生成SFC按钮
        generateSFCButton: false,
        // previewFormButton: false,
        exportJsonButton: false,
        formTemplates: false,
        logoHeader: false,
      },
      //全局数据源变量
      globalDsv: {
        variableOptions: null,
      },
      designerRef: null,
    };
  },
  // mounted() {
  //   this.getVariableOptions();
  // },
  watch: {
    isShow(val) {
      if (val) {
        this.getVariableOptions();
      }
    },
  },
  methods: {
    vfDesignerMounted() {
      this.designerRef = this.$refs.vfDesigner;
      // this.getFormJson();
    },
    getVariableOptions() {
      Operator.getPipelineTemplateInfoById(this.pipelineId).then((res) => {
        // console.log(res.data.debugResult);
        const tvm_modules = res.data.debugResult.tvm_modules;
        const variableOptions = this.convertObjectToArray(tvm_modules, Number(this.pipelineId), 'getImage');
        // this.$set(this.designerConfig, "variableOptions", variableOptions);
        this.globalDsv.variableOptions = variableOptions;
        this.getFormJson(variableOptions);
      });
    },
    getFormJson(variableOptions) {
      Operator.getFormJson({
        pipelineId: this.pipelineId,
      }).then((res) => {
        const formJson = JSON.parse(res.data.formJson);
        setTimeout(() => {
          formJson.widgetList.forEach((ele) => {
            // console.log(ele.options.variableVal);
            // console.log(variableOptions);
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
          // console.log(formJson);
          this.designerRef.setFormJson(formJson);
        }, 100);
      });
    },
    saveFormJson() {
      const formJson = this.designerRef.getFormJson();
      // console.log(JSON.stringify(formJson));
      const data = {
        formJson: JSON.stringify(formJson), //应用表单结构
        pipelineId: this.pipelineId, //流程id
      };
      Operator.saveFormJson(data).then((res) => {
        this.$message.success("表单已保存！");
      });
    },
    close() {
      this.designerRef.clearDesigner();
      this.designerRef = null;
      this.$emit("update:isShow", false);
    },
  },
};
</script>

<style lang="less" scoped>
/deep/ .form-modal .ant-modal {
  width: 100% !important;
  height: 100vh;
  overflow: hidden;
  top: 0;
  margin: 0;
  padding: 0;
}
/deep/ .form-modal .ant-modal-header {
  // border-radius: 0;
  // background-color: rgba(167, 205, 255, 1);
  padding: 0;
  border: none;
  // border-radius: 0 0 8px 8px;
}

/deep/ .form-modal .ant-modal-content {
  height: 100vh;
  border-radius: 0;
}

/deep/ .form-modal .ant-modal-body {
  height: 100%;
  padding: 0;
  background-color: rgba(218, 234, 255);
}
</style>