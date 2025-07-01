<script setup>
import {defineProps, onMounted, ref} from "vue";

import {toValue, until, useAsyncState, useVModel} from "@vueuse/core";

import isEmpty from "lodash/isEmpty";

import {queryDeployHistoryRollbackLast, selectOneInferserviceVersionInfoByInfesvrIdAndId} from "@/api/appCenter";

// Props
const props = defineProps({
      visible: {
        type: Boolean,
      },
      rowData: {
        type: Object,
        required: true,
      }
    }
);
// events emitter
const emits = defineEmits(["confirm", 'cancel', 'error', 'update:visible']);
// VModels
const vModelVisible = useVModel(props, "visible", emits);

// Flags
const loaded = ref(false);
// Handlers
const handleOk = function handleOk() {
  if (isEmpty(toValue(lastDeployHistory)) || isEmpty(toValue(lastVersionInfo))) {
    return false;
  }
  emits("confirm", {
    infesvrId: toValue(lastDeployHistory)?.infesvrId,
    fromVersionId: props.rowData?.currVersion,
    toVersionId: toValue(lastDeployHistory)?.infesvrVersionId,
    lastDeployHistory: {...toValue(lastDeployHistory)},
    lastVersionInfo: {...toValue(lastVersionInfo)}
  });
  vModelVisible.value = false;
};
const handleCancel = function handleCancel() {
  vModelVisible.value = false;
};
const handleError = function handleError(err) {
  vModelVisible.value = false;
  emits("error", err);
};

// Business Data
const lastDeployHistory = ref(null);

const lastVersionInfo = ref(null);

// Hooks
onMounted(async () => {

  // 1. 获取回退部署记录
  {
    // 1. 获取部署历史表
    let {
      state,
      isReady
    } = useAsyncState(queryDeployHistoryRollbackLast(props.rowData?.id).then(res => res.data).catch(err => {
      handleError(err);
    }), null);
    await until(isReady).toBe(true);
    lastDeployHistory.value = state?.value;
  }
  // 2. 获取版本详细信息
  {
    let {
      state,
      isReady
    } = useAsyncState(selectOneInferserviceVersionInfoByInfesvrIdAndId(
        lastDeployHistory.value?.infesvrId, lastDeployHistory.value?.infesvrVersionId
    ).then(res => res.data).catch(err => {
      handleError(err)
    }), null)
    await until(isReady).toBe(true);
    lastVersionInfo.value = state?.value;
  }
  loaded.value = true;
})
</script>

<template>
  <a-modal :visible="true"
           title="版本回滚"
           @ok="handleOk"
           centered
           @cancel="handleCancel"
           width="540px"
           :maskClosable="false"
  >
    <el-skeleton animated :loading="!loaded">
      <template>
        <a-row>
          <span style="width: 100%">请自行核对回滚版本是否为预期版本。</span>
        </a-row>
        <a-row>
          <a-col :span="12">
            <a-col :span="12">
              当前版本：
            </a-col>
            <a-col :span="12">
              {{ rowData?.currVersionInfo?.versionName }}
            </a-col>
          </a-col>
          <a-col :span="12">
            <a-col :span="12">
              上一版本：
            </a-col>
            <a-col :span="12">
              {{ lastVersionInfo?.versionName }}
            </a-col>
          </a-col>
        </a-row>
        <a-row>
          <span style="width: 100%">平台使用滚动更新方式，切换版本不会导致服务中断，请确认是否执行回滚。</span>
        </a-row>
      </template>
      <template slot="template">
        <a-row>
          <el-skeleton-item variant="text" style="margin-right: 16px;" />
        </a-row>
        <a-row>
          <el-skeleton-item variant="text" style="margin-right: 16px;" />
        </a-row>
        <a-row>
          <el-skeleton-item variant="text" style="margin-right: 16px;" />
        </a-row>
      </template>
    </el-skeleton>
    <template #footer>
      <a-button key="back" @click="handleCancel">
        返回
      </a-button>
      <a-button key="submit" type="primary" @click="handleOk" :disabled="!loaded">
        确认
      </a-button>
    </template>
  </a-modal>
</template>

<style scoped>

</style>