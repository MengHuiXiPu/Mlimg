//涉及到推理服务应用上线相关的工具类
// @author zhigh
// @email  liuzhi34@tcl.com
//
import {OperateTypeEnum, RunningStateEnum} from "./constants";


export function resourceSpecFormat(configInfo) {
    if (!configInfo) return '未配置';

    const {resourceMode, coreSize, memorySize, gpuCoreSize, gpuMemorySize, replicaNum} = configInfo;

    if (resourceMode === 0) {
        return `(${coreSize}Core/内存：${memorySize}MiB) * ${replicaNum}`;
    }

    return `(CPU:${coreSize}Core/内存：${memorySize}MiB/GPU:${gpuCoreSize}Core-${gpuMemorySize}MiB) * ${replicaNum}`;
}


export function runStateEnum(runStateCode) {
    return RunningStateEnum.fromCode(runStateCode);
}

export function isRunningState(runStateCode) {
    return runStateEnum(runStateCode) === RunningStateEnum.RUNNING;
}


export function runStateFormat(runStateCode) {
    return runStateEnum(runStateCode)?.description;
}

/**
 * @param {Number} runStateCode
 * @param {RunningStateEnum[]} stateEnums
 */
export function stateIn(runStateCode, stateEnums) {
    const code = runStateEnum(runStateCode)?.code;
    return stateEnums?.findIndex((val) => {
        return code && val.code === code;
    }) > -1;
}

export function isIntermediateState(runStateCode) {
    return [
        RunningStateEnum.STARTING,
        RunningStateEnum.RESTARTING,
        RunningStateEnum.STOPPING,
        RunningStateEnum.ROLLING_RELEASE,
    ].includes(runStateEnum(runStateCode));
}

export function isLockedRunningState(runStateCode) {
    return [
        RunningStateEnum.LOCKED_RUNNING,
    ].includes(runStateEnum(runStateCode));
}

export function startEnable(runStateCode) {
    return stateIn(runStateCode, [
        RunningStateEnum.CONFIGURED,
        RunningStateEnum.STOPPED,
        RunningStateEnum.ERROR,
    ]) && !isIntermediateState(runStateCode);
}

export function stopEnable(runStateCode) {
    return stateIn(runStateCode, [
        RunningStateEnum.RUNNING,
        RunningStateEnum.LOCKED_RUNNING,
        RunningStateEnum.STARTING,
        RunningStateEnum.RESTARTING,
    ]) && !isIntermediateState(runStateCode);
}

export function switchEnable(runStateCode, inferserviceInfo) {
    return stateIn(runStateCode, [RunningStateEnum.RUNNING]) && inferserviceInfo?.versionCount > 1 && !isIntermediateState(runStateCode);
}

export function rollbackEnable(runStateCode, inferserviceInfo) {
    return stateIn(runStateCode, [
        RunningStateEnum.RUNNING
    ]) && inferserviceInfo?.versionCount > 1 && !isIntermediateState(runStateCode);
}

export function deletedEnable(runStateCode, inferserviceInfo) {
    return stateIn(runStateCode, [
        RunningStateEnum.CREATED,
        RunningStateEnum.CONFIGURED,
        RunningStateEnum.STOPPED,
        RunningStateEnum.ERROR,
        RunningStateEnum.DISABLED
    ]) && !isIntermediateState(runStateCode);
}

export function loadingState(runStateCode) {
    return stateIn(runStateCode, [
        RunningStateEnum.ROLLING_RELEASE,
        RunningStateEnum.STARTING,
        RunningStateEnum.STOPPING,
    ]) && runStateEnum(runStateCode) !== RunningStateEnum.RUNNING && !isLockedRunningState(runStateCode);
}

// ===== 操作记录相关的公共函数 ======

/**
 * @param {Number} operateTypeCode
 */
export function operateTypeEnum(operateTypeCode) {
    return OperateTypeEnum.fromCode(operateTypeCode);
}

export function operateTypeFormat(operateTypeCode) {
    return operateTypeEnum(operateTypeCode)?.description;
}

export function operateDescFormat(record) {
    const opType = record?.opType;
    const versionId = record?.infesvrVersionId;
    const fromInfesvrVersionId = record?.fromInfesvrVersionId;

    let result = operateTypeFormat(opType);

    if (versionId || fromInfesvrVersionId) {
        result += ":" + fromInfesvrVersionId;

        if (versionId) {
            result += ` => ${versionId}`
        }
    }

    return result;
}

