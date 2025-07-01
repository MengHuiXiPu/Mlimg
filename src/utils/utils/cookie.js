import Cookie from 'js-cookie'
import { ipRegText } from './validate'

/** 获取根域名 */
const rootDomain = ()=>{
  if (location.hostname === 'localhost' || new RegExp(`^${ipRegText}$`).test(location.hostname)) {
    return location.hostname
  } else {
    let hostArr = location.hostname.split('.')
    if (hostArr.length <= 2) hostArr.join('.')
    else return hostArr.slice(hostArr.length-2).join('.')
  }
}
/**
 * 设置cookie
 * @param  {String} name
 * @param  {String} value
 */
export function setCookie(name, value) {
  Cookie.set(name, value, {domain: rootDomain()})
}
/**
 * 读取cookie
 * @param  {String} name
 */
export function getCookie(name) {
  return Cookie.get(name, {domain: rootDomain()})
}
/**
 * 移除cookie
 * @param  {String} name
 */
export function removeCookie(name = '') {
  if(name) {
    Cookie.remove(name, {domain: rootDomain()})
  }
}
/**
 * 移除所有cookie
 */
export function clearCookie() {
  Object.keys(Cookie.get() || {}).forEach(key => {
    Cookie.remove(key, {domain: rootDomain()})
  })
}