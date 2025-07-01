<template>
  <!-- 新增或者更新应用 -->
  <a-modal
    v-model="isShow"
    :title="type === 1 ? '新建应用' : '编辑应用'"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form-model
      ref="ruleForm"
      :model="form"
      :rules="rules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      layout="horizontal"
    >
      <a-form-model-item label="应用名称" prop="name">
        <a-input v-model="form.name" type="text" />
      </a-form-model-item>
      <a-form-model-item label="应用编号" prop="number">
        <a-input v-model="form.number" type="text" />
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
export default {
  name: "addApplicationDialog",
  props: {
    type: {
      type: Number,
      default: 1,
    },
  },
  data() {
    return {
      isShow: false,
      form: {
        name: "",
        number: "",
      },
      rules: {
        name: [
          {
            required: true,
            message: "请输入应用名称",
            trigger: "blur",
          },
        ],
        number: [
          {
            required: true,
            message: "请输入应用编号",
            trigger: "blur",
          },
        ],
      },
    };
  },
  methods: {
    showModal() {
      this.isShow = true;
    },
    hideModal() {
      this.isShow = false;
    },
    getData(record) {
      this.form.appId = record.id || "";
      this.form.name = record.name || "";
      this.$set(this.form, "number", record.number || "");
    },
    handleCancel() {
      this.form.appId = "";
      this.form.name = "";
      this.form.number = "";
    },
    handleOk() {
      this.$refs.ruleForm.validate((valid) => {
        if (valid) {
          this.$emit("add-application", this.form);
        } else {
          return false;
        }
      });
    },
  },
};
</script>

<style></style>
