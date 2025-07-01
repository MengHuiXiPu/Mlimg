<template>
  <div class="pro-table-header flex py-4">
    <span class="header-left">
      <slot name="left">
        <el-button
            v-if="showCreate"
            type="primary"
            icon="el-icon-plus"
            round
            :disabled="createDisabled"
            @click="onCreate"
        >{{ createTitle }}</el-button>
        <slot name="betweenOps" />
        <el-button
            v-if="showDelete"
            type="danger"
            icon="el-icon-delete"
            round
            :disabled="deleteDisabled"
            @click="onDelete"
        >{{ deleteTitle }}</el-button
        >
      </slot>
      <i v-if="loading" class="el-icon-loading" />
    </span>
    <span class="header-right ml-auto">
      <slot name="right">
        <BaseForm
            ref="queryForm"
            inline
            class="query-form"
            :form-items="formItems"
            :model="formModel"
        />
      </slot>
    </span>
  </div>
</template>

<script>
import BaseForm from '@/components/BaseForm';

export default {
  name: 'ProTableHeader',
  components: {
    BaseForm,
  },
  props: {
    // 是否展示创建按钮
    showCreate: {
      type: Boolean,
      default: true,
    },
    // 创建按钮展示名
    createTitle: {
      type: String,
      default: '创建',
    },
    // 是否禁用创建按钮
    createDisabled: {
      type: Boolean,
      default: false,
    },
    // 是否展示删除按钮
    showDelete: {
      type: Boolean,
      default: false,
    },
    // 删除按钮展示名
    deleteTitle: {
      type: String,
      default: '删除',
    },
    // 是否禁用创建按钮
    deleteDisabled: {
      type: Boolean,
      default: false,
    },
    // 数据搜索表单项定义数组
    formItems: {
      type: Array,
      default: () => [],
    },
    // 数据搜索表单值绑定
    formModel: {
      type: Object,
      default: () => ({}),
    },
    // 是否展示 loading 图标
    loading: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    // 点击创建按钮，抛出创建事件
    onCreate() {
      this.emit('create');
    },
    // 点击删除按钮，抛出删除事件
    onDelete() {
      this.emit('delete');
    },
  }
}
</script>

<style lang="scss" scoped>
::v-deep.query-form .el-form-item {
  margin-bottom: 10px;
}
</style>