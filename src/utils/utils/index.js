import CryptoJS from 'crypto'
import moment from 'moment'
import * as api from './api'
import * as auth from './auth'
import * as validate from './validate'

export { api, auth, validate }

/**
 * DES加密
 * @param {string} str 被加密的明文
 * @param {string} key 密钥
 */
export const encryptByDES = (str, key) => {
  var keyHex = Buffer.from(key)
  var iv = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8])
  var cipher = CryptoJS.createCipheriv('des-cbc', keyHex, iv)
  cipher.setAutoPadding(true) // default true
  var ciph = cipher.update(str, 'utf8', 'base64')
  ciph += cipher.final('base64')
  return ciph
}

/**
 * 数据或树结构扁平化
 * @param {Array|Object} datas 数组或对象
 * @param {String} key 子节点属性 
 */
export function flat(datas = [], key = 'children') {
  let list = [], item = null
  const flatList = []
  if(Array.isArray(datas)) {
    list = [].concat(datas)
  } else {
    list.push(datas)
  }
  while(item = list.shift()) {
    if(item[key] && item[key].length) {
      list = list.concat(item.children.map(c => ({...c, parent: item})))
    }
    flatList.push(item)
  }
  return flatList
}

/** 
 * 字符串首字母转大写
 * @param {String} str 被转换字符
 */
export const firstUpperCase = (str) => {
  if(typeof str !== 'string') return ''
  return str.substr(0, 1).toLocaleUpperCase() + str.substr(1).toLocaleLowerCase()
}

export function createForm(initData) {
  if(initData.constructor !== Object) {
    throw new Error('函数createFormClass只接受普通对象作为初始数据')
  }
  initData = cloneDefObj(initData)
  return class Form {
    constructor(data) {
      Object.assign(this, cloneDefObj(initData), data)
      Object.defineProperty(this, '_isForm', {
        value: true,
        configurable: false,
        enumerable: false,
        writable: false
      })
    }
    reset(...keys) {
      if(keys.length) {
        keys.forEach(key => {
          if(initData.hasOwnProperty(key)) this[key] = clone(initData[key])
          else console.warn('初始化数据中不存在key: ', key)
        })
      } else {
        Object.assign(this, cloneDefObj(initData))
      }
    }
    init() {
      Object.keys(this).forEach(key => {
        if(initData.hasOwnProperty(key)) this[key] = clone(initData[key])
        else delete this[key]
      })
    }
    static add(key, value) {
      if(initData.hasOwnProperty(key)) console.warn(`初始化数据中已存在key：${key}，请使用set函数。`)
      else initData[key] = clone(value)
    }
    static set(key, value) {
      if(initData.hasOwnProperty(key)) initData[key] = clone(value)
      else console.warn('初始化数据中不存在key: ', key)
    }
    static get(key) {
      if(initData.hasOwnProperty(key)) return initData[key]
      else console.warn('初始化数据中不存在key: ', key)
    }
    static del(key) {
      if(initData.hasOwnProperty(key)) delete initData[key]
      else console.warn('初始化数据中不存在key: ', key)
    }
  }
}
createForm.new = function(initData) {
  return new (createForm(initData))()
}

export function clone(target) {
  const type = typeof target
  switch(type) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'undefined':
    case 'symbol':
      return target
  }
  if(target === null) return null
  else if(Array.isArray(target)) return target.map(clone)
  else if(target._isAMomentObject) return moment(target)
  else if(target.constructor === Date) return new Date(target - 0)
  else if(target.constructor === Map) return cloneMap(target)
  else if(target.constructor === Set) return new Set(target)
  else return cloneDefObj(target)
}

function cloneDefObj(target) {
  return Object.entries(target).reduce(function(obj, [key, value]) {
    obj[key] = clone(value)
    return obj
  }, {})
}

function cloneMap(target) {
  const map = new Map()
  target.forEach((value, key) => {
    map.set(clone(key), clone(value))
  })
  return map
}