<template>
  <div class="project-info">
<!--    <a-input v-model="currentProjectId"/>-->
    <a-spin :spinning="loading">
      <a-form :form="form" :label-col="{ span: 5 }" :wrapper-col="{ span: 12 }">
        <a-form-item label="项目名称">
          <div class="form-item-content">
            <a-input
                placeholder="请输入"
                v-decorator="['projectName', { rules: [{ required: true, message: '请输入项目名称!' }, { max: 255, message: '项目名称不能超过255个字符!' }] }]"
                :disabled="!editableState.projectName"
                :class="{'editable-text': editableState.projectName, 'non-editable-text': !editableState.projectName}"
                :maxLength="255"
                @input="updateRemainingChars('projectName')"
                style="width: 100%;"
            />
            <div class="edit-buttons">
              <a-button v-if="!editableState.projectName" type="link" @click="toggleEdit('projectName')">编辑</a-button>
              <a-button v-else type="link" @click="saveEdit('projectName')">保存</a-button>
              <a-button v-if="editableState.projectName" type="link" @click="cancelEdit('projectName')">取消</a-button>
            </div>
          </div>
          <div class="char-count">
            {{ remainingChars.projectName }} / 255
          </div>
        </a-form-item>
        <a-form-item label="项目归属地">
          <div class="form-item-content">
            <a-row style="width: 100%;">
              <a-col :span="5">
                <a-select
                    placeholder="请选择"
                    v-decorator="['foundation', { rules: [{ required: true, message: '请选择项目归属地!' }] }]"
                    :disabled="!editableState.foundation"
                    :class="{'editable-text': editableState.foundation, 'non-editable-text': !editableState.foundation}"
                >
                  <a-select-option value="shenzhen">
                    深圳
                  </a-select-option>
                  <a-select-option value="guangzhou">
                    广州
                  </a-select-option>
                  <a-select-option value="wuhan">
                    武汉
                  </a-select-option>
                  <a-select-option value="huizhou">
                    惠州
                  </a-select-option>
                  <a-select-option value="suzhou">
                    苏州
                  </a-select-option>
                </a-select>
              </a-col>
              <a-col :span="2" style="text-align: center">
                <span>-</span>
              </a-col>
              <a-col :span="17">
                <a-select
                    mode="multiple"
                    placeholder="请选择"
                    v-decorator="['factory', { rules: [{ required: true, message: '请选择厂区!' }] }]"
                    :disabled="!editableState.foundation"
                    :class="{'editable-text': editableState.foundation, 'non-editable-text': !editableState.foundation}"
                >
                  <a-select-option v-for="factory in factoryOptions" :key="factory" :value="factory">
                    {{ factory }}
                  </a-select-option>
                </a-select>
              </a-col>
            </a-row>
            <div class="edit-buttons">
              <a-button v-if="!editableState.foundation" type="link" @click="toggleEdit('foundation')">编辑</a-button>
              <a-button v-else type="link" @click="saveEdit('foundation')">保存</a-button>
              <a-button v-if="editableState.foundation" type="link" @click="cancelEdit('foundation')">取消</a-button>
            </div>
          </div>
        </a-form-item>
        <a-form-item label="项目描述">
          <div class="form-item-content">
            <a-textarea
                placeholder="请输入"
                :auto-size="{ minRows: 5, maxRows: 999 }"
                v-decorator="['projectDescription', { rules: [{ required: true, message: '请输入项目描述!' }] }]"
                :disabled="!editableState.projectDescription"
                :class="{'editable-text': editableState.projectDescription, 'non-editable-text': !editableState.projectDescription}"
                @input="updateRemainingChars('projectDescription')"
                style="width: 100%;"
            />
            <div class="edit-buttons">
              <a-button v-if="!editableState.projectDescription" type="link" @click="toggleEdit('projectDescription')">编辑</a-button>
              <a-button v-else type="link" @click="saveEdit('projectDescription')">保存</a-button>
              <a-button v-if="editableState.projectDescription" type="link" @click="cancelEdit('projectDescription')">取消</a-button>
            </div>
          </div>
          <div class="char-count">
            {{ remainingChars.projectDescription }} / 无限制
          </div>
        </a-form-item>
      </a-form>
    </a-spin>
  </div>
</template>

<script>
import axios from 'axios';
import {getProjectById, updateProjectSpace} from "@/api/project";

export default {
  name: "ProjectInfo",
  data() {
    return {
      form: this.$form.createForm(this, { name: 'project_info' }),
      factoryOptions: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10'],
      editableState: {
        projectName: false,
        foundation: false,
        projectDescription: false,
      }, // 每个字段的编辑状态
      originalValues: {}, // 保存原始值
      projectId: null, // 保存项目ID
      remainingChars: {
        projectName: 0,
        projectDescription: 0,
      }, // 剩余字符数
      loading: true, // 加载状态
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

        // 解析 site 字段
        const [foundation, factory] = projectData.site.split('-');
        const factoryArray = factory.match(/T\d/g) || [];

        // 设置表单字段值
        this.form.setFieldsValue({
          projectName: projectData.projectName,
          foundation: foundation,
          factory: factoryArray,
          projectDescription: projectData.projectDescription,
        });

        // 保存原始值
        this.originalValues = {
          projectName: projectData.projectName,
          foundation: foundation,
          factory: factoryArray,
          projectType: projectData.projectType,
          projectDescription: projectData.projectDescription,
          projectMembersDtoList: null,
          projectComputingPowerResourceDtoList: null,
          projectStorageResourceDtoList: null,
        };

        // 保存项目ID
        this.projectId = projectData.id;

        // 初始化剩余字符数
        this.updateRemainingChars('projectName');
        this.updateRemainingChars('projectDescription');
      } catch (error) {
        console.error('获取项目数据失败:', error);
      } finally {
        this.loading = false; // 数据加载完成后关闭加载状态
      }
    },
    toggleEdit(field) {
      if (field === 'foundation') {
        this.$set(this.editableState, 'foundation', true);
      } else {
        this.$set(this.editableState, field, true);
      }
    },
    saveEdit(field) {
      if (field === 'foundation') {
        this.$set(this.editableState, 'foundation', false);
      } else {
        this.$set(this.editableState, field, false);
      }
      this.form.validateFields((err, values) => {
        if (!err) {
          console.log('Received values of form: ', values);

          // 将 foundation 和 factory 拼接为 site
          const site = `${values.foundation}-${values.factory.join('')}`;

          // 更新项目数据
          const updatedData = {
            id: this.projectId,
            projectName: values.projectName,
            site: site,
            projectDescription: values.projectDescription,
            projectType: this.originalValues.projectType, // 默认为null
            projectMembersParamList: null,
            projectComputingPowerResourceParamList: null,
            projectStorageResourceParamList: null,
          };

          console.log('Updated project data:', updatedData);

          // 调用更新接口
          this.updateProject(updatedData);
        }
      });
    },
    cancelEdit(field) {
      if (field === 'foundation') {
        this.$set(this.editableState, 'foundation', false);
      } else {
        this.$set(this.editableState, field, false);
      }
      this.form.setFieldsValue({
        [field]: this.originalValues[field],
      });
      this.updateRemainingChars(field);
    },
    async updateProject(updatedData) {
      try {
        // const response = await axios.post('/projects/updateProjectSpace', updatedData);
        const response = await updateProjectSpace(updatedData)
        console.log('更新项目空间成功:', response);
        // 可以在这里处理更新成功的逻辑，比如提示用户更新成功
      } catch (error) {
        console.error('更新项目空间失败:', error);
        // 可以在这里处理更新失败的逻辑，比如提示用户更新失败
      }
    },
    updateRemainingChars(field) {
      const value = this.form.getFieldValue(field);
      if (field === 'projectName') {
        this.remainingChars.projectName = 255 - (value ? value.length : 0);
      } else if (field === 'projectDescription') {
        this.remainingChars.projectDescription = value ? value.length : 0;
      }
    },
    transformProjectMembers(members) {
      // 示例转换逻辑：假设需要将每个成员的 name 字段重命名为 memberName
      return members.map(member => ({
        projectId: member.projectId,
        memberName: member.memberName,
        memberRole: member.memberRole,
        memberId: member.id,
        email: member.email,
        phone: member.phone,
        // 其他字段...
      }));
    },
    transformComputingPowerResources(resources) {
      // 示例转换逻辑：假设需要将每个资源的 id 字段重命名为 resourceId
      return resources.map(resource => ({
        projectId: resource.projectId,
        powerResourceId: resource.powerResourceId,
        powerResourceName: resource.powerResourceName,
        cpuQuota: resource.cpuQuota,
        memoryQuota: resource.memoryQuota,
        gpuModel: resource.gpuModel,
        gpuQuota: resource.gpuQuota,
      }));
    },
    transformStorageResources(resources) {
      // 示例转换逻辑：假设需要将每个资源的 id 字段重命名为 resourceId
      return resources.map(resource => ({
        resourceId: resource.id,
        // 其他字段...
      }));
    },
  },
};
</script>

<style lang="less" scoped>
.project-info {
  width: 98%;
  height: 580px;
  background-color: rgba(242, 242, 242, 1);
}

.form-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-left: 10px;
  width: auto;
}

.editable-text {
  color: #000; /* 可编辑状态下的字体颜色 */
}

.non-editable-text {
  color: #888; /* 不可编辑状态下的字体颜色 */
}

.char-count {
  font-size: 12px;
  color: #888;
  margin-top: 5px;
}

.list-container {
  display: flex;
  flex-wrap: wrap; /* 自动换行 */
}

.name-item {
  position: relative;
  width: 100px;
  height: 40px;
  padding: 10px;
  margin: 10px 0;
  transition: box-shadow 0.3s ease;
}

.name-item .name {
  transition: box-shadow 0.3s ease;
}

.name-item:hover .name {
  box-shadow: 0 10px 10px rgba(0, 0, 0, 0.5);
}

.icon {
  display: none;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}

.name-item:hover .icon {
  display: block;
}

.add-receiver-btn {
  position: relative;
  width: 100px;
  height: 30px;
  padding: 10px;
  margin: 10px 0;
}
.run-title-row {
  line-height: 1;
}
.common-tooltip {
  vertical-align: 0em;
}
</style>
