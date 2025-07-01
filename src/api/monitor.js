/*
 * @Author: liuzhi
 * @description: 监控 api接口
 */
import {axios} from '@/utils/request'

export function instantQuery(metricType, metricName, {
    serviceId,
    instanceId,
    version,
    timestamp
}) {
    return axios({
        url: `/api/v1/monitor/${metricType}/${metricName}/instant/${serviceId}`,
        method: 'GET',
        params: {
            instanceId,
            version,
            timestamp
        },
    })
}

export function rangeQuery(metricType, metricName, {
    serviceId,
    start,
    end,
    step,
    instanceId,
    version,
}) {
    return axios({
        url: `/api/v1/monitor/${metricType}/${metricName}/range/${serviceId}`,
        method: 'GET',
        params: {
            start,
            end,
            step,
            instanceId,
            version,
        },
    })
}

/**
 * 聚合查询
 * @param metricType 指标类型
 * @param metricName 指标名
 * @param serviceId 服务id
 * @param start start
 * @param type 聚合类型
 * @param end end
 * @param step 步长
 * @param instanceId 实例ID
 * @param version 版本号哦
 * @returns {Promise<{
 *    "code": number,
 *    "data": [
 *        {
 *            "attributes": object,
 *            "values": [
 *                {
 *                    "timestamp": string,
 *                    "type": string,
 *                    "value": {
 *                        "amount": string,
 *                        "format": string
 *                    }
 *                }
 *            ]
 *        }
 *    ],
 *    "msg": string,
 *    "success": boolean
 * }>}
 */
export function aggregationQuery(metricType, metricName, {
    serviceId,
    start,
    type,
    end,
    step,
    instanceId,
    version,
}) {
    return axios({
        url: `/api/v1/monitor/${metricType}/${metricName}/aggregation/${serviceId}`,
        method: 'GET',
        params: {
            start,
            end,
            step,
            type,
            instanceId,
            version,
        },
    })
}


/**
 * 服务指标查询
 * @param serviceId 服务id
 * @param start start
 * @param end end
 * @param step {'YEAR' | 'MONTH' | 'DAY' | 'HOUR' | 'MINUTE' | 'SECOND'} 步长类型
 * @param version 版本号
 * @param metricName {'percentile' | 'success-rate' | 'resp-time' | 'service-cpm'} 指标名 - percentile: 响应百分数
 * @returns {Promise<{
 *    "code": number,
 *    "data": [
 *        {
 *            "attributes": object,
 *            "values": [
 *                {
 *                    "timestamp": string,
 *                    "value": {
 *                        "amount": string,
 *                        "format": string
 *                    }
 *                }
 *            ]
 *        }
 *    ],
 *    "msg": string,
 *    "success": boolean
 * }>}
 */
export function serviceMetricsQuery({
                                                   serviceId,
                                                   start,
                                                   end,
                                                   step,
                                                   version,
                                                   metricName,
                                               }) {
    return axios({
        url: `/api/v1/monitor/application/${metricName}/${serviceId}`,
        method: 'GET',
        params: {
            start,
            end,
            step,
            version,
        },
    })
}

/**
 * 服务指标聚合查询
 * @param serviceId 服务id
 * @param type {'AVG' | 'MAX' | 'MIN'} 聚合类型
 * @param start start
 * @param end end
 * @param step {'YEAR' | 'MONTH' | 'DAY' | 'HOUR' | 'MINUTE' | 'SECOND'} 步长类型
 * @param version 版本号
 * @param metricName {'percentile' | 'success-rate' | 'resp-time' | 'service-cpm'} 指标名 - percentile: 响应百分数
 * @returns {Promise<{
 *    "code": number,
 *    "data": [
 *        {
 *            "attributes": object,
 *            "values": [
 *                {
 *                    "timestamp": string,
 *                    "type": string,
 *                    "value": {
 *                        "amount": string,
 *                        "format": string
 *                    }
 *                }
 *            ]
 *        }
 *    ],
 *    "msg": string,
 *    "success": boolean
 * }>}
 */
export function serviceAggregationMetricsQuery({
                                                   serviceId,
                                                   type,
                                                   start,
                                                   end,
                                                   step,
                                                   version,
                                                   metricName,
                                               }) {
    return axios({
        url: `/api/v1/monitor/application/aggregation/${metricName}/${serviceId}`,
        method: 'GET',
        params: {
            start,
            end,
            type,
            step,
            version,
        },
    })
}


/**
 * 服务信息查询
 *
 * @param serviceId 服务id
 * @returns {Promise<{
 *    "code": number,
 *    "data": {
 *     "id": string,
 *     "name": string,
 *     "versions":
 *         {
 *             "version": string,
 *             "runningInstances": string[],
 *             "historyInstances": string
 *         }[]
 *    },
 *    "msg": string,
 *    "success": boolean
 * }>}
 */
export function queryServiceInfoById(serviceId) {
    return axios({
        url: `/api/v1/monitor/ai/service/${serviceId}`,
        method: 'GET',
    })
}
