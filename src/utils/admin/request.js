/*
 * Copyright 2019-2020 Zheng Jie
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import axios from 'axios';
import qs from 'qs';

import { getToken, removeToken } from '@/utils/auth';
import notification from 'ant-design-vue/es/notification'
import Config from '@/settings';

import { HttpError } from '../base'

import mapper from '../../lib/api-map';
import router from '@/router'
function isWhiteList(url) {
  return /(api\/histogram)|(api\/distribution)/.test(url);
}

// 创建axios实例
const service = axios.create({
  // baseURL 在request拦截器中指定
  timeout: Config.timeout, // 请求超时时间
  withCredentials: true,
  // 格式化 query 中数组格式
  paramsSerializer(params) {
    return qs.stringify(params, { indices: false });
  },
});

// request拦截器
service.interceptors.request.use(
  (config) => {
    if (config.baseURL) {
      // 已经指定BaseURL，不修改
    } else {
      // console.log('config.url == ' + config.url);
    }
    config.baseURL = mapper(config.url); //;

    if (getToken()) {
      config.headers.Authorization = getToken(); // 让每个请求携带自定义token 请根据实际情况自行修改
    }
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
    return config;
  },
  (error) => {
    // Do something with request error
    // console.log(error); // for debug
    Promise.reject(error);
  }
);

// response 拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 如果请求的返回类型是流，则直接返回 data
    if (response.config.responseType === 'blob') {
      return res;
    }
    if (res.code === 403) {
      console.log('token过期了')
      removeToken();
      // window.location.reload(true); // 强制从服务器加载页面
      router.push("/login");
      return false;
    }
    // if the custom code is not 200, it is judged as an error.
    if (res.code !== 200) {
      console.log('状态码不为200')
      if (isWhiteList(response.config.url)) {
        return Promise.reject(res.msg || '请求异常');
      }
      return HttpError(res.msg || '请求异常', res.code);
    }
    if(res.code === 200){
      if(res.data){
        res.data.msg = res.msg || '操作成功';
      }
    }
    return res.data;
  },
  (error) => {
    if (error.response) {
      const { data } = error.response;
      // 目前后端返回会出现有 code 无 msg
      if (data && data.code) {
        if (data.code === 401) {
          notification.error({
            message: data.msg || 'Authorization verification failed',
            // description: 'Authorization verification failed'
          })
        }
        return HttpError(data.msg || '请求异常', data.code);
      }
      return HttpError(`请求异常：${error.response.statusText}`);
    }

    if (error.request) {
      return HttpError('请求异常：无返回结果');
    }

    return HttpError(error.message);
  }
);

export default service;

