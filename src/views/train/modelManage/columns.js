// 模型列表table columns
export const modelListColumns = [
  {
    title: '模型名称',
    dataIndex: "modelName",
    ellipsis: true,
    scopedSlots: { customRender: "modelName" },
    width: '25%',
  },{
    title: "算法模板",
    ellipsis: true,
    dataIndex: "imageName",
    scopedSlots: { customRender: "imageName" },
    width: "20%",
  },{
    title: "模型状态",
    dataIndex: "isPublish",
    scopedSlots: { customRender: "isPublish" },
    width: "120px",
  },{
    title: "离线评估数",
    dataIndex: "forecastCounts",
    width: "120px",
  },{
    title: "类型",
    dataIndex: "tagType",
    width: "100px",
  },{
    title: "创建人",
    dataIndex: "createBy",
    width: "140px",
  },{
    title: "创建时间",
    dataIndex: "createTime",
    width: "168px",
  },{
    title: "完成时间",
    dataIndex: "finishTime",
    width: "168px",
  },{
    title: "操作",
    dataIndex: "action",
    scopedSlots: { customRender: "action" },
    width: "155px",
    // align: 'right',
  }
]