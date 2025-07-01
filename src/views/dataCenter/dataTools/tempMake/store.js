
const data = {
  frame: null,
  app: null,
  frontendConfigs: [
    // {
    //   templateMakingInfoId:4,
    //   step: 1,
    //   config: "", //可存储前端自己需要的 json 字符串
    // },
    // {
    //   templateMakingInfoId:5,
    //   step: 2,
    //   config: "", //可存储前端自己需要的 json 字符串
    // }
  ], //前端需要的 json 配置,数据库里单独一张表,参考注释里的格式
}

export const useSetFrame = (frame) => {
  data.frame = frame
}
export const useGetFrame = () => {
  return data.frame
}
export const useSetApp = (app) => {
  data.app = app
}
export const useGetApp = () => {
  return data.app
}
export const useGetFEConfigs = (step) => {
  const currData = data.frontendConfigs.find(item => item.step === step)
  return currData?.config || ""
}
/**
 * 更新配置
 * @param {*} step 
 * @param {*} config stringify 字符串 | array(接口返回的数组)
 */
export const useSetFEConfigs = (config, step,) => {
  if (step === undefined) { //第二个参数不存在，全量替换
    data.frontendConfigs = config
    return
  }
  const currData = data.frontendConfigs.find(item => item.step === step)
  if (currData) {
    currData.config = config
  } else {
    data.frontendConfigs.push({
      step,
      config
    })
  }
  console.log('store frontendConfigs', data.frontendConfigs)
}
// 清除 data
export const useClearData = () => {
  data.frame = null
  data.frontendConfigs = []
  data.app = null
}
