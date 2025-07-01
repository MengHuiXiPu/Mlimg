import uniqueId from 'lodash/uniqueId';

/**
 * uniqueId+时间戳，生成一个唯一数字 ID，（不足够严谨，但够用）
 * @returns {number} - 返回生成的唯一数字ID
 */
export function uniqueNumericId(prefix = '') {
  // 使用 lodash 的 uniqueId 生成唯一部分，结合时间戳的最后6位数字
  const uniquePart = uniqueId();
  const timestampPart = Date.now().toString().slice(-6); // 只取时间戳最后6位

  // 将生成的字符串 ID 转换为数字类型
  const numericId = Number(uniquePart + timestampPart);

  return numericId;
}


// 该方法不再使用，需求上又不需要展示序号id了
/**
 * @description 从1开始，在graph上按照顺序生成数字id
 * 目前仅判断节点以及用于节点id，edge和port仍然使用uniqueNumericId
 * @param {*} graph 
 * @returns 
 */
export function sequenceNumericId(graph, sliceLength = 0) {
  // 获取graph上的所有节点
  const nodes = graph.getNodes() || []
  // 截取复制前的node，即有效节点
  const oiginalNodes = nodes.slice(0, nodes.length - sliceLength)
  // const nodes = (graph.getNodes() || []).filter(node => node.getProp()?.isClone !== true);
  // 映射出id列表并排序
  const ids = oiginalNodes.map(node => parseInt(node.id)).sort((a, b) => a - b);
  // const ids = nodes.map(node => node.getData()?._incrementId).sort((a, b) => a - b);
  // console.log(ids)
  return ids.length ? ids[ids.length - 1] + 1 : 1;
}