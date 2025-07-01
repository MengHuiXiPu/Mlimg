/**
 * 生成校验函数
 * @param {String} regText  正则文本
 * @param {String} msg  错误信息 
 */
export function createValidator(regText, msg) {
  const reg = new RegExp(regText)
  /**
   * 符合form调用方式的校验函数
   * 仅对格式进行校验，不做必填校验
   */
  return function(rule, value, callback) {
    if(value === undefined || value === null || value === '' || reg.test(value)) {
      callback()
    } else {
      callback(new Error(msg))
    }
  }
}

/** 若干个邮箱校验 */
export const emailRegText = '\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*'
export const validatorEmails = createValidator(`^(${emailRegText},)*(${emailRegText})$`, '请输入正确的邮箱格式，多个邮箱以英文逗号分隔')

/** 固话校验 */
export const telRegText = '(\\d{3,4}-)?\\d{7,8}'
export const validatorTel = createValidator(`^${telRegText}$`, '请输入正确的固话（格式：区号+号码,如010-1234567）')

/** 手机号校验 */
export const mobileRegText = '1[3|4|5|6|7|8|9]\\d{9}'
export const validatorMobile = createValidator(`^${mobileRegText}$`, '请输入正确的电话号码')

/** 手机号码或者固话校验 */
export const validatorMobileOrTel = createValidator(`^${mobileRegText}$|^${telRegText}$`, '请输入正确的电话号码或者固话号码')

/** 身份证校验 */
export const idNoRegText = '[1-9]\\d{7}((0\\d)|(1[0-2]))(([0|1|2]\\d)|3[0-1])\\d{3}$|^[1-9]\\d{5}[1-9]\\d{3}((0\\d)|(1[0-2]))(([0|1|2]\\d)|3[0-1])\\d{3}([0-9]|X)'
export const validatorIdNo = createValidator(`^${idNoRegText}$`, '请输入正确的身份证号码')

/** IP校验 */
export const ipRegText = '(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])'
export const validatorIp = createValidator(`^${ipRegText}$`, '请输入正确的IP地址')

/** url校验 */
export const urlRegText = '(https?:\\/\\/([\\w-]+\\.)+[\\w-]+(/?[\\w-./?%&=]*)?)|([a-zA-Z]+://[^\\s]*)'
export const validatorUrl = createValidator(`^${urlRegText}$`, '请输入正确的url')
