import { axios } from '@/utils/request'
import {API_MODULE_NAME} from "@/config/config";

/**
 * 获取所有资源池的ID和名称
 * @returns {Promise}
 */
export function getAllPollComputeIdName() {
    return axios({
        url: `/${API_MODULE_NAME.ADMIN}/platformResource/getAllPollComputeIdName`,
        method: 'get'
    });
}

/**
 * 获取主机列表及统计信息
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getHostList(params) {
    return axios({
        url: `/${API_MODULE_NAME.ADMIN}/platformResource/host`,
        method: 'get',
        params
    });
}

/**
 * 获取没有被分配的主机列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getUnAssignedHost(params) {
    return axios({
        url: `/${API_MODULE_NAME.ADMIN}/platformResource/unAssignedHost`,
        method: 'get',
        params
    });
}

/**
 * 获取所有存储资源池的ID和名称
 * @returns {Promise}
 */
export function getAllPollStorageIdName() {
    return axios({
        url: `/${API_MODULE_NAME.ADMIN}/platformResource/getAllPollStorageIdName`,
        method: 'get'
    });
}

/**
 * 获取PVC列表及统计信息
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getPVCList(params) {
    return axios({
        url: `/${API_MODULE_NAME.ADMIN}/platformResource/pvc`,
        method: 'get',
        params
    });
}

/**
 * 查询所有PVC信息
 * @param {Long} pvcId - PVC ID（非必填）
 * @returns {Promise}
 */
export function queryAllPvcs(pvcId) {
    return axios({
        url: `/${API_MODULE_NAME.ADMIN}/platformResource/queryAllPvcs`,
        method: 'get',
        params: { pvcId }
    });
}

/**
 * 获取资源池列表
 * @param {Object} params 查询参数，例如 { name: "资源池名称" }
 * @returns {Promise} 返回资源池列表
 */
export function getResourcePools(params) {
    return axios.get(`/${API_MODULE_NAME.ADMIN}/platformPool/queryComputePool`, {
        params
    });
}

/**
 * 根据资源池ID获取主机信息
 * @param {number} poolId 资源池ID
 * @returns {Promise} 返回主机信息列表
 */
export function getHostsByPoolId(poolId) {
    return axios.get(`/${API_MODULE_NAME.ADMIN}/platformPool/queryComputePool2Host`, {
        params: { id: poolId }
    });
}

/**
 * 添加算力资源池
 * @param {Object} data 资源池信息
 * @param {string} data.name 资源池名称
 * @param {string} data.description 资源池描述
 * @returns {Promise} 返回添加结果
 */
export function addComputePool(data) {
    return axios.post(`/${API_MODULE_NAME.ADMIN}/platformPool/addComputePoll`, data);
}

/**
 * 修改算力资源池
 * @param {Object} data 资源池信息
 * @param {Object} data.id 资源池信息
 * @param {string} data.name 资源池名称
 * @param {string} data.description 资源池描述
 * @returns {Promise} 返回添加结果
 */
export function updateComputePoll(data) {
    return axios.put(`/${API_MODULE_NAME.ADMIN}/platformPool/updateComputePoll`, data);
}

/**
 * 删除算力资源池
 * @param {string} id 资源池ID
 * @returns {Promise} 返回删除操作的结果
 */
export function deleteComputePool(id) {
    return axios.delete(`/${API_MODULE_NAME.ADMIN}/platformPool/deleteComputePoll`, {
        data: { id }
    });
}

/**
 * 添加主机到算力资源池
 * @param {Object} data 请求参数，例如 { poolId: 10, hostIds: [21, 22, 23] }
 * @returns {Promise} 返回接口调用的 Promise
 */
export function addHosts2ComputePoll(data) {
    return axios.post(`/${API_MODULE_NAME.ADMIN}/platformPool/addHosts2ComputePoll`, data);
}

/**
 * 从算力资源池中移除主机
 * @param {Object} params 请求参数，例如 { hostId: "2", poolId: "1" }
 * @returns {Promise} 返回移除操作的结果
 */
export function removeHostFromComputePool(params) {
    return axios.delete(`/${API_MODULE_NAME.ADMIN}/platformPool/removeHostFromComputePool`, {
        data: params
    });
}

/**
 * 存储资源池列表
 * @returns {Promise} 所有存储资源池
 */
export function queryStoragePool(params) {
    return axios.get(`/${API_MODULE_NAME.ADMIN}/platformPool/queryStoragePool`, {
        params
    });
}

/**
 * 添加存储资源池接口
 * @param {Object} data 请求参数
 * @returns {Promise}
 */
export function addStoragePool(data) {
    return axios.post(`/${API_MODULE_NAME.ADMIN}/platformPool/addStoragePool`, data);
}

/**
 * 修改存储资源池
 * @param {Object} data 资源池信息
 * @param {Object} data.id 资源池信息
 * @param {string} data.name 资源池名称
 * @param {string} data.description 资源池描述
 * @returns {Promise} 返回添加结果
 */
export function updateStoragePool(data) {
    return axios.put(`/${API_MODULE_NAME.ADMIN}/platformPool/updateStoragePool`, data);
}

/**
 * 删除存储资源池
 * @param {string} id 资源池ID
 * @returns {Promise} 返回删除操作的结果
 */
export function deleteStoragePool(id) {
    return axios.delete(`/${API_MODULE_NAME.ADMIN}/platformPool/deleteStoragePool`, {
        data: { id }
    });
}

/**
 * 判断算力资源池是否被引用
 * @param {Object} deleteDTO - 请求参数对象
 * @returns {Promise} - 返回一个 Promise，包含接口响应数据
 */
export function queryComputePoolIsUsed(deleteDTO) {
    return axios.get(`/${API_MODULE_NAME.ADMIN}/platformPool/queryComputePoolIsUsed`, {
        params: deleteDTO
    });
}

/**
 * 判断主机是否可以移除
 * @param {Object} removeDTO - 请求参数对象
 * @returns {Promise} - 返回一个 Promise，包含接口响应数据
 */
export function queryHostCanRemove(removeDTO) {
    return axios.get(`/${API_MODULE_NAME.ADMIN}/platformPool/queryHostCanRemove`, {
        params: removeDTO
    });
}

/**
 * 判断存储资源池是否被引用
 * @param {Object} storagePool - 请求参数对象，包含存储资源池的 ID
 * @returns {Promise} - 返回一个 Promise，包含接口响应数据
 */
export function queryStoragePoolIsUsed(storagePool) {
    return axios.get(`/${API_MODULE_NAME.ADMIN}/platformPool/queryStoragePoolIsUsed`, {
        params: storagePool
    });
}

/**
 * 实时刷新主机信息
 */
export function refreshHostInfo() {
    return axios.get(`/${API_MODULE_NAME.ADMIN}/platformResource/refreshHost`);
}

/**
 * 实时刷新PVC信息
 */
export function refreshPvcInfo() {
    return axios.get(`/${API_MODULE_NAME.ADMIN}/platformResource/refreshPvc`);
}

/**
 * 判断资源池是否被项目引用
 */
export function checkPoolUsedByProject(queriesQueryParam) {
    return axios.get(`/${API_MODULE_NAME.ADMIN}/projects/getQuotaInfo`,{
        params: queriesQueryParam
    });
}