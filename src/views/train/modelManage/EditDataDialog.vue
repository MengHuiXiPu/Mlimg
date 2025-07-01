<template>
  <div style="overflow-y: auto;" class="scrollbar">
    <a-form-model
    style="width: 100%;"
    ref="ruleForm"
    :model="editForm"
    :rules="rules"
    :label-col="labelCol"
    :wrapper-col="wrapperCol"
  >
   <template v-for="item in Object.keys(editForm)">
      <template v-if="Object.prototype.toString.call(editForm[item]) === '[object Object]'">
        <a-form-model-item v-for="child in Object.keys(editForm[item])"  :ref="child" :key="child" :label="child" :prop="child" :wrapper-col="wrapperCol" :disabled="isDisabled">
        <template v-if="Array.isArray(editForm[item][child])">
          <a-select mode="tags" style="width: 100%" placeholder="请输入参数" @change="handleChange" v-model="editForm[item][child]" :disabled="isDisabled">
            <a-select-option v-for="data in editForm[item][child]" :key="data">
              {{ data }}
            </a-select-option>
          </a-select>
        </template>
        <template v-else-if="typeof editForm[item][child] === 'boolean'">
          <a-select style="width: 100%" placeholder="请输入参数" @change="handleChange" v-model="editForm[item][child]" :disabled="isDisabled">
            <a-select-option v-for="data in [true, false]" :key="data">
              {{ data }}
            </a-select-option>
          </a-select>
        </template>
        <a-input-number v-else-if="typeof editForm[item][child] === 'number'" :disabled="isDisabled" v-model="editForm[item][child]" @change="!editForm[item][child] ? editForm[item][child] = 0: ''" :min="0" style="width: 100%" />
        <a-input v-else v-model="editForm[item][child]" :disabled="isDisabled" />
      </a-form-model-item>
      </template>
      <a-form-model-item :ref="item" :key="item" :label="item" :prop="item" :wrapper-col="wrapperCol" v-else>
        <template v-if="Array.isArray(editForm[item])">
          <a-select mode="tags" style="width: 100%" placeholder="请输入参数" @change="handleChange" v-model="editForm[item]" :disabled="isDisabled">
            <a-select-option v-for="data in editForm[item]" :key="data" :disabled="isDisabled">
              {{ data }}
            </a-select-option>
          </a-select>
        </template>
        <template v-else-if="typeof editForm[item] === 'boolean'">
          <a-select style="width: 100%" placeholder="请输入参数" @change="handleChange" v-model="editForm[item]" :disabled="isDisabled">
            <a-select-option v-for="data in [true, false]" :key="data">
              {{ data }}
            </a-select-option>
          </a-select>
        </template>
        <a-input-number v-else-if="typeof editForm[item] === 'number'" v-model="editForm[item]" @change="!editForm[item] ? editForm[item] = 0: ''" :min="0" :disabled="isDisabled" style="width: 100%" />
        <a-input v-else v-model="editForm[item]" :disabled="isDisabled" />
      </a-form-model-item>
    </template>
  </a-form-model>
  </div>
</template>
<script>
// 赋值粘贴自模型训练
export default {
  data() {
    return {
      editForm: {},
      labelCol: { span: 5 },
      wrapperCol: { span: 18 },
      other: '',
      rules: {},
    };
  },
  computed: {
    isDisabled () {
      // return this.$store.state.model.modelInfoRecord?.taskStatus === 1
      return false
    }
  },
  props: {
    // editForm: Object || String
  },
  // created () {
  //   this.editForm = this.editForm.map(item => {
  //     if
  //   })
  // },
  watch: {
    'editForm.mean' (value) {
      if(value.length && Array.isArray(value)) {
        let list  = value
        list.forEach((item, index) => {
          if (isNaN(Number(item))) {
            this.editForm.mean.splice(index, 1)
            this.$message.info('该参数只能为数值')
          }
        })
      }
    },
    'editForm.std' (value) {
      if(value.length && Array.isArray(value)) {
        let list  = value
        list.forEach((item, index) => {
          if (isNaN(Number(item))) {
            this.editForm.std.splice(index, 1)
            this.$message.info('该参数只能为数值')
          }
        })
      }
    },
    editForm: {
      handler (value) {
        console.log(value);
        if (value.model_params) {
          if (value.model_params.std) {
            if (value.model_params.std.length) {
              this.editForm.model_params.std.forEach((item, index) => {
                if (isNaN(Number(item))) {
                  this.editForm.model_params.std.splice(index, 1)
                  this.$message.info('该参数只能为数值')
                }
              })
            }
          }
          if (value.model_params.mean) {
            if (value.model_params.mean.length) {
              this.editForm.model_params.mean.forEach((item, index) => {
                if (isNaN(Number(item))) {
                  this.editForm.model_params.mean.splice(index, 1)
                  this.$message.info('该参数只能为数值')
                }
              })
            }
          }
        }
        // this.$emit("formData", this.editForm)
      },
      deep: true
    }
  },
  created () {
    // this.getRules()
  },
  methods: {
    getRules (formdata) {
      this.editForm = formdata
      let keys = Object.keys(this.editForm)
      let params = {}
      keys.forEach((item) => {
        if (Object.prototype.toString.call(this.editForm[item]) === '[object Object]') {
          let childs = Object.keys(this.editForm[item])
          childs.forEach(ele => {
            // params[ele] = [
            //   {
            //     required: this.isValueEmpty(this.editForm[item][ele]), message: `请输入${item}信息`, trigger: 'blur'
            //   }
            // ]
            if (Array.isArray(this.editForm[item][ele])) {
              this.editForm[item][ele] = this.editForm[item][ele].map(item => item.toString())
            }
          })
        } else {
          params[item] = [
            {
              required: this.isValueEmpty(this.editForm[item]), message: `请输入${item}信息`, trigger: 'blur'
            }
          ]
          if (Array.isArray(this.editForm[item])) {
            this.editForm[item] = this.editForm[item].map(item => item.toString())
          }
        }
      })
      console.log(params);
      this.rules = params
    },
    isValueEmpty (value) {
      if (value === undefined || value === null) {
        return false;
      }
      if (typeof value === "string" && value.trim() === "") {
        return false;
      }
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      if (typeof value === "object" && Object.keys(value).length === 0) {
        return false;
      }
      return value ? true : false;
    },
    handleChange (value, data, ele) {
      console.log(value, data, ele)
    },
    onSubmit() {
      this.$refs.ruleForm.validate(valid => {
        if (valid) {
          this.$emit('formData', this.editForm)
        } else {
          console.log('error submit!!');
          return false;
        }
      });
    },
    resetForm() {
      this.$refs.ruleForm.resetFields();
    },
  },
};
</script>
<style scoped lang="less">
.scrollbar {
  height: 42vh;
  width: calc(100% - 210px);
}
</style>
