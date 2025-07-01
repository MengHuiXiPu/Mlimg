<template>
  <div class="project-detail">
    <div class="form-group">
      <label for="projectName">项目名称:</label>
      <input type="text" id="projectName" :value="project.projectName" readonly />
    </div>
    <div class="form-group">
      <label for="projectDescription">项目描述:</label>
      <textarea id="projectDescription" :value="project.projectDescription" readonly></textarea>
    </div>
  </div>
</template>

<script>
// import axios from 'axios';

import {getPersonalProjectById} from "@/api/project";

export default {
  name: "ProjectDetail",
  data() {
    return {
      project: {
        projectName: '',
        projectDescription: ''
      }
    };
  },
  created() {
    this.fetchProjectData();
  },
  methods: {
    async fetchProjectData() {
      try {
        // const params = { id: 8 }; // 默认id为8
        // const response = await axios.get('/projects/getPersonalProjectById');
        const response = await getPersonalProjectById();

        this.project = response;
      } catch (error) {
        console.error('获取项目数据失败:', error);
      }
    }
  }
};
</script>


<style scoped>
.project-detail {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, textarea {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  resize: none;
}

textarea {
  height: 100px;
}
</style>
