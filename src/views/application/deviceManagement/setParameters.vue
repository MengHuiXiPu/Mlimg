<template>
  <step-layout>
    <template slot="right">
      <div class="editor-container">
        <json-editor ref="jsonEditor" v-model="value" />
      </div>
    </template>
    <template slot="bottom">
      <a-button type="primary" @click="nextStep" class="btnStep">配置下发</a-button>
      <a-button style="margin-left: 10px;" @click="cancel" class="btnStep">取消</a-button>
    </template>
  </step-layout>
</template>

<script>
import JsonEditor from '@/components/JsonEditor'
import StepLayout from '@/components/StepLayout'
export default {
  name: 'JsonEditorDemo',
  components: { JsonEditor, StepLayout },
  data() {
    return {
      value: ''
    }
  },
  props: {
    transferData: {
      type: Object,
      default: () => ({})
    },
  },
  watch: {
    // 合并接口保存选择的文件信息到selectedRowKeys和selectedFiles
    'transferData.transferCfg':  {
      handler(val) {  //接口返回的是js对象
        this.value = val===undefined ? null: JSON.parse(val)
      },
      immediate: true
    }
  },
  methods: {
    nextStep() {
      try {
        // 尝试将 JSON 字符串解析为 JSON 对象
        const jsonObject = JSON.parse(this.value);
        // 说明用户编辑过，已被editor自动转为json
        // 更新选择的算法到父组件
        this.$emit('collect-data', 'extendCommandParam', this.value)
      } catch (error) {
        // 说明value是普通对象，从接口解析反显(watch中的处理)，用户没做编辑处理
        this.$emit('collect-data', 'extendCommandParam', JSON.stringify(this.value))
      }
      
    },
    cancel() {
      this.$router.back()
    }
  },
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
.editor-container {
  position: relative;
  height: 100%
}
.btnStep {
  width: @nextStepWidth;
  height: @nextStepHeight;
  color: @nextStepColor;
  background-color: @nextStepBgc;
  border-radius: @borderRadiusSmall;
}
</style>