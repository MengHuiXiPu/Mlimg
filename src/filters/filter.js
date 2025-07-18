import Vue from 'vue'
import moment from 'moment'
import 'moment/locale/zh-cn'
moment.locale('zh-cn')

Vue.filter('NumberFormat', function (value) {
  if (!value) {
    return '0'
  }
  const intPartFormat = value.toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,') // 将整数部分逢三一断
  return intPartFormat
})

Vue.filter('moment', function (dataStr, pattern = 'YYYY-MM-DD HH:mm:ss') {
  if (dataStr) {
    return moment(dataStr).format(pattern)
  }
  return ''
})

Vue.filter('isNumber', function (dataStr, pattern = '&Y') {//需要过滤的字符串dataStr，格式化模式pattern
  if (String(dataStr).includes(pattern)) {
    return String(dataStr).replace('&Y', '') || ''
  }
  else {
    return String(dataStr) || ''
  }
})
