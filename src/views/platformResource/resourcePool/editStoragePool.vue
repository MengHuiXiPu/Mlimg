<template>
  <div>
    <!-- 新建/编辑算力资源池弹窗 -->
    <a-modal
        v-model:visible="visible"
        :title="modalTitle"
        :width="600"
        @ok="handleSubmit"
        @cancel="handleCancel"
    >
      <a-form
          :model="form"
          :rules="rules"
          ref="formRef"
          label-col="{ span: 6 }"
          wrapper-col="{ span: 16 }"
      >
        <!-- 资源池名称 -->
        <a-form-item label="存储资源池名称" prop="name">
          <a-input v-model="form.name"
                   placeholder="请输入（字母、下划线、中文，长度限制128）"
                   maxlength="128">
            v-decorator="['form.name', { rules: [{ required: true, message: 'Please input your note!' }] }]"
          </a-input>
        </a-form-item>
        <!-- 描述 -->
        <a-form-item label="描述" prop="description">
          <a-textarea
              v-model="form.description"
              placeholder="请输入描述，长度限制512"
              maxlength="512"
              rows="4">
            v-decorator="[
            'form.description',
            { rules: [{ required: true, message: 'Please select your gender!' }] },
            ]"

          </a-textarea>
        </a-form-item>
        <!-- PVC存储资源选择 -->
        <a-form-item label="选择PVC存储资源" prop="pvcId">
          <a-select
              v-model="form.pvcId"
              placeholder="请选择PVC存储资源"
              :options="pvcOptions"
              allow-clear>
            v-decorator="[
            'form.pvcId',
            { rules: [{ required: true, message: 'Please select your gender!' }] },
            ]"
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import {updateStoragePool, queryAllPvcs, addStoragePool, checkPoolUsedByProject} from "@/api/system/platformResource";


export default {
  data() {
    return {
      visible: false, // 控制弹窗显示
      modalTitle: "新建存储资源池", // 弹窗标题，默认是新建
      form: {
        id: "",
        name: "", // 资源池名称
        description: "", // 描述
        pvcId: null, // 绑定下拉选择的值
      },
      rules: {
        name: [
          {required: true, message: "请输入存储资源池名称", trigger: "blur"},
          {min: 1, max: 128, message: "名称长度不能超过128个字符", trigger: "blur"},
          {
            pattern: /^[a-zA-Z_\u4e00-\u9fa5]+$/,
            message: "名称只能包含字母、下划线或中文，长度限制128个字符",
            trigger: "blur",
          },
        ],
        description: [
          {max: 512, message: "描述长度不能超过512个字符", trigger: "blur"},
        ],
        pvcId: [
          {required: true, message: '请选择PVC存储资源', trigger: 'change'},
        ],
      },
      pvcOptions: [], // 下拉选项数据
    };
  },
  methods: {

    async showModal(record) {
      this.visible = true
      if (record != null) {
        await this.fetchPvcOptions(record);
        this.modalTitle = "编辑存储资源池"; // 设置标题为编辑
        // 将 record 中的值赋值给 form
        this.form.id = record.id || ""; // 如果 record.id 不存在，赋值为空字符串
        this.form.name = record.name || ""; // 如果 record.name 不存在，赋值为空字符串
        this.form.description = record.description || ""; // 如果 record.description 不存在，赋值为空字符串
        // this.form.pvcId = record.pvcId || ""; // 如果 record.description 不存在，赋值为空字符串
      } else {
        this.modalTitle = "新建存储资源池";
        await this.fetchPvcOptions();
      }
      // 如果是编辑模式，确保 pvcId 对应的选项正确显示
      if (record && record.pvcId) {
        const matchedOption = this.pvcOptions.find((option) => option.value === record.pvcId);
        if (matchedOption) {
          this.form.pvcId = matchedOption.value;
        }
      }

    },
    // 提交表单
    async handleSubmit() {
      if (!this.validateMethod()) {
        return;
      }

      try {
        // 判断是新增还是修改
        const isEdit = !!this.form.id;

        if (isEdit) {
          // 编辑模式
          const isPoolUsed = await this.doCheckPoolUsedByProject(this.form.id);

          if (isPoolUsed) {
            // 如果资源池已被项目引用，弹出确认框
            await this.showConfirmationDialog();
          } else {
            // 如果资源池未被引用，直接提交修改
            await this.submitUpdateStoragePool();
          }
        } else {
          // 新增模式
          await this.submitAddStoragePool();
        }
        //
        // // 提交成功后，关闭弹窗并刷新数据
        // this.resetFormAndClose();
      } catch (error) {
        console.error("操作失败：", error);
        this.$message.error("操作失败，请重试！");
      }
    },

    // 显示确认对话框
    async showConfirmationDialog() {
      return new Promise((resolve, reject) => {
        this.$confirm({
          title: "修改存储资源",
          content:
              "当前资源池已被项目存储数据，若您修改了存储资源，将会影响相关项目的正常使用，请确保完成数据迁移后，再进行修改。",
          okText: "已完成迁移，确定",
          cancelText: "取消",
          onOk: async () => {
            try {
              await this.submitUpdateStoragePool();
              resolve();
              this.resetFormAndClose();
            } catch (error) {
              reject(error);
            }
          },
          onCancel: () => {
          },
        });
      });
    },

    // 提交修改存储资源池
    async submitUpdateStoragePool() {
      const response = await updateStoragePool(this.form);
      if (response.code === 200 && response.data.status === 200) {
        this.$message.success("存储资源池修改成功！");
        this.resetFormAndClose();
      } else {
        this.$message.error({
          message: "存储资源池修改失败: " + response.msg,
          duration: 5000, // 显示 5 秒
        });
        // throw new Error("存储资源池修改失败");
      }
    },

    // 提交新增存储资源池
    async submitAddStoragePool() {
      const response = await addStoragePool(this.form);
      if (response.code === 200 && response.data.status === undefined) {
        this.$message.success("存储资源池新增成功！");
        this.resetFormAndClose();
      } else {
        this.$message.error({
          message: "存储资源池新增失败: " + response.msg,
          duration: 5000, // 显示 5 秒
        });
        // throw new Error("存储资源池新增失败");
      }
    },

    // 重置表单并关闭弹窗
    resetFormAndClose() {
      // 清空表单
      this.form = {
        id: "",
        name: "",
        description: "",
        pvcId: null,
      };

      // 关闭弹窗
      this.visible = false;

      // 通知父组件刷新数据
      this.$emit("fetchStoragePools");
    },
    async doCheckPoolUsedByProject(poolId) {
      try {
        const storageResourceId = poolId;
        // 调用后端接口
        const response = await checkPoolUsedByProject({storageResourceId});

        // 假设后端返回的数据结构为 QuotaInfoDto
        const quotaInfo = response.data;
        // 返回 powerResourceAllocate 字段的值
        if (quotaInfo && typeof quotaInfo.storageResourceAllocate === 'boolean') {
          return quotaInfo.storageResourceAllocate;
        } else {
          console.error('返回数据格式不正确:', quotaInfo);
          return false; // 如果数据格式不正确，默认返回 false
        }
      } catch (error) {
        console.error('调用接口失败:', error);
        return false; // 如果接口调用失败，默认返回 false
      }
    },
    // 取消操作
    handleCancel() {
      this.form = {
        id: "",
        name: "",
        description: "",
        pvcId: null,
      };
      this.visible = false; // 关闭弹窗
    },

    async fetchPvcOptions(record) {
      try {
        // 根据是否有 pvcId 决定是否传参
        const response = record
            ? await queryAllPvcs(record.pvcId)
            : await queryAllPvcs();
        if (response.code === 200 && response.data) {
          // 将接口返回的 name 和 id 映射为下拉选项
          this.pvcOptions = response.data.map((pvc) => ({
            label: pvc.name, // 下拉框显示的名称
            value: pvc.id,   // 下拉框对应的值
          }));
        } else {
          console.error('获取PVC存储资源失败：', response.msg || '未知错误');
        }
      } catch (error) {
        console.error('获取PVC存储资源失败：', error);
      }
    },
    validateMethod() {
      const name = this.form.name.trim(); // 去除首尾空格
      const description = this.form.description.trim(); // 去除首尾空格

      const nameRegex = /^[a-zA-Z_\u4e00-\u9fa5]+$/; // 允许的字符：字母、下划线、中文
      if (!name) {
        this.$message.error('请输入算力资源池名称');
        return false
      }
      if (name.length > 128) {
        this.$message.error('名称长度不能超过128个字符');
        return false
      }
      if (!nameRegex.test(name)) {
        this.$message.error('名称只支持字母、下划线、中文');
        return false
      }
      if (description.length > 512) {
        this.$message.error('描述长度不能超过512个字符');
        return false
      }
      if (!this.form.pvcId) {
        this.$message.error('请选项pvc存储资源');
        return false
      }
      return true
    },
  },
};
</script>

<style scoped>
/* 自定义样式 */
</style>