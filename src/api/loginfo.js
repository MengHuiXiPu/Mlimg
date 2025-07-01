import request from '@/utils/admin/request';
import { API_MODULE_NAME } from '@/config/config'
import  {axios} from '@/utils/request'
import { method } from 'lodash';

  // 获取监控的POD服务版本以及实例列表
export function getlokiLogs(params) { 
    return axios({
      url: `/loki/api/v1/query_range`,
      method: 'get',
      params,
    });
}
//日志标签信息
export function getlokiLabels() { 
  return axios({
    url: `/loki/api/v1/labels`,
    method: 'get',
  });
}

//日志标签对应名称
export function getlokiLabelsName(params) { 
  return axios({
    url: `/loki/api/v1/label/${params}/values`,
    method: 'get',
  });
}
//通过任务名称获取实例、版本信息
export function getInstanceByTask(params){
    return request({
        url:``,
        method:'get',
        params
    })
}
export function getVerionsInstance(params){
  return axios({
    url:`/api/v1/monitor/ai/service/1`,
    method:'get',
    params
  })
}
