<template>
  <div class="input-group tool-input-group">
    <div class="input-group-prepend tool-option-pre">
      <span class="input-group-text tool-option-font">{{ name }}</span>
    </div>
    <input
      v-model="localValue"
      class="form-control tool-option-input"
      @keyup.enter="$emit('submit')"
    />
  </div>
</template>

<script>
export default {
  name: "PanelInputString",
  model: {
    prop: "value",
    event: "update"
  },
  props: {
    name: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      localValue: this.value
    };
  },
  watch: {
    localValue() {
      this.$emit("update", this.localValue);
    },
    value(newValue) {
      this.localValue = newValue;
    }
  }
};
</script>

<style scoped>
.tool-input-group {
  padding-top: 3px;
}

.tool-option-pre {
  /* background-color: #383c4a; */
}

.tool-option-font {
  border-color: #1890ff;
  background-color: #1890ff;
  color: white;
  font-size: 12px;
  height: 20px;
}

.tool-option-input {
  display: table-cell;
  /* border-color: #1890ff; */
  color: black;
  padding: 0 0 0 3px;
  /* border-color: #1890ff; */
  font-size: 12px;
  height: 20px;
}
</style>
