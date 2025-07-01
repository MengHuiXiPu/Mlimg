/**
 * @description: 用于表单验证validator
 */

export const checkNotSpace = async (rule, value, callback) => {
  if (!value || !value.trim()) {
    callback(new Error('当前值不能为空'))
  } else {
    callback()
  }
}