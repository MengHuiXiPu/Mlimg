<template>
  <div>
    <!-- 面包屑导航区域 -->
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/roles' }">权限管理</el-breadcrumb-item>
      <el-breadcrumb-item>角色列表</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 卡片视图 -->
    <el-card>
      <!-- 添加角色按钮区域 -->
      <el-row>
        <el-col>
          <el-button type="primary" @click="addDialogVisible = true"
            >添加角色</el-button
          >
        </el-col>
      </el-row>

      <!-- 角色列表区域 -->
      <el-table :data="rolelist" border stripe>
        <!-- 展开列 -->
        <el-table-column type="expand">
          <template slot-scope="scope">
            <el-row
              :class="['bdbottom', i1 === 0 ? 'bdtop' : '', 'vcenter']"
              v-for="(item1, i1) in scope.row.children"
              :key="item1.id"
            >
              <!-- 渲染一级权限 -->
              <el-col :span="8">
                <el-tag
                  closable
                  @close="removeRightById(scope.row, item1.id)"
                  >{{ item1.auth_name }}</el-tag
                >
                <i class="el-icon-caret-right"></i>
              </el-col>
              <!-- 渲染二级 -->
              <el-col :span="16">
                <!-- 通过for循环嵌套渲染二级权限 -->
                    <el-tag
                      type="success"
                      v-for="(item2) in item1.children"
                      :key="item2.id"
                      closable
                      @close="removeRightById(scope.row, item2.id)"
                      >{{ item2.auth_name }}</el-tag>
              </el-col>
            </el-row>
            <!-- <pre>
                    {{ scope.row }}
                </pre
            > -->
          </template>
        </el-table-column>
        <!-- 索引列 -->
        <el-table-column label="#" type="index" align="center"></el-table-column>
        <el-table-column label="角色名称" prop="role_name" align="center"></el-table-column>
        <el-table-column label="角色描述" prop="role_desc" align="center"></el-table-column>
        <el-table-column label="操作" width="300px" align="center">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="primary"
              icon="el-icon-edit"
              @click="showDialog(scope.row.id)"
              >编辑</el-button
            >
            <el-button
              size="mini"
              type="danger"
              icon="el-icon-delete"
              @click="deleteRoles(scope.row.id)"
              >删除</el-button
            >
            <el-button
              size="mini"
              type="warning"
              icon="el-icon-setting"
              @click="showSetRightDialog(scope.row)"
              >分配权限</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>
      <!-- 新增角色区域 -->
      <el-dialog
        title="新增角色"
        :visible.sync="addDialogVisible"
        width="50%"
        @close="addDialogClosed"
      >
        <el-form
          :model="addForm"
          :rules="addFormRules"
          ref="addFormRef"
          label-width="100px"
        >
          <el-form-item label="角色名称" prop="roleName">
            <el-input v-model="addForm.roleName"></el-input>
          </el-form-item>
          <el-form-item label="角色描述" prop="roleDesc">
            <el-input v-model="addForm.roleDesc"></el-input>
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="addDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="addRoles()">确 定</el-button>
        </span>
      </el-dialog>

      <!-- 编辑角色信息区域 -->
      <el-dialog title="编辑信息" :visible.sync="editDialogVisible" width="50%">
        <el-form
          :model="editForm"
          :rules="editFormRules"
          ref="editFormRef"
          label-width="100px"
        >
          <el-form-item label="角色名称" prop="role_name">
            <el-input v-model="editForm.role_name"></el-input>
          </el-form-item>
          <el-form-item label="角色描述" prop="role_desc">
            <el-input v-model="editForm.role_desc"></el-input>
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="editDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="editRoles()">确 定</el-button>
        </span>
      </el-dialog>

      <!-- 分配权限对话框 -->
      <el-dialog
        title="分配权限"
        :visible.sync="setRightDialogVisible"
        width="50%"
        @close="setRightDialogClosed"
      >
        <!-- 树形控件 -->
        <el-tree
          default-expand-all
          show-checkbox
          :data="rightlist"
          :props="treeProps"
          node-key="id"
          :default-checked-keys="defKeys"
          ref="treeRef"
        ></el-tree>
        <span slot="footer" class="dialog-footer">
          <el-button @click="setRightDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="allotRights">确 定</el-button>
        </span>
      </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      //所有角色列表数据
      rolelist: [],
      // 编辑对话框显示状态
      editDialogVisible: false,
      // 新增角色对话框显示状态
      addDialogVisible: false,
      // 控制分配权限对话框的显示与隐藏
      setRightDialogVisible: false,
      // 查询到的用户信息对象
      editForm: {},
      // 新增角色信息
      addForm: {
        roleName: "",
        roleDesc: "",
      },
      // 所有权限数据
      rightlist: [],
      // 树形控件的属性绑定对象
      treeProps: {
        label: "auth_name",
        children: "children",
      },
      //默认选中的节点ID值数组
      defKeys: [],
      // 当前即将分配权限的角色id
      roleId: "",
      // 新增角色信息验证规则
      addFormRules: {
        roleName: [
          { required: true, message: "请输入角色名称", trigger: "blur" },
          {
            min: 2,
            max: 10,
            message: "长度在 2 到 10 个字符",
            trigger: "blur",
          },
        ],
        roleDesc: [
        //   { required: true, message: "请输入角色名称", trigger: "blur" },
          {
            min: 2,
            max: 20,
            message: "长度在 2 到 20 个字符",
            trigger: "blur",
          },
        ],
      },
      // 修改角色信息验证规则
      editFormRules: {
        role_name: [
          { required: true, message: "请输入角色名称", trigger: "blur" },
          {
            min: 2,
            max: 10,
            message: "长度在 2 到 10 个字符",
            trigger: "blur",
          },
        ],
        role_desc: [
        //   { required: true, message: "请输入角色名称", trigger: "blur" },
          {
            min: 2,
            max: 20,
            message: "长度在 2 到 20 个字符",
            trigger: "blur",
          },
        ],
      },
    };
  },
  created() {
    this.getRolesList();
  },
  methods: {
    //获取所有角色的列表
    async getRolesList() {
      const { data: res } = await this.$http.get("right/roles");
      if (res.meta.status !== 200) {
        return this.$message.error("获取角色列表失败！");
      }
      this.rolelist = res.data;
      console.log(this.rolelist);
    },
    async showDialog(id) {
      const { data: res } = await this.$http.get("right/roles/" + id);
      if (res.meta.status !== 200)
        return this.$message.error("获取角色信息失败");
      console.log(res);
      this.editForm = res.data;
      this.editDialogVisible = true;
    },
    //
    // 修改角色信息
    editRoles() {
      this.$refs.editFormRef.validate(async (valid) => {
        if (!valid) return; // 没通过校验
        // 通过验证发起修改角色信息的网络请求
        const { data: res } = await this.$http.put(
          "right/roles/" + this.editForm.id,
          { roleName: this.editForm.role_name, roleDesc: this.editForm.role_desc }
        );
        console.log(res);
        if (res.meta.status !== 200) return this.$message.error(res.meta.msg);
        this.$message.success("编辑成功");
        this.editDialogVisible = false;
        this.getRolesList();
      });
    },
    // 删除角色
    deleteRoles(id) {
      this.$confirm("此操作将永久删除该角色, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          const { data: res } = await this.$http.delete("right/roles/" + id);
          if (res.meta.status !== 200) return this.$message.error(res.meta.msg);
          this.$message.success("删除成功！");
          this.getRolesList();
          this.$message({
            type: "success",
            message: "删除成功!",
          });
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除",
          });
        });
    },
    //新增角色
    addRoles() {
      this.$refs.addFormRef.validate(async (valid) => {
        if (!valid) return ;
        const { data: res } = await this.$http.post("right/roles", this.addForm);
        console.log(res);
        if (res.meta.status !== 201) return this.$message.error(res.meta.msg);
        this.addDialogVisible = false;
        this.$message.success("创建成功！");
        this.getRolesList();
      });
    },
    //弹窗关闭时清空弹窗输入框的内容
    addDialogClosed() {
      this.$refs.addFormRef.resetFields();
    },
    // 根据Id删除对应的权限
    async removeRightById(role, rightId) {
      //弹框提示用户是否要删除
      const confirmResult = await this.$confirm(
        "此操作将永久删除该权限, 是否继续?",
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      ).catch((err) => err);

      if (confirmResult !== "confirm") {
        return this.$message.info("取消了删除！");
      }

      const { data: res } = await this.$http.delete(
        `right/roles/${role.id}/rights/${rightId}`
      );
      if (res.meta.status !== 200) {
        return this.$message.error(res.meta.msg);
      }
      //   this.getRolesList(); 不建议这个方法，就导致整个表格数据重新渲染
      role.children = res.data;
    },
    // 展示分配权限的对话框
    async showSetRightDialog(role) {
      this.roleId = role.id;
      // 获取所有权限的数据
      const { data: res } = await this.$http.get("right/tree");
      if (res.meta.status !== 200)
        return this.$message.error(res.meta.msg);
      // 获取到的权限数据保存
      this.rightlist = res.data;
      console.log(this.rightlist);
      // 递归获取二级节点的ID
      this.getLeafKeys(role, this.defKeys);
      this.setRightDialogVisible = true;
    },
    // 通过递归的形式，获取角色下所有二级权限的id，并保存到defKeys数组中
    getLeafKeys(node, arr) {
      // 如果当前node节点不包含children属性，则是二级节点
      if (!node.children) {
        return arr.push(node.id);
      }
      node.children.forEach((item) => this.getLeafKeys(item, arr));
    },
    // 监听分配权限对话框的关闭事件
    setRightDialogClosed() {
      this.defKeys = [];
    },
    // 点击为角色分配权限
    async allotRights() {
      // ...  ES6语法
      // 展开运算符
      const keys = [
        ...this.$refs.treeRef.getCheckedKeys(),
        ...this.$refs.treeRef.getHalfCheckedNodes(),
      ];
      const idStr = keys.join(",");
      const { data: res } = await this.$http.post(
        `right/roles/${this.roleId}/rights`,
        { rids: idStr }
      );
      if(res.meta.status !== 200) return this.$message.error(res.meta.msg);
      this.$message.success('分配权限成功！');
      console.log(res);
      this.getRolesList();
      this.setRightDialogVisible = false;
    },
  },
};
</script>

<style lang="less" scoped>
.el-tag {
  margin: 7px;
}
.bdtop {
  border-top: 1px solid #eee;
}
.bdbottom {
  border-bottom: 1px solid #eee;
}
.vcenter {
  display: flex;
  align-items: center;
}
</style>