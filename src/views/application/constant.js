// 下发文件类型
export const FILETYPE = new Map([
  [0, 'SDK'],
  [1, '逻辑模块'],
  [2, '标注文件']
])
// 设备状态
export const DEVICESTATUS = new Map([
  [0, {name: '停止',color: 'default'}],
  [1, {name: '正常',color: 'success'}],
  [2, {name: '暂停',color: 'processing'}],
  [3, {name: '上线',color: 'success'}],
  [-1, {name: '异常',color: 'warning'}],
  [-2, {name: 'SDK错误',color: 'error'}],
  [-3, {name: '离线',color: 'default'}]
])
// 命令
export const COMMAND = new Map([
  ['init', 0],
  ['start', 1],
  ['pause', 2],
  ['stop', 3]
])
// 文件下发状态
export const TRANSFERSTATUS = new Map([
  [0, {name: '准备中',color: 'blue'}],
  [1, {name: '打包中',color: 'orange'}],
  [2, {name: '已打包',color: 'pink'}],
  [3, {name: '等待下发',color: 'cyan'}],
  [4, {name: '已下发',color: 'green'}],
  [5, {name: '错误',color: 'red'}]
])
// 命令执行状态
export const CMDSTATUS = new Map([
  [0, {name: '未执行',color: 'blue'}],
  [1, {name: '成功',color: 'green'}],
  [2, {name: '失败',color: 'red'}],
])

// 记录类型
export const RECORDTYPE = new Map([
  [0, '文件记录'],
  [1, '命令记录']
])