export class RunningStateEnum {
    /**
     * @type {RunningStateEnum[]}
     */
    static VALUES = [];

    /**
     * 构造函数
     * @constructor
     * @param {Number} code
     * @param {String} description
     * @param {String} group 分组名
     */
    constructor(code, description, group) {
        this.code = code;
        this.description = description;
        this.group = group;
        Object.freeze(this);
        RunningStateEnum.VALUES.push(this);
    }

    static DISABLED = new RunningStateEnum(0, "禁用", "终态");
    static CREATED = new RunningStateEnum(1, "已创建", "终态");
    static CONFIGURED = new RunningStateEnum(1 << 1, "已配置", "终态");
    static STARTING = new RunningStateEnum(1 << 2, "启动中", "中间态");
    static RUNNING = new RunningStateEnum(1 << 3, "运行中", "终态");
    static STOPPING = new RunningStateEnum(1 << 5, "停止中", "中间态");
    static STOPPED = new RunningStateEnum(1 << 6, "已停止", "终态");
    static LOCKED = new RunningStateEnum(1 << 28, "锁定", "终态");
    static ERROR = new RunningStateEnum(1 << 7, "运行错误", "终态");
    static DELETED = new RunningStateEnum(1 << 30, "已删除", "终态");
    // Composite state：复合状态
    static ROLLING_RELEASE = new RunningStateEnum(RunningStateEnum.RUNNING.code | RunningStateEnum.STARTING.code, "滚动发布", "中间态");
    static RESTARTING = new RunningStateEnum(RunningStateEnum.STOPPING.code | RunningStateEnum.STARTING.code, "重启中", "中间态");
    // 锁定运行，只可以停止
    static LOCKED_RUNNING = new RunningStateEnum(RunningStateEnum.LOCKED.code | RunningStateEnum.RUNNING.code, "锁定运行", "终态");

    /**
     * @returns {RunningStateEnum[]}
     */
    static values() {
        return RunningStateEnum.VALUES;
    }

    // 根据 code 查找枚举值
    static fromCode(code) {
        return RunningStateEnum.values().find(status => status.code === code);
    }

    toString() {
        return `${this.code}: ${this.description}`;
    }
}


export class OperateTypeEnum {
    /**
     * @type {OperateTypeEnum[]}
     */
    static VALUES = [];

    /**
     * 构造函数
     * @constructor
     * @param {Number} code
     * @param {String} description
     */
    constructor(code, description) {
        this.code = code;
        this.description = description;
        Object.freeze(this);
        OperateTypeEnum.VALUES.push(this);
    }

    static CREATE = new OperateTypeEnum(1, "创建推理服务");
    static CREATE_VERSION = new OperateTypeEnum(1 << 1, "创建推理服务子版本");
    static CONFIG = new OperateTypeEnum(1 << 2, "配置推理服务部署参数");
    static CONFIG_VERSION = new OperateTypeEnum(1 << 3, "配置推理服务子版本部署参数");
    static START = new OperateTypeEnum(1 << 4, "启动推理服务");
    static START_VERSION = new OperateTypeEnum(1 << 5 | 1 << 4, "启动推理服务子版本");
    static RESTART = new OperateTypeEnum(1 << 6, "重启推理服务");
    static RESTART_VERSION = new OperateTypeEnum(1 << 7, "重启推理服务子版本");
    static SWITCH_VERSION = new OperateTypeEnum(1 << 8, "切换推理服务版本");
    static ROLLBACK = new OperateTypeEnum(1 << 9, "回退推理服务");
    static STOP_VERSION = new OperateTypeEnum(1 << 10, "停止推理服务子版本");
    static STOP = new OperateTypeEnum(1 << 11, "停止推理服务");
    static DELETE_VERSION = new OperateTypeEnum(1 << 31, "删除推理服务子版本");
    static DELETE = new OperateTypeEnum(1 << 30, "删除推理服务");


    /**
     * @returns {OperateTypeEnum[]}
     */
    static values() {
        return OperateTypeEnum.VALUES;
    }

    // 根据 code 查找枚举值
    static fromCode(code) {
        return OperateTypeEnum.values().find(status => status.code === code);
    }

    static mapValues() {
        return OperateTypeEnum.values().map((val) => {
            return {
                value: val.code,
                text: val.description,
            };
        });
    }

    toString() {
        return `${this.code}: ${this.description}`;
    }
}


export const resourcesLimits = {
    coreMax: 20,
    memoryMax: 50,
    GPUCoreMax: 20,
    GPUMemoryMax: 1024 * 16,
    replicaNumMax: 5
};