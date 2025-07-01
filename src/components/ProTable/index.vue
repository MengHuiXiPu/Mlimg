<template>
  <div class="pro-table-container">
    <ProTableHeader
        :show-create="showCreate"
        :create-disabled="createDisabled"
        :create-title="createTitle"
        :show-delete="showDelete"
        :delete-disabled="mergedDeleteDisabled"
        :delete-title="deleteTitle"
        :form-items="mergedFormItems"
        :form-model="state.queryFormModel"
        :loading="headerLoading"
        @create="onCreate"
        @delete="onDelete"
    >
      <template v-slot:left>
        <slot name="left" />
      </template>
      <template v-slot:right>
        <slot name="right" />
      </template>
      <template v-slot:betweenOps>
        <slot name="betweenOps" />
      </template>
    </ProTableHeader>
    <el-tabs
        v-if="showTabs"
        v-model="state.activeTab"
        class="eltabs-inlineblock"
        @tab-click="onTabClick"
    >
      <el-tab-pane
          v-for="tab of tabs"
          :key="tab.name"
          :label="tab.label"
          :name="tab.name"
          :disabled="tab.disabled"
      />
    </el-tabs>
    <slot name="header-refresh">
      <el-tooltip v-if="showRefresh" effect="dark" content="刷新" placement="top">
        <el-button
            class="with-border fr mr-10"
            style="padding: 8px;"
            icon="el-icon-refresh"
            @click="onRefresh"
        />
      </el-tooltip>
    </slot>
    <BaseTable
        ref="table"
        v-loading="tableLoading"
        v-bind="tableAttrs"
        :columns="mergedColumns"
        :data="state.data"
        @sort-change="onSortChange"
        @selection-change="onSelectionChange"
        v-on="$listeners"
    >
      <template v-for="slot of slotLeft" v-slot:[slot.name]="scope">
        <slot :row="scope.row" :name="slot.name" />
      </template>
    </BaseTable>
    <el-pagination
        v-if="pageShow"
        v-bind="mergedPageAttrs"
        :style="`text-align:${pageAlign}; margin-top: 8px;`"
        @size-change="onSizeChange"
        @current-change="onPageChange"
    />
  </div>
</template>

<script>
import { MessageBox } from 'element-ui';

import BaseTable from '@/components/BaseTable';
import { Constant } from '@/utils';
import { usePagination } from '@/hooks';

import ProTableHeader from './header';
import {computed, onMounted} from "vue";

const defaultSlots = ['left', 'betweenOps', 'right', 'header-refresh'];
export default {
  name: 'ProTable',
  components: {
    ProTableHeader,
    BaseTable,
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
    // 标签页定义数组
    tabs: {
      type: Array,
      default: () => [],
    },
    // 是否展示刷新按钮
    showRefresh: {
      type: Boolean,
      default: false,
    },
    // 表格列定义数组
    columns: {
      type: Array,
      default: () => [],
    },
    // 表格其他属性
    tableAttrs: {
      type: Object,
      default: () => ({}),
    },
    // 是否展示分页
    showPagination: {
      type: Boolean,
      default: true,
    },
    // 分页组件位置
    pageAlign: {
      type: String,
      default: 'center',
    },
    // 分页其他属性
    paginationAttrs: {
      type: Object,
      default: () => ({}),
    },
    // 请求数据方法
    listRequest: Function,
    // 请求接口额外参数
    listOptions: {
      type: Object,
      default: () => ({}),
    },
    // 查询之前的回调方法，如果返回 false 则停止请求
    beforeListFn: Function,
    // 查询之后的回调方法，入参为当前查询结果
    afterListFn: Function,
    // 删除数据方法
    delRequest: Function,
    // 调用默认删除接口时用于获取 ID 字段
    idField: {
      type: String,
      default: 'id',
    },
    // 区分在表格上展示 loading 还是在头部展示 loading。table - 表格; header - 头部。
    loadingType: {
      type: String,
      default: 'table',
    },
    // 是否在渲染之后立刻请求数据
    refreshImmediate: {
      type: Boolean,
      default: true,
    },
  },
  data(){

    return {
      state: {
        activeTab: null, // 激活的标签页
        queryFormModel: {}, // 查询表单值
        data: [], // 表格数据
        selectedRows: [], // 表格多选行
        loading: false, // 表格 loading 状态
        paginationVisible: false, // 需要在请求之后展示分页，避免分页页码提前设置之后无法正确展示
      },
      defaultFormModel: '',
      sortInfo: {
        sort: null,
        order: null,
      },
      mergedPageAttrs: null,
      pagination: null,
    }
  },
  mounted(){
    // 渲染后调用一次查询
    if (this.refreshImmediate) {
      this.query();
    }
    if (this.showTabs) {
      this.state.activeTab = this.tabs[0].name; // 默认打开第一个 tab
    }
    // 分页 & 数据
    const { mergedPageAttrs, pagination, setPagination } = usePagination({
      ...this.paginationAttrs,
    });
    this.mergedPageAttrs = mergedPageAttrs;
    this.pagination = pagination;
    // 绑定setPagination方法到Vue实例的data属性
    this.$data.setPagination = setPagination;
    console.log("setPagination=========== ", setPagination);
  },
  watch: {
    formItems: {
      handler(items) {
        const newModel = {};
        items.forEach((item) => {
          // 不添加没有 prop 属性的表单项，如按钮
          item.prop && (newModel[item.prop] = undefined);
        });
        this.defaultFormModel = newModel;
        // 根据表单项获取并赋值 query 对象
        this.state.queryFormModel = { ...this.defaultFormModel };
      },
      immediate: true,
    },

  },
  computed: {
    showTabs() {
      return this.tabs.length > 0;
    },
    pageShow() {
      return this.showPagination && this.state.paginationVisible
    },
    // 列定义预处理
    mergedColumns() {
      return this.columns.map((column) => {
        // 为下拉表头绑定默认查询方法
        if (column.dropdownList && typeof column.func !== 'function') {
          column.func = (value) => {
            this.state.queryFormModel[column.prop] = value;
            this.query();
          };
        }
        return column;
      });
    },

    mergedFormItems(){
      // 配置一个 funcObj 来提供查询和重置方法
      const funcObj = { query: this.query, resetQuery: this.resetQuery };
      return this.formItems.map((item) => {
        const copyItem = { ...item };
        if (item.func in funcObj) {
          const func = funcObj[item.func];
          copyItem.func = () => func();
        }
        if (item.change in funcObj) {
          const func = funcObj[item.change];
          copyItem.change = () => func();
        }
        return copyItem;
      });
    },

    // 表格插槽
    slotLeft() {
      return Object.keys(this.$slots)
          .filter((name) => !defaultSlots.includes(name))
          .map((name) => ({ name }));
    },

    mergedDeleteDisabled() {
      return this.deleteDisabled || this.state.selectedRows.length === 0;
    },

    tableLoading() {
      return this.state.loading && this.loadingType === 'table';
    },

    headerLoading() {
      return this.state.loading && this.loadingType === 'header';
    },

  },
  methods: {
    setQuery(query = {}) {
      Object.assign(this.state.queryFormModel, query);
    },
    onTabClick() {
      this.emit('tab-change', this.state.activeTab);
    },
    setSort(sort = {}) {
      Object.assign(this.sortInfo, sort);
    },
    // 数据请求
    async refresh(queryObj) {
      if (typeof this.listRequest === 'function') {
        if (typeof this.beforeListFn === 'function') {
          const res = this.beforeListFn();
          if (res === false) return;
        }
        this.state.loading = true;
        const { currentPage, pageSize } = this.pagination;
        // if(this.pagination) {
        //   let { currentPage, pageSize } = this.pagination;
        //   currentPage = currentPage;
        //   pageSize = pageSize
        // }
        // 清除空的查询参数
        Object.keys(this.state.queryFormModel).forEach((key) => {
          if (this.state.queryFormModel[key] === '' || this.state.queryFormModel[key] === null) {
            this.state.queryFormModel[key] = undefined;
          }
        });
        const { page, result } = await this.listRequest({
          ...this.state.queryFormModel,
          current: currentPage,
          size: pageSize,
          sort: this.sortInfo.sort || undefined,
          order: this.sortInfo.order || undefined,
          ...this.listOptions,
          ...queryObj,
        }).finally(() => {
          this.state.loading = false;
        });
        // 如果当前非第一页，且总数据量已经小于或等于上一页能展示的所有数据，那么重新请求上一页的数据
        if (page.current > 1 && page.total <= page.size * (page.current - 1)) {
          await this.refresh({current: currentPage - 1});
          return;
        }
        typeof this.setPagination === 'function' && this.setPagination(page);
        this.state.data = result;
        this.state.paginationVisible = true;
        if (typeof this.afterListFn === 'function') {
          this.afterListFn(result);
        }
      }
    },
    // 数据查询
    query(queryObj = {}) {
      typeof this.setPagination === 'function' && this.setPagination({
        current: 1,
      });
      this.refresh(queryObj);
    },
    // 查询重置
    resetQuery() {
      this.setQuery(this.defaultFormModel);
      this.query();
    },

    onSizeChange(size){
      typeof this.setPagination === 'function' && this.setPagination({
        size,
        current: 1,
      });
      this.query();
    },
    onPageChange(page) {
      typeof this.setPagination === 'function' && this.setPagination({
        current: page,
      });
      this.refresh();
    },
    onSortChange({ prop, order }) {
      this.setSort({
        sort: order && prop,
        order: order && Constant.tableSortMap[order],
      });
      this.query();
    },
    onSelectionChange(selections) {
      this.state.selectedRows = selections;
    },
    // 创建按钮
    onCreate() {
      this.emit('add');
    },
    // 删除按钮
    async onDelete() {
      if (typeof this.delRequest === 'function') {
        const ids = this.state.selectedRows.map((row) => row[this.idField]);
        await MessageBox.confirm(`确认删除选中的${ids.length}条数据?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        });
        await this.delRequest({ ids });
        await this.refresh();
      }
      this.emit('delete', this.state.selectedRows);
    },

    // 刷新按钮
    onRefresh() {
      this.refresh();
    },

  },

}
</script>

<style scoped>

</style>