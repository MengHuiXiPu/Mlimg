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

<template>
  <div class="app-container">
    <!--工具栏-->
    <div class="toolbar space-between">
      <el-form :inline="true"  size="small" ref="refSearchForm" @submit.native.prevent>
        <el-form-item label="名称" prop="name">
          <el-input v-model="query.blurry" placeholder="请输入" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="$event=>handSearch($event)">查询</el-button>
          <el-button type="primary" plain @click="handSearch($event, true)">重置</el-button>
        </el-form-item>
      </el-form>
      <div style="margin-bottom: 18px;">
        <el-button type="primary" @click="crud.toAdd()" icon="el-icon-plus">新建用户</el-button>
        <el-button type="danger" @click="handdelete" icon="el-icon-delete" :disabled="crud.selections.length == 0" >删除</el-button>
      </div>
    </div>
      <!-- <cdOperation>
        <span slot="right">
          <el-input
            v-model="query.blurry"
            clearable
            placeholder="输入用户名或邮箱搜索"
            style="width: 200px;"
            class="filter-item"
            @change="crud.toQuery"
          />
          <el-date-picker
            v-model="query.createTime"
            :default-time="['00:00:00', '23:59:59']"
            type="daterange"
            range-separator=":"
            class="date-item"
            value-format="timestamp"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :picker-options="pickerOptions"
            @change="crud.toQuery"
          />
          <rrOperation />
        </span>
      </cdOperation> -->
    <!-- </div> -->
    <!--表单渲染-->
    <BaseModal
      style="min-height: 600px"
      :before-close="crud.cancelCU"
      :visible="crud.status.cu > 0"
      :title="crud.status.title"
      :loading="crud.status.cu === 2"
      width="600px"
      @cancel="crud.cancelCU"
      @ok="submit"
    >
      <el-form ref="form" :inline="true" :model="form" :rules="rules" label-width="83px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickName">
          <el-input v-model="form.nickName" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="性别" prop="sex">
          <el-radio-group v-model="form.sex" style="width: 185px;">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select
            v-model="form.roleId"
            :disabled="isDisabled(form.id)"
            placeholder="请选择"
            class="filter-item"
            style="width: 185px;"
            filterable
          >
            <el-option
              v-for="item in roleOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="enabled">
          <el-radio-group
            v-model="form.enabled"
            :disabled="isDisabled(form.id)"
            style="width: 185px;"
          >
            <el-radio v-for="item in dict.user_status" :key="item.id" :label="item.value">{{
              item.label
            }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <br>
        <el-form-item label="有效期">
          <div style="display: flex; align-items: center; height: 40px;">
            <el-radio-group v-model="dateRadio" style="width: 185px;">
                <el-radio :label="-1">永久有效</el-radio>
                <el-radio :label="0">自定义</el-radio>
            </el-radio-group>
            <div style="display: flex" v-if="dateRadio !== -1">
              <el-input v-model="formdate" class="inputNumber" type="number" placeholder="请输入有效期天数"/>
              <span style="margin-left: 8px;">天</span>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="备注" prop="remark" style="margin-bottom: 0;">
          <el-input v-model="form.remark" maxlength="50" show-word-limit />
        </el-form-item>
      </el-form>
    </BaseModal>
    <!--表格渲染-->
    <el-table
      ref="table"
      stripe
      max-height="630"
      v-loading="crud.loading"
      :data="crud.data"
      highlight-current-row
      @selection-change="crud.selectionChangeHandler"
    >
      <el-table-column align="" :selectable="checkboxT" type="selection"  />
      <el-table-column align="" show-overflow-tooltip prop="username" label="用户名" />
      <el-table-column align="" show-overflow-tooltip prop="nickName" label="昵称" />
      <el-table-column align="" prop="sex" label="性别" />
      <el-table-column align="" show-overflow-tooltip prop="phone" label="手机号" />
      <el-table-column align="" width="200" prop="email" label="邮箱" />
      <el-table-column align="" show-overflow-tooltip prop="roles">
        <template #header>
          <dropdown-header
            title="角色"
            :list="userRoleList"
            :filtered="Boolean(crud.query.roleId)"
            @command="filterByRoles"
          />
        </template>
        <template slot-scope="scope">
          <span>{{ getUserRoles(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column align="" prop="enabled" width="80">
        <template #header>
          <dropdown-header
            title="状态"
            :list="userStatusList"
            :filtered="Boolean(crud.query.enabled)"
            @command="filterByStatus"
          />
        </template>
        <template slot-scope="scope">
          <el-tag :type="scope.row.enabled ? '' : 'info'" effect="plain"
            >{{ dict.label.user_status[scope.row.enabled.toString()] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column align="" show-overflow-tooltip prop="remark" label="备注" />
      <el-table-column align="" show-overflow-tooltip prop="createTime" label="创建时间" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column align="right" label="操作" width="160" fixed="right">
        <template slot-scope="scope">
          <udOperation
            :data="scope.row"
            :show-edit="hasPermission('system:user:edit')"
            :show-delete="hasPermission('system:user:delete')"
            :disabled-edit="isDisabledEdit(scope.row.id)"
            :disabled-dle="isDisabled(scope.row.id)"
            :showResetPwd = "hasPermission('system:user:edit')"
          />
          <el-button
            v-show="false"
            v-if="hasPermission('system:user:configEdit')"
            type="text"
            class="ml-10"
            @click="doEditUserConfig(scope.row)"
            >修改配置</el-button
          >
          <el-button
            v-show="false"
            v-if="hasPermission('system:user:resourceInfo')"
            type="text"
            class="ml-10"
            @click="doCheckUserResourceInfo(scope.row.id)"
            >资源监控</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <!--分页组件-->
    <!-- <el-pagination
      class="pagination"
      background
      page-size="10"
      layout="total, prev, pager, next"
      :total="crud.page.total">
    </el-pagination> -->
    <pagination />
    <!-- 修改用户配置弹窗 -->
    <BaseModal
      :visible.sync="userConfigVisible"
      title="修改用户配置"
      :loading="userConfigLoading"
      width="600px"
      @ok="onUserConfigSubmit"
      @cancel="userConfigVisible = false"
      @close="onUserConfigClose"
    >
      <el-form
        ref="userConfigForm"
        :model="userConfigForm"
        :rules="userConfigRules"
        label-width="180px"
        @submit.native.prevent
      >
        <el-form-item prop="notebookDelayDeleteTime" label="Notebook 自动关闭时间">
          <el-input-number
            v-model="userConfigForm.notebookDelayDeleteTime"
            :min="1"
            :max="24"
            step-strictly
          />&nbsp;小时
          <el-tooltip effect="dark" content="Notebook 自动关闭时间限制为 1-24 小时" placement="top">
            <i class="el-icon-warning-outline primary f18 v-text-top" />
          </el-tooltip>
        </el-form-item>
        <el-form-item prop="cpuLimit" label="CPU 资源限制">
          <el-input-number v-model="userConfigForm.cpuLimit" :min="1" step-strictly />&nbsp;核
        </el-form-item>
        <el-form-item prop="gpuLimit" label="GPU 资源限制">
          <el-input-number v-model="userConfigForm.gpuLimit" :min="1" step-strictly />&nbsp;卡
        </el-form-item>
        <el-form-item prop="memoryLimit" label="内存资源限制">
          <el-input-number v-model="userConfigForm.memoryLimit" :min="1" step-strictly />&nbsp;Gi
        </el-form-item>
      </el-form>
    </BaseModal>
    <!-- 用户资源监控弹窗 -->
    <BaseModal
      :visible.sync="userResourceInfoVisible"
      title="用户资源监控"
      width="1200px"
      :show-ok="false"
      cancel-text="关闭"
      @cancel="userResourceInfoVisible = false"
      @close="onUserResourceInfoClose"
    >
      <UserResourceMonitor
        v-loading="userResourceInfoLoading"
        :resource-info="userResourceInfo"
        type="system"
      />
    </BaseModal>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { isNil } from 'lodash';

import CRUD, { presenter, header, form, crud } from '@crud/crud';
import rrOperation from '@crud/RR.operation';
import cdOperation from '@crud/CD.operation';
import udOperation from '@crud/UD.operation';
import pagination from '@crud/Pagination';
import { validateName, validateAccount } from '@/utils';
import { hasPermission } from '@/utils/store'
import crudUser, { getUserConfig, submitUserConfig } from '@/api/system/user';
import { getAll } from '@/api/system/role';
import { getUserResourceInfo } from '@/api/system/pod';
import BaseModal from '@/components/BaseModal';
import DropdownHeader from '@/components/DropdownHeader';
import datePickerMixin from '@/mixins/datePickerMixin';
import UserResourceMonitor from '@/components/UserResourceMonitor';
import { parseTime } from '@/utils/utils.js'

const ADMIN_USER_ID = 1; // 系统管理员ID

const defaultForm = {
  id: null,
  username: null,
  nickName: null,
  sex: null,
  email: null,
  remark: null,
  enabled: null,
  phone: null,
  roles: [],
  roleId: '',
  expirationDays: -1,
};

// 用户配置默认值
const defaultUserConfigForm = {
  userId: null,
  notebookDelayDeleteTime: null,
  cpuLimit: null,
  memoryLimit: null,
  gpuLimit: null,
};

export default {
  name: 'User',
  components: {
    BaseModal,
    cdOperation,
    rrOperation,
    udOperation,
    pagination,
    DropdownHeader,
    UserResourceMonitor,
  },
  cruds() {
    return CRUD({
      title: '用户',
      crudMethod: { ...crudUser },
      optShow: {
        add: hasPermission('system:user:create'),
        del: hasPermission('system:user:delete'),
      },
    });
  },
  mixins: [presenter(), header(), form(defaultForm), crud(), datePickerMixin],
  // 数据字典
  dicts: ['user_status'],
  data() {
    return {
      formdate: '',
      dateRadio: -1,
      dateOption: [
        // {
        //   name: '一天',
        //   value: 'day'
        // },
        // {
        //   name: '一周',
        //   value: 'week'
        // },
        // {
        //   name: '一个月',
        //   value: 'month'
        // },
        // {
        //   name: '一年',
        //   value: 'year'
        // },
        {
          name: '永久有效',
          value: 'never'
        },
        {
          name: '自定义',
          value: 'custom'
        },
      ],
      height: `${document.documentElement.clientHeight - 180}px;`,
      roleOptions: [],
      defaultProps: { children: 'children', label: 'name' },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { validator: validateAccount, trigger: 'blur' },
        ],
        nickName: [
          { required: true, message: '请输入用户昵称', trigger: 'blur' },
          { validator: validateName, trigger: 'blur' },
        ],
        email: [
          { required: true, message: '请输入邮箱地址', trigger: 'blur' },
          {
            pattern: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
            message: '请输入正确的邮箱地址',
            trigger: ['blur', 'change'],
          },
        ],
        phone: [
          { required: true, message: '请输入手机号码', trigger: 'blur' },
          {
            pattern: /^1\d{10}$/,
            message: '请输入正确的11位手机号码',
            trigger: ['blur', 'change'],
          },
        ],
        sex: [{ required: true, message: '请选择性别', trigger: 'change' }],
        enabled: [{ required: true, message: '请选择状态', trigger: 'change' }],
        roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
        date: [{ required: true, message: '请输入有效期', trigger: 'change' }],
      },

      // 用户配置
      userConfigVisible: false,
      userConfigLoading: false,
      userConfigForm: { ...defaultUserConfigForm },
      userConfigRules: {
        notebookDelayDeleteTime: [
          { required: true, message: '请输入 Notebook 自动关闭时间', trigger: 'change' },
        ],
        cpuLimit: [{ required: true, message: '请输入 CPU 资源限额', trigger: 'change' }],
        gpuLimit: [{ required: true, message: '请输入 GPU 资源限额', trigger: 'change' }],
        memoryLimit: [{ required: true, message: '请输入内存资源限额', trigger: 'change' }],
      },

      // 用户资源监控
      userResourceInfo: null,
      userResourceInfoVisible: false,
      userResourceInfoLoading: false,
    };
  },
  computed: {
    ...mapGetters(['user']),
    userStatusList() {
      return [{ label: '全部', value: null }].concat(this.dict.user_status);
    },
    userRoleList() {
      const arr = [{ label: '全部', value: null }];
      this.roleOptions.forEach((item) => {
        arr.push({ label: item.name, value: item.id });
      });
      return arr;
    },
  },
  created() {
    this.$nextTick(() => {
      this.getRoles();
      this.crud.msg.add = '新增成功，默认密码：123456';
    });
  },
  mounted() {
    const that = this;
    window.onresize = function temp() {
      that.height = `${document.documentElement.clientHeight - 180}px;`;
    };
  },
  methods: {
    hasPermission,
    parseTime,
    handSearch (event, reset) {
      // this.crud.query.blurry = value
      if(reset) {
        this.crud.query.blurry = ''
      }
      this.crud.toQuery()
    },
    submit () {
      if (this.dateRadio === -1) {
        this.crud.form.expirationDays = -1
        // console.log("AAAAAAAthis.crud:  ", this.crud)
        // this.crud.submitCU().then((res)=>{
        //   console.log(res,'dateRadio=-1')
        // })
        this.crud.submitCU()
      } else {
        if (!this.formdate || parseInt(Number(this.formdate)) <= 0) {
          this.$message.warning("有效期天数不能为空！")
          return
        }
        this.crud.form.expirationDays = this.formdate
        // this.crud.submitCU().then((res)=>{
        // })
        this.crud.submitCU()
      }
    },
    handdelete () {
      this.$confirmEle(`确认删除选中的${this.crud.selections.length}条数据?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        this.crud.delAllLoading = true;
        this.crud.doDelete(this.crud.selections);
      }).catch(() => {
      });
    },
    handCreate () {
      this.dateRadio = -1
      this.crud.toAdd();
    },
    [CRUD.HOOK.afterAddError]() {
      this.afterErrorMethod();
    },
    [CRUD.HOOK.afterEditError]() {
      this.afterErrorMethod();
    },
    afterErrorMethod() {
      // 恢复select
      this.crud.form.roleId = this.crud.form.roles[0]?.id || '';
    },
    // 新增与编辑前做的操作
    [CRUD.HOOK.afterToCU]() {
      this.form.enabled = this.form.enabled != null ? this.form.enabled.toString() : null;
      this.crud.form.roleId = this.crud.form.roles[0]?.id || '';
      this.formdate = 30
      if (this.crud.form.expirationDays === -1) {
        this.dateRadio = -1
      } else {
        this.dateRadio = 0
        this.formdate = this.crud.form.expirationDays
      }
    },
    // 表单验证后的操作
    [CRUD.HOOK.afterValidateCU]() {
      this.crud.form.roles = [{ id: this.crud.form.roleId }];
      // delete this.crud.form.roleId; // 删除不需要提交的字段
      return true;
    },
    // 获取弹窗内角色数据
    getRoles() {
      getAll()
        .then((res) => {
          this.roleOptions = res;
        })
        .catch(() => {});
    },
    isDisabledEdit(id) {
      return id === ADMIN_USER_ID;
    },
    isDisabled(id) {
      return id === this.user.id || id === ADMIN_USER_ID;
    },
    checkboxT(row) {
      return !this.isDisabled(row.id);
    },
    getUserRoles(row) {
      const roles = row.roles || [];
      const names = roles.map((role) => role.name);
      return names.join('<br/>') || '-';
    },
    filterByStatus(status) {
      this.crud.query.enabled = status;
      this.crud.refresh();
    },
    filterByRoles(id) {
      this.crud.query.roleId = id;
      this.crud.refresh();
    },

    async doEditUserConfig({ id }) {
      const userConfig = await getUserConfig(id);
      // 然后根据用户配置对象生成用户配置表单值
      Object.keys(defaultUserConfigForm).forEach((key) => {
        this.userConfigForm[key] = isNil(userConfig[key])
          ? defaultUserConfigForm[key]
          : userConfig[key];
      });
      this.userConfigVisible = true;
    },
    onUserConfigSubmit() {
      this.$refs.userConfigForm.validate((valid) => {
        if (valid) {
          this.userConfigLoading = true;
          submitUserConfig({
            ...this.userConfigForm,
          })
            .then(() => {
              this.userConfigVisible = false;
            })
            .finally(() => {
              this.userConfigLoading = false;
            });
        }
      });
    },
    onUserConfigClose() {
      Object.assign(this.userConfigForm, defaultUserConfigForm);
    },

    async doCheckUserResourceInfo(userId) {
      this.userResourceInfoVisible = true;
      this.userResourceInfoLoading = true;
      this.userResourceInfo = await getUserResourceInfo(userId).finally(() => {
        this.userResourceInfoLoading = false;
      });
    },
    onUserResourceInfoClose() {
      this.userResourceInfo = null;
    },
  },
};
</script>
<style lang="less">
.inputNumber {
  input {
    padding-right: 0;
  }
}
.el-table {
  border-radius: 4px;
  .el-table__header {
    thead {
      color: #000;
    }
    th {
        background: #d7d7d7;
        &.el-table__cell {
          padding: 8px 0;
        }
    }
    .is-leaf {
        background: #d7d7d7 !important;
    }
  }
  .el-table__body-wrapper {
    .el-table__cell {
      padding: 7px  0;
    }
  }
  &.authCode {
    .el-table__header {
      .el-table__cell {
          padding: 11px 0;
        }
    }
  }
}
.el-table__fixed-right {
  .el-table__fixed-body-wrapper {
    .el-table__cell {
      padding: 7px  0;
    }
  }
}
.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
  background: #f2f2f2;
}
</style>
<style scoped lang="less">
</style>