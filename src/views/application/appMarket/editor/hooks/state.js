import { ref, set,computed } from "vue";
// import cloneDeep from "lodash/cloneDeep";
import { getConfigList, getDebugTaskByConfig, getDebugResByPicId } from "@/api/runtorun.js";
import { Message as $message } from 'element-ui';

// 配置信息，整个配置页面共享
const configData = ref({})
// 控制图片列表中的哪些图片显示loading
const groupLoading = ref([])
// 当前配置存在进行中的调试任务时，有值，需要持续轮训任务结果和控制一些页面显示元素, 调试任务结束要及时clear该值
const taskId = ref(null)
// 当前聚焦图片的推理结果，会在右下角输出结果显示
const outputs = ref([])
// 推理结果json，本来只需要output，后面要求增加json展示才加的
const outputsJson = ref("")
// 激活的工具，目前进需要用到bbox和select
const activeTool = ref("")
// 标注（算法配置中的输入部分）
const annotations = ref([
  // {
  //   id: "",
  //   segment: [],
  //   visible: true,
  //   parameterName: '',  //可能有多个参数需要标注，根据该字段决定将该标注放在哪个参数的值下
  // }
])
// 图形组， 时一个paperjs的Group实例，所有标注图形都放在该对象下，可用来操作标注的显示，隐藏，删除等，在initCanvas时初始化
const shapesGroup = ref(null)
// 一些共用的响应式数据, 写成集合
const commonState = ref({
  // 算法配置项中，类型为rect的配置项名称列表，在input和toolbar中使用，存在时显示bbox工具按钮
  annotationItemKeys: ref(new Set())
})
/**
 * 更新某个属性的值. 或者更新整个configData
 * @param {*} key 
 */
const setConfigData = (key, value) => {
  if(typeof(key) ==='string') {
    set(configData.value, key, value )
  }
  if(typeof(key) === 'object') {
    configData.value = key
  }
}

/**
 * 设置groupLoading
 * @param {*} ids ：单个id或者数组集合
 */
const setGroupLoading = (ids) => {
  if(Array.isArray(ids)) {
    groupLoading.value = ids
  }
  if(typeof(ids) === 'string' || typeof(ids) === 'number') {
    groupLoading.value.splice(0)
    groupLoading.value.push(ids)
  }
}
/**
 * 设置taskId
 * @param {*} id 
 */
const setTaskId = (id) => {
  taskId.value = id
}
const setOutputs = (result = [], json = "") => {
  outputs.value = result
  outputsJson.value = json || ""
}
const setActiveTool = tool => {
  activeTool.value = tool
}
// 
const setCommonState = (key, value) => {
  set(commonState.value, key, value)
  if(key === "Empty") {  //重置
    commonState.value.annotationItemKeys = ref(new Set())
  }
}
/**
 * 标注的增删改清空操作
 * @param {*} annotation 
 * @param {*} type Add|Empty|Delete|Update
 */
const setAnnotations = (type = 'Add', annotation, ) => {
  if(type === "Add") {
    annotations.value.push(annotation)
  }else if (type === "Empty") {  //清空所有标注
    annotations.value.splice(0)
  }else if (type === "Delete") {
    const index = annotations.value.findIndex(an => an.id === annotation.id)
    annotations.value.splice(index, 1)
  }else if (type === "Update") {
    const index = annotations.value.findIndex(an => an.id === annotation.id)
    annotations.value.splice(index, 1, annotation)
  }
}

// 推理任务在进行时，需要禁用页面上的一些动作
const processing = computed(() => {
  // 存在任务id表示任务在推理进行时
  return taskId.value ? true : false
})
/**
 * 查询并解析更新推理结果
 * @param {*} params 
 */
const queryOutputs = params => {
  // setOutputs([])  //先清空输出结果
  return getDebugResByPicId(params).then(res => {
    if(res.code == 0 && res.data) {
      try {
        const result = JSON.parse(res.data)
        setOutputs(result.data || [], res.data)
        if(result.code !== 0) {
          $message.error(result.msg)
        }
        // $message.success("任务已完成")
      }catch(e) {
        console.log("推理结果解析失败，未按照约定返回", res.data)
        // 清空outputs
        setOutputs([], "") 
      } 
    }else {
      setOutputs([], "") 
    }
  })
}

/**
 * 根据配置id查询并update configData
 * @param {*} id 
 */
const queryConfigById = id => {
  return new Promise(async (resolve, reject) => {
    const configRes = await getConfigList({id: id})
    if(configRes.code == 0) {
      setConfigData(configRes.data?.records[0] || {})
      resolve()
    }
    // 领导要求不影响主页面渲染,在此之前resovle
    // 查询配置下是否存在进行中的任务
    const taskRes = await getDebugTaskByConfig(id)
    if(taskRes.code == 0) {//只判断一条数据，接口那边反馈最多只会存在一条未完成的任务
      if(taskRes.data?.length && taskRes.data[0].isCompleted === false) {
        setTaskId(taskRes.data[0]?.id)
      }else {
        setTaskId(null)
      }
    }
  })
}

/**
 * @returns 
 */
export function useState() {
  return {
    configData,
    setConfigData,
    queryConfigById,

    groupLoading,
    setGroupLoading,

    taskId,
    setTaskId,

    outputs,
    setOutputs,
    outputsJson,
    queryOutputs,

    processing,

    activeTool,
    setActiveTool,

    shapesGroup,
    annotations,
    setAnnotations,

    commonState,
    setCommonState,
  }
}