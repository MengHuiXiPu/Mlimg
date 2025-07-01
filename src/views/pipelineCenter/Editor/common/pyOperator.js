import { message as Message } from '@/utils/resetMessgae';
// useSetState, useSocketInstance, useProvideDebugResult, useDebugResult
import { useGetState } from "@pipeline/Editor/store/index.js";
import Operator from "@/api/operator";
import { saveGraph } from "@pipeline/Editor/common/request.js";
import { setCellRunStatus } from "@pipeline/Editor/common/cell";
/**
 * 实例化python算子
 * @param {*} cell 
 */
export const instPyOperator = async (cell) => {
  const pipelineId = useGetState('pipelineId')
  const nodeData = cell.getData()
  setCellRunStatus(cell, "RUNNING")
  const res = await Operator.createPyOperator({
    operatorId: nodeData.operatorId,
    templateId: pipelineId.value,
    nodeNum: nodeData.id
  }).catch(err => {
    // 销毁并从移除
    cell.dispose()
    Message.error(err.message || err.msg || err.response.data?.msg || '创建算子异常')
  })
  setCellRunStatus(cell, null)
  if (res.code == 0) { //将有用数据写入cell
    cell.setData({
      ...nodeData,
      // 此时items和inits都是空的,不用写入
      // items: res.data?.frontendSetting?.items || [],
      // outputs: res.data?.frontendSetting?.outputs || [],
      recordId: res.data?.id, //用于用户更新python算子时使用
      dynamicOperatorName: res.data?.name
    })
  }
}
/**
 * @description 解析python算子代码，并保存到后端
 * @param {*} cell 
 * @param {*} codeString
 */
export const parseAndSaveCode = async (cell, codeString) => {
  return new Promise(async (resolve, reject) => {
    const nodeData = cell.getData()
    try {
      const parseResult = await Operator.parsePyCode({
        code: codeString,
      })
      if (parseResult.code != 0) {  //解析失败
        reject({ type: "parseError", msg: parseResult.msg })
        // Message.error(parseResult.msg)
        return
      }
      // 将解析出来的信息，保存到python算子实例
      const savePyResult = await Operator.updatePyOperator({
        operatorId: nodeData.recordId,
        content: codeString,  // 算子代码
        parseResult: parseResult.data,  // 解析结果
      })
      if (savePyResult.code != 0) {
        // 保存失败
        reject(savePyResult.msg)
        return Message.error(savePyResult.msg)
      }
      cell.setData({  //将解析并保存的输入,输出写入cell.data，同时触发change:data事件
        ...nodeData,
        // 此时items和inits都是空的,不用写入
        items: savePyResult.data?.frontendSetting?.items || [],
        outputs: savePyResult.data?.frontendSetting?.outputs || [],
        codeContent: codeString,
      }, { deep: false })
      // 调用graph的保存方法， 将python算子的配置保存到graph
      await saveGraph(false)
      resolve()
    } catch (err) {
      console.error(err)
      // 服务等其他异常情况
      Message.error("服务异常")
      reject(err)
    }
  })
}