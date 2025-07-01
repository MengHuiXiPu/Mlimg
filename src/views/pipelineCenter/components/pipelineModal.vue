<template>
  <a-modal
    :visible="isShow"
    wrap-class-name="scheme-modal"
    :footer="null"
    :mask="false"
    :maskClosable="false"
    :keyboard="false"
    :destroyOnClose="true"
    @cancel="close"
  >
    <G6Editor v-if="pipelineId" mode="edit" :initData="initGraph" :pipelineId="pipelineId" :debug-data="debugData" :pipeLineData="pipeLineData" ref="refG6Editor"> </G6Editor>
  </a-modal>
</template>

<script>
import Operator from "@/api/operator";
import G6Editor from "../pipelineEditor/components/G6Editor";
import eventBus from "@/views/pipelineCenter/pipelineEditor/utils/eventBus";
export default {
  components: {
    G6Editor,
  },
  props: {
    isShow: {
      type: Boolean,
      default: false,
    },
    pipelineId: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      initGraph: {},
      debugData: {},
      pipeLineData: {}, //pipeline完整信息
      mockId: ""
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
      this.$emit("update:isShow", false);
    },
    getInitData() {
      // 根据ID获取流程信息  --回显
      Operator.getPipelineTemplateInfoById(this.pipelineId).then((res) => {
        this.initGraph = res.data.graph;
        this.debugData = res.data.debugResult;
        this.pipeLineData = res.data;
      });
    }
  },
  created () {
    this.mockId = ""
    eventBus.$on("reloadGraph", (data) => {
      this.mockId = 347
      // console.log("重载data")
      Operator.getPipelineTemplateInfoById(this.mockId).then((res) => {
        this.initGraph = res.data.graph;
        this.debugData = res.data.debugResult;
        this.pipeLineData = res.data;
        // this.$refs.refG6Editor.init()
      });
    });
  },
  computed: {
    calcPipelineId() {
      return this.mockId || this.pipelineId
    }
  },
  beforeDestroy() {
    eventBus.$off('nodeDblclick')
  }
};
</script>

<style lang="less" scoped>
/deep/ .scheme-modal .ant-modal {
  width: 100% !important;
  height: 100vh;
  overflow: hidden;
  top: 0;
  margin: 0;
  padding: 0;
}
/deep/ .scheme-modal .ant-modal-header {
  // border-radius: 0;
  // background-color: rgba(167, 205, 255, 1);
  padding: 0;
  border: none;
  // border-radius: 0 0 8px 8px;
}

/deep/ .scheme-modal .ant-modal-content {
  height: 100vh;
  border-radius: 0;
}

/deep/ .scheme-modal .ant-modal-body {
  height: 100%;
  padding: 0;
  // background-color: rgba(218, 234, 255);
}
/deep/ .ant-modal-close-x {
  line-height: 40px;
}
</style>