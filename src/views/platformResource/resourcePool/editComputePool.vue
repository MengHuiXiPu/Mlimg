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
          ref="formRef"
          label-col="{ span: 6 }"
          wrapper-col="{ span: 16 }"
      >
        <!-- 资源池名称 -->
        <a-form-item
            label="算力资源池名称"
            name="name"
        >
          <a-input
              v-model="form.name"
              placeholder="请输入（字母、下划线、中文，长度限制128）"
              maxlength="128"
          />
        </a-form-item>

        <!-- 描述 -->
        <a-form-item
            label="描述"
            name="description"
        >
          <a-textarea
              v-model="form.description"
              placeholder="请输入描述，长度限制512"
              maxlength="512"
              rows="4"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import {addComputePool, updateComputePoll} from "@/api/system/platformResource";


export default {
  data() {
    return {
      visible: false, // 控制弹窗显示
      modalTitle: "新建算力资源池", // 弹窗标题，默认是新建
      form: {
        id: "",
        name: "", // 资源池名称
        description: "", // 描述
      },
      errors: {}
    };
  },
  methods: {

    showModal(record) {
      console.log("record", record);
      this.visible = true
      if (record != null) {
        this.modalTitle = "编辑算力资源池"; // 设置标题为编辑
        // 将 record 中的值赋值给 form
        this.form.id = record.id || ""; // 如果 record.id 不存在，赋值为空字符串
        this.form.name = record.name || ""; // 如果 record.name 不存在，赋值为空字符串
        this.form.description = record.description || ""; // 如果 record.description 不存在，赋值为空字符串
      }else {
        this.modalTitle = "新建算力资源池"; // 设置标题为编辑
      }
    },
// 提交表单
    async handleSubmit() {

      if (!this.validateMethod()) {
        return
      }
      try {
        if (this.form.id) {
          // 调用 updateComputePoll 方法提交数据
          const response = await updateComputePoll(this.form);
          if (response.code === 200 && response.data.status === undefined) {
            // 提示用户操作成功
            this.$message.success("算力资源池修改成功！");
          } else {
            // 提示用户操作失败，延长显示时间
            this.$message.error({
              message: "算力资源池修改失败: " + response.msg,
              duration: 5000 // 显示 5 秒
            });
          }
        } else {
          // 调用 addComputePool 方法提交数据
          const response = await addComputePool(this.form);
          if (response.code === 200) {
            // 提示用户操作成功
            this.$message.success("算力资源池新增成功！");
          } else {
            // 提示用户操作失败，延长显示时间
            this.$message.error({
              message: "算力资源池新增失败: " + response.msg,
              duration: 5000 // 显示 5 秒
            });
          }
        }

        // 关闭弹窗
        this.visible = false;

        // 清空表单
        this.form = {
          name: "",
          description: "",
        };

        // 如果需要刷新父组件的数据，可以在这里触发事件通知父组件
        this.$emit("fetchResourcePools");
      } catch (error) {
        console.error("表单验证失败或接口调用失败：", error);
        this.$message.error("算力资源池添加失败，请重试！");
      }
    },

    // 取消操作
    handleCancel() {
      this.visible = false; // 关闭弹窗
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

      return true
    },


  },
};
</script>

<style scoped>
/* 自定义样式 */
</style>