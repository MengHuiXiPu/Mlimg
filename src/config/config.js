// 固定配置参数
import moment from "moment"
import { formatTime } from '@/utils/util'

const date = [
    {
        name: '今天',
        key: 'today',
        value: [
            formatTime(moment()),
            formatTime(moment())
        ]
    },
    {
        name: '近7天',
        key: 'last7Day',
        value: [
            formatTime(moment().add(-6, "day")),
            formatTime(moment())
        ]
    },
    {
        name: '近30天',
        key: 'last30Day',
        value: [
            formatTime(moment().add(-29, "day")),
            formatTime(moment())
        ]
    },
]
export default {
    date,
}

export const api_version = 'v1';
export const api_prefix = '/api';

export const API_MODULE_NAME = {
    ADMIN: 'admin', // 系统接口
    DATA: api_prefix + api_version + '/' + 'data', // 数据管理
    NOTEBOOK: api_prefix + api_version + '/' + 'notebook', // Notebook
    ALGORITHM: api_prefix + api_version + '/' + 'algorithm', // 算法管理
    IMAGE: api_prefix + api_version + '/' + 'image', // 镜像管理
    TRAIN: api_prefix + api_version + '/' + 'train', // 训练管理
    MODEL: api_prefix + api_version + '/' + 'model', // 模型管理
    MODEL_OPTIMIZE: api_prefix + api_version + '/' + 'optimize', // 模型优化
    CLOUD_SERVING: api_prefix + api_version + '/' + 'serving', // 云端 Serving 在线服务
    BATCH_SERVING: api_prefix + api_version + '/' + 'batchServing', // 云端 Serving 批量服务
    ATLAS: api_prefix + api_version + '/' + 'measure', // 模型炼知
    K8S: api_prefix + api_version + '/' + 'k8s', // K8S
    DCM: api_prefix + api_version + '/' + 'dcm', // 医学dcm
    TADL: api_prefix + api_version + '/' + 'tadl', // TADL
    POINT_CLOUD: api_prefix + api_version + '/' + 'pointCloud',
    DUBHE_PRO: api_prefix + api_version + '/' + 'terminal', // 天枢专业版
};

// 登录、注册参数配置
export const loginConfig = {
    allowRegister: process.env.NODE_ENV !== 'production', // 是否允许注册
};

// 训练管理模块参数配置
export const trainConfig = {
    trainNodeMax: Infinity, // 分布式训练节点上限
    delayCreateTimeMax: 168, // 延时启动时间上限
    delayDeleteTimeMax: 168, // 训练时长上限
};

// 算法管理参数配置
export const algorithmConfig = {
    uploadFileAcceptSize: 1024, // 上传算法文件大小限制，单位为 MB，0 表示不限制大小
};

// 镜像管理参数配置
export const imageConfig = {
    allowUploadImage: true, // 是否允许上传镜像
    uploadFileAcceptSize: 0, // 上传镜像文件大小限制，单位为 MB，0 表示不限制大小
};

// 模型管理模块参数配置
export const modelConfig = {
    uploadFileAcceptSize: 0, // 上传模型文件大小限制，单位为 MB，0 表示不限制大小
};

// 云端 Serving 模块参数配置
export const servingConfig = {
    onlineServingNodeSumMax: 10,
    onlinePredictFileSizeSum: 10, // 在线服务预测时总文件上传大小限制，单位为 MB，test 和 prod 环境暂时限制为 10MB
};

// 模型炼知模块参数配置
export const atlasConfig = {
    uploadFileAcceptSize: 5, // 上传度量图文件大小限制，单位为 MB，0 表示不限制大小
};
