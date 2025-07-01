<template>

  <div v-if="isGreenTagGroup">
    <a-tag color="#17a2b8">{{ stateLabel }}</a-tag>
  </div>
  <div v-else-if="isRunning">
    <a-tag color="#28a745">{{ stateLabel }}</a-tag>
  </div>
  <div v-else-if="isLoadingTagGroup">
    <a-tag color="#ffc107">
      {{ stateLabel }}
      <a-icon type="loading"/>
    </a-tag>
  </div>
  <div v-else-if="isError">
    <a-popover
        title="异常信息"
        trigger="hover"
        class="red-color"
    >
      <a-tag color="red">
        失败
        <a-icon type="warning" class="warning-icon"/>
      </a-tag>
      <template #content>
        <slot name="error-content">启动失败请联系管理员</slot>
      </template>
    </a-popover>
  </div>
  <div v-else>
    <a-tag>未知状态</a-tag>
  </div>

</template>
<script setup>
import {computed, defineEmits, defineProps, onActivated, onDeactivated, onMounted, onUnmounted, ref} from "vue";
import {useIdle} from "@vueuse/core";

import {runStateEnum, runStateFormat} from "@/views/application/catalog/utils"
import {RunningStateEnum} from "@/views/application/catalog/constants";
import {getInferserviceInfoById} from "@/api/appCenter";

const props = defineProps({
  state: {
    required: true,
    type: Number
  },
  inferserviceId: Number,
});

const emits = defineEmits(["refreshed"]);


const {idle} = useIdle(20 * 60);


const isGreenTagGroup = computed(() => {
  return [RunningStateEnum.CREATED, RunningStateEnum.CONFIGURED, RunningStateEnum.STOPPED].includes(runStateEnum(props.state));
});

const isRunning = computed(() => {
  return [RunningStateEnum.RUNNING, RunningStateEnum.LOCKED_RUNNING].includes(runStateEnum(props.state))
});
const isError = computed(() => {
  return [RunningStateEnum.ERROR].includes(runStateEnum(props.state))
});
const isLoadingTagGroup = computed(() => {
  return [RunningStateEnum.STARTING, RunningStateEnum.STOPPING, RunningStateEnum.ROLLING_RELEASE, RunningStateEnum.RESTARTING].includes(runStateEnum(props.state));
});

const stateLabel = computed(() => {
  return runStateFormat(props.state);
});

const refreshStateTimer = ref(null);


[onMounted, onActivated].forEach(fn => fn(() => {
  refreshStateTimer.value = setInterval(async () => {
    if (!idle.value && isLoadingTagGroup.value && !!props.inferserviceId) {
      const {code, data} = await getInferserviceInfoById(props.inferserviceId);
      if (code === 0) {
        emits("refreshed", data);
      }
    }
  }, 3000);
}));

[onUnmounted, onDeactivated].forEach(fn => fn(() => {
  if (!!refreshStateTimer.value) {
    clearInterval(refreshStateTimer.value);
  }
}));

</script>
<style scoped>
.red-color {
  color: red;
}

.warning-icon /deep/ svg {
  vertical-align: 0 !important;
}
</style>