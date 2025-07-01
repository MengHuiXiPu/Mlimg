<script setup>
import {computed, defineEmits, defineProps, onMounted, ref, reactive} from 'vue';
import {until, useAsyncState, toRef} from '@vueuse/core';
import {getDataSoureList} from "@/api/dataCenter";

import {getInferserviceVersionByIdPage} from "@/api/appCenter"
import {startEnable} from "@/views/application/catalog/utils";
import {resourcesLimits} from "@/views/application/catalog/constants";

const props = defineProps({
  rowData: {
    type: Object,
    required: true,
  }
});

const labelSpan = 6;
const limits = reactive(resourcesLimits);

const emits = defineEmits(['confirm', 'cancel']);
const formRef = ref(null);
const resetForm = (names) => {
  formRef.value?.resetFields(names);
};

const validateForm = (cb) => {
  return formRef.value?.validate(cb);
};

const spinning = ref(false);

const config = ref({
  versionId: "请选择部署的版本",
  // 字段
  resourceType: "0",
  cpuCoreSize: 1,
  gpuCoreSize: 1,
  gpuMemory: 1,
  memory: 1,
  replicaNum: 1,
  dataSource: [],
});
const versionList = ref([]);
const rules = {
  versionId: [{
    type: "integer", required: true, message: '请选择版本',
  }],
  resourceType: [{
    type: "enum", required: true, message: '请选择资源类型', enum: ["0", "1"],
  }],
  cpuCoreSize: [{
    type: "integer", required: true, message: "请输入CPU核心数", trigger: "blur"
  }],
  gpuCoreSize: [{
    type: "integer", required: true, message: "请输入GPU核心数", trigger: "blur"
  }],
  gpuMemory: [{
    type: "integer", required: true, message: "请输入显存大小", trigger: "blur"
  }],
  memory: [{
    type: "integer", required: true, message: "请输入内存大小", trigger: "blur"
  }],
  replicaNum: [{
    type: "integer", required: true, message: "实例数量", trigger: "blur"
  }]
};

const canSelectVersionList = computed(() => {
  return versionList.value.filter((v) => {
    return startEnable(v?.versionStatus);
  });
})

const maxVersion = computed(() => {
  return canSelectVersionList.value.length > 0 ? canSelectVersionList.value[0].versionName : '--';
})

const dataSourceList = ref([]);


const showDeployConfig = ref(false);

const filterDataSourceList = computed(() => {
  return showDeployConfig.value ? dataSourceList.value : [];
});

onMounted(async () => {
  if (props.rowData?.id) {
    spinning.value = true;

    const {state, isReady} = useAsyncState(Promise.all([
              getInferserviceVersionByIdPage(props.rowData?.id, 1, 999),
              getDataSoureList({pageNo: 1, limit: 10000})
            ]).then((results) => {
                  const [versionRes, datasourceRes] = results;
                  return [
                    versionRes.code === 0 ? versionRes.data?.records : [],
                    datasourceRes.code === 0 ? datasourceRes.data?.records : [],
                  ];
                }
            ).finally(() => spinning.value = false),
            [[], []]
        )
    ;

    await until(isReady).toBe(true);

    [versionList.value, dataSourceList.value] = toRef(state).value;
  }
});


const form = computed(() => {
  return {
    id: props.rowData?.id,
    versionId: config.value.versionId,
    config: !showDeployConfig.value ? null : (() => {
      const volumePaths = dataSourceList.value.filter((item) => {
        return config.value.dataSource.indexOf(item?.id) > -1;
      }).map((item) => {
        return {
          id: item?.id,
          pvcName: item?.pvcName,
          reservedFields2: item?.reservedFields2,
        }
      });
      return {
        resourceMode: config.value.resourceType,
        coreSize: config.value.cpuCoreSize,
        memorySize: config.value.memory,
        ...(config.value.resourceType === '0' ? {} : {
          gpuCoreSize: config.value.gpuCoreSize,
          gpuMemorySize: config.value.gpuMemory
        }),
        replicaNum: config.value.replicaNum,
        volumePaths: volumePaths.length > 0 ? JSON.stringify(volumePaths) : null,
      }
    })()
  };
});
</script>

<template>
  <a-spin :spinning="spinning">
    <a-modal
        title="启动配置"
        :visible="true"
        @ok="() => validateForm((valid) => valid ? emits('confirm', form) : false)"
        @cancel="emits('cancel', form)"
        centered
        width="800px"
        :maskClosable="false"
    >
      <a-form-model
          ref="formRef"
          :label-col="{ span: 6 }"
          :wrapperCol="{ span: 18 }"
          layout="horizontal"
          :rules="rules"
          :model="config"
      >
        <a-form-model-item label="启动版本号" prop="versionId">
          <a-select placeholder="请选择" v-model="config.versionId">
            <a-select-option :value="item.versionId" v-for="item in canSelectVersionList">
              {{
                item.versionName
              }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-row v-if="!!maxVersion">
          <a-col :offset="labelSpan" :span="24 - labelSpan">
          <span style="font-size: xx-small; color: #a89028">
            平台检测检测到新版本{{ maxVersion }}，请仔细确认需要启动的版本号
          </span>
          </a-col>
        </a-row>
        <a-row>
          <a-col offset="20" style="text-align: right">
            <a-button type="link" @click="showDeployConfig = !showDeployConfig">
              {{
                showDeployConfig ? "隐藏" : "更多设置"
              }}
            </a-button>
          </a-col>
        </a-row>
        <template v-if="showDeployConfig">
          <a-divider orientation="left">算力资源</a-divider>
          <a-form-model-item label="资源类型" prop="resourceType">
            <a-radio-group v-model="config.resourceType">
              <a-radio value="0">CPU类型</a-radio>
              <a-radio value="1">GPU类型</a-radio>
            </a-radio-group>
          </a-form-model-item>

          <a-form-model-item label="CPU" prop="cpuCoreSize">
            <a-row>
              <a-col :span="16">
                <a-slider v-model="config.cpuCoreSize" :min="1" :max="limits.coreMax" :step="1"/>
              </a-col>
              <a-col :span="4">
                <a-input-number
                    v-model="config.cpuCoreSize"
                    :min="1"
                    :max="limits.coreMax"
                    :step="1"
                    style="margin-left: 16px"
                />
              </a-col>
            </a-row>
          </a-form-model-item>
          <a-form-model-item label="内存(MiB)" prop="memory">
            <a-row>
              <a-col :span="16">
                <a-slider v-model="config.memory" :min="1" :max="limits.memoryMax" :step="1"/>
              </a-col>
              <a-col :span="4">
                <a-input-number
                    v-model="config.memory"
                    :min="1"
                    :max="limits.memoryMax"
                    :step="1"
                    style="margin-left: 16px"
                />
              </a-col>
            </a-row>
          </a-form-model-item>
          <template v-if="config.resourceType === '1'">
            <a-form-model-item label="GPU" prop="gpuCoreSize">
              <a-row>
                <a-col :span="16">
                  <a-slider v-model="config.gpuCoreSize" :min="1" :max="limits.GPUCoreMax" :step="1"/>
                </a-col>
                <a-col :span="4">
                  <a-input-number
                      v-model="config.gpuCoreSize"
                      :min="1"
                      :max="limits.GPUCoreMax"
                      :step="1"
                      style="margin-left: 16px"
                  />
                </a-col>
              </a-row>
            </a-form-model-item>
            <a-form-model-item label="显存(MiB)" prop="gpuMemory">
              <a-row>
                <a-col :span="16">
                  <a-slider v-model="config.gpuMemory" :min="1" :max="limits.GPUMemoryMax" :step="1"/>
                </a-col>
                <a-col :span="4">
                  <a-input-number
                      v-model="config.gpuMemory"
                      :min="1"
                      :max="limits.GPUMemoryMax"
                      :step="1"
                      style="margin-left: 16px"
                  />
                </a-col>
              </a-row>
            </a-form-model-item>
          </template>
          <a-form-model-item :wrapper-col="{ span: 24 - labelSpan, offset: labelSpan }">
            <span>✖</span>
          </a-form-model-item>
          <a-form-model-item label="实例数量" prop="replicaNum">
            <a-input-number v-model="config.replicaNum" :max="limits.replicaNumMax" :min="1"/>
          </a-form-model-item>

          <a-divider orientation="left">存储资源</a-divider>
          <a-form-model-item label="数据源挂载" prop="dataSource">
            <a-select
                mode="multiple"
                placeholder="请选择"
                v-model="config.dataSource"
            >
              <a-select-option :value="item.id" v-for="item in filterDataSourceList">{{ item.dsName }}</a-select-option>
            </a-select>
          </a-form-model-item>
        </template>
      </a-form-model>
    </a-modal>
  </a-spin>
</template>

<style scoped>

</style>