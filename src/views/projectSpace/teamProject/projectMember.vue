<template>
  <div class="project-member">
    <a-form :form="form" :label-col="{ span: 5 }" :wrapper-col="{ span: 12 }">
      <a-form-item label="项目管理员">
        <a-select
            mode="multiple"
            :allowClear="true"
            placeholder="请选择"
            show-search
            optionFilterProp="label"
            :value="managerSelect"
            @search="fetchUser"
            @change="handleChange"
            v-decorator="['managers', { rules: [{ required: true, message: '请选择项目管理员!' }] }]"
            :disabled="editingRole !== 'managers'"
        >
          <a-select-option v-for="(item, index) of managers" :key="index" :value="item.nickName" :label="item.nickName">
            {{ item.nickName }}
          </a-select-option>
        </a-select>
        <div class="edit-buttons">
          <a-button v-if="editingRole !== 'managers'" type="link" @click="startEditing('managers')">编辑</a-button>
          <span v-else>
            <a-button type="link" @click="saveChanges('managers')">保存</a-button>
            <a-button type="link" @click="cancelEditing('managers')">取消</a-button>
          </span>
        </div>
      </a-form-item>
      <a-form-item label="算法开发工程师">
        <a-select
            mode="multiple"
            :allowClear="true"
            placeholder="请选择"
            show-search
            optionFilterProp="label"
            :value="developerSelect"
            @search="fetchUser"
            @change="handleChange"
            v-decorator="['developers', { rules: [{ required: true, message: '请选择算法开发工程师!' }] }]"
            :disabled="editingRole !== 'developers'"
        >
          <a-select-option v-for="(item, index) of developers" :key="index" :value="item.nickName" :label="item.nickName">
            {{ item.nickName }}
          </a-select-option>
        </a-select>
        <div class="edit-buttons">
        <a-button v-if="editingRole !== 'developers'" type="link" @click="startEditing('developers')">编辑</a-button>
        <span v-else>
          <a-button type="link" @click="saveChanges('developers')">保存</a-button>
          <a-button type="link" @click="cancelEditing('developers')">取消</a-button>
        </span>
        </div>
      </a-form-item>
      <a-form-item label="模型训练工程师">
        <a-select
            mode="multiple"
            :allowClear="true"
            placeholder="请选择"
            show-search
            optionFilterProp="label"
            :value="trainerSelect"
            @search="fetchUser"
            @change="handleChange"
            v-decorator="['trainers', { rules: [{ required: true, message: '请选择模型训练工程师!' }] }]"
            :disabled="editingRole !== 'trainers'"
        >
          <a-select-option v-for="(item, index) of trainers" :key="index" :value="item.nickName" :label="item.nickName">
            {{ item.nickName }}
          </a-select-option>
        </a-select>
        <div class="edit-buttons">
        <a-button v-if="editingRole !== 'trainers'" type="link" @click="startEditing('trainers')">编辑</a-button>
        <span v-else>
          <a-button type="link" @click="saveChanges('trainers')">保存</a-button>
          <a-button type="link" @click="cancelEditing('trainers')">取消</a-button>
        </span>
        </div>
      </a-form-item>
    </a-form>
  </div>
</template>
<script>
// import axios from 'axios';
import { findByNickNameSearch } from "@/api/system/user";
import {getProjectById, updateProjectSpace} from "@/api/project";

export default {
  name: "projectMember",
  data() {
    return {
      groupedMembers: {}, // 分组后的成员数据
      form: this.$form.createForm(this, { name: 'project_member' }),
      managers: [],
      developers: [],
      trainers: [],
      expectedRoles: [
        'managers',
        'developers',
        'trainers',
      ], // 预期的角色名称
      managerSelect: [],
      developerSelect: [],
      trainerSelect: [],
      editingRole: '', // 当前正在编辑的角色
      id: 0,
    };
  },
  created() {
    // this.fetchProjectData();
  },
  mounted() {
    // 路由跳转携带参数
    this.id = this.$route.query.id;
    if (!this.id){
      // 全局变量项目变更
      this.id = this.currentProjectId
    }
    this.$store.commit('SET_CURRENT_PROJECT', this.id);
    this.fetchProjectData();
  },
  computed: {
    currentProjectId () {
      return this.$store.getters.currentProjectId
    }
  },
  watch:{
    currentProjectId(newVal, oldVal){
      this.id = newVal
      this.fetchProjectData();
    }
  },
  methods: {
    async fetchProjectData() {
      try {
        // const response = await axios.get('/projects/getProjectById', {
        //   params: { id: this.id }, // 默认传参 id=2
        // });
        const response = await getProjectById(this.id);
        const projectData = response;

        // 分组处理 projectMembersDtoList
        this.groupedMembers = this.groupByRole(projectData.projectMembersDtoList);

        // 确保所有预期的角色都在表单中
        this.expectedRoles.forEach(role => {
          if (!this.groupedMembers[role]) {
            this.groupedMembers[role] = [];
          }
          this.groupedMembers['managers'].map(member => member.nickName)
          this.managers.push(...this.groupedMembers[role])

        });
        this.managers.push(...this.groupedMembers['managers'])
        this.developers.push(...this.groupedMembers['developers'])
        this.trainers.push(...this.groupedMembers['trainers'])
        // 设置表单字段值
        this.setFormValues();
      } catch (error) {
        console.error('获取项目数据失败:', error);
      }
    },
    async fetchUser(value) {
      console.log('fetching user', value);
      const users = await findByNickNameSearch(value);
      // this.managers = users;
      // this.developers = users;
      // this.trainers = users;
      this.managers.push(...users);
      this.developers.push(...users);
      this.trainers.push(...users);
      console.log('this.managers', this.managers);
    },
    handleChange(value) {
      console.log('value', value);
      if (this.editingRole === 'managers') {
        this.managerSelect = value;
      } else if (this.editingRole === 'developers') {
        this.developerSelect = value;
      } else if (this.editingRole === 'trainers') {
        this.trainerSelect = value;
      }
    },
    groupByRole(members) {
      return members.reduce((acc, member) => {
        if (!acc[member.memberRole]) {
          acc[member.memberRole] = [];
        }
        acc[member.memberRole].push(member);
        return acc;
      }, {});
    },
    setFormValues() {
      this.form.setFieldsValue({
        managers: this.groupedMembers['managers'].map(member => member.nickName),
        developers: this.groupedMembers['developers'].map(member => member.nickName),
        trainers: this.groupedMembers['trainers'].map(member => member.nickName),
      });
      this.managerSelect = this.groupedMembers['managers'].map(member => member.nickName);
      this.developerSelect = this.groupedMembers['developers'].map(member => member.nickName);
      this.trainerSelect = this.groupedMembers['trainers'].map(member => member.nickName);
    },
    filterOption(input, option) {
      return option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0;
    },
    startEditing(role) {
      this.editingRole = role;
    },
    cancelEditing(role) {
      // 这里可以添加取消逻辑
      this.editingRole = '';
      this.setFormValues(); // 重置表单值
    },
    async saveChanges(roleName) {
      try {
        const formValues = this.form.getFieldsValue();
        const projectMembersParamList = [];

        // 构建 projectMembersParamList
        this.expectedRoles.forEach(roleName => {
          const roleUsers = formValues[roleName.toLowerCase()];
          if (roleUsers && roleUsers.length > 0) {
            roleUsers.forEach(nickName => {
              const user = this.managers.find(user => user.nickName === nickName) ||
                  this.developers.find(user => user.nickName === nickName) ||
                  this.trainers.find(user => user.nickName === nickName);
              if (user) {
                projectMembersParamList.push({
                  projectId: 2, // 假设项目ID为2
                  memberName: user.username || user.memberName, // 使用userData中的username
                  nickName: user.nickName,
                  memberRole: roleName,
                  email: user.email || '',
                  phone: user.phone || '',
                });
              }
            });
          }
        });

        // 构建 ProjectsEditParam 对象
        const projectsEditParam = {
          id: this.id,
          projectMembersParamList: projectMembersParamList,
        };

        // 调用接口
        // const response = await axios.post('/projects/updateProjectSpace', projectsEditParam);
        const response = await updateProjectSpace(projectsEditParam)
        console.log('更新项目成功:', response);

        // 重置编辑状态
        this.editingRole = '';
      } catch (error) {
        console.error('更新项目失败:', error);
      }
    },
  },
};
</script>

<style lang="less" scoped>


.edit-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-left: 10px;
  width: auto;
}

</style>
