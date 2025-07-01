
/**
 * pipeline命令列表
 * @enum
 */
export const COMMOND = {
  START: "TVM_RUN_START", //开启调试
  STOP: "TVM_RUN_STOP", //关闭调试
  STEP: "TVM_RUN_STEP", //单步调试
  BREAK: "TVM_RUN_BREAK", //断点调试
  RUNALL: "TVM_RUN_FULL", //全速运行
}

/**
 * 执行调试命令后响应的状态(pipeline整体的状态)
 * @enum
 */
export const PLRUNSTATUS = {
  END: 0, //（0：当前pipeline运行结束， <0：异常退出）， 运行结束时会有一个 tvm_modules 为空的单独数据回调。
  STARTED: 1,//开始调试（收到 TVM_RUN_START 命令)
  PENDING: 2,  //正在调试,
  FINISHCMD: 3 //当前调试命令完成
}
/**
 * 节点的状态与之对应的视图状态
 * @enum
 */
export const CELLSTATUS = {
  SUCCESS: require("@pipeline/Editor/assets/success.png"),
  ERROR: require("../assets/error.png"),
  RUNNING: require("../assets/running.svg"),

}
/**
* 工具类型
* @enum
*/
export const ToolTypeEnum = {
  /**@type {String} 删除元素 */
  REMOVE_BUTTON: 'custom-remove-button'
}

/**
* 事件分发类型
* @enum
*/
export const CustomEventTypeEnum = {
  /**@type {String} 单元点击触发 */
  CELL_CLICK: '__antv_x6_custom_event_type_cell_click__',
  /**@type {String} 节点点击触发 */
  NODE_CLICK: '__antv_x6_custom_event_type_node_click__',
  /**@type {String} 双击节点触发 */
  DOUBLE_NODE_CLICK: '__antv_x6_custom_event_type_cell_double_click__',
  /**@type {String} 帮助信息 */
  HELP: '__antv_x6_custom_event_type_help__',
  /**@type {String} 冻结画布 */
  FREEZE_GRAPH: '__antv_x6_custom_event_type_freeze_graph__',
  /**@type {String} 运行时异常 */
  RUNTIME_ERR: '__antv_x6_custom_event_type_runtime_err__',
}

/**
* 选择状态
* @enum
*/
export const SelectStateEnum = {
  /**@type {String} 已选中 */
  SELECTED: 'selected',
  /**@type {String} 未选中 */
  UN_SELECTED: 'unselected'
}

/**
* 配置项
* @enum
*/
export const Config = {
  /**@type {String} 可操作Node区 插槽 */
  PANEL_AREA_SLOT: 'panel_area_slot',
  /**@type {String} Tooltips 插槽 */
  TOOLTIPS_SLOT: 'tooltips_slot',
}

/**
* 节点触发类型
*/
export const ActionType = {
  /**@type {String} 触发器 */
  TRIGGER: 'TRIGGER',
  /**@type {String} 条件 */
  CONDITION: 'CONDITION',
  /**@type {String} 动作 */
  ACTION: 'ACTION',
}
