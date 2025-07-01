/**
 * 每一个调试指令都会有descriptors ="TVM_RUNCMD_ACK"/"TVM_DATAS_CALLBACK"的回调，start只有ack
 * ACK表示指令是否能被执行，CALLBACK表示执行的回调结果
 * 目前的理解 前端只需要关注status即可  <0就是有异常的，要reject
 */


import { exportData } from "@pipeline/Editor/common/graph.js";
import Operator from "@/api/operator";
import pipelineApi from "@/api/pipeline";
import { Message } from "element-ui";
import { useGetState, useSetState, useSocketInstance, useProvideDebugResult, useDebugResult, useNodeData } from "@pipeline/Editor/store/index.js";
import { COMMOND, PLRUNSTATUS } from "@pipeline/Editor/common/enums";
import { useGraph } from "@pipeline/Editor/store/index";
import { setCellRunStatus, selectNodeById } from "@pipeline/Editor/common/cell";
import { transformToHierarchy } from "@pipeline/Editor/util/transData.js";
import { isWhileNode, isPyNode } from "@pipeline/Editor/common/cell.js";
import Emitter from "@pipeline/Editor/util/channel.js";
// import { validGraph } from "@pipeline/Editor/common/validGraph.js";

/**
 * @description  因为算子组和方案 接口是两套，这个根据pipelineType匹配返回
 * @param {*} methodName 
 */
export function matchRequestMethod(methodName = "") {
  const pipelineType = useGetState("pipelineType").value
  const methodsMap = {
    save: {
      "scheme": Operator.updatePipelineTemplateById,
      "group": Operator.updateOperatorGroupTemplateById
    },
    loadPipeline: {
      "group": Operator.getOperatorGroupTemplateInfoById,
      "scheme": Operator.getPipelineTemplateInfoById
    },
    upload: {
      "scheme": Operator.uploadImage,
      "group": Operator.uploadGroupImage
    },
    getImage: {
      // Operator.getImage
      "scheme": Operator.getImage,
      "group": Operator.getGroupImage
    },
    bindModel: {
      "scheme": pipelineApi.bindOperatorModelPipeline,
      "group": pipelineApi.bindOperatorModelOG
    }
  }
  return methodsMap[methodName][pipelineType]
}
/**
 * 保存pipeline data
 * @param {*} messageFlag 是否显示保存成功的提示, 默认显示
 * @returns Promise
 */
export function saveGraph(messageFlag = true) {
  const grapgData = exportData();
  // const graph = useGraph();
  // console.log('原始导出的data', graph.value.toJSON())
  // console.log('当前使用', grapgData)
  // return
  const pipelineId = useGetState('pipelineId');
  if (!pipelineId.value) return Message.warning("未匹配pipelineId")
  const nodes = grapgData.nodes.map(node => {
    // position要转为x,y存储
    const { x, y } = node.position
    // 精简接线桩数据以保存
    const ports = (node.ports?.items || []).map(port => {
      return {
        id: port.id,
        group: port.group,
      }
    })
    const result = {
      x,
      y,
      id: node.id,
      label: node?.data?.label,
      name: node?.data?.name,
      shape: node.shape,
      zIndex: node.zIndex,
      ports,
      type: "node",
      parent: node.parent || null,
      // 改版后需要显示一部分算子描述信息
      typeName: node?.data?.typeName,
      remark: node?.data?.remark,
      // 下面的算子的配置信息
      group: node?.data?.group,
      operatorType: node?.data?.operatorType,
      opGroupId: node?.data?.opGroupId,
      operatorId: node?.data?.operatorId,
      rpaLabelingId: node?.data?.rpaLabelingId,
      inits: node?.data?.inits || [],
      items: node?.data?.items,
      outputs: node?.data?.outputs,
      width: node.size?.width,
      height: node.size?.height,

      recordId: node?.data?.recordId, // python算子需要的实例化记录id
      codeContent: node?.data?.codeContent || null, //python算子的代码
      dynamicOperatorName: node?.data?.dynamicOperatorName || null, //python算子才需要
    }
    // 业务上 新增special和supportRemote配置项
    if ('special' in node.data || 'supportRemote' in node.data) {
      result.special = node.data.special;  // 特殊配置项（当前为远程调用）
      result.supportRemote = node.data.supportRemote; // 是否支持远程调用
    }
    // 如果是while算子，需要前端指定一个全局唯一的虚拟算子组名字（后端及引擎算实现while的逻辑是把他当做虚拟算子组）
    if (isWhileNode(node.data)) {
      result.dynamicGroupName = node.data.dynamicGroupName || `${pipelineId.value}_while_${node.id}`;
      result.conditions = node.data?.conditions;
      // result.conditionDataSetting = node.data?.conditionDataSetting || []
      if (node.data?.conditionDataSetting?.length) {
        result.conditionDataSetting = node.data?.conditionDataSetting.map(item => {
          return {
            ...item,
            // 组合为[id,varName]为["id_varName"]
            compareValue: item._compareValue.join("_")
          }
        })
      }
    }
    return result
  })
  const edges = grapgData.edges.map(edge => {
    // 数据格式仍按照多端子俩连线配置（后端不修改，保留原有json映射）
    return {
      id: edge.id,
      zIndex: edge.zIndex,
      parent: edge.parent || null,
      type: "edge",
      sourceId: edge.source?.cell,
      targetId: edge.target?.cell,
      startVar: edge.source?.port,
      endVar: edge.target?.port,
      condition: edge.condition,
      // source: edge.source,
      // target: edge.target,
    }
  })
  const transfomedData = transformToHierarchy(nodes, edges)
  // console.log(transfomedData)
  return matchRequestMethod('save')(pipelineId.value, {
    graph: {
      nodes: transfomedData.nodes,
      edges: transfomedData.edges,
    }
  }).then((res) => {
    if (res.code === 0) {
      messageFlag && Message.success("保存成功");
    }
  })
}

/**
 * @description 调试pipeline，包括断点，单步等socket参数的构建
 * @param {*} command
 * @param {*} modules
 */
export function matchDebugOption(command, modules = {}) {
  const pipelineId = useGetState('pipelineId');
  const params = {
    version: "1.0.0", //固定值
    descriptors: "TVM_RUN_SETTING", //固定值
    guid: pipelineId.value,  //pipelineId
    timestamp: Date.now(),
    command: COMMOND[command],
    tvm_modules: {
      // 仅断点调试时设置， 打了断点的算子id_name
      // "618_boxFilter": "",
      // "3152_button_group": { "10_delayms": "" }
      ...modules
    }
  }
  return params
}

/**
 * 通知客户端进入调试模式，这里不涉及一条通知多条回复，是与http一样的请求响应对应，进入调试模式才能做其他的事情
 * @returns Promise
 */
export function startDebugMode() {
  // 获取socket实例的方法
  const { decoratorSend, response, status, close } = useSocketInstance();
  // 以Promise返回，记录执行状态
  return new Promise(async (resolve, reject) => {
    if (status.value != "OPEN") {
      Message.warning("socket服务异常，无法运行pipeline")
      return reject()
    }
    useSetState('loadingText', "进入调试模式...")
    const params = JSON.stringify(matchDebugOption("START"))
    decoratorSend((params), res => {
      // start命令只会返回descriptors: "TVM_RUNCMD_ACK"响应，不需要区分
      // useSetState('loadingText', "")  //响应后关闭loading（因为出现过socket连接正常，消息发出后，一直没有响应的情况，所以添加此loading）
      if (res.status == PLRUNSTATUS['STARTED']) {
        // 全局状态改为调试中(其他页面一些操作是监听的debuging的值，所以置为true的时机必须在获取完pod信息，并创建socket连接后)
        useSetState("debuging", true)
        // 清空调试结果
        useProvideDebugResult([])
        resolve(res)
      } else {
        // 全局状态改为非调试中
        useSetState("debuging", false)
        reject(res)
      }
    })
  })
}
/**
 * @description 停止调试模式
 * @returns Promise
 */
export function stopDebugMode() {
  // 获取socket实例的方法
  const { decoratorSend, response, decoratorClose } = useSocketInstance();
  // 以Promise返回，记录执行状态
  return new Promise((resolve, reject) => {
    const params = JSON.stringify(matchDebugOption("STOP"))
    // 发一个stop会响应一个 descriptors=TVM_RUNCMD_ACK和一个TVM_DATAS_CALLBACK
    decoratorSend((params), res => {
      // if (res.descriptors === "TVM_RUNCMD_ACK") return
      // if (res.status >= PLRUNSTATUS['END']) { //>=0,即没有报错，表示退出成功
      if (res.descriptors === "TVM_RUNCMD_ACK") {
        // 全局状态改为调试中
        // useSetState("debuging", false)
        // 重置节点样式
        const graph = useGraph().value
        if (graph) {
          const allNodes = graph.getNodes()
          allNodes.forEach(node => {
            setCellRunStatus(node, null)
            if (node.getData()._breakpoint) {
              // node.setAttrByPath("circle/fill", "#DCDFE6")
            }
          })
          Message.success("已退出调试")
        }
        decoratorClose() // 关闭socket
        resolve(res)
      } else {
        reject(res)
      }
    })
  })
}
/**
 * @description :全速运行pipeline
 * @returns Promise
 */
export function runAllPipeline() {
  // 获取socket实例的方法
  const { decoratorSend, response } = useSocketInstance();
  // 设置所有节点为running状态
  const graph = useGraph().value
  const allNodes = graph.getNodes()
  allNodes.forEach(node => {
    setCellRunStatus(node, "RUNNING")
  })
  // 用于记录已运行的算子id
  const rundNodeIds = new Set()
  // 以Promise返回，记录执行状态
  return new Promise((resolve, reject) => {
    const params = JSON.stringify(matchDebugOption("RUNALL"))
    //该命令会有多次websocket响应，即该回调会被多次执行
    decoratorSend((params), res => {
      if (res.status == PLRUNSTATUS['PENDING']) {
        //只要是调试中的状态，就不断地将结果交给下面的函数处理
        handleRunResult(res, rundNodeIds)
      } else if (res.status <= PLRUNSTATUS['END'] || res.status === PLRUNSTATUS['FINISHCMD']) { // 调试完成或者运行报错时，都resolve
        // 用所有节点-已运行几点，得到的是未运行的节点，将这些节点视图更新为ERROR状态
        const unRunNodes = allNodes.filter(node => !rundNodeIds.has(node.id))
        unRunNodes.forEach(node => {
          setCellRunStatus(node, "ERROR")
        })
        // 不再需要，由useInitWebsocket拦截处理
        // if (res.status == PLRUNSTATUS['END']) {  //无报错的运行结束
        //   Message.success("pipeline运行结束")
        //   close() //关闭socket连接
        // }
        // 全局状态重置
        // useSetState("debuging", false)
        resolve(res)
      } else {
        // 全局状态还原
        useSetState("debuging", false)
        reject({
          _message: 'full run error:',
          res
        })
      }
    })
  })
}
/**
 * @dscription 调试执行器，先创建整个调试流程的上下文以及状态， 返回两个function，用于断点和单步运行调用
 * @returns function，返回两个函数，runBreakpoint：每次调用该函数，运行至下一断点。runNextStep：调用该函数，运行至下一节点
 */
export function debugExecutor() {
  // <<<<<<<<<<<<<<<<<<初始化上下文状态 START >>>>>>>>>>>>>>>>>
  // 获取socket实例的方法
  const { decoratorSend, response, close } = useSocketInstance();
  // 获取所有节点
  const graph = useGraph().value
  const allNodes = graph.getNodes()
  allNodes.forEach(node => {
    setCellRunStatus(node, "RUNNING")
    // 对于打了断点的节点，重置断点的颜色为未运行的灰色
    if (node.getData()?._breakpoint) {
      // node.setAttrByPath("circle/fill", "#DCDFE6")
    }
  })
  // 用于记录已运行的算子id
  const rundNodeIds = new Set()
  // <<<<<<<<<<<<<<<<<<初始化上下文状态 END>>>>>>>>>>>>>>>>>
  // 用于走下一断点的方法
  function runBreakpoint() {
    // 获取graph的所有断点最新数据(因为用户可能进入调试模式后动态增减断点节点，所以需要每次调用断点调试时都获取最新的数据)
    const allBreakpointNodes = allNodes.filter(node => node.getData()?._breakpoint)
    const modules = {}
    allBreakpointNodes.forEach(node => {
      const data = node.getData()
      // 特殊处理while节点和python动态算子节点
      const name = isWhileNode(data) ? data.dynamicGroupName : isPyNode(data) ? data.dynamicOperatorName : data.name
      modules[`${data.id}_${name}`] = ""
    })
    const params = JSON.stringify(matchDebugOption("BREAK", modules))
    return new Promise((resolve, reject) => {
      decoratorSend(params, res => {
        // if (res.descriptors === "TVM_RUNCMD_ACK") return
        if (res.status === PLRUNSTATUS['FINISHCMD']) {  //该断点命令执行完成
          handleRunResult(res, rundNodeIds)
          // 一个断点命令执行完成，status=3时，会返回该断点的执行结果
          // 获取这个执行的节点，并选中，这样第一可以出发选中事件更新右侧输出结果，第二可以标识这个运行下一断点的动作运行完了哪一个节点
          const lastNodekeys = Object.keys(res.tvm_modules)[0] || ""
          const nodeId = lastNodekeys.split("_")[0]
          selectNodeById(nodeId)
          resolve(res)
        } else if (res.status === PLRUNSTATUS['PENDING']) {

          handleRunResult(res, rundNodeIds)
        } else if (res.status <= PLRUNSTATUS['END']) {  //整个pipeline运行完成或出现error
          // 用所有节点-已运行几点，得到的是未运行的节点，将这些节点视图更新为ERROR状态
          const unRunNodes = allNodes.filter(node => !rundNodeIds.has(node.id))
          unRunNodes.forEach(node => {
            setCellRunStatus(node, "ERROR")
          })

          // 全局状态重置 // 不再需要，由useInitWebsocket拦截处理
          // useSetState("debuging", false)
          // if (res.status == PLRUNSTATUS['END']) {  //无报错的运行结束
          //   close() //关闭socket连接
          //   Message.success("pipeline运行结束")
          // }
          resolve(res)
        } else { //非约定的意外情况 
          useSetState("debuging", false)
          reject({
            _message: 'break run error:',
            res
          })
        }
      })
    })
  }
  // 用于走单步运行的方法
  function runNextStep() {
    return new Promise((resolve, reject) => {
      const params = JSON.stringify(matchDebugOption("STEP"))
      // 该命令只会返回一次响应，即该回调只会执行一次
      decoratorSend(params, res => {
        if (res.status === PLRUNSTATUS['END']) { //pipeline运行结束
          // 不再需要，由useInitWebsocket拦截处理
          // Message.success("pipeline运行结束")
          // close() //关闭socket连接
          // useSetState("debuging", false)  //修改全局状态标识
          const unRunNodes = allNodes.filter(node => !rundNodeIds.has(node.id))
          unRunNodes.forEach(node => {
            setCellRunStatus(node, "ERROR")
          })
          resolve()
        } else if (res.status < PLRUNSTATUS['END']) { //运行或命令执行出错
          useSetState("debuging", false)  //修改全局状态标识
          const unRunNodes = allNodes.filter(node => !rundNodeIds.has(node.id))
          unRunNodes.forEach(node => {
            setCellRunStatus(node, "ERROR")
          })
          reject({
            _message: 'break run error:',
            res
          })
        } else if (res.status === PLRUNSTATUS['PENDING']) { //调试中, 在断点调试时  应该只有ACK指令会返回2，暂时先什么都不处理

        } else if (res.status === PLRUNSTATUS['FINISHCMD']) { //该断点命令执行完成，是callback响应，会有运行结果返回
          handleRunResult(res, rundNodeIds)
          // 单步运行命令结束时，status 3，必有该节点的运行结果，且只有一个,
          // 获取该节点，并选中，这样1可以触发选中事件更新右侧输出结果，第2可以标识点击下一步运行完了哪一个节点
          const lastNodekeys = Object.keys(res.tvm_modules)[0] || ""
          const nodeId = lastNodekeys.split("_")[0]
          selectNodeById(nodeId)
          resolve()
        }
      })
    })
  }
  return {
    runBreakpoint,
    runNextStep
  }
}
/**
 * @description :单步运行pipeline（独立启动单步运行，不依赖断点模式，目前先不支持，如果后续需要，重写该方法）
 * @returns Promise
//  */
// export function runPipelineStep() {
//   // 获取socket实例的方法
//   const { decoratorSend, response } = useSocketInstance();
//   return new Promise((resolve, reject) => {
//     const params = JSON.stringify(matchDebugOption("STEP"))
//     // 该命令只会返回一次响应，即该回调只会执行一次
//     decoratorSend(params, res => {
//       if (res.status === PLRUNSTATUS['END']) { //pipeline运行结束
//         Message.success("pipeline运行结束")
//         useSetState("debuging", false)  //修改全局状态标识
//         resolve()
//       } else if (res.status < PLRUNSTATUS['END']) { //运行或命令执行出错
//         useSetState("debuging", false)  //修改全局状态标识
//         reject({
//           _message: 'break run error:',
//           res
//         })
//       } else if (res.status === PLRUNSTATUS['PENDING']) { //调试中, 在断点调试时  应该只有ACK指令会返回2，暂时先什么都不处理

//       } else if (res.status === PLRUNSTATUS['FINISHCMD']) { //该断点命令执行完成，是callback响应，会有运行结果返回
//         handleRunResult(res)
//         resolve()
//       }
//     })
//   })
// }
/**
 * @description 根据运行响应结果，设置cell状态
 * @param {*} runRes  运行结果  
 * @param {Set} rundNodeIds: 用于记录已运行的节点id，全速+断点调试下，会用到
 */
const handleRunResult = (runRes = {}, rundNodeIds) => {
  const { guid, tvm_modules } = runRes
  const debugResult = useDebugResult().value || []
  // 根据guid查找对应的结果对象,pipeline的加入到pipeline的结果中，算子组的加入到算子组的结果中
  const result = debugResult.find(item => item.guid == guid)
  //获取当前选中的节点，为了当该节点运行完时，更新输出结果的视图
  const focusNodeId = useNodeData().value?.id;
  if (result) {
    // 将算子运行结果追加到tvm_modules中
    result.tvm_modules = {
      ...result.tvm_modules,
      ...tvm_modules
    }
  } else {
    debugResult.push(runRes)
  }
  const keys = Object.keys(tvm_modules)
  if (!keys.length) return
  keys.forEach(key => {
    // 根据key,形式为 5_merge这样的，解析出算子id+name
    let [opId, opName] = key.split("_")
    opId = parseInt(opId)
    const cell = useGraph().value.getCellById(opId)
    // console.log('根据结果获取到的cell：', cell)
    let status = tvm_modules[key].run_status
    if (cell) {
      if (status == 0) {
        setCellRunStatus(cell, "SUCCESS")
      } else if (status < 0) {
        setCellRunStatus(cell, "ERROR")
      } else {
        Message.warning(`算子的run_status非法：${status} 需明确`)
      }
      if (focusNodeId === opId) { //通知中间结果页面更新视图
        Emitter.emit('update-result-view', cell)
      }
    }
    rundNodeIds && rundNodeIds.add(opId)
  })
}
// 将全图所有节点设置为运行状态
export const setGraphRunningView = (allNodes = []) => {
  if (allNodes?.length < 1) {
    const graph = useGraph().value
    allNodes = graph.getNodes()
  }
  allNodes.forEach(node => {
    setCellRunStatus(node, "RUNNING")
  })
}
