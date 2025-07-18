/*
* Copyright 2019-2020 Zheng Jie
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

import { Constant } from '@/utils/index';
import { parseTime } from '@/utils/utils.js'
import Vue from 'vue';

/**
 * CRUD配置
 * @param {*} options <br>
 * @return crud instance.
 * @example
 * 要使用多crud时，请在关联crud的组件处使用crud-tag进行标记，如：<jobForm :job-status="dict.job_status" crud-tag="job" />
 */
function CRUD(options) {
  const defaultOptions = {
    tag: 'default',
    // id字段名
    idField: 'id',
    // 标题
    title: '',
    // 请求数据的url
    url: '',
    // 表格数据
    data: [],
    // 选择项
    selections: [],
    // 待查询的对象
    query: {},
    // 查询数据的参数
    params: {},
    // Form 表单
    form: {},
    // 重置表单
    defaultForm: () => {},
    // 排序规则，默认 id 降序， 支持多字段排序 ['id,desc', 'createTime,asc']
    sort: null,
    order: null,
    // 等待时间
    time: 50,
    // CRUD Method
    crudMethod: {
      add: (form) => {},
      del: (id) => {},
      edit: (form) => {},
      list: (id) => {},
    },
    // 主页操作栏显示哪些按钮
    optShow: {
      add: true,
      edit: true,
      del: true,
      reset: true,
    },
    // 自定义一些扩展属性
    props: {
      // 主页操作栏显示按钮的文本信息
      optText: {
        add: '创建',
        edit: '修改',
        del: '删除',
        reset: '重置',
      },
      // 弹窗标题显示
      optTitle: {
        add: '创建',
        edit: '修改',
      },
      // 分页组件居 左边/中间/右边显示
      paginationAlign: 'center',
      // 搜索按钮icon是否显示
      searchIconShow: false,
      // 重置按钮icon是否显示
      resetIconShow: false,
    },
    // 在主页准备
    queryOnPresenterCreated: true,
    // 调试开关
    debug: false,
  };
  options = mergeOptions(defaultOptions, options);
  const data = {
    ...options,
    // 记录数据状态
    dataStatus: {},
    status: {
      add: CRUD.STATUS.NORMAL,
      edit: CRUD.STATUS.NORMAL,
      // 添加或编辑状态
      get cu() {
        if (this.add === CRUD.STATUS.NORMAL && this.edit === CRUD.STATUS.NORMAL) {
          return CRUD.STATUS.NORMAL;
        } if (this.add === CRUD.STATUS.PREPARED || this.edit === CRUD.STATUS.PREPARED) {
          return CRUD.STATUS.PREPARED;
        } if (this.add === CRUD.STATUS.PROCESSING || this.edit === CRUD.STATUS.PROCESSING) {
          return CRUD.STATUS.PROCESSING;
        }
        throw new Error('wrong crud\'s cu status');
      },
      // 标题
      get title() {
        return this.add > CRUD.STATUS.NORMAL 
        ? `${crud.props.optTitle.add}${crud.title}` 
        : this.edit > CRUD.STATUS.NORMAL 
          ? `${crud.props.optTitle.edit}${crud.title}` 
          : crud.title;
      },
    },
    msg: {
      submit: '提交成功',
      add: '创建成功',
      edit: '保存成功',
      del: '删除成功',
      error:'错误原因'
    },
    page: {
      // 页码
      current: 1,
      // 每页数据条数
      size: 10,
      // 总数据条数
      total: 0,
      // 显示分页
      show: false,
    },
    // 整体loading
    loading: false,
    // 删除的 Loading
    delAllLoading: false,
  };
  const methods = {
    /**
     * 通用的提示
     */
    submitSuccessNotify() {
      crud.notify(crud.msg.submit, CRUD.NOTIFICATION_TYPE.SUCCESS);
    },
    addSuccessNotify() {
      crud.notify(crud.msg.add, CRUD.NOTIFICATION_TYPE.SUCCESS);
    },
    editSuccessNotify() {
      crud.notify(crud.msg.edit, CRUD.NOTIFICATION_TYPE.SUCCESS);
    },
    delSuccessNotify() {
      crud.notify(crud.msg.del, CRUD.NOTIFICATION_TYPE.SUCCESS);
    },
    ErrorNotify(){
      crud.notify(crud.msg.error, CRUD.NOTIFICATION_TYPE.ERROR);
    },
    WarningNotify(msg){
      crud.notify(msg, CRUD.NOTIFICATION_TYPE.WARNING);
    },
    // 搜索
    toQuery() {
      crud.page.current = 1;
      crud.refresh();
    },
    // 排序
    sortChange({ prop, order }) {
      crud.page.current = 1;
      crud.sort = order && prop;
      crud.order = order && Constant.tableSortMap[order];
      crud.refresh();
    },
    // 刷新
    refresh() {
      if (!callVmHook(crud, CRUD.HOOK.beforeRefresh)) {
        return;
      }
      return new Promise((resolve, reject) => {
        crud.loading = true;
        // 请求数据
        crud.crudMethod.list(crud.getQueryParams()).then(data => {
          // TODO 兼容以前的API，后续需要删除
          const page = data.page || data.pagination;
          page.current = page.current || page.page;
          crud.page.current = page.current;
          crud.page.size = page.size;
          crud.page.total = page.total;
          crud.data = data.result;
          crud.resetDataStatus();
          // time 毫秒后显示表格
          setTimeout(() => {
            crud.loading = false;
            callVmHook(crud, CRUD.HOOK.afterRefresh);
            crud.page.show = true;
          }, crud.time);
          resolve(data);
        }).catch(err => {
          crud.loading = false;
          crud.page.show = true;
          reject(err);
        });
      });
    },
    /**
     * 启动添加
     */
    toAdd() {
      crud.resetForm();
      if (!(callVmHook(crud, CRUD.HOOK.beforeToAdd, crud.form) && callVmHook(crud, CRUD.HOOK.beforeToCU, crud.form))) {
        return;
      }
      crud.status.add = CRUD.STATUS.PREPARED;
      callVmHook(crud, CRUD.HOOK.afterToAdd, crud.form);
      callVmHook(crud, CRUD.HOOK.afterToCU, crud.form);
    },
    /**
     * 启动fork
     * fork的逻辑是copy一份预置的数据项填入form，然后调用add接口
     * 好像 实际的实现只需要把toAdd的第一行改掉就行了
     * @param {*} data 数据项
     */
    toFork(data) {
      crud.resetForm(JSON.parse(JSON.stringify(data)));
      if (!(callVmHook(crud, CRUD.HOOK.beforeToFork, crud.form) && callVmHook(crud, CRUD.HOOK.beforeToCU, crud.form))) {
        return;
      }
      crud.status.add = CRUD.STATUS.PREPARED;
      callVmHook(crud, CRUD.HOOK.afterToAdd, crud.form);
      callVmHook(crud, CRUD.HOOK.afterToCU, crud.form);
    },
    /**
     * 启动编辑
     * @param {*} data 数据项
     */
    toEdit(data) {
      crud.resetForm(JSON.parse(JSON.stringify(data)));
      if (!(callVmHook(crud, CRUD.HOOK.beforeToEdit, crud.form) && callVmHook(crud, CRUD.HOOK.beforeToCU, crud.form))) {
        return;
      }
      crud.status.edit = CRUD.STATUS.PREPARED;
      crud.getDataStatus(crud.getDataId(data)).edit = CRUD.STATUS.PREPARED;
      callVmHook(crud, CRUD.HOOK.afterToEdit, crud.form);
      callVmHook(crud, CRUD.HOOK.afterToCU, crud.form);
    },
    /**
     * 启动删除
     * @param {*} data 数据项
     */
    toDelete(data) {
      crud.getDataStatus(crud.getDataId(data)).delete = CRUD.STATUS.PREPARED;
    },
    /**
     * 取消删除
     * @param {*} data 数据项
     */
    cancelDelete(data) {
      if (!callVmHook(crud, CRUD.HOOK.beforeDeleteCancel, data)) {
        return;
      }
      crud.getDataStatus(crud.getDataId(data)).delete = CRUD.STATUS.NORMAL;
      callVmHook(crud, CRUD.HOOK.afterDeleteCancel, data);
    },
    /**
     * 取消新增/编辑
     */
    cancelCU() {
      const addStatus = crud.status.add;
      const editStatus = crud.status.edit;
      if (addStatus === CRUD.STATUS.PREPARED) {
        if (!callVmHook(crud, CRUD.HOOK.beforeAddCancel, crud.form)) {
          return;
        }
        crud.status.add = CRUD.STATUS.NORMAL;
      }
      if (editStatus === CRUD.STATUS.PREPARED) {
        if (!callVmHook(crud, CRUD.HOOK.beforeEditCancel, crud.form)) {
          return;
        }
        crud.status.edit = CRUD.STATUS.NORMAL;
        crud.getDataStatus(crud.getDataId(crud.form)).edit = CRUD.STATUS.NORMAL;
      }
      crud.resetForm();
      if (addStatus === CRUD.STATUS.PREPARED) {
        callVmHook(crud, CRUD.HOOK.afterAddCancel, crud.form);
      }
      if (editStatus === CRUD.STATUS.PREPARED) {
        callVmHook(crud, CRUD.HOOK.afterEditCancel, crud.form);
      }
      // 清除表单验证
      if (crud.findVM('form').$refs.form) {
        setTimeout(() => {
          crud.findVM('form').$refs.form.clearValidate();
        }, 0);
      }
    },
    /**
     * 提交新增/编辑
     */
    submitCU() {
      if (!callVmHook(crud, CRUD.HOOK.beforeValidateCU)) {
        return;
      }
      crud.findVM('form').$refs.form.validate(valid => {
        if (!valid) {
          return;
        }
        if (!callVmHook(crud, CRUD.HOOK.afterValidateCU)) {
          return;
        }
        if (crud.status.add === CRUD.STATUS.PREPARED) {
          crud.doAdd();
        } else if (crud.status.edit === CRUD.STATUS.PREPARED) {
          crud.doEdit();
        }
      });
    },
    /**
     * 执行添加
     */
    doAdd() {
      if (!callVmHook(crud, CRUD.HOOK.beforeSubmit)) {
        return;
      }
      crud.status.add = CRUD.STATUS.PROCESSING;
      crud.crudMethod.add(crud.form).then((res) => {
        console.log(res,'添加结果在这里')
        // if(res.status != 200){
        //   console.log(res.msg, '信息')
        //   crud.msg.error = res.msg
        //   crud.ErrorNotify(res.msg)
        //   crud.status.add = CRUD.STATUS.PREPARED;
        //   callVmHook(crud, CRUD.HOOK.afterAddError);
        //   return
        // }
        crud.status.add = CRUD.STATUS.NORMAL;
        crud.resetForm();
        crud.addSuccessNotify();
        // 清除表单验证
        if (crud.findVM('form').$refs.form) {
          setTimeout(() => {
            crud.findVM('form').$refs.form.clearValidate();
          }, 0);
        }
        callVmHook(crud, CRUD.HOOK.afterSubmit);
        crud.refresh();
      }).catch(err => {
        crud.status.add = CRUD.STATUS.PREPARED;
        callVmHook(crud, CRUD.HOOK.afterAddError);
        return Promise.reject(err);
      });
    },
    /**
     * 执行编辑
     */
    doEdit() {
      if (!callVmHook(crud, CRUD.HOOK.beforeSubmit)) {
        return;
      }
      crud.status.edit = CRUD.STATUS.PROCESSING;
      console.log(crud.form);
      crud.crudMethod.edit(crud.form).then((res) => {
        if(res?.status && (res?.msg || res?.message)){
          crud.status.edit = CRUD.STATUS.PREPARED;
          crud.getDataStatus(crud.getDataId(crud.form)).edit = CRUD.STATUS.PREPARED;
          crud.WarningNotify(res?.msg || res?.message);
          callVmHook(crud, CRUD.HOOK.afterEditCancel);
        }else{
          crud.status.edit = CRUD.STATUS.NORMAL;
          crud.getDataStatus(crud.getDataId(crud.form)).edit = CRUD.STATUS.NORMAL;
          crud.editSuccessNotify();
          crud.resetForm();
          callVmHook(crud, CRUD.HOOK.afterSubmit);
          crud.refresh();
        }
        // 清除表单验证
        if (crud.findVM('form').$refs.form) {
          setTimeout(() => {
            crud.findVM('form').$refs.form.clearValidate();
          }, 0);
        }
      }).catch(err => {
        crud.status.edit = CRUD.STATUS.PREPARED;
        callVmHook(crud, CRUD.HOOK.afterEditError);
        return Promise.reject(err);
      });
    },
    /**
     * 执行删除
     * @param {*} data 数据项
     */
    doDelete(data) {
      let delAll = false;
      let dataStatus;
      const ids = [];
      if (data instanceof Array) {
        delAll = true;
        data.forEach(val => {
          ids.push(this.getDataId(val));
        });
      } else {
        ids.push(this.getDataId(data));
        dataStatus = crud.getDataStatus(this.getDataId(data));
      }
      if (!callVmHook(crud, CRUD.HOOK.beforeDelete, data)) {
        return;
      }
      if (!delAll) {
        dataStatus.delete = CRUD.STATUS.PROCESSING;
      }
      return crud.crudMethod.del(ids).then(() => {
        if (delAll) {
          crud.delAllLoading = false;
        } else dataStatus.delete = CRUD.STATUS.PREPARED;
        crud.delChangePage(ids.length);
        crud.delSuccessNotify();
        callVmHook(crud, CRUD.HOOK.afterDelete, data);
        crud.refresh();
      }).catch(err => {
        if (delAll) {
          crud.delAllLoading = false;
        } else dataStatus.delete = CRUD.STATUS.PREPARED;
        return Promise.reject(err);
      });
    },
    /**
     * 获取查询参数
     */
    getQueryParams() {
      // 清除参数无值的情况
      Object.keys(crud.query).length !== 0 && Object.keys(crud.query).forEach(item => {
        if (crud.query[item] === null || crud.query[item] === '') crud.query[item] = undefined;
      });
      Object.keys(crud.params).length !== 0 && Object.keys(crud.params).forEach(item => {
        if (crud.params[item] === null || crud.params[item] === '') crud.params[item] = undefined;
      });
      return {
        current: crud.page.current,
        size: crud.page.size,
        sort: crud.sort || undefined,
        order: crud.order || undefined,
        ...crud.query,
        ...crud.params,
      };
    },
    // 当前页改变
    pageChangeHandler(e) {
      crud.page.current = e;
      crud.refresh();
    },
    // 每页条数改变
    sizeChangeHandler(e) {
      crud.page.size = e;
      crud.page.current = 1;
      crud.refresh();
    },
    // 在删除当前页所有数据时，有是否首页，是否末页四种组合情况
    // 只有在不是首页，是末页的情况下，当前页码需减一
    delChangePage(delCount) {
      const delCurrentPage = delCount === crud.data.length;
      const pageCount = Math.ceil(crud.page.total / crud.page.size);
      if (delCurrentPage && crud.page.current === pageCount && crud.page.current !== 1) {
        crud.page.current -= 1;
      }
    },
    // 选择改变
    selectionChangeHandler(val) {
      crud.selections = val;
    },
    /**
     * 重置查询参数
     * @param {Boolean} toQuery 重置后进行查询操作
     */
    resetQuery(toQuery = true) {
      const defaultQuery = JSON.parse(JSON.stringify(crud.defaultQuery));
      const {query} = crud;
      Object.keys(query).forEach(key => {
        query[key] = defaultQuery[key];
      });
      if (toQuery) {
        crud.toQuery();
      }
    },
    /**
     * 重置表单
     * @param {Array} data 数据
     */
    resetForm(data) {
      const form = data || (typeof crud.defaultForm === 'object' ? JSON.parse(JSON.stringify(crud.defaultForm)) : crud.defaultForm.apply(crud.findVM('form')));
      const crudFrom = crud.form;
      for (const key in form) {
        if (crudFrom.hasOwnProperty(key)) {
          crudFrom[key] = form[key];
        } else {
          Vue.set(crudFrom, key, form[key]);
        }
      }
    },
    /**
     * 重置数据状态
     */
    resetDataStatus() {
      const dataStatus = {};
      function resetStatus(datas) {
        datas.forEach(e => {
          dataStatus[crud.getDataId(e)] = {
            delete: 0,
            edit: 0,
          };
          if (e.children) {
            resetStatus(e.children);
          }
        });
      }
      resetStatus(crud.data);
      crud.dataStatus = dataStatus;
    },
    /**
     * 获取数据状态
     * @param {Number | String} id 数据项id
     */
    getDataStatus(id) {
      return crud.dataStatus[id];
    },
    /**
     * 用于树形表格多选, 选中所有
     * @param selection
     */
    selectAllChange(selection) {
      // 如果选中的数目与请求到的数目相同就选中子节点，否则就清空选中
      if (selection && selection.length === crud.data.length) {
        selection.forEach(val => {
          crud.selectChange(selection, val);
        });
      } else {
        crud.findVM('presenter').$refs.table.clearSelection();
      }
    },
    /**
     * 用于树形表格多选，单选的封装
     * @param selection
     * @param row
     */
    selectChange(selection, row) {
      // 如果selection中存在row代表是选中，否则是取消选中
      if (selection.find(val => { return crud.getDataId(val) === crud.getDataId(row); })) {
        if (row.children) {
          row.children.forEach(val => {
            crud.findVM('presenter').$refs.table.toggleRowSelection(val, true);
            selection.push(val);
            if (val.children) {
              crud.selectChange(selection, val);
            }
          });
        }
      } else {
        crud.toggleRowSelection(selection, row);
      }
    },
    /**
     * 切换选中状态
     * @param selection
     * @param data
     */
    toggleRowSelection(selection, data) {
      if (data.children) {
        data.children.forEach(val => {
          crud.findVM('presenter').$refs.table.toggleRowSelection(val, false);
          if (val.children) {
            crud.toggleRowSelection(selection, val);
          }
        });
      }
    },
    findVM(type) {
      return crud.vms.find(vm => vm && vm.type === type).vm;
    },
    notify(title, type = CRUD.NOTIFICATION_TYPE.INFO) {
      crud.vms[0].vm.$notify({
        title,
        type,
        duration: 2500,
      });
    },
    updateProp(name, value) {
      Vue.set(crud.props, name, value);
    },
    getDataId(data) {
      if (!data.hasOwnProperty(this.idField)) {
        console.error('[CRUD error]: no property [%s] in %o', this.idField, data);
      }
      return data[this.idField];
    },
    attchTable() {
      const {table} = this.findVM('presenter').$refs;
      const columns = [];
      table.columns.forEach((e, index) => {
        if (!e.property || e.type !== 'default') {
          return;
        }
        e.__index = index;
        columns.push({
          property: e.property,
          index,
          label: e.label,
          visible: true,
        });
      });
      this.updateProp('tableColumns', columns);
      this.updateProp('table', table);
    },
  };
  const crud = { ...data};
  // 可观测化
  Vue.observable(crud);
  // 附加方法
  Object.assign(crud, methods);
  // 记录初始默认的查询参数，后续重置查询时使用
  Object.assign(crud, {
    defaultQuery: JSON.parse(JSON.stringify(data.query)),
    // 预留4位存储：组件 主页、头部、分页、表单，调试查看也方便找
    vms: Array(4),
    /**
     * 注册组件实例
     * @param {String} type 类型
     * @param {*} vm 组件实例
     * @param {Number} index 该参数内部使用
     */
    registerVM(type, vm, index = -1) {
      const vmObj = {
        type,
        vm,
      };
      if (index < 0) {
        this.vms.push(vmObj);
        return;
      }
      if (index < 4) { // 内置预留vm数
        this.vms[index] = vmObj;
        return;
      }
      this.vms.length = Math.max(this.vms.length, index);
      this.vms.splice(index, 1, vmObj);
    },
    /**
     * 取消注册组件实例
     * @param {*} vm 组件实例
     */
    unregisterVM(type, vm) {
      for (let i = this.vms.length - 1; i >= 0; i--) {
        if (this.vms[i] === undefined) {
          continue;
        }
        if (this.vms[i].type === type && this.vms[i].vm === vm) {
          if (i < 4) { // 内置预留vm数
            this.vms[i] = undefined;
          } else {
            this.vms.splice(i, 1);
          }
          break;
        }
      }
    },
  });
  // 冻结处理，需要扩展数据的话，使用crud.updateProp(name, value)，以crud.props.name形式访问，这个是响应式的，可以做数据绑定
  Object.freeze(crud);
  return crud;
}

// hook VM
function callVmHook(crud, hook) {
  if (crud.debug) {
    console.log(`callVmHook: ${hook}`);
  }
  const tagHook = crud.tag ? `${hook}$${crud.tag}` : null;
  let ret = true;
  const nargs = [crud];
  for (let i = 2; i < arguments.length; ++i) {
    nargs.push(arguments[i]);
  }
  // 有些组件扮演了多个角色，调用钩子时，需要去重
  const vmSet = new Set();
  crud.vms.forEach(vm => vm && vmSet.add(vm.vm));
  vmSet.forEach(vm => {
    if (vm[hook]) {
      ret = vm[hook].apply(vm, nargs) !== false && ret;
    }
    if (tagHook && vm[tagHook]) {
      ret = vm[tagHook].apply(vm, nargs) !== false && ret;
    }
  });
  return ret;
}

// useExistKey 表示只根据现有 key 进行赋值，不存在的 key 不赋值
function mergeOptions(src, opts, useExistKey = true) {
  const optsRet = {
    ...src,
  };
  if (!useExistKey) {
    Object.assign(optsRet, opts)
  } else {
    for (const key in src) {
      if (opts.hasOwnProperty(key)) {
        if (isObject(optsRet[key])) {
          optsRet[key] = mergeOptions(optsRet[key], opts[key], !['query'].includes(key)); // query 对象无初始 key，需要无差别赋值
        } else {
          optsRet[key] = opts[key];
        }
      }
    }
  }
  return optsRet;
}

function isObject(variable) {
  return typeof variable === 'object' && variable !== null;
}

/**
 * 查找crud
 * @param {*} vm
 * @param {string} tag
 */
function lookupCrud(vm, tag) {
  tag = tag || vm.$attrs['crud-tag'] || 'default';
  // function lookupCrud(vm, tag) {
  if (vm.$crud) {
    const ret = vm.$crud[tag];
    if (ret) {
      return ret;
    }
  }
  return vm.$parent ? lookupCrud(vm.$parent, tag) : undefined;
}

/**
 * crud主页
 */
function presenter(crud) {
  if (crud) {
    console.warn('[CRUD warn]: ' + 'please use $options.cruds() { return CRUD(...) or [CRUD(...), ...] }');
  }
  return {
    data() {
      // 在data中返回crud，是为了将crud与当前实例关联，组件观测crud相关属性变化
      return {
        crud: this.crud,
      };
    },
    beforeCreate() {
      this.$crud = this.$crud || {};
      let cruds = this.$options.cruds instanceof Function ? this.$options.cruds() : crud;
      if (!(cruds instanceof Array)) {
        cruds = [cruds];
      }
      cruds.forEach(ele => {
        if (this.$crud[ele.tag]) {
          console.error(`${'[CRUD error]: ' + 'crud with tag ['}${  ele.tag  } is already exist`);
        }
        this.$crud[ele.tag] = ele;
        ele.registerVM('presenter', this, 0);
      });
      this.crud = this.$crud.defalut || cruds[0];
    },
    methods: {
      parseTime,
    },
    created() {
      for (const k in this.$crud) {
        if (this.$crud[k].queryOnPresenterCreated) {
          this.$crud[k].toQuery();
        }
      }
    },
    destroyed() {
      for (const k in this.$crud) {
        this.$crud[k].unregisterVM('presenter', this);
      }
    },
    mounted() {
      // 如果table未实例化（例如使用了v-if），请稍后在适当时机crud.attchTable刷新table信息
      if (this.$refs.table !== undefined) {
        this.crud.attchTable();
      }
    },
  };
}

/**
 * 头部
 */
function header() {
  return {
    data() {
      return {
        crud: this.crud,
        query: this.crud.query,
      };
    },
    beforeCreate() {
      this.crud = lookupCrud(this);
      this.crud.registerVM('header', this, 1);
    },
    destroyed() {
      this.crud.unregisterVM('header', this);
    },
  };
}

/**
 * 分页
 */
function pagination() {
  return {
    data() {
      return {
        crud: this.crud,
        page: this.crud.page,
      };
    },
    beforeCreate() {
      this.crud = lookupCrud(this);
      this.crud.registerVM('pagination', this, 2);
    },
    destroyed() {
      this.crud.unregisterVM('pagination', this);
    },
  };
}

/**
 * 表单
 */
function form(defaultForm) {
  return {
    data() {
      return {
        crud: this.crud,
        form: this.crud.form,
      };
    },
    beforeCreate() {
      this.crud = lookupCrud(this);
      this.crud.registerVM('form', this, 3);
    },
    created() {
      this.crud.defaultForm = defaultForm;
      this.crud.resetForm();
    },
    destroyed() {
      this.crud.unregisterVM('form', this);
    },
  };
}

/**
 * crud
 */
function crud(options = {}) {
  const defaultOptions = {
    type: undefined,
  };
  options = mergeOptions(defaultOptions, options);
  return {
    data() {
      return {
        crud: this.crud,
      };
    },
    beforeCreate() {
      this.crud = lookupCrud(this);
      this.crud.registerVM(options.type, this);
    },
    destroyed() {
      this.crud.unregisterVM(options.type, this);
    },
  };
}

/**
 * CRUD钩子
 */
CRUD.HOOK = {
  /** 刷新 - 之前 */
  beforeRefresh: 'beforeCrudRefresh',
  /** 刷新 - 之后 */
  afterRefresh: 'afterCrudRefresh',
  /** 删除 - 之前 */
  beforeDelete: 'beforeCrudDelete',
  /** 删除 - 之后 */
  afterDelete: 'afterCrudDelete',
  /** 删除取消 - 之前 */
  beforeDeleteCancel: 'beforeCrudDeleteCancel',
  /** 删除取消 - 之后 */
  afterDeleteCancel: 'afterCrudDeleteCancel',
  /** 新建 - 之前 */
  beforeToAdd: 'beforeCrudToAdd',
  /** 新建 - 之后 */
  afterToAdd: 'afterCrudToAdd',
  /** 编辑 - 之前 */
  beforeToEdit: 'beforeCrudToEdit',
  /** 编辑 - 之后 */
  afterToEdit: 'afterCrudToEdit',
  /** 开始 "新建/编辑" - 之前 */
  beforeToCU: 'beforeCrudToCU',
  /** 开始 "新建/编辑" - 之后 */
  afterToCU: 'afterCrudToCU',
  /** "新建/编辑" 验证 - 之前 */
  beforeValidateCU: 'beforeCrudValidateCU',
  /** "新建/编辑" 验证 - 之后 */
  afterValidateCU: 'afterCrudValidateCU',
  /** 添加取消 - 之前 */
  beforeAddCancel: 'beforeCrudAddCancel',
  /** 添加取消 - 之后 */
  afterAddCancel: 'afterCrudAddCancel',
  /** 编辑取消 - 之前 */
  beforeEditCancel: 'beforeCrudEditCancel',
  /** 编辑取消 - 之后 */
  afterEditCancel: 'afterCrudEditCancel',
  /** 提交 - 之前 */
  beforeSubmit: 'beforeCrudSubmitCU',
  /** 提交 - 之后 */
  afterSubmit: 'afterCrudSubmitCU',
  afterAddError: 'afterCrudAddError',
  afterEditError: 'afterCrudEditError',
};

/**
 * CRUD状态
 */
CRUD.STATUS = {
  NORMAL: 0,
  PREPARED: 1,
  PROCESSING: 2,
};

/**
 * CRUD通知类型
 */
CRUD.NOTIFICATION_TYPE = {
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info',
  ERROR: 'error',
};

export default CRUD;

export {
  presenter,
  header,
  form,
  pagination,
  crud,
};
