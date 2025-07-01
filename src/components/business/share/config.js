import { axios } from "@/utils/request";

export const shareMap = {
  // 数据集共享相关接口
  dataSet: {
    createShare: data => axios({
      url: "/api/v1/datacenter/dataShare/create",
      method: "post",
      data,
    }),
    setPublic: data => axios({
      url: "/api/v1/datacenter/dataShare/setIsPublic",
      method: "post",
      data,
    }),
    getSharedUsers: data => axios({
      url: "/api/v1/datacenter/dataShare/getSharedUsers",
      method: "post",
      data,
    }),
    shareType: 0
  },
  // 算法管理共享相关 /api/v1/
  algorithm: {
    createShare: data => axios({
      url: "/api/v1/algorithm/dataShare/create",
      method: "post",
      data,
    }),
    setPublic: data => axios({
      url: "/api/v1/algorithm/dataShare/setIsPublic",
      method: "post",
      data,
    }),
    getSharedUsers: data => axios({
      url: "/api/v1/algorithm/dataShare/getSharedUsers",
      method: "post",
      data,
    }),
    shareType: 1
  },
  // 模型/训练共享相关(对应model_manage_info这张表)
  model: {
    createShare: data => axios({
      url: "/api/v1/traincenter/dataShare/create",
      method: "post",
      data,
    }),
    setPublic: data => axios({
      url: "/api/v1/traincenter/dataShare/setIsPublic",
      method: "post",
      data,
    }),
    getSharedUsers: data => axios({
      url: "/api/v1/traincenter/dataShare/getSharedUsers",
      method: "post",
      data,
    }),
    shareType: 2
  }
}