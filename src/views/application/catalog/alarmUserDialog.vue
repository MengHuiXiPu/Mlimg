<template>
  <div>
    <!--工具栏-->
<!--    <div class="head-container">-->
<!--      <a-header-->
<!--          :showReload="false"-->
<!--          :showNew="false"-->
<!--          :placeholderText="'输入用户名或邮箱搜索'"-->
<!--          @search="handSearch"-->
<!--      />-->
<!--    </div>-->
    <a-header
        :showReload="false"
        :showNew="false"
        :placeholderText="'输入用户名或邮箱搜索'"
        @search="handSearch"
    />
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
    </el-table>
    <pagination />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import CRUD, { presenter, header, crud } from '@crud/crud';
import rrOperation from '@crud/RR.operation';
import cdOperation from '@crud/CD.operation';
import udOperation from '@crud/UD.operation';
import pagination from '@crud/Pagination';
import { hasPermission } from '@/utils/store'
import crudUser from '@/api/system/user';
import { getAll } from '@/api/system/role';
import DropdownHeader from '@/components/DropdownHeader';
import datePickerMixin from '@/mixins/datePickerMixin';
import UserResourceMonitor from '@/components/UserResourceMonitor';
import { parseTime } from '@/utils/utils.js'

const ADMIN_USER_ID = 1; // 系统管理员ID

export default {
  name: 'AlarmUserDialog',
  components: {
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
    });
  },
  mixins: [presenter(), header(), crud(), datePickerMixin],
  // 数据字典
  dicts: ['user_status'],
  data() {
    return {
      dateOption: [
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
    this.$nextTick(() => {
      console.log(this.crud)
    })
  },
  methods: {
    parseTime,
    handSearch (value) {
      this.crud.query.blurry = value
      this.crud.toQuery()
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

    // 获取弹窗内角色数据
    getRoles() {
      getAll()
          .then((res) => {
            this.roleOptions = res;
          })
          .catch(() => {});
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

  },
};
</script>
<style lang="less">
.inputNumber {
  input {
    padding-right: 0;
  }
}
//.el-table {
//  border-radius: 16px;
//  .el-table__header {
//    thead {
//      color: #000;
//    }
//    th {
//      background: #d7d7d7;
//      &.el-table__cell {
//        padding: 16px 0;
//      }
//    }
//    .is-leaf {
//      background: #d7d7d7 !important;
//    }
//  }
//  .el-table__body-wrapper {
//    .el-table__cell {
//      padding: 7px  0;
//    }
//  }
//  &.authCode {
//    .el-table__header {
//      .el-table__cell {
//        padding: 11px 0;
//      }
//    }
//  }
//}
//.el-table__fixed-right {
//  .el-table__fixed-body-wrapper {
//    .el-table__cell {
//      padding: 7px  0;
//    }
//  }
//}
//.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
//  background: #f2f2f2;
//}
</style>
<style scoped lang="less">
</style>