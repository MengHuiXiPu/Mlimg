import Vue from 'vue'
import http from 'axios'
import store from '@/store'
import Cookie from 'js-cookie'
import { rootDomain } from '@/utils/util'
import notification from 'ant-design-vue/es/notification'
// import { Message } from 'element-ui';
import { message as Message } from './resetMessgae'
import { getToken, removeToken } from '@/utils/auth';
import mapper from '../lib/api-map';

// 创建 axios 实例
// const service = axios.create({
//   timeout: 180000 // 请求超时时间
// })
const whitelist = [
  "/api/v1/pipelinecenter/operator/python/parse-code"
]
http.defaults.timeout = 0
const err = (error) => {
  if (error.response) {
    const data = error.response.data
    window._env_ = window._env_ || {}
    // const tokenType = Cookie.get(window._env_.COOKIE_TOKENTYPE_KEY || "token_type", { domain: rootDomain() })
    // const token = Cookie.get(window._env_.COOKIE_TOKEN_KEY || 'access_token', { domain: rootDomain() })
    const tokenType = window._env_.COOKIE_TOKENTYPE_KEY !== undefined? Cookie.get(window._env_.COOKIE_TOKENTYPE_KEY || "token_type", { domain: rootDomain() }) : null;
    const token = window._env_.COOKIE_TOKEN_KEY !== undefined? Cookie.get(window._env_.COOKIE_TOKEN_KEY || 'access_token', { domain: rootDomain() }) : null;
    if (error.response.status === 403) {
      notification.error({
        message: 'Forbidden',
        description: data.message
      })
    }
    if (error.response.status === 401) {
      notification.error({
        message: 'Unauthorized',
        description: 'Authorization verification failed'
      })
      if (token && tokenType) {
        store.dispatch('Logout').then(() => {
          const isDev = process.env.NODE_ENV === 'development'
          if (isDev) {
            setTimeout(() => {
              window.location.reload()
            }, 1500)
          } else {
            const fromUrl = location.href
            const httpUrl = location.protocol + '//' + location.host
            window.location.href = `${httpUrl}/auth/login?fromUrl=${fromUrl}`
          }
        })
      }
    }
    // if (error.response.status === -1) {
    //   console.log("axios data", data);
    //   notification.error({
    //     message: error.response.status,
    //     description: data.msg
    //   })
    // }
    // 停止tensonboard服务的接口，因前端不好判断modelid对应的服务是否启动，只能在离开训练页面时就调用一下，如果没有启动会报错，不显示处理即可
    if((error.response.config?.url || "").includes('/adapter/stop_tensorboard')) {
      return
    }
    if (error.response.status !== 401 && error.response.status !== 403 && error.response.headers['upload-response'] !== 'finish') {
      // if(data.message || data.msg || data.error) {  //强烈要求修改为 存在msg才提示，不存在msg就当没有异常0.0
      notification.error({
        message: error.response.status,
        description: data.message || data.msg || data.error || "Internal Server Error"
      })
      // }
    }
  }
  return Promise.reject(error)
}
// request interceptor
http.interceptors.request.use(config => {
  if (config.baseURL) {
    // 已经指定BaseURL，不修改
  } else {
    config.baseURL = mapper(config.url);
  }
  config.baseURL = mapper(config.url); //;
  if (getToken()) {
      config.headers['Authorization'] = getToken(); //tokenType + ' ' + token // 让每个请求携带自定义 token 请根据实际情况自行修改
    }
  config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
  return config
}, err)

// response interceptor
http.interceptors.response.use((response) => {
  if (response.data.code === 403) {
    removeToken();
    window.location.reload();
    return false;
  }
  if (response.data.code === 401) {
    if (getToken()) {
      notification.error({
        message: 'Unauthorized',
        description: 'Authorization verification failed'
      })
      store.dispatch('LogOut').then(() => {
        const isDev = process.env.NODE_ENV === 'development'
        if (isDev) {
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        } else {
          const fromUrl = location.href
          const httpUrl = location.protocol + '//' + location.host
          window.location.href = `${httpUrl}/auth/login?fromUrl=${fromUrl}`
        }
      })
    }
  } else if (response.data.code && (response.data.code !== 0 && response.data.code !== 200)   && !whitelist.includes(response.config.url)) {
    Message.warning(response.data?.msg || response.data?.message)
  }else if(response?.data?.code !==0 && response?.data?.msg !=='success'){ //后端太乱了...
    Message.warning(response.data?.msg || response.data?.message)
  }
  //兼容blob数据传输接口
  if(response.config.family == -1 || response.config.family == -2){
    const base64Data = response.data.data;
    const binaryData = atob(base64Data); // 解码 Base64 数据
    const arrayBuffer = new ArrayBuffer(binaryData.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < binaryData.length; i++) {
      uint8Array[i] = binaryData.charCodeAt(i);
    }
    if(response.config.family == -1) {
      const blobData = new Blob([arrayBuffer], {type: 'image/*'}); // 创建 Blob 对象
      return blobData;
    }
    if(response.config.family == -2){
      const blob = new Blob([arrayBuffer]); // 创建 Blob 对象
      // 创建下载链接
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.style.display = 'none';  // 隐藏下载链接
      try{
        let params = response.config.params;
        downloadLink.download = params.zipFilePath
      }catch (e) {
         downloadLink.download = response.config.url.split('/').pop();  // 提取文件名
      }
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }

  }
  return response.data
}, err)

// export default http;
export {
  http as axios
}