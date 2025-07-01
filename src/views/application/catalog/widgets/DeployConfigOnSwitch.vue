<script setup>
import {computed, defineEmits, defineProps, reactive, ref, watch} from 'vue';

import {useVModel} from '@vueuse/core';
import {getDataSoureList} from "@/api/dataCenter";

import {getInferserviceVersionByIdPage} from "@/api/appCenter"

import {stateIn} from "@/views/application/catalog/utils";
import {resourcesLimits, RunningStateEnum} from "@/views/application/catalog/constants";


const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  rowData: {
    type: Object,
    required: true,
  }
});
const emits = defineEmits(['confirm', 'cancel', 'error', 'update:visible']);

const visibleVModel = useVModel(props, "visible", emits);


const labelSpan = 6;
const limits = reactive(resourcesLimits);
const switchDeployConfig = ref(false);
const formRef = ref(null);
const resetForm = (names) => {
  formRef.value?.resetFields(names);
};

const validateForm = (cb) => {
  return formRef.value?.validate(cb);
};

const fromVersionId = computed(() => {
  return props.rowData?.currVersion;
});

const fromVersionName = computed(() => {
  return props.rowData?.currVersionInfo?.versionName;
});

const spinning = ref(false);

const config = ref({
  fromVersion: fromVersionId,
  toVersionId: "",
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
  toVersionId: [{
    type: "integer", required: true, message: '请选择要切换的目标版本', trigger: 'blur'
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

const inferserviceId = computed(() => {
  return props.rowData?.id;
});

const isMustDeployConfig = computed(() => {
  return stateIn(selectedToVersion.value?.versionStatus, [RunningStateEnum.CREATED]);
});

const showDeployConfig = computed(() => {
  return isMustDeployConfig.value || switchDeployConfig.value;
});

const canSelectVersionList = computed(() => {
  return versionList.value.filter((v) => {
    return fromVersionId.value !== v?.versionId;
  });
});

const selectedToVersion = computed(() => {
  return versionList.value.find((v) => {
    return config.value.toVersionId === v?.versionId;
  });
})

const dataSourceList = ref([]);

watch(() => props.visible, async (val) => {
  if (val && props.rowData?.id) {
    resetForm();
    spinning.value = true;
    await getInferserviceVersionByIdPage(inferserviceId.value, 1, 999).then(
        (res) => {
          const {code, data} = res;
          if (code === 0) {
            const {records} = data;
            versionList.value = records;
          } else {
            versionList.value = [];
          }
        }
    ).catch((err) => {
      versionList.value = [];
      emits("error", err)
    }).finally(() => {
      spinning.value = false;
    });
    await getDataSoureList({
      pageNo: 1,
      limit: 10000
    }).then((res) => {
      dataSourceList.value = res.data?.records.filter(rec => {
        return !!rec.pvcName
      })
    }).catch(() => {
      dataSourceList.value = [];
    });
  }
});

const deployConfig = computed(() => {
  if (showDeployConfig.value) {
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
      gpuCoreSize: config.value.gpuCoreSize,
      gpuMemorySize: config.value.gpuMemory,
      replicaNum: config.value.replicaNum,
      volumePaths: volumePaths.length > 0 ? JSON.stringify(volumePaths) : null,
    }
  }
})

const form = computed(() => {
  return {
    infesvrId: inferserviceId.value,
    oldVersionId: fromVersionId.value,
    newVersionId: config.value.toVersionId,
    config: deployConfig.value,
  }
});

const onOk = function onOk() {
  validateForm((valid) => {
    if (valid) {
      emits('confirm', form.value)
      visibleVModel.value = false;
    } else {
      return false;
    }
  });
};

const onCancel = function onCancel(reason) {
  emits('cancel', reason);
  visibleVModel.value = false;
};

</script>

<template>
  <a-spin :spinning="spinning">
    <a-modal
        title="版本切换"
        :visible="visible"
        @ok="onOk"
        @cancel="onCancel"
        centered
        width="800px"
        :maskClosable="false"
    >
      <a-form-model
          ref="formRef"
          :label-col="{ span: labelSpan }"
          :wrapperCol="{ span: 24 - labelSpan }"
          layout="horizontal"
          :rules="rules"
          :model="config"
      >
        <a-row style="margin-left: 64px">
          <a-col>
            平台使用滚动更新方式，切换版本不会导致服务中断，请确认是否执行回滚。
          </a-col>
        </a-row>
        <a-form-model-item label="当前版本号">
          {{ fromVersionName }}
        </a-form-model-item>
        <a-form-model-item label="启动版本号" prop="toVersionId">
          <a-select placeholder="请选择切换版本号" v-model="config.toVersionId">
            <a-select-option :value="item.versionId" v-for="item in canSelectVersionList">{{
                item.versionName
              }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-row v-if="!isMustDeployConfig">
          <a-col offset="20" style="text-align: right">
            <a-button type="link" @click="switchDeployConfig = !switchDeployConfig">{{
                switchDeployConfig ? "隐藏" : "更多设置"
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
              <a-select-option :value="item.id" v-for="item in dataSourceList">{{ item.dsName }}</a-select-option>
            </a-select>
          </a-form-model-item>
        </template>
      </a-form-model>
    </a-modal>
  </a-spin>
</template>

<style scoped>

</style>