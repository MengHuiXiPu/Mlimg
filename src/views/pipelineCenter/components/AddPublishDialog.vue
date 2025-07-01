<template>
  <a-modal
    ref="pubshlishRef"
    :visible="isShow"
    title="新建发布应用"
    width="720px"
    :loading="loading"
    :maskClosable="false"
    destroyOnClose
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <PublishInfo ref="publishInfo" :form.sync="publishInfoForm" />
  </a-modal>
</template>

<script>
import PublishInfo from "./PublishInfo";
import Operator from "@/api/operator";
export default {
  name: "AddPublishDialog",
  components: {
    PublishInfo,
  },
  props: {
    isShow: {
      type: Boolean,
      default: false,
    },
    pipelineTemplateId: {
      type: String,
      default: -1,
    },
    pipelineTemplateName: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      loading: false,
      publishInfoForm: {
        taskName: this.pipelineTemplateName,
        taskId: "",
        storedDirName: "",
        description: "",
        versionDescription: "",
        storedDirId: "",
        attachToAlreadyInfesvr: "0",
      },
    };
  },
  mounted() {},
  methods: {
    handleOk() {
      this.$refs.publishInfo.$refs.ruleForm.validate(async (valid) => {
        if (!valid) {
          return false;
        } else {
          const params = { ...this.publishInfoForm }; // modelType暂时写为1，因为通用模型采用这种方式新建模型
          console.log("publishInfoForm: ", params);
          let res;
          if(params.attachToAlreadyInfesvr ===  '0') {
            res = await Operator.publishPipelineTemplate(
                this.pipelineTemplateId,
                params
            );
          } else {
            res = await Operator.publishPipelineTemplateToAlreadyInfesvr(
                this.pipelineTemplateId,
                params.taskId,
                params
            );
          }

          console.log("新建模型的res: ", res);
          this.isShow = false;
        }
      });
    },
    handleCancel() {
      this.$emit("update:isShow", false);
    },
  },
};
</script>

<style scoped lang="less">
</style>