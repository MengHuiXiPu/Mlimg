<template>
  <div class="editable-cell">
    <div v-if="editable" class="editable-cell-input-wrapper">
      <a-input
        :placeholder="value"
        :value="value"
        style="margin-right: 8px"
        @change="handleChange"
        @pressEnter="check"
      />
      <a-icon type="check" class="editable-cell-icon-check" @click="check" />
      <a-icon type="close" class="editable-cell-icon-check" @click="cancelRename"/>
    </div>
    <div v-else class="editable-cell-text-wrapper font-14">
      <span style="margin-right: 8px">{{ value || " " }}</span>
      <a-icon type="edit" class="editable-cell-icon" @click="edit" />
    </div>
    <div class="error">{{ errorText }}</div>
  </div>
</template>

<script>
export default {
  props: {
    text: String,
    nameList: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      value: "",
      errorText: "",
      editable: false,
    };
  },
  watch: {
    text: {
      handler(val) {
        this.value = val;
      },
      immediate: true,
    },
  },
  methods: {
    handleChange(e) {
      const value = e.target.value;
      this.value = value;
      this.errorText = "";
    },
    check() {
      // 英文字母、数字和下划线不超过8位的字符串，且不能以下划线结尾
      // const regex = /^(?!.*_$)[a-zA-Z0-9_]{1,8}$/;
      // 增加对中文的支持
      const regex = /^(?!.*_$)[a-zA-Z0-9_\u4e00-\u9fa5]{1,8}$/;
      if (this.value === "") {
        this.errorText = "Label name is empty";
        return;
      } else if (
        this.nameList.includes(this.value) &&
        this.text !== this.value
      ) {
        this.errorText = "Label name you input is duplicate";
        return;
      } else if (!regex.test(this.value)) {
        this.errorText =
          "中文、英文、数字和下划线不超过8位的字符串，且不能以下划线结尾";
        return;
      }
      this.editable = false;
      this.$emit("change", this.value);
    },
    cancelRename(){
      this.value = this.text;
      console.log(this.value,'checkNameList')
      this.editable = false;
    },
    edit() {
      this.editable = true;
      if (this.text === "Write down new label name.") {
        this.value = "";
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.editable-cell-input-wrapper,
.editable-cell-text-wrapper {
  display: flex;
  align-items: center;
}
.font-14 {
  font-size: 14px;
}
.error {
  color: red;
}
::v-deep .ant-input {
  height: 32px;
  border-radius: 4px;
}
</style>