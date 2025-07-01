<template>
  <div>
    <a-form layout="inline" :form="form">
      <a-form-item label="版本">
        <a-select default-value="v0.3" style="width: 120px" size="small" @change="handleChange">
          <a-select-option value="v0.3">
            v0.3
          </a-select-option>
          <a-select-option value="v0.2">
            v0.2
          </a-select-option>
          <a-select-option value="v0.1">
            v0.1
          </a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
    <a-table :columns="columns" :data-source="dataSource" rowKey="key">
      <template slot="action" slot-scope="text, record">
        <a @click="view(record)">查看日志</a>
      </template>
    </a-table>
  </div>
</template>
<script>

export default {
  name: "instanceList",
  computed: {
    props: {
      serviceId: {
        default: 0,
        type: Number
      }
    },
  },
  data() {
    return {
      form: {},
      columns: [
        {
          title: '实例ID',
          dataIndex: 'id',
          key: 'id',
          scopedSlots: {customRender: "id"},
        },
        {
          title: 'Host IP',
          dataIndex: 'ip',
          key: 'ip',
        },
        {
          title: '实例状态',
          dataIndex: 'status',
          key: 'status',
        },
        {
          title: '开始时间',
          key: 'startTime',
          dataIndex: 'startTime',
        },
        {
          title: '操作',
          key: 'action',
          scopedSlots: {customRender: 'action'},
        },
      ],
      dataSource: [
        {
          key: '1',
          id: '1',
          ip: '10.1.1.1',
          status: 'Running',
          startTime: "2025-01-17 12:12:43"
        },
        {
          key: '2',
          id: '2',
          ip: '10.1.1.2',
          status: 'Stoped',
          startTime: "2025-01-17 12:12:43"
        },
        {
          key: '1',
          id: '3',
          ip: '10.1.1.3',
          status: 'Waitting',
          startTime: "2025-01-17 12:12:43"
        },
      ],

    }
  },
  methods: {
    handleChange(value) {
      console.log(`selected ${value}`);
    },
    view(record) {
    },
  }
}
</script>
<style scoped>
.icons >>> .anticon-spin {
  margin-left: 6px;
  margin-bottom: 6px;
  color: #00aa00;
}
</style>