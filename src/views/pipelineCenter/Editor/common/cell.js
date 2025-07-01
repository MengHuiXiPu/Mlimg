/**
 * @description 操作cell的方法集
 */

import { setBasePortAttrs } from "@pipeline/Editor/common/regiterShape.js";
import { uniqueNumericId } from "@pipeline/Editor/util/index.js";
import { CELLSTATUS } from "@pipeline/Editor/common/enums.js";
import { useGraph } from "@pipeline/Editor/store/index";
import { Message } from "element-ui";
/**
 * 往switch节点上添加case端口(port)
 * @param {*} cell switch节点cell
 * @param {*} param 
 * @param {*} options  x6中addport方法的第二个参数
 */
export const addSwitchPort = (cell, { text, data } = param, options = {}) => {
  return cell.addPort({
    group: 'bottom',
    id: `${uniqueNumericId()}`, //x6的port只支持string类型的id（如果使用number类型，port的一些方法会报错）
    attrs: {
      ...setBasePortAttrs(),
      text: {
        text: text,
        fill: '#888888',
        fontSize: 10,
      },
    },
    data: {
      // structs: [item.inits[0].struct]
      ...data
    }
  }, {
    ...options
  })
}
/**
 * @description 对某个节点设置断点状态
 * 1、视图更新： 显示断点的圆点
 * 2、将data中的_breakpoint字段  set为true/false
 * @param {*} cell 
 * @param {Boolean} bp 
 */
export const setBreakpoint = (cell, bp) => {
  // cell.setAttrByPath("circle/fill", "#DCDFE6")
  cell.setAttrByPath("debug/style/visibility", bp ? "visible" : "hidden")
  // 更新data中的_breakpoint字段(视图都是根据data中该字段更新的)
  cell.setData({
    _breakpoint: bp
  })
}
/**
 * @description 设置节点运行视图状态
 * @param {*} cell 
 * @param {*} status 目前有：running, success, error
 */
export const setCellRunStatus = (cell, status) => {
  cell.setAttrByPath("runStatus/xlink:href", CELLSTATUS[status] || "")
  if (cell.getData()?._breakpoint && status === "SUCCESS") { //如果该节点打了断点，将断点设置为绿色
    // cell.setAttrByPath("circle/fill", "#8ef361")
  }
}
/**
 * @description 根据节点id，选中该节点
 * @param {*} nodeId 
 * @param {*} graph 
 */
export function selectNodeById(nodeId, graph) {
  if (!nodeId) return;
  graph = graph || useGraph().value;
  const node = graph.getCellById(nodeId); // 根据 ID 获取节点
  if (node) {
    graph.cleanSelection(); // 清除已有的选中项（可选）
    graph.select(node); // 选中目标节点
  } else {
    console.warn(`未找到 ID 为 ${nodeId} 的节点`);
  }
}
/**
 * @description: 判断是否是While节点
 * @param {*} cell 节点对象或者cell的data对象
 * @returns 
 */
export const isWhileNode = (cell) => {
  if (!cell) {
    // throw new Error("cell is undefined")
    return false
  }
  let data
  if (typeof (cell.isNode) === 'function' && cell.isNode()) {  //传入的是cell基类对象
    data = cell.getData();
  } else { //传入的是data对象
    data = cell
  }
  return data.name === "While"
}
/**
 * @description: 判断是否是Start/End节点
 * @param {*} cell 
 * @returns 
 */
export const isStartOrEndNode = (cell) => {
  if (!cell) {
    // throw new Error("cell is undefined")
    return false
  }
  let data
  if (typeof (cell.isNode) === 'function' && cell.isNode()) {  //传入的是cell基类对象
    data = cell.getData();
  } else { //传入的是data对象
    data = cell
  }
  return ["start", "end"].includes(data.name)
}
/**
 * @description: 判断是否是Python节点
 * @param {*} cell 
 * @returns 
 */
export const isPyNode = (cell) => {
  if (!cell) {
    // throw new Error("cell is undefined")
    return false
  }
  let data
  if (typeof (cell.isNode) === 'function' && cell.isNode()) {  //传入的是cell基类对象
    data = cell.getData();
  } else { //传入的是data对象
    data = cell
  }
  return data.name === "PythonCode"
}
