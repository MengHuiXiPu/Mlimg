import axios from 'axios'
import notification from 'ant-design-vue/es/notification'

const http = axios.create({
  // baseURL: '/api/v1'
  baseURL: null
})

const err = (error) => {
  console.log("error: ", error)
  notification.error({
    // message: error.response.status,
    description: '服务器发生错误，请重试'
  })
  return Promise.reject(error)
}

// request interceptor
http.interceptors.request.use(config => {
  return config
}, err)

// response interceptor
http.interceptors.response.use((response) => {
  return response.data
}, err)

export default http