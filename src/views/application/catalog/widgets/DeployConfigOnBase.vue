<script setup>
import {computed, defineEmits, defineProps, nextTick, onMounted, reactive, ref, watch} from 'vue';
import {getDataSoureList} from "@/api/dataCenter";
import {resourcesLimits} from "@/views/application/catalog/constants";

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  }
});
const labelSpan = 6;

const limits = reactive(resourcesLimits);

const emits = defineEmits(['confirm', 'cancel', 'confirm:run']);
const formRef = ref(null);

const resetForm = (names) => {
  formRef.value?.resetFields(names);
};

const validateForm = (cb) => {
  return formRef.value?.validate(cb);
};

const config = ref({
  // 字段
  resourceType: "0",
  cpuCoreSize: 1,
  gpuCoreSize: 1,
  gpuMemory: 1,
  memory: 1,
  replicaNum: 1,
  dataSource: [],
});

const form = computed(() => {
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
    memorySize: config.value.memory * 1024,
    gpuCoreSize: config.value.gpuCoreSize,
    gpuMemorySize: config.value.gpuMemory,
    replicaNum: config.value.replicaNum,
    volumePaths: volumePaths.length > 0 ? JSON.stringify(volumePaths) : null,
  };
});
const rules = {
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
const dataSourceList = ref([]);

onMounted(() => {
});

watch(() => props.visible, (val) => {
  if (val) {
    resetForm();
    nextTick(() => {
      getDataSoureList({
        pageNo: 1,
        limit: 10000
      }).then((res) => {
        dataSourceList.value = res.data?.records.filter(rec => {
          return !!rec.pvcName
        })
      }).catch((e) => {
        console.log(e);
        dataSourceList.value = [];
      });
    })
  }
});


const handleOk = function handleOk() {
  validateForm((valid) => {
    if (valid) {
      emits('confirm', form.value);
    } else {
      return false;
    }
  });
}
const handleCancel = function handleCancel() {
  emits('cancel', false);
}
const handleOkAndRun = function handleOkAndRun() {
  emits('confirm:run', form.value);
}

</script>

<template>
  <a-modal
      title="部署配置"
      :visible="visible"
      @ok="handleOk"
      @cancel="handleCancel"
      centered
      width="800px"
      :maskClosable="false"
  >
    <a-form-model
        layout="horizontal"
        ref="formRef"
        :rules="rules"
        :model="config"
        :label-col="{ span: labelSpan }"
        :wrapper-col="{ span: 24 - labelSpan }"
    >
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
                :max="200"
                :step="1"
                style="margin-left: 16px"
            />
          </a-col>
        </a-row>
      </a-form-model-item>
      <a-form-model-item label="内存(GiB)" prop="memory">
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
      <a-form-model-item label="GPU" prop="gpuCoreSize" v-if="config.resourceType === '1'">
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
      <a-form-model-item label="显存(MiB)" prop="gpuMemory" v-if="config.resourceType === '1'">
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
    </a-form-model>
    <template #footer>
      <a-button key="back" @click="handleCancel">
        返回
      </a-button>
      <a-button key="submit" type="primary" @click="handleOk">
        确认
      </a-button>
      <a-button key="submitAndRun" type="primary" @click="handleOkAndRun">
        确认并启动
      </a-button>
    </template>
  </a-modal>
</template>

<style scoped>

</style>