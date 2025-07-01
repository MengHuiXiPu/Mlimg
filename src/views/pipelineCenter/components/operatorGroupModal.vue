<template>
  <a-modal
    :visible="isShow"
    wrap-class-name="opGroup-modal"
    :footer="null"
    :mask="false"
    :maskClosable="false"
    :keyboard="false"
    :destroyOnClose="true"
    @cancel="close"
  >
    <OperatorGroupEditor 
      v-if="operatorGroupId" 
      mode="edit" 
      :initData="initGraph" 
      :operatorGroupId="operatorGroupId"
      :debug-data="debugData" 
      :operatorType="operatorType" 
      :rpaLabelingId="rpaLabelingId"
      :readOnly="readOnly"
    > </OperatorGroupEditor>
  </a-modal>
</template>

<script>
import Operator from "@/api/operator";
import OperatorGroupEditor from "../pipelineEditor/components/G6Editor/operatorGroupEditor.vue";
export default {
  name: 'OperatorGroupModel',
  components: {
    OperatorGroupEditor,
  },
  props: {
    isShow: {
      type: Boolean,
      default: false,
    },
    operatorGroupId: {
      type: Number,
      default: null
    },
    operatorType: {
      type: Number,
      default: null
    },
    rpaLabelingId: {
      required: true,
      type: Number,
      default: null,
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      initGraph: {},
      debugData: {},
    }
  },
  watch: {
    isShow(val) {
      if (val) {
        this.getInitData()
      }
    }
  },
  methods: {
    close() {
      this.initGraph = {}
      this.debugData = {}
      this.$emit("update:isShow", false);
      this.$emit('on-fresh')
    },
    getInitData() {
      // 根据ID获取流程信息  --回显
      let getOperatorGroupInfoById = Operator.getOperatorGroupTemplateInfoById
      if(this.operatorType == 2){
        getOperatorGroupInfoById = Operator.getVirOpGroupPipelineGraphById;
      }
      getOperatorGroupInfoById(this.operatorGroupId).then((res) => {
        this.initGraph = res.data.graph;
        this.debugData = res.data?.debugResult;
      });
    }
  },
};
</script>

<style lang="less" scoped>
/deep/ .opGroup-modal .ant-modal {
  width: 100% !important;
  height: 100vh;
  overflow: hidden;
  top: 0;
  margin: 0;
  padding: 0;
}
/deep/ .opGroup-modal .ant-modal-header {
  // border-radius: 0;
  // background-color: rgba(167, 205, 255, 1);
  padding: 0;
  border: none;
  // border-radius: 0 0 8px 8px;
}

/deep/ .opGroup-modal .ant-modal-content {
  height: 100vh;
  border-radius: 0;
}

/deep/ .opGroup-modal .ant-modal-body {
  height: 100%;
  padding: 0;
  // background-color: rgba(218, 234, 255);
}
/deep/ .ant-modal-close-x {
  line-height: 40px;
}
</style>