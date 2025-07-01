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
    <!-- 嵌套对象时 -->
      <template v-if="Object.prototype.toString.call(editForm[item]) === '[object Object]'">
        <a-form-model-item v-for="(val, child) in editFormTypeObj[item]"  :ref="child" :key="child" :label="child" :prop="child" :wrapper-col="wrapperCol" :disabled="isDisabled">
        <template v-if="editFormTypeObj[item][child] ==='array'">
          <!-- <a-select mode="tags" style="width: 100%" placeholder="请输入参数" @change="handleChange" v-model="editForm[item][child]" :disabled="isDisabled">
            <a-select-option v-for="data in editForm[item][child]" :key="data">
              {{ data }}
            </a-select-option>
          </a-select> -->
          <tag-input v-model="editForm[item][child]" :disabled="isDisabled"></tag-input>
        </template>
        <template v-else-if="editFormTypeObj[item][child] === 'boolean'">
          <a-select style="width: 100%" placeholder="请输入参数" @change="handleChange" v-model="editForm[item][child]" :disabled="isDisabled">
            <a-select-option v-for="data in [true, false]" :key="data">
              {{ data }}
            </a-select-option>
          </a-select>
        </template>
        <a-input-number v-else-if="editFormTypeObj[item][child] === 'number'" :disabled="isDisabled" v-model="editForm[item][child]" :min="0" style="width: 100%" />
        <a-input v-else v-model="editForm[item][child]" :disabled="isDisabled" />
      </a-form-model-item>
      </template>
      <!-- 非对象 -->
      <a-form-model-item :ref="item" :key="item" :label="item" :prop="item" :wrapper-col="wrapperCol" v-else>
        <template v-if="editFormTypeObj[item] === 'array'">
          <!-- <a-select mode="tags" style="width: 100%" placeholder="请输入参数" @change="handleChange" v-model="editForm[item]" :disabled="isDisabled">
            <a-select-option v-for="data in editForm[item]" :key="data" :disabled="isDisabled">
              {{ data }}
            </a-select-option>
          </a-select> -->
          <tag-input v-model="editForm[item]" :disabled="isDisabled"></tag-input>
        </template>
        <template v-else-if="editFormTypeObj[item] === 'boolean'">
          <a-select style="width: 100%" placeholder="请输入参数" @change="handleChange" v-model="editForm[item]" :disabled="isDisabled">
            <a-select-option v-for="data in [true, false]" :key="data">
              {{ data }}
            </a-select-option>
          </a-select>
        </template>
        <a-input-number v-else-if="editFormTypeObj[item] === 'number'" v-model="editForm[item]" :min="0" :disabled="isDisabled" style="width: 100%" />
        <a-input v-else v-model="editForm[item]" :disabled="isDisabled" />
      </a-form-model-item>
    </template>
  </a-form-model>
  </div>
</template>
<script>
import TagInput from "@/components/TagInput/index.vue";
export default {
  components: {
    TagInput,
  },
  data() {
    return {
      editForm: {},
      editFormTypeObj: {},    //根据editform初始化的值，来确定渲染什么表单item
      labelCol: { span: 5 },
      wrapperCol: { span: 18 },
      other: '',
      rules: {},
    };
  },
  computed: {
    isDisabled () {
      return this.$store.state.model.modelInfoRecord?.taskStatus === 1
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
    // 根据editForm值的类型，初始化渲染对应的表单填写item: input/number/select等
    // 紧急修复，没有做递归，仅支持两层Object的解析
    fmtTypeObj(editForm) {
      this.editFormTypeObj = {}
      Object.keys(editForm).forEach(key => {
        if(Array.isArray(editForm[key])) {
          this.editFormTypeObj[key] = "array"
        }else if(Object.prototype.toString.call(editForm[key]) === '[object Object]') {
          this.editFormTypeObj[key] = {}
          Object.keys(editForm[key]).forEach(oKey => {
            if(Array.isArray(editForm[key][oKey])) {
              this.editFormTypeObj[key][oKey] = "array"
            }else {
              this.editFormTypeObj[key][oKey] = typeof(editForm[key][oKey])
            }
          })
        }else {
          this.editFormTypeObj[key] = typeof(editForm[key])
        }
      })
    },
    getRules (formdata) {
      this.editForm = formdata
      this.fmtTypeObj(this.editForm)
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
