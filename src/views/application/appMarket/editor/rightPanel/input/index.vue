<template>
  <div>
    <header class="right-header">参数设置</header>
    <a-form-model
      style="width: 100%;"
      :model="formData"
      :rules="formRules"
      :label-col="labelCol"
      :wrapper-col="wrapperCol"
      labelAlign="right"
      ref="refInputForm"
      class="scrollbar params-form"
    >
      <a-form-model-item :label="`${item.label}：`" v-for="item in configurableFormItems" :key="item.name" :prop="item.name">
        <!-- <span slot="label" class="row-label">{{ item.label }}</span> -->
        <div v-if="item.type==='image'" class="upload-item-block">
          <a-upload  :showUploadList="false" accept="image/*" :customRequest="$event => doUploadPicture($event, item)">
            <a-button type="primary" size="small">点击上传</a-button>
          </a-upload>
          <image-viewer class="upload-image" width="80px" height ="40px" :src="imageMap[item.name]" :url-list="[imageMap[item.name]]" objectFit="contain"></image-viewer>
        </div>
        <!-- 单选 -->
        <a-select v-model="formData[item.name]" v-else-if="item.type==='radio'" :placeholder="item.placeholder" :allowClear="!item.required">
          <a-select-option :value="option.value" v-for="option in item.options">{{ option.label }}</a-select-option>
        </a-select>
        <!-- 多选 -->
        <a-select v-model="formData[item.name]" v-else-if="item.type==='checkbox'" mode="multiple" :placeholder="item.placeholder">
          <a-select-option :value="option.value" v-for="option in item.options">{{ option.label }}</a-select-option>
        </a-select>
        <!-- 输入框，包括普通input 和数字类型，浮点类型 -->
        <template v-else-if="item.type==='input'">
          <a-input-number v-model="formData[item.name]" v-if="['float', 'integer'].includes(item.dataType)"
            :min="Array.isArray(item.range) ? ([null, undefined].includes(item.range[0]) ? -Infinity : item.range[0]) : -Infinity"
            :max="Array.isArray(item.range) ? ([null, undefined].includes(item.range[1]) ? Infinity : item.range[1]) : Infinity"
            :precision="item.dataType==='integer'? 0 : undefined"
            :step="item.dataType==='integer'? 1 : 0.1"
            :placeholder="item.placeholder"
            style="width: 100%;"
          />
          <a-input v-model="formData[item.name]" v-else/>
        </template>
        <!-- 标注框 -->
        <template v-else-if="item.type==='rect'">
          <template v-if="annotations && matchAnnotation(annotations, item.name).length">
            <div class="space-between annotation-block" v-for="annotation in matchAnnotation(annotations, item.name)">
              <!-- <a-checkbox size="small"  @change="$event => toggleShowPath($event, annotation)" v-model="annotation.visible">{{ (annotation.segment || []).join(',') }}</a-checkbox> -->
              <!-- <a-button type="link" size="small">20,40,459,288</a-button> -->
              <a-checkbox size="small"  @change="$event => toggleShowPath($event, annotation)" v-model="annotation.visible">{{ `[${annotation.segment}]`}}</a-checkbox>
              <i class="el-icon-delete action-btn" @click="doRemoveAnnotation(annotation)"></i>
            </div>
          </template>
          <a-input  v-else :placeholder="item.placeholder || '请使用标注工具标注区域'" disabled/>
        </template>
        <!-- 其他情况默认输入框 -->
        <a-input v-model="formData[item.name]" v-else :placeholder="item.placeholder" allowClear/>
      </a-form-model-item>
  </a-form-model>
  </div>
</template>

<script>
import { useState } from "../../hooks/state.js";
import { ref, onMounted, set, reactive,computed } from "vue";
import { uploadPicToConfigInput, getSourcePicByPath } from "@/api/runtorun.js";
import { Message as $message } from 'element-ui';
import ImageViewer from "@/components/ImageViewer/index.js";
import EventBus from "@/utils/bus.js";
import { generateId } from "../../../util.js";
export default {
  components: {
    ImageViewer,
  },
  data() {
    return {
      // layout="vertical"
      labelCol: { span: 8 },
      wrapperCol: { span: 16 },
      isVisible: true,
      // formData: {}, 
      // formRules: {},
    }
  },
  watch: {
    // 为rect类型的参数赋值
    annotations(val) {
      if(!Array.isArray(val)) return
      // 清除所有标注项的值，
      // const keys = Array.from(new Set(val.map(item => item.parameterName)));
      [...this.commonState.annotationItemKeys].forEach(key => { 
        this.formData[key] = []
      })
      // 重新分配所有annotations
      val.forEach(anno => {
        if(Array.isArray(this.formData[anno.parameterName])) {
          this.formData[anno.parameterName].push(anno.segment)
        }else {
          this.formData[anno.parameterName] = [anno.segment]
        }
      })
    }
  },
  methods: {
    /**
     * @public 保存配置时调用，会先校验表单，通过后将配置信息update 到configData, 并返回该对象
     * 将结果传递给 collectData
     */
    submit(collectData) {
      this.$refs.refInputForm.validate(async (valid, obj) => {//验证表单数据
        if (!valid) { collectData.checkFlag = false; return false } 
        try {
          const params = { }
          // 将formData中的值更新到formItems
          this.formItems.forEach(item => {
            item.value = this.formData[item.name]
          })
          params.outputs = JSON.parse(this.configData.inputParams).outputs
          params.inputs = this.formItems
          // 将数据更新到configData
          this.setConfigData('inputParams', JSON.stringify(params))
          // 再更改checkFlag为true，以走后续流程
          collectData.checkFlag = true
        } catch (error) {
          console.error(error)
          collectData.checkFlag = false
        }
      })
    },
    // 移除标注
    doRemoveAnnotation(annotation) {
      // 从annotations中移除
      this.setAnnotations("Delete", annotation)
      if(!this.shapesGroup?.children) return  //未focus图片时  还没有shapesGroup
      // 从shapeGroup中移除
      const rectangle = this.shapesGroup.children.find(child => child.data.id === annotation.id);
      if (rectangle) {
          rectangle.remove();
          // this.paper.view.draw();
      }
    },
    // 显示/隐藏标注
    toggleShowPath(event, annotation) {
      if(!this.shapesGroup?.children) return  //未focus图片时  还没有shapesGroup
      const rectangle = this.shapesGroup.children.find(child => child.data.id === annotation.id);
      if (rectangle) {
        rectangle.visible = event.target.checked;
          // this.paper.view.draw();
      }
    },
    // 将所有标注按照参数名称过滤返回
    matchAnnotation(list = [], name) {
      return list.filter(an => an.parameterName === name)
    }
  },
  created() {
    EventBus.$on("r2rInputParamsSubmit", this.submit)
  },
  beforeDestroy() {
    EventBus.$off("r2rInputParamsSubmit")
  },
  setup() {
    const formItems = ref([])
    const formData = ref({})
    const formRules = ref({})
    const imageMap = reactive({}) //图片路径映射map  key: 配置项 name, value： blob url
    const { configData, setConfigData, shapesGroup, annotations, setAnnotations , setCommonState, commonState} = useState()
    /**
     * 解析参数, 根据返回结果渲染表单的结构数据，构建表单校验结果，生成formData
     * @param {*} inputJson 
     */
    const parseParameter = (inputJson) => {
      try {
        const jsonData = JSON.parse(inputJson);
        const inputs = jsonData.inputs;
        formItems.value = inputs;
        // console.log('输入参数配置',inputs)
        const _annotationItemKeys = new Set()
        inputs.forEach(item => {
          set(formData.value, item.name, item.value)
          if(item.type === 'image') {
            set(imageMap, item.name, null)
            // 加载对应图片
            loadImg(item.value, item)
          }
          // 未配置或者true的时候，都是必填
          if([null, undefined].includes(item.required) || item.required===true) {
            set(formRules.value, item.name, {
              required: true, 
              message: `请配置${item.label}信息`, 
              trigger: ['radio','checkbox', 'rect'].includes(item.type) ? 'change': 'blur',
            })
          }
          //标注区域，如果有默认值，需要添加到annotations里面，并回显标注区域（回显的问题需要先有图片，且需要关联图片，不明确，所以先不处理，大概率实际使用时 区域参数不会有默认值）
          if(item.type === 'rect' && Array.isArray(item.value)) {  
            item.value.forEach(an => {
              setAnnotations( 'Add',{
                id: generateId(an),
                segment: an,
                visible: false,
                parameterName: item.name, 
              })
            })
          }
          // 采集annotationItemKeys
          if(item.type === 'rect') {
            _annotationItemKeys.add(item.name)
          }
        })
        setCommonState('annotationItemKeys', _annotationItemKeys)
      }catch (e) {
        console.error("inputParams参数格式异常，无法解析渲染配置表单", inputJson)
      }
    }
    // 输入配置图片上传
    const doUploadPicture = async (data = {}, item) => {
      let formParam = new FormData()
      formParam.append('configId', configData.value.id)
      formParam.append('file', data.file)
      const uploadRes = await uploadPicToConfigInput(formParam)
      if(uploadRes.code === 0) {
        $message.success("上传成功")
        // 将存储路径更新到formData
        formData.value[item.name] = uploadRes.data
        loadImg(uploadRes.data, item)
      }
    }
    // 根据地址加载调试图片，为imageMap赋值
    const loadImg = async (path, targetItem) => {
      if(!path) return null
      const res = await getSourcePicByPath(path)
      const url = window.URL.createObjectURL(res)
      imageMap[targetItem.name] = url
    }
    // 获取需要可视化配置的配置项，以此来渲染表单
    // (打破原有规则)要求configurable只针对image类型生效
    const configurableFormItems = computed(() => {
      return formItems.value.filter(item => item.type!=='image' || (item.type==='image'&&item.configurable))
    })
    onMounted(() => {
      parseParameter(configData.value.inputParams)
    })
    return {
      configData,
      setConfigData,
      shapesGroup,
      annotations,
      setAnnotations,

      formItems,
      configurableFormItems,
      formData,
      formRules,

      doUploadPicture,

      imageMap,
      commonState,
    }
  }
}
</script>

<style lang="less" scoped>
@import "../../../base.less";
::v-deep .ant-input-group-addon{
  border: none;
  background-color: transparent;
  padding: 0;
}
.upload-item-block {
  display: flex;
  align-items: flex-start;
  justify-content: space-around;
}
.annotation-block {
  background-color: @bg-color;
  height: 26px;
  margin-top: 5px;
  padding: 0 10px;
  border-radius: 2px;
  .action-btn{
    cursor: pointer;
  }
}
.params-form {
  ::v-deep .ant-form-item label {
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}
// .upload-image {
//   display: inline-block;
//   vertical-align: middle;
// }
</style>