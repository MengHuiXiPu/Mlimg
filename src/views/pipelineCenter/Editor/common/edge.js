/**
 * @description 处理edge连线的方法集
 */


/**
 * 判断连线是否和ifesle/ifelseto/switch节点有关，有的话，为其set condition属性
 * @param {*} cell cell实例
 * @param {*} cellData cell数据,作为写入condition字段的目标
 */
export const setCondition = (cell, cellData) => {
  const source = cell.getSourceNode()
  // const target = cell.getTargetNode()
  // 先处理switch的情况： 仅需要关注该edge是否从switch节点出去
  if (source && source.getData()?.name === "Switch") {
    // 获取该edge的起始接线桩id
    const sourcePortId = cell.getSourcePortId()
    // 根据起始接线桩id，获取该edge的起始节点的输出端口信息
    // const sourcePort = source.getPort(sourcePortId)
    // const sourcePortData = sourcePort.getData()
    // 读取port的attrs/text/text属性，作为condition字段写入cellData
    const condition = source.getPortProp(sourcePortId, "attrs/text/text")
    cellData.condition = condition
  }
  // 如果edge是从ifelse/ifelseto节点连出的
  if (source && ['IfElse', 'IfElseTO'].includes(source.getData()?.name)) {
    // 获取该edge的起始接线桩id
    const sourcePortId = cell.getSourcePortId()
    const tranformMap = {
      "p_left": 0, //对应false
      "p_right": 1,  //对应true
      "p_bottom": 2, // 对应timeout
    }
    // console.log(sourcePortId)
    cellData.condition = tranformMap[sourcePortId]
  }
}