/** Copyright 2020 Tianshu AI Platform. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================
 */

import request from '@/utils/admin/request';
import { API_MODULE_NAME } from '@/config/config'

export function getProjects(param) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/projects/list` + param,
    method: 'get',
  });
}

export function getProjectById(id) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/projects/getProjectById?id=` + id,
    method: 'get',
  });
}

export function getProjectByUser() {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/projects/getProjectByUser`,
    method: 'get',
  });
}

export function getPersonalProjectById() {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/projects/getPersonalProjectById`,
    method: 'get',
  });
}

export function queryComputePool() {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/platformPool/queryAllComputePool`,
    method: 'get',
  });
}

export function queryStoragePool() {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/platformPool/queryAllStoragePool`,
    method: 'get',
  });
}

export function addProjects(data) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/projects/addProjects`,
    method: 'post',
    data,
  });
}

export function updateProjectSpace(data) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/projects/updateProjectSpace`,
    method: 'post',
    data,
  });
}

export function updateModuleConfig(data) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/projects/updateModuleConfig`,
    method: 'post',
    data,
  });
}



export function updateProjects(data) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/projects/updateProjects`,
    method: 'post',
    data,
  });
}

export function delProjects (ids) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/projects/${ids}`,
    method: 'delete'
  })
}

export function getPowerQuotaInfo(powerResourceId) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/projects/getQuotaInfo?powerResourceId=${powerResourceId}`,
    method: 'get',
  });
}

export function getStorageQuotaInfo(storageResourceId) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/projects/getQuotaInfo?storageResourceId=${storageResourceId}`,
    method: 'get',
  });
}


