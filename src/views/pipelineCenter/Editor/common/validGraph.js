import { isWhileNode, selectNodeById } from "@pipeline/Editor/common/cell.js";
import { Message } from "element-ui";


/**
 * @description: 校验While节点
 * 1、必须指定开始，指定结束
 * @param {*} whileCell 
 */
// edge toJSON后的数据格式
// {
//   "shape": "edge",
//   "attrs": {
//       "line": {
//           "stroke": "#A2B1C3",
//           "strokeDasharray": 5,
//           "style": {
//               "animation": "ant-line 30s infinite linear"
//           }
//       }
//   },
//   "id": "2217793",
//   "zIndex": 1,
//   "parent": 1,
//   "source": {
//       "cell": 2,
//       "port": "p_bottom"
//   },
//   "target": {
//       "cell": 1,  // 节点id
//       "port": "p_bottom"
//   }
// }
export function validWhile(whileCell) {
  const childEdges = whileCell.getChildren().filter(child => child.isEdge()).map(edge => edge.toJSON())
  if (!childEdges.length) {
    Message.warning('While循环必须指定开始和结束')
    return false
  }
  // 存在从 port: p_in连出的线，否则视为无开始
  if (!childEdges.find(edge => edge.source?.port == 'p_in')) {
    Message.warning('While循环必须通过连线指定开始')
    return false
  }
  // 存在从 port: p_bottom连入的线，否则视为无结束
  if (!childEdges.find(edge => edge.target?.port == 'p_bottom' && edge.target?.cell === whileCell.id)) {
    Message.warning('While循环必须通过连线指定结束')
    return false
  }
  return true
}

export const validSwitch = (nodeCell) => {
  return true
}
/**
 * 主要用来校验连线
 * @param {*} graph 
 * @returns 
 */
export const validGraph = (graph) => {
  return new Promise((resolve, reject) => {
    const cells = graph.getCells()
    const nodes = graph.getCells()
    if (!cells.length) {
      resolve()
    }
    for (let i = 0; i < nodes.length; i++) {
      if (isWhileNode(nodes[i])) {
        if (validWhile(nodes[i])) {
          continue
        } else {
          reject()
          break;
        }
      }
    }
    // 
    resolve()
  })

}

/**
 * @description: compose函数
 * @param  {...any} fns 
 * @returns 
 */
export const compose = (...fns) => (arg) => fns.reduce((com, n) => n(com), arg)


/**
 * 校验整个画布所有节点的配置是否合法
 * @param {*} graph 
 * @returns Promise
 */
export const validGraphConfig = (graph) => {
  graph = graph || useGraph().value
  const allNodes = graph.getNodes()
  return Promise.all(allNodes.map(node => validNodeConfig(node.getData())))
}
/**
 * @description 校验节点配置是否合法， 目前只校验必填参数
 * @param {*} nodeData 
 * @returns Promise， 后续可能需要支持和服务端交互做异步校验
 */
export const validNodeConfig = (nodeData) => {
  return new Promise((resolve, reject) => {
    // 获取items+inits配置项
    const configItems = [...nodeData.items || [], ...nodeData.inits || [],]
    for (let i = 0; i < configItems.length; i++) {
      // 如果存在必填项，且没有填写，则校验不通过, reject并跳出循环
      if (configItems[i].force && [null, undefined, ""].includes(configItems[i].value)) {
        Message.warning(`节点${nodeData._label}的${configItems[i].displayName || configItems[i].varName}为必填项`);
        // 选中该节点
        selectNodeById(nodeData.id);
        reject(`node config invalid, ${nodeData._label}-${configItems[i].varName} is required`);
        break;
      }
    }
    // 校验while算子
    // if (isWhileNode(nodeData)) {
    //   // "type": 1,
    //   //   "valueLow": "",
    //   //   "compareValue": "",
    //   //   _compareValue: [],
    //   //   "logic": 1
    //   const conditionDataSetting = nodeData.conditionDataSetting
    //   conditionDataSetting.forEach(item => {
    //     if ([null, undefined, ""].includes(item.valueLow) || [null, undefined, ""].includes(item.compareValue)) {
    //       // Message.warning(`节点${nodeData._label}的${item.displayName || item.varName}为必填项`);
    //       Message.warning(`请配置节点${nodeData._label}的条件`);
    //       // 选中该节点
    //       selectNodeById(nodeData.id);
    //       reject(`node config invalid, ${nodeData._label}-${item.varName} is required`);
    //     }
    //   })
    // }
    resolve()
  })
}