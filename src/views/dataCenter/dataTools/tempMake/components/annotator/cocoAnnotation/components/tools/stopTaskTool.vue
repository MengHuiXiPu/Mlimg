<template>
  <div class="mb-8">
    <a-button
      style="display: none"
      type="ghost"
      class="lineBtn"
      size="small"
      :disabled="!taskId"
      @click="stopTask"
    >
      <!-- <span>停止</span><br />
      <span>标注</span> -->
    </a-button>
  </div>
</template>

<script>
import axios from "axios";
import { mapMutations, mapState } from "vuex";
export default {
  computed: {
    ...mapState({
      taskId: (state) => state.annotator.taskId,
    }),
  },
  methods: {
    ...mapMutations(["setTaskId"]),
    // 停止任务
    stopTask() {
      const globalLoading = this.$loading({
        lock: true,
        text: '停止中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.4)'
      });
      axios
        .post(`/api/v1/datacenter/autoAnnotator/stopTaskById/${this.taskId}`)
        .then(() => {
          this.setTaskId("");
        }).finally(()=> { globalLoading.close() })
    },
  },
};
</script>

<style lang="less" scoped>
.lineBtn {
  height: auto;
  &:disabled {
    color: white;
  }
  &:not(:disabled) {
    &:hover {
      color: #2ecc71;
      border-color: #2ecc71;
    }
    &:focus {
      color: #2ecc71;
      border-color: #2ecc71;
    }
  }
}
.mb-8 {
  margin-bottom: 8px;
}
</style>
