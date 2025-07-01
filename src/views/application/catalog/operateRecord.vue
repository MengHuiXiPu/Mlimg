<template>
  <div>
    <a-form-model ref="formRef" layout="inline" :model="form">
      <a-form-model-item label="事件类型" prop="operateType">
        <a-select v-model="form.operateType" style="width: 220px">
          <a-select-option :value="item.value" v-for="item in operateTypeEnumValues">
            {{ item.text }}
          </a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item label="操作时间" prop="operateTimeRange">
        <a-range-picker show-time v-model="form.operateTimeRange" style="margin: auto !important"/>
      </a-form-model-item>
      <a-form-model-item label="操作人" prop="operator">
        <a-input type="text" v-model="form.operator"></a-input>
      </a-form-model-item>

      <a-form-model-item>
        <a-button type="primary" html-type="submit" style="margin-right: 20px" @click="handleSearch">
          查询
        </a-button>
        <a-button type="default" html-type="reset" @click="resetForm">
          重置
        </a-button>
      </a-form-model-item>
    </a-form-model>
    <a-spin :spinning="loading">
      <a-table
          :columns="columns"
          :data-source="dataSource"
          :rowKey="record => record?.id"
          @change="handleTableChange"
          :pagination="pagination"
      >
        <template #operateType="record">
          {{ operateTypeFormat(record?.opType) }}
        </template>
        <template #content="record">
          {{ operateDescFormat(record) }}
        </template>
        <template #createTime="record">
          {{ record?.createTime | moment }}
        </template>
        <template #status="record">
          <template v-if="record?.opStatus==='1'">
            <a-tag color="green">生效</a-tag>
          </template>
          <template v-else-if="record?.opStatus==='0'">
            <a-popover
                title="异常信息"
                trigger="hover"
            >
              <a-tag color="red">
                失败
                <a-icon type="warning" class="warning-icon"/>
              </a-tag>
              <template #content>
                {{ record?.errMsg }}
              </template>
            </a-popover>
          </template>
          <template v-else>
            <a-tag color="yellow">
              进行中
              <a-icon type="loading"/>
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-spin>
  </div>
</template>
<script setup>
import {ref, defineProps, nextTick, onMounted} from "vue";
import moment from "moment";

import {OperateTypeEnum} from "./constants";
import {operateDescFormat, operateTypeFormat} from "./utils";

import {getInferserviceOperateLogByIdPage} from "@/api/appCenter";

const props = defineProps({
  serviceId: {
    required: true,
    type: Number,
  }
});
const operateTypeEnumValues = ref(OperateTypeEnum.mapValues());
const columns = [
  {
    title: '事件类型',
    key: 'operateType',
    scopedSlots: {customRender: "operateType"},
  },
  {
    title: '操作内容',
    key: 'content',
    scopedSlots: {customRender: 'content'},
  },
  {
    title: '操作人',
    dataIndex: 'createBy',
    key: 'createBy',
  },
  {
    title: '操作时间',
    key: 'createTime',
    scopedSlots: {customRender: 'createTime'},
  },
  {
    title: '操作结果',
    key: 'status',
    scopedSlots: {customRender: 'status'},
  },
];


const formRef = ref(null);
const resetForm = (names) => {
  formRef.value?.resetFields(names);
};

const validateForm = (cb) => {
  return formRef.value?.validate(cb);
};

const dataSource = ref([]);
const form = ref({
  operateType: "",
  operateTimeRange: [],
  operator: "",
});

const getFilters = () => {
  return {
    opType: !!form.value.operateType ? parseInt(form.value.operateType) : undefined,
    createBy: form.value.operator?.trim().length > 0 ? form.value.operator : undefined,
    createTimeRangeFrom: form.value.operateTimeRange?.length === 2 ? moment(form.value.operateTimeRange[0]).format("YYYY-MM-DD HH:mm:ss") : undefined,
    createTimeRangeTo: form.value.operateTimeRange?.length === 2 ? moment(form.value.operateTimeRange[1]).format("YYYY-MM-DD HH:mm:ss") : undefined,
  };
};

const loading = ref(false);

const pagination = ref({
  current: 1,
  pageSize: 10,
  hideOnSinglePage: true,
  showSizeChanger: true,
  pageSizeOptions: ["10", "20", "30", "50"],
  showTotal: function (total) {
    return `共 ${total} 条`;
  },
  total: 0,
});

const pagingOperateLogs = function pagingOperateLogs({pageNo = 1, limit = 10, filters = {}, sorter = {}}) {
  loading.value = true;
  getInferserviceOperateLogByIdPage(props.serviceId, {pageNo, limit, ...filters, ...sorter}).then(res => {
    const {code, data} = res;
    if (code === 0) {
      const {records, total} = data;
      dataSource.value = records;
      pagination.value.total = total;
      pagination.value.current = pageNo;
      pagination.value.pageSize = limit;
    } else {
      dataSource.value = [];
    }
  }).finally(() => {
    loading.value = false;
  });
};

const handleTableChange = function handleTableChange(page) {
  pagingOperateLogs({
    pageNo: page.current,
    limit: page.pageSize,
    filters: getFilters(),
  });
};

onMounted(() => {
  nextTick(() => {
    pagingOperateLogs({
      filters: getFilters(),
    });
  });
});


const handleSearch = function handleSearch() {
  validateForm(valid => {
    if (valid) {
      pagingOperateLogs({
        filters: getFilters(),
      })
    } else {
      return false;
    }
  });
}
</script>
<style scoped>
.warning-icon /deep/ svg {
  vertical-align: 0 !important;
}
</style>