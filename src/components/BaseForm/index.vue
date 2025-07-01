<template>
  <el-form ref="formRef" :model="model" v-bind="attrs" v-on="$listeners" @submit.native.prevent>
    <template v-for="item of mergedFormItems">
      <el-form-item
          v-if="!hideItem(item)"
          :key="item.prop"
          :label="item.label"
          :label-width="item.labelWidth"
          :prop="item.prop"
      >
        <!-- 输入框/文本域 -->
        <template v-if="item.type === 'input'">
          <el-input
              v-model="model[item.prop]"
              :type="item.inputType"
              v-bind="item"
              @change="(value) => runFunc(item.change, value)"
          />
        </template>
        <!-- 下拉框 -->
        <template v-else-if="item.type === 'select'">
          <el-select
              v-model="model[item.prop]"
              v-bind="item"
              @change="(value) => runFunc(item.change, value)"
          >
            <el-option
                v-for="option of item.options"
                :key="option.value"
                :value="option.value"
                :label="option.label"
                :disabled="option.disabled"
            />
          </el-select>
        </template>
        <!-- 时间选择器 -->
        <el-date-picker
            v-else-if="item.type === 'date'"
            v-model="model[item.prop]"
            :type="item.dateType"
            v-bind="item"
            @change="(value) => runFunc(item.change, value)"
        />
        <!-- 按钮 -->
        <template v-else-if="item.type === 'button'">
          <el-button
              :type="item.btnType"
              :disabled="item.disabled"
              v-bind="item"
              @click="runFunc(item.func)"
          >
            <template v-if="!item.circle">{{ item.btnText }}</template>
          </el-button>
        </template>
      </el-form-item>
    </template>
  </el-form>
</template>

<script>
import { runFunc } from '@/utils';

export default {
  name: "BaseForm",
  inheritAttrs: false,
  props: {
    formItems: {
      type: Array,
      required: true,
    },
    model: {
      type: Object,
      required: true,
    },
  },
  data(){
    return {
      // 默认表单属性
      defaultFormAttrs: {},
      // 默认表单项定义
      defaultItemDefinition: {
        type: 'input',
        clearable: true,
        rows: 4,
      },
      // 表单组件 ref
      formRef: null,

    }
  },
  computed: {
    // 合并表单默认属性和 $attrs
    attrs() {
      return { ...this.defaultFormAttrs, ...this.$attrs };
    },
    // 表单项预处理
    mergedFormItems() {
      return this.formItems.map((item) => {
        return { ...this.defaultItemDefinition, ...item };
      });
    },
  },
  methods: {
    hideItem(item) {
      if (item.hidden) return true;
      if (typeof item.hiddenFunc === 'function')
        return item.hiddenFunc();
      return false;
    },
    // 表单校验方法
    validate(resolve, reject) {
      let valid;
      this.formRef.validate((isValid) => {
        valid = isValid;
        if (isValid) {
          if (typeof resolve === 'function') {
            return resolve(this.model);
          }
          return true;
        }
        if (typeof reject === 'function') {
          return reject(this.model);
        }
        return false;
      });
      return valid;
    },
    // 清空表单校验
    clearValidate() {
      this.formRef.clearValidate();
    }
  }
}
</script>

<style scoped>

</style>