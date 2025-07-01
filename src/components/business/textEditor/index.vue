<template>
  <div>
    <span v-if ="!editActived">{{ text }}</span>
    <span v-else style="display:flex;">
      <el-input v-model="newText" :maxlength="maxlength" v-bind="$attrs"></el-input>
      <a-icon type="check" class="icon-btn" @click="handleOk" style="color: #409eff"/>
      <a-icon type="close" class="icon-btn" @click="handleCancel"/>
    </span>
    <a-icon type="edit" class="edit-icon" @click="handleEdit" v-if="!editActived"/>
  </div>
</template>

<script>
import { isValidName } from '@/utils';
export default {
  name: 'text-editor',
  data() {
    return {
      editActived: false, // 是否激活编辑
      newText: '', // 编辑后的文本
    }
  },
  props: {
    text: {
      type: String,
      default: ""
    },
    // 是否必填，即不能为空
    required: {
      type: Boolean,
      default: false
    },
    maxlength: {
      type: Number,
      default: 50
    }
  },
  methods: {
    handleEdit() {
      this.editActived = true
      this.newText = this.text
    },
    handleOk() {
      // check
      if (this.required && !isValidName(this.newText)) {
        this.$message.error('只支持中文、英文、数字、下划线和中划线')
        return
      }
      if (this.newText.length > this.maxlength) {
        this.$message.error(`长度不超过 ${this.maxlength}个字符`)
        return
      }
      this.editActived = false
      this.$emit('change', this.newText)
    },
    handleCancel() {
      this.editActived = false
    }
  },
}
</script>

<style lang="less" scoped>
.edit-icon {
  vertical-align: 3px;
  margin-left: 10px;
  cursor: pointer;
  // color: #2e4fde;
  color: #409eff;
}
.icon-btn {
  color: #888888;
  cursor: pointer;
  line-height: 1.5em;
  margin: 0 5px;
}
</style>