<template>
  <div>
    <a-row :gutter="2" class="alarm-row">
      <a-col :span="3"><span style="font-size: 16px; font-weight: bold ">算力资源</span></a-col>
      <a-col :span="21">
        <a-table :columns="columnsCalculate" :data-source="dataCalculate">
          <template slot="name" slot-scope="text">{{ text }}</template>
          <template slot="action" slot-scope="text">
            <a>修改</a>
          </template>
        </a-table>
      </a-col>
    </a-row>
    <a-row :gutter="2" class="alarm-row">
      <a-col :span="3">
        <span style="font-size: 16px; font-weight: bold ">存储资源</span>
      </a-col>
      <a-col :span="21">
        <a-table :columns="columnsResource" :data-source="dataResource">
        </a-table>
      </a-col>
    </a-row>
  </div>
</template>

<script>
export default {
  data(){
    return {
      columnsCalculate: [
        {
          title: '资源池名称',
          dataIndex: 'name',
          key: 'name',
          scopedSlots: { customRender: 'name' },
        },
        {
          title: '资源配额大小',
          dataIndex: 'allocation',
          key: 'allocation',
        },
        {
          title: '功能模块使用配置',
          dataIndex: 'configModule',
          key: 'configModule',
        },
        {
          title: '操作',
          dataIndex: 'action',
          key: 'action',
          scopedSlots: { customRender: 'action' },
        },
      ],
      dataCalculate: [
        {
          key: '1',
          name: '公共资源池1',
          allocation: '100Core 200GB  P100(32GB) *4',
          configModule: '数据中心、训练中心',
        },
        {
          key: '2',
          name: '公共资源池2',
          allocation: '100Core 200GB  P100(32GB) *4',
          configModule: '数据中心、训练中心',
        },
        {
          key: '3',
          name: '专属资源池1',
          allocation: '100Core 200GB  P100(32GB) *4',
          configModule: '服务中心',
        },
      ],

      columnsResource: [
        {
          title: '资源池名称',
          dataIndex: 'name',
          key: 'name',
          scopedSlots: { customRender: 'name' },
        },
        {
          title: '资源池类型',
          dataIndex: 'type',
          key: 'type',
        },
        {
          title: '存储配额',
          dataIndex: 'allocation',
          key: 'allocation',
        },
        {
          title: '已使用情况',
          dataIndex: 'used',
          key: 'used',
        },
      ],
      dataResource: [
        {
          key: '1',
          name: '公共存储资源池1',
          type: 'NAS存储',
          allocation: '100GB',
          used: '80GB',
        },
        {
          key: '2',
          name: '公共存储资源池2',
          type: 'NAS存储',
          allocation: '100GB',
          used: '80GB',
        },
        {
          key: '3',
          name: '公共存储资源池3',
          type: 'NAS存储',
          allocation: '100GB',
          used: '80GB',
        },
      ],
    }
  }
}
</script>

<style lang="less" scoped>

</style>