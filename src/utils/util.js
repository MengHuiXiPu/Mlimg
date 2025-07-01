import CryptoJS from 'crypto'
import moment from 'moment'
import { getDefaultConfig, downFile, downFileConfig } from '@/api/home'
import { getSystemConfig } from "@/api/dataCenter";
import axios from 'axios'
import message from 'ant-design-vue/es/message'
import store from '@/store'
export function timeFix () {
  const time = new Date()
  const hour = time.getHours()
  return hour < 9 ? '早上好' : hour <= 11 ? '上午好' : hour <= 13 ? '中午好' : hour < 20 ? '下午好' : '晚上好'
}

/**
 * 触发 window.resize
 */
export function triggerWindowResizeEvent () {
  const event = document.createEvent('HTMLEvents')
  event.initEvent('resize', true, true)
  event.eventType = 'message'
  window.dispatchEvent(event)
}

export function handleScrollHeader (callback) {
  let timer = 0

  let beforeScrollTop = window.pageYOffset
  callback = callback || function () {}
  window.addEventListener(
    'scroll',
    event => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        let direction = 'up'
        const afterScrollTop = window.pageYOffset
        const delta = afterScrollTop - beforeScrollTop
        if (delta === 0) {
          return false
        }
        direction = delta > 0 ? 'down' : 'up'
        callback(direction)
        beforeScrollTop = afterScrollTop
      }, 50)
    },
    false
  )
}

export function isIE () {
  const bw = window.navigator.userAgent
  const compare = (s) => bw.indexOf(s) >= 0
  const ie11 = (() => 'ActiveXObject' in window)()
  return compare('MSIE') || ie11
}

/**
 * Remove loading animate
 * @param id parent element id or class
 * @param timeout
 */
export function removeLoadingAnimate (id = '', timeout = 1500) {
  if (id === '') {
    return
  }
  setTimeout(() => {
    document.body.removeChild(document.getElementById(id))
  }, timeout)
}

// DES 加密 [str: 需要加密的str； key：秘钥]
export const encryptByDES = (str, key) => {
  var keyHex = Buffer.from(key)
  var iv = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8])
  var cipher = CryptoJS.createCipheriv('des-cbc', keyHex, iv)
  cipher.setAutoPadding(true) // default true
  var ciph = cipher.update(str, 'utf8', 'base64')
  ciph += cipher.final('base64')
  return ciph
}

export const setDocumentTitle = function (title) {
  document.title = title
  const ua = navigator.userAgent
  // eslint-disable-next-line
  const regex = /\bMicroMessenger\/([\d\.]+)/
  if (regex.test(ua) && /ip(hone|od|ad)/i.test(ua)) {
    const i = document.createElement('iframe')
    i.src = '/favicon.ico'
    i.style.display = 'none'
    i.onload = function () {
      setTimeout(function () {
        i.remove()
      }, 9)
    }
    document.body.appendChild(i)
  }
}

// 时间戳转换格式
function add0 (m) { return m < 10 ? '0' + m : m }
export const timestampToDatetime = (timestamp, mode = 1) => {
  if (!timestamp) {
    return ''
  }
  var time = new Date(timestamp)
  var y = time.getFullYear()
  var m = time.getMonth() + 1
  var d = time.getDate()
  var h = time.getHours()
  var mm = time.getMinutes()
  var s = time.getSeconds()
  if (mode === 1) {
    return y + '-' + add0(m) + '-' + add0(d) + ' ' + add0(h) + ':' + add0(mm) + ':' + add0(s)
  } else if (mode === 2) {
    return y + '-' + add0(m) + '-' + add0(d)
  }
}

export const getParameterByName = (name) => {
  // eslint-disable-next-line
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]")
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)')
  const results = regex.exec(location.search)
  return results == null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '))
}
// 获取根域名
export const rootDomain = () => {
  const regIp = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/
  // eslint-disable-next-line no-useless-escape
  const partIp = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\:([0-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-5]{2}[0-3][0-5])$/
  if (regIp.test(location.host)) {
    return location.host
  }
  if (partIp.test(location.host)) {
    return location.host.split(':')[0]
  }
  if (location.host.includes('localhost')) {
    return 'localhost'
  }
  const hostArr = location.host.split('.')
  if (hostArr.length === 2) {
    return hostArr.join('.')
  }
  return hostArr.slice(1).join('.')
}

export const domTitle = 'tcl-Cli'

// bucketName 文件下载
export const BUCKET_NAME = 'tcl'
// 本地文件的地址，a标签不能获取代理地址
export const FILE_URL = 'http://ai.tcl.cn:32467'

// 下载文件
export const downloadFile = async (url) => {
  const el = document.createElement('a')
  el.style.display = 'none'
  el.href = url
  el.setAttribute('download', '')
  // console.log("downloadFile: " + url)
  document.body.appendChild(el)
  el.click()
  document.body.removeChild(el)
  // console.log("clicked: " + url)
  // const head = await downFileConfig(url)
  // const fileName = head.headers['content-disposition'].split(";")[1].split("=")[1]
  // if (store.state.app.downloadList.filter(item => item.name === fileName).length > 0) {
  //   message.warning('当前任务已经在下载队列中')
  //   return false
  // }
  // const id = new Date().getTime()
  // store.commit('SHOW_DOWNLOAD', true)
  // store.commit('SET_DOWNLOAD', {
  //   id,
  //   name: fileName,
  //   status: 'active',
  //   progress: 0
  // })
  // const onDownloadProgress = (params) => {
  //   store.commit('SET_DOWNLOAD', {
  //     id,
  //     name: fileName,
  //     status: params.loaded === params.total ? 'success' : 'active',
  //     progress: (params.loaded / params.total * 100).toFixed(2)
  //   })
  // }
  // return downFile(url, onDownloadProgress).then(res => {
  //   const el = document.createElement('a')
  //   el.style.display = 'none'
  //   el.href = window.URL.createObjectURL(res.data)
  //   el.download = fileName
  //   el.click()
  //   // 清除缓存
  //   window.URL.revokeObjectURL(window.URL.createObjectURL(res.data))
  //   store.commit('SET_DOWNLOAD', {
  //     id,
  //     name: fileName,
  //     status: 'success',
  //     progress: store.state.app.downloadList.filter(item => item.id === id)[0].progress
  //   })
  // }).catch(() => {
  //   store.commit('SET_DOWNLOAD', {
  //     id,
  //     name: fileName,
  //     status: 'exception',
  //     progress: store.state.app.downloadList.filter(item => item.id === id)[0].progress
  //   })
  // })
}



export  const downloadRes =(urlVal) => {
  // return `/api/v1/algorithm/imageManageInfo/downCalculate?zipFilePath=${params}`
  // return axios({
  //   url: '/api/v1/imagemanage/imageManageInfo/downCalculate',
  //   method: 'get',
  //   params
  // })
  return axios({
    url: urlVal,
    method: 'get',
    family: -2,
    // responseType: 'blob'
  })
}

// 图片地址
export const getImageUrl = (url, type) => {
  const isDev = process.env.NODE_ENV === "development"
  return isDev ? `${FILE_URL}${url}/${type}` : `${url}/${type}`
}
// 图片下载地址
export const getDownloadimageUrl = (url, type) => {
  return `${url}/${type}`
}

// 处理矩阵的头部
export const getMatrixColumns = (head = []) => {
 return head.map((item, index) => {
    const obj = {
      title: item.title,
      dataIndex: item.key,
      key: item.key,
      align: 'center',
      isNum: item.isNum
    }
    if (item.isNum) {
      obj.scopedSlots = { customRender: "isNum" }
      obj.width = 100
      obj.customCell = (record, iddex) => {
        const cellStyle = "padding: 0"
        return { style: cellStyle }
      }
    }
    if (index === 0 || index === 1) {
      obj.width = 120
    }
    return obj
  })
}

// ip:port;p:port检验 /^(reg;)?reg$/g
// eslint-disable-next-line no-useless-escape
export const KafkaIPReg = /^((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\:([0-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-5]{2}[0-3][0-5]);)?(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\:([0-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-5]{2}[0-3][0-5])$/g

// eslint-disable-next-line no-useless-escape
export const RVIPReg = /^(tcp:)(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\:([0-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-5]{2}[0-3][0-5])$/

// eslint-disable-next-line no-useless-escape
export const networkIPReg = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\:([0-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-5]{2}[0-3][0-5])$/

// 查询参数处理
export const getParams = (param, that, type) => {
  that.loading = true
  // 树节点的
  //param有dataRef属性，则拆出来赋值给nodeCode和id
  if (param?.dataRef) {
    that.nodeCode = param?.dataRef?.nodeCode
    that.nodeId = param?.dataRef?.id
  }
  // 如果请求没有分页相关的，就修改分页为默认值
  if (!(param?.pageSize && param?.pageIndex)) {
    that.pagination.current = 1
    that.pagination.pageSize = 10
  }
  //声明params，赋值limit和pageNo属性，若无赋值则默认为10和1
  let params = {
    limit: param?.pageSize || 10,
    pageNo: param?.pageIndex || 1,
  }
  //按照类型分别对params进行不同的扩展，添加新属性
  switch (type) {
    case "dataMrg":  
      params = {
        ...params,
        dlName: param?.search || "",
        dlType: that.tabActiveKey || 1,
        dlTagType: param?.dlTagType || "",
      }
      break
    case "modelDataMrg":
      params = {
        ...params,
        dlName: that.search,
        dlType: that.tabActiveKey || 1,
        dlTagType: param?.dlTagType || "",
        source: 'traincenter',
      }
      break
    case "offlineDataMrg":
      params = {
        ...params,
        dlName: that.search,
        dlType: that.tabActiveKey || 2,
        dlTagType: param?.dlTagType || "",
        source: 'traincenter',
      }
      break
    case "mirror":
      params = {
        ...params,
        // imageName: that.search || "",
        // tagType: param?.tagType || "",
        supportDistTraining: param?.supportDistTraining,
        imageType: that.tabActiveKey || 1
      }
      break
    case "model":
      params = {
        ...params,
        modelName: param?.search || '',
        modelType: that.tabActiveKey || 1,
      }
      break
    case "offline":
      params = {
        ...params,
        taskName: param?.search || "",
        modelType: that.tabActiveKey || 1,
      }
      // 模型管理详情页中的离线预测
      if (param?.modelId) {
        params = {
          ...params,
          modelId: param?.modelId,
          taskName: param?.search || "",
          modelType: param?.modelType,
        }
      }
      break
    case "catalog":
      params = {
        ...params,
        taskName: param?.search || ""
      }
      break
  }

  // 点击树节点
  if (that.nodeCode) params.nodeCode = that.nodeCode
  if (that.nodeId) params.nodeId = that.nodeId

  return params
}

// moment时间处理函数
export const formatTime = (time, format = "YYYY-MM-DD HH:mm:ss") => {
  return moment(time).format(format)
}

export const checkColor = (num) => {
  let color = '#fff'
  if (num < 2) {
    color = 'rgb(206, 218, 241,1)'
  } else if (num >= 2 && num <= 12) {
    color = 'rgb(100, 144, 236,1)'
  } else {
    color = 'rgb(37, 105, 246, 1)'
  }
  return color
}
// 混淆矩阵处理颜色
export const getBackgroundStyle = (num) => {
  if (String(num).includes('&Y')) {
    return {
      background: checkColor(Number(String(num).replace('&Y', ''))),
      color: '#fff'
    }
  } else {
    return {
      background: '#fff'
    }
  }
}
// 获取CPU,GPU默认配置
export const getResourceConfig = async () => {
  const res = await getDefaultConfig()
  // 查询cpu 内存最大数限制
  const others = await Promise.all(['cpu_size_max', 'mem_size_max'].map((key => getSystemConfig({keyName: key}))))
  const cpu_size_max = (others[0]?.data?.valueInfo || 1) * 1
  const mem_size_max = (others[1]?.data?.valueInfo || 16) * 1
  if (res.code !== 0) return false
  const { default_cpu_core,
    default_gpu_mem_size,
    default_gpu_num,
    default_mem_size,
    default_message_timeout,
    gpu_size_max,
    task_num_max,
    default_validation_set,
    batch_move_max_size
  } = res.data
  return {
    cpu_core_default: default_cpu_core,
    cpu_size_default: default_mem_size,
    gpu_core_default: default_gpu_num,
    gpu_size_default: default_gpu_mem_size,
    default_message_timeout,
    gpu_size_max,
    task_num_max,
    default_validation_set,
    batch_move_max_size,
    cpu_size_max,
    mem_size_max,
  }
}
// 下载资源定位uri, 后端返回下载链接，设置响应头content-disposition，前端打开即可触发浏览器下载
export const openDownloadURI = path => {
  window.open(`${location.origin}${path}`)
}
/**
 * @description读取图片的像素(宽高)
 * @param {*} url 图片url
 * @returns 
 */
export const getImageSize = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // 监听图片加载完成
    const onLoad = () => {
      // 获取宽高
      const dimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight
      };
      // 清理
      img.onload = null;
      img.onerror = null;
      img.src = ''; // 释放对图片的引用
      resolve(dimensions);
    };
    // 监听图片加载失败
    const onError = (error) => {
      // 清理
      img.onload = null;
      img.onerror = null;
      img.src = ''; // 释放对图片的引用
      reject(new Error('Failed to load image: ' + error));
    };
    // 绑定事件
    img.onload = onLoad;
    img.onerror = onError;
    // 开始加载图片
    img.crossOrigin = 'Anonymous'; // 解决跨域问题
    img.src = url;
  });
}
