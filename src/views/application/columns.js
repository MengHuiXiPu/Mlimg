// 设备管理/设备信息列表
export const deviceCols = [
  {
    title: "设备名称",
    dataIndex: "name",
    // width: 150,
  },{
    title: "设备编号",
    dataIndex: "number",
    // width: 180,
  },{
    title: "设备类型",
    dataIndex: "type",
    // width: 100,
  },{
    title: "设备信息",
    dataIndex: "deviceInfo",
  },{
    title: "设备状态",
    dataIndex: "status",
    scopedSlots: { customRender: "status" },
    // width: 100,
  },{
    title: "功能描述",
    dataIndex: "functionDes",
  },{
    title: "位置信息",
    dataIndex: "locationInfo",
  },{
    title: "备注",
    dataIndex: "remark",
  },
  // {
  //   title: "创建人",
  //   dataIndex: "createBy",
  //   // width: 80
  // },
  {
    title: "创建时间",
    dataIndex: "createTime",
    scopedSlots: { customRender: "createTime" },
    width: 170
  },
  // {
  //   title: "修改人",
  //   dataIndex: "updateBy",
  //   // width: 80
  // },
  {
    title: "修改时间",
    dataIndex: "updateTime",
    scopedSlots: { customRender: "updateTime" },
    width: 170
  },
  {
    title: "操作",
    key: "x",
    scopedSlots: { customRender: "operate" },
    align: 'right',
    width: 220
  }
]

// 下发文件列表 columns配置项
export const  transferCols = [{
  title: "文件名称",
  dataIndex: "name",
  ellipsis: true,
}, 
// {
//   title: "相对路径",
//   dataIndex: "zipUrl",
// }, 
{
  title: "文件类型",
  dataIndex: "fileType",
  scopedSlots: { customRender: "fileType" }
}, {
  title: "版本编号",
  dataIndex: "versionNum",
  width: 90
}, {
  title: "细分类型",
  dataIndex: "category",
}, {
  title: "是否公开",
  dataIndex: "isPublic",
  scopedSlots: { customRender: "isPublic" },
  width: 90
}, {
  title: "备注",
  dataIndex: "remark",
  ellipsis: true,
}, 
// {
//   title: "创建人",
//   dataIndex: "createBy",
//   width: 90
// }, 
{
  title: "创建时间",
  dataIndex: "createTime",
  scopedSlots: { customRender: "createTime" },
  width: 170
  // ellipsis: true,
}, 
// {
//   title: "修改人",
//   dataIndex: "updateBy",
//   width: 90
// }, 
{
  title: "修改时间",
  dataIndex: "updateTime",
  scopedSlots: { customRender: "updateTime" },
  width: 170
  // ellipsis: true,
},{
  title: "操作",
  key: "x",
  scopedSlots: { customRender: "operate" },
  align: 'right',
  width: 180
}]