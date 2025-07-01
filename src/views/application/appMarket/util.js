/**
 * 根据矩形区域坐标值，生成一个拼接id
 * @param {*} rect 
 */
export function generateId(rect = []) {
  if(!Array.isArray(rect)) {
    throw new Error('please input Array')
  }
  // 转换成字符串拼接
  return rect.reduce((accumulator, currentValue) => { return accumulator +'' + currentValue;})
}