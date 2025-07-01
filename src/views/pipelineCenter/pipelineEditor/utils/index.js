import merge from 'lodash/merge';
import pick from 'lodash/pick';
import uniqueId from 'lodash/uniqueId';
import upperFirst from 'lodash/upperFirst';
import eventBus from "@/views/pipelineCenter/pipelineEditor/utils/eventBus";

const toLabelType = {
  "POINT2I" : "point",
  "ROI4I" : "roi",
  "string" : "template"
}
const toQueryString = obj => Object.keys(obj).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`).join('&');

const addListener = (target, eventName, handler) => {
  if (typeof handler === 'function') target.on(eventName, handler);
};

const  getBox=(x, y, width, height)=> {
  const x1 = (x + width) < x ? (x + width) : x
  const x2 = (x + width) > x ? (x + width) : x
  const y1 = (y + height) < y ? (y + height) : y
  const y2 = (y + height) > y ? (y + height) : y
  return {
      x1, x2, y1, y2
  }
}
const defaultItem  = {varName : '', varType: 'any'};
const conditionItem  = {varName : '', varType: 'int'};

function conditionPoints(name){
  if(name == 'IfElseTO') {
    let ifElseTo = {
      inPoints: [[0, 0.5, {...conditionItem}]],
      outPoints: [[1, 0.5, {...conditionItem, condition: 2, varName: 'TimeOut'}],
        [0.5, 0, {...conditionItem, condition: 0, varName: 'False'}], [0.5, 1, {
          ...conditionItem,
          condition: 1,
          varName: 'True'
        }]],
    }
    return ifElseTo
  }else if(name == 'IfElse') {
    let ifElse = {
      inPoints: [[0, 0.5, {...conditionItem}]],
      outPoints: [[0.5, 0, {...conditionItem, condition: 0, varName: 'False'}], [0.5, 1, {
        ...conditionItem,
        condition: 1,
        varName: 'True'
      }]],
    }
    return ifElse
  }
}
function evenlyDistributeVarName(flag, arr, varName) {
  if (!Array.isArray(arr) || arr.length === 0) {
    if(flag === 0){
      return [[0, 0.5, defaultItem]]
    }
    return [];
  }
  const result = [];

  const step = 1 / (arr.length + 1);

  for (let i = 0; i < arr.length; i++) {
    const end = (i + 1) * step;

    // 获取 varName 属性值
    const value = arr[i];

    // 添加到结果数组中
    result.push([flag, end, value]);
  }
  if(flag == 0){
    result.push([0.5, 0, defaultItem])
    result.push([0.5, 1, defaultItem])
  }
  return result;
}
/**
 * add edge hook
 * @param {*} graph 
 * @param {*} src 
 * @param {*} dst 
 * @param {*} target 
 * @param {*} model 
 * @param {*} index 
 * @param {*} source 
 * @returns 
 */
function autoMatchVar(graph, src, dst, target, model, index, source) {
  let matchingOutput = src.controlType == dst.controlType;
  // 如果找到匹配项，将其 varName 赋值给 inheritVariable
  if (matchingOutput || src.varType == dst.varType || dst.varType=="any") {
    if (arraysEqual(src.struct, dst.struct) || dst.varType=="any") {
      if(model.items != null && index < model.items.length && index >= 0) {
        model.items[index].inheritVariable = [];
        model.items[index].inheritVariable.push(src.varName);
        // 增加多点继承需求
        if(Array.isArray(model.items[index].inheritVariables) ){
          model.items[index].inheritVariables.push([src.varName]);
        }else {
          model.items[index].inheritVariables = [[src.varName]]
        }
        if(Array.isArray(model.items[index].inheritNodeIds) ){
          model.items[index].inheritNodeIds.push(source.id);
        }else {
          model.items[index].inheritNodeIds = [source.id]
        }

        model.items[index].inheritNodeId = source.id;
        model.items[index].variable = "";
        graph.update(target, model);
      }
      return true;
    }
  }
  return false;
}
function autoMatchVar111(graph, src, dst, target){
  for (let i = 0; i < dst.items.length; i++) {
    // 获取当前项的 controlType
    let currentItemControlType = dst.items[i].controlType;
    let currentItemStruct = dst.items[i].struct;
    // 在 outputs 中查找与当前项 controlType 相同的项
    let matchingOutput = src.outputs.find(output => output.controlType === currentItemControlType);


    // 如果找到匹配项，将其 varName 赋值给 inheritVariable
    if (matchingOutput) {
      if (arraysEqual(matchingOutput.struct, currentItemStruct)) {
        dst.items[i].inheritVariable = [];
        dst.items[i].inheritVariable.push(matchingOutput.varName);
        dst.items[i].inheritNodeId = src.id;
        dst.items[i].variable = "";
      }
    }
  }
  graph.update(target, dst);
}
function arraysEqual(arr1, arr2) {
  if(arr1 == null && arr2 == null) return true;
  if(arr1 != null && arr2 != null) {
      if (arr1.length !== arr2.length) return false;
      const arr1Copy = arr1.slice();
      const arr2Copy = arr2.slice();


      while (arr1Copy.length > 0) {
        const currentItem = arr1Copy.pop();

        const matchingIndex = arr2Copy.findIndex(item =>
            item.varName == currentItem.varName && item.varType == currentItem.varType
        );

        if (matchingIndex === -1) {
          // 没找到匹配项
          return false;
        }
        // 移除已匹配的项
        arr2Copy.splice(matchingIndex, 1);
      }

      // 如果成功匹配所有元素，返回 true
      return true;
    }
   return false;
}

function truncateStringToFitWidth(originalString, maxWidth, fontSize) {
  // 创建一个虚拟的DOM元素，用于测量字符串的宽度
  const testElement = document.createElement('div');
  testElement.style.position = 'absolute';
  testElement.style.visibility = 'hidden';
  testElement.style.width = 'auto';
  testElement.style.font = `${fontSize}px sans-serif`;
  document.body.appendChild(testElement);

  // 循环逐字符添加到虚拟元素中，直到字符串宽度超过最大宽度
  let truncatedString = '';
  for (const char of originalString) {
    testElement.textContent = truncatedString + char;
    if (testElement.offsetWidth <= maxWidth) {
      truncatedString += char;
    } else {
      break;
    }
  }
  if(truncatedString.length < originalString.length){
    truncatedString += "...";
  }

  // 移除虚拟元素
  document.body.removeChild(testElement);

  return truncatedString;
}
export {
  merge,
  pick,
  toQueryString,
  uniqueId,
  upperFirst,
  addListener,
  getBox,
  evenlyDistributeVarName,
  autoMatchVar,
  truncateStringToFitWidth,
  arraysEqual,
  conditionPoints,
  toLabelType
};