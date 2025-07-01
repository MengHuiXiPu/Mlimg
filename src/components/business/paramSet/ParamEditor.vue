<template>
  <div style="overflow-y: auto;" class="scrollbar">
    <!-- 将参数分组，并渲染多个表单，而不是使用一个表单，那样无法做表单校验，同时避免不同分组同名参数问题 -->
    <a-form-model
      v-for="(formItemTypeList, groupName) in paramsGroup"
      style="width: 100%;"
      :model="formData[groupName]"
      :rules="formRules"
      :label-col="labelCol"
      :wrapper-col="wrapperCol"
    >
    <!-- 遍历渲染参数分组 -->
    <!-- <template v-for="(formItemTypeList, groupName) in paramsGroup"> -->
      <a-form-model-item v-for="item in formItemTypeList" :key="item.label" :label="item.label" :prop="item.label" :wrapper-col="wrapperCol">
        <tag-input 
          v-model="formData[groupName][item.label].value" :disabled="isDisabled" inputType="number"
          v-if="item.type === 'numberArray'" class="form-item" style="display: inline-flex;"
        ></tag-input>
        <tag-input 
          v-model="formData[groupName][item.label].value" :disabled="isDisabled" inputType="string"
          v-else-if="item.type === 'stringArray'" class="form-item" style="display: inline-flex;"
        ></tag-input>
        <a-select class="form-item" placeholder="请输入参数" v-model="formData[groupName][item.label].value" :disabled="isDisabled" v-else-if="item.type === 'boolean'">
          <a-select-option v-for="data in [true, false]" :key="data">
            {{ data }}
          </a-select-option>
        </a-select>
        <a-input-number v-else-if="item.type === 'number'" v-model="formData[groupName][item.label].value" :min="0" :disabled="isDisabled" class="form-item"/>
        <a-input v-else v-model="formData[groupName][item.label].value" :disabled="isDisabled" class="form-item"/>
        <!-- intro信息 -->
        <a-icon type="question-circle" class="question-circle-icon" v-tooltip="item.intro"/>
      </a-form-model-item>
    <!-- </template> -->
    </a-form-model>
    <!-- 之前要求只编辑 model_train_params，model_params 和 special_params 三个参数组，现要求可对所有参数进行编辑 -->
    <div style="text-align: center;">
      <a-button type="link" :disabled="isDisabled" @click="toggleAdvanceParam">
        高级参数设置<a-icon :type="showAdvanceParam? 'arrow-down':'arrow-up'" style="vertical-align: inherit;"/>
      </a-button>
    </div>
    <a-form-model
      style="width: 100%;"
      :model="othersFormData"
      :rules="otherFormRules"
      :label-col="labelCol"
      :wrapper-col="wrapperCol"
      v-if="showAdvanceParam"
    >
      <a-form-model-item v-for="item in otherFormItemList" :key="item.label" :label="item.label" :prop="item.label" :wrapper-col="wrapperCol">
        <tag-input 
          v-model="othersFormData[item.label].value" :disabled="isDisabled" inputType="number"
          v-if="item.type === 'numberArray'" class="form-item" style="display: inline-flex;"
        ></tag-input>
        <tag-input 
          v-model="othersFormData[item.label].value" :disabled="isDisabled" inputType="string"
          v-else-if="item.type === 'stringArray'" class="form-item" style="display: inline-flex;"
        ></tag-input>
        <a-select class="form-item" placeholder="请输入参数" v-model="othersFormData[item.label].value" :disabled="isDisabled" v-else-if="item.type === 'boolean'">
          <a-select-option v-for="data in [true, false]" :key="data">
            {{ data }}
          </a-select-option>
        </a-select>
        <a-input-number v-else-if="item.type === 'number'" v-model="othersFormData[item.label].value" :min="0" :disabled="isDisabled" class="form-item"/>
        <a-input v-else v-model="othersFormData[item.label].value" :disabled="isDisabled" class="form-item"/>
        <a-icon type="question-circle" class="question-circle-icon" v-tooltip="item.intro"/>
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script>
import { ref, reactive, onMounted, set } from "vue";
import TagInput from "@/components/TagInput/index.vue";
import cloneDeep from "lodash/cloneDeep";
export default {
  components: {
    TagInput,
  },
  data() {
    return {
      labelCol: { span: 5 },
      wrapperCol: { span: 18 },
    }
  },
  computed: {
    isDisabled () {
      return this.$store.state.model.modelInfoRecord?.taskStatus === 1
    }
  },
  props: {
    // 参数对象,从后台返回的alphathmParam JSON字符串中解析出来，格式如下:
    // 里面部分参数在前端可 编辑，其他参数不需要前端编辑
    // {
    //   "img_height": { "value": 224, "intro": "训练图片高,预设: 224" },
    //   "img_width":  { "value": 224, "intro": "训练图片宽,预设: 224" },
    // }
    editForm: {
      type: Object,
      defalut: () => ({})
    }
  },
  setup(props, { }) {
    let editData
    let formData = ref({})
    
    const formRules = ref({})   //表单校验规则
    // 需要支持编辑的参数组
    const paramsGroup = reactive({
      // model_train_params: [],   //训练参数
      // special_params: [],   //业务参数
      // model_params: [],     //测试推理参数
    })
    const showAdvanceParam = ref(false)
    // 高级参数设置的formData
    const othersFormData = ref({})
    const otherFormItemList = ref([])
    const otherFormRules = ref({})

    const validator = (rule, value, callback) => {
      if (!value || [null, undefined, ''].includes(value.value) || (Array.isArray(value?.value) && !value?.value?.length)) {
        callback(new Error(''))
      } else {
        callback()
      }
    }
    // 初始化表单渲染项类别
    // 初始化表单校验规则
    const initTypeObj = () => {
      let rules = {}
      Object.keys(paramsGroup).forEach(groupKey => {
        paramsGroup[groupKey] = Object.keys(editData[groupKey] || {}).map(key => {
          let type
          const rawValue = formData.value[groupKey][key].value
          if(Array.isArray(rawValue) && rawValue.every(v => typeof(v) === 'number')) {  //渲染成number tag-input
            type = 'numberArray'
          }else if(Array.isArray(rawValue) && !rawValue.every(v => typeof(v) === 'number')){
            type = 'stringArray'
          }else if(typeof(rawValue) ==='number') {  //渲染成input-number
            type = 'number'
          }else if(typeof(rawValue) ==='boolean') {  //select
            type = 'boolean'
          }else { //普通input
            type = 'string'
          }
          // 设置校验规则
          rules[key] = [
            { required: _isValueEmpty(rawValue), 
              message: `请输入${key}信息`, 
              trigger: 'blur',
              validator: _isValueEmpty(rawValue) ? validator: (rule, value, callback)=>{ callback() }, 
            }
          ]
          return {
            type,
            label: key,
            intro: formData.value[groupKey][key].intro
          }
        })
      })
      formRules.value = rules
    }
    /**
     * 初始化高级参数编辑数据
     */
    const initAdvanceParam = () => {
      const data = cloneDeep(props.editForm)
      Object.keys(data).forEach(key => {
        if(key !== 'model_train_params' && key !== 'special_params' && key !== 'model_params' && key !=='class_dict') {
          // othersFormData.value[key] = data[key]
          set(othersFormData.value, key, data[key])
        }
      })
      otherFormItemList.value = Object.keys(othersFormData.value || {}).map(key => {
        let type
        const rawValue = othersFormData.value[key].value
        if(Array.isArray(rawValue) && rawValue.every(v => typeof(v) === 'number')) {  //渲染成number tag-input
          type = 'numberArray'
        }else if(Array.isArray(rawValue) && !rawValue.every(v => typeof(v) === 'number')){
          type = 'stringArray'
        }else if(typeof(rawValue) ==='number') {  //渲染成input-number
          type = 'number'
        }else if(typeof(rawValue) ==='boolean') {  //select
          type = 'boolean'
        }else { //普通input
          type = 'string'
        }
        // 设置校验规则
        otherFormRules.value[key] = [
          { required: _isValueEmpty(rawValue), 
            message: `请输入${key}信息`, 
            trigger: 'blur',
            validator: _isValueEmpty(rawValue) ? validator: (rule, value, callback)=>{ callback() }, 
          }
        ]
        return {
          type,
          label: key,
          intro: othersFormData.value[key].intro
        }
      })
    }
    /**
     * @public 外部调用来获取组件表单最新数据
     */
    const getValue = () => {
      return {
        // ...editData,    //主要获取不需要前端编辑的字段
        ...formData.value,   // 获取需要前端编辑的基础字段
        ...othersFormData.value,  //获取前端要编辑的高级字段
        class_dict: editData.class_dict, //该字段不允许前端编辑,从editData中取回
      }
    }
    /**
     * @public 外部调用，在editForm变更后，重新渲染页面
     */
    const initState = () => {
      // 关闭高级参数编辑
      showAdvanceParam.value = false

      editData = cloneDeep(props.editForm)
      //采用分组方式，而不是...展开为一级，避免同名参数覆盖问题
      let res = {}
      if(Object.keys(editData.model_train_params || {}).length) {
        res.model_train_params = editData.model_train_params
        paramsGroup.model_train_params = []
      }
      if(Object.keys(editData.special_params || {}).length) {
        res.special_params = editData.special_params
        paramsGroup.special_params = []
      }
      if(Object.keys(editData.model_params || {}).length) {
        res.model_params = editData.model_params
        paramsGroup.model_params = []
      }
      formData.value = res
      initTypeObj()
      // 初始化高级参数编辑数据
      initAdvanceParam()
    }
    // 这里使用原有逻辑，即EditDataDialog中的逻辑
    const _isValueEmpty = (value) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string" && value.trim() === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (typeof value === "object" && Object.keys(value).length === 0) return false;
      if(typeof value === 'boolean') return true
      return value ? true : false;
    }
    
    const toggleAdvanceParam = () => {
      showAdvanceParam.value = !showAdvanceParam.value
    }

    initState()
    return {
      paramsGroup,
      formData,
      formRules,
      getValue,
      initTypeObj,
      initState,

      showAdvanceParam,
      toggleAdvanceParam,
      otherFormItemList,
      othersFormData,
      otherFormRules,
    }
  }
}
</script>

<style lang="less" scoped>
.scrollbar {
  height: 42vh;
  width: calc(100% - 210px);
}
.form-item {
  width: 92%;
  margin-right: 10px;
}
.question-circle-icon {
  color: #ccc;
  cursor: pointer;
}
</style>