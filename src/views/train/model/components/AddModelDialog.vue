<template>
  <div>
    <a-modal
        ref="modelRef"
        :visible="visible"
        title="新建模型"
        @ok="handleOk"
        @cancel="handleCancel"
        width="720px"
        :ok-button-props="{ props: {
          disabled: loading,
          loading: loading
        }}"
        :loading="loading"
        :maskClosable="false"
        destroyOnClose
        ok-text="确定"
        cancel-text="取消"
    >
      <ModelBaseInfo ref="modelBaseInfo" :form.sync="modelInfoForm"/>
    </a-modal>
  </div>
</template>

<script>
import ModelBaseInfo from './ModelBaseInfo'
import {
  createModel
} from '@/api/modelManage'
export default {
  name: "AddModelDialog",
  components: {
    ModelBaseInfo
  },
  data(){
    return {
      loading: false,
      modelInfoForm: {
        modelName: '',
        storedDirName: '',
        modelDescription: '',
        storedDirId: '',
        modelId: null,
      },
    }
  },
  computed: {
    visible() {
      return this.$store.state.model.step.newModelVisible;
    }
  },
  mounted() {
    console.log("mounted挂载了！！AddModelDialog")
    console.log("visible computed: ", this.visible)
  },
  methods: {
    handleOk() {
      this.$refs.modelBaseInfo.$refs.ruleForm.validate(async (valid) => {
        if(!valid) {
          return false;
        } else {
          const params = {...this.modelInfoForm, modelType: '1', isPublish: -3, }; // modelType暂时写为1，因为通用模型采用这种方式新建模型
          console.log("表单信息modelInfoForm: ", params);
          const res = await createModel(params);
          console.log("新建模型的res: ", res);
          this.modelInfoForm.modelId = res.data;
          localStorage.setItem("info", JSON.stringify(this.modelInfoForm))
          this.$emit('goStepForm', res.data, this.modelInfoForm.modelName);
          this.$store.commit('setNewModelVisible', false);
        }
      })
    },
    handleCancel() {
      this.$store.commit('setNewModelVisible', false);
      // this.$refs.modelRef.$refs.ruleForm.resetFields();
    },
  }
}
</script>

<style scoped lang="less">
/deep/ .ant-select-selection--single {
  height: 42px!important;
  line-height: 42px!important;
  margin-right: 16px;
}
/deep/ .ant-form-item-children {
  position: relative;
  display: flex;
  align-items: center;
}

</style>