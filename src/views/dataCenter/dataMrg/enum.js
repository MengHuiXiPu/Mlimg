// 数据集标签列表
export const DLTYPELIST = [
  { value: 1, label: '训练集' },
  { value: 2, label: '评估集' },
]

// 数据集状态列表（数据库里的，也会在数据集列表中返回）
export const DSSTATUSLIST = [
  { value: 1, label: "解析中" },
  { value: 2, label: "正常" },
  { value: 3, label: "解析失败" },
  { value: 4, label: "创建中" },
  { value: 5, label: "复制中" },
  { value: 6, label: "拆分中" },
  { value: 7, label: "解析图片中" },
  { value: 8, label: "转换中" },
  { value: 9, label: "上传中" },
  { value: 10, label: "转换失败" }
]

//表示创建中的数据集状态
export const CREATING_STATUSLIST = [1, 4, 5, 6, 7, 8, 9]
//表示创建失败的数据集状态
export const DEFEAT_STATUSLIST = [3, 10]

// 前端查询以及反显展示的状态
export const DSSTATUSLISTFRONT = [
  { label: "正常", value: 2 },
  { label: "创建中", value: CREATING_STATUSLIST }, //合并为string
  { label: "创建失败", value: DEFEAT_STATUSLIST },
  { label: "标注中", value: "MARKING" }
]