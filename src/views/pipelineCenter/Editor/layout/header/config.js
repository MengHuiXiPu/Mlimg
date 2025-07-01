import { useGetState } from "@pipeline/Editor/store/index.js";
import { ref, computed } from "vue";

// 断点调试按钮text
const debugTitle = computed(() => {
  const debuging = useGetState("debuging").value
  return debuging ? "运行至下一断点" : "断点调试"
})
// 单步执行按钮text
const stepOverTitle = computed(() => {
  const debuging = useGetState("debuging").value
  return debuging ? "下一步" : "单步调试"
})
/**
 * @description 工具栏配置
 */
export const Tools = {
  undo: {
    svg: "ic_undo",
    directive: "undo",
    can: false,
    title: "撤销",
  },
  redo: {
    svg: "ic_redo",
    directive: "redo",
    can: false,
    title: "重做",
  },
  copy: {
    svg: "copy",
    directive: "copy",
    title: "复制",
    can: false,
  },
  delete: {
    svg: "delete-bin-line",
    directive: "dustbin",
    title: "删除",
    can: false,
  },
  focus: {
    svg: "focus",
    directive: "focus",
    title: "居中",
  },
  // zoomin: {
  //   iconClass: 'icon-zoom-out',
  //   directive: "zoomin",
  //   title: "放大",
  // },
  // zoomout: {
  //   iconClass: 'icon-zoomout',
  //   directive: "zoomout",
  //   title: "缩小",
  // },
  select: {
    svg: "drag",  //默认拖拽模式
    directive: "toggleMode",
    title: "切换为选择模式",
    active: false,
    // can: false,
  },
  // selectAll: {
  //   iconClass: 'icon-ic_select_all',
  //   svg: "selectAll",
  //   directive: "select_all",
  //   title: "全选",
  // },
  fullscreen: {
    svg: "fullscreen1",
    directive: "fullscreen",
    title: "全屏",
  },
}

/**
 * @description 系统功能配置
 */
export const DebugTools = {
  save: {
    directive: "save",
    svg: "save-3-line",
    // can: false,
    title: "保存",
  },
  run: {
    iconClass: 'icon-play-circle-line',
    directive: "runAll",
    svg: "play-circle-line",
    can: true,
    title: "全速运行",
  },
  nextBreakPoint: {
    svg: "debug",
    directive: "nextBreakPoint",
    // can: false,
    title: debugTitle,
  },
  // 运行至下一个算子
  nextStep: {
    directive: "nextStep",
    svg: "debug-step-over",
    can: true,    //改为默认启用
    title: stepOverTitle,
  },
  stop: {
    directive: "stop",
    svg: "shut-down-line",
    can: false,
    title: "退出调试",
  },
  // close: {
  //   iconClass: 'icon-close1',
  //   directive: "close",
  //   // can: false,
  //   title: "关闭",
  // },
}


// 引导文案
export const TipsContent = [
  {
    label: "Ctrl+a",
    value: "单元全选",
  }, {
    label: "Ctrl+c",
    value: "单元复制",
  }, {
    label: "Ctrl+v",
    value: "单元粘贴",
  }, {
    label: "Delete / BackSpace",
    value: "单元删除",
  }, {
    label: "Ctrl+z",
    value: "单元撤销",
  }, {
    label: "Ctrl+y",
    value: "单元重做",
  },
  // {
  //   label: "Esc",
  //   value: "取消所有选中单元",
  // },
  // {
  //   label: "Alt+h",
  //   value: "帮助信息",
  // },
  {
    label: "Alt+f",
    value: "画布居中",
  }, {
    label: "Ctrl+mouseWheel",
    value: "放大/缩小",
  }, {
    label: "Alt+leftMouseDown",
    value: "框选",
  }, {
    label: "F8",
    value: "运行至下一断点",
  }, {
    label: "F10",
    value: "运行至下一步",
  },
]