<template>
  <div class="content-box">
    <div class="toolbar space-between">
      <el-form :inline="true"  size="small" ref="refSearchForm" @submit.native.prevent>
        <el-form-item label="名称" prop="name">
          <el-input v-model="keyword" placeholder="请输入" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handSearch($event)">查询</el-button>
          <el-button type="primary" plain @click="handSearch($event, true)">重置</el-button>
        </el-form-item>
      </el-form>
      <div style="margin-bottom: 18px;">
        <el-button type="primary" @click="lastStep" :disabled="currentId === 'root'">上一级</el-button>
      </div>
    </div>
    <a-table
      :columns="columns"
      :data-source="shareDataList"
      :pagination="pagination"
      @change="handleTableChange"
      :loading="loading"
      ref="shareTable"
    >
      <template slot="name" slot-scope="text, record">
        <div class="flex vertical-center">
          <a-icon
            v-if="record.isFolder"
            type="folder"
            class="mr-8"
            style="font-size: 22px; color: #ffca28"
          />
          <a-icon
            v-else
            type="file-text"
            class="mr-8"
            style="font-size: 22px; color: #4d97ff"
          />
          <el-tooltip effect="dark" :content="record.name" placement="top">
            <span class="name-ellipsis" @click="openItem(record)"
              >{{ record.name }}
            </span>
          </el-tooltip>
        </div>
        <div v-if="editId === record.id" class="error">{{ errorText }}</div>
      </template>
      <template slot="isFolder" slot-scope="text, record">
        <span>{{ record.isFolder ? "目录" : "文件" }}</span>
      </template>
      <template slot="updateTime" slot-scope="text, record">
        <span>{{ text|moment }}</span>
      </template>
      <template slot="fileDescribe" slot-scope="text, record">
        <span>{{ record.fileDescribe || "--" }}</span>
      </template>
      <template slot="action" slot-scope="text, record">
        <div style="display: flex; align-items: center">
          <a-popover trigger="click">
            <template slot="content">
              <div>文件大小：{{ record.fileSize || "--" }}</div>
              <div>目录：{{ record.isFolder ? "是" : "否" }}</div>
              <div>修改时间：{{ record.updateTime | moment }}</div>
            </template>
            <a
              type="link"
              :class="{
                'aButton-style': true,
                'mr-8': true,
              }"
              >文件大小</a
            >
          </a-popover>
          <a
            type="link"
            :class="{
              'aButton-style': true,
            }"
            @click="downloadFile(record)"
            >下载 <a-icon v-show="downloadLoading === record.id" type="loading"
          /></a>
        </div>
      </template>
    </a-table>
  </div>
</template>

<script>
import fileApi from "@/api/file-api";
import { saveAs } from "file-saver";

export default {
  name: "Sharing",
  props: {
    sortable: {
      type: Object,
      default: function () {
        return { prop: "", order: "" };
      },
    },
  },
  data() {
    return {
      keyword: "",
      columns: [
        {
          title: "名称",
          dataIndex: "name",
          key: "name",
          scopedSlots: { customRender: "name" },
        },
        {
          title: "类型",
          dataIndex: "isFolder",
          key: "isFolder",
          width: 80,
          scopedSlots: { customRender: "isFolder" },
        },
        {
          title: "创建用户",
          dataIndex: "createBy",
          key: "createBy",
        },
        {
          title: "修改时间",
          dataIndex: "updateTime",
          key: "updateTime",
          scopedSlots: { customRender: "updateTime" },
        },
        {
          title: "描述",
          dataIndex: "fileDescribe",
          key: "fileDescribe",
          scopedSlots: { customRender: "fileDescribe" },
          ellipsis: true,
        },
        {
          title: "操作",
          dataIndex: "action",
          key: "action",
          width: "330px",
          scopedSlots: { customRender: "action" },
        },
      ],
      shareDataList: [],
      pathList: [],
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: [10, 20, 30, 40, 50],
      },
      currentId: "root",
      loading: false,
      downloadLoadingId: "",
    };
  },
  methods: {
    openItem(record) {
      let that = this;
      if (record.isFolder) {
        this.pathList.push(this.currentId);
        this.currentId = record.id;
        this.pagination.current = 1;
        this.getPublicData();
      } else {
        if (["jpg", "jpeg", "png"].includes(record.suffix)) {
          this.showImage = true;
        } else if (["txt"].includes(record.suffix)) {
          console.log("txt文件");
          fileApi
            .getPreviewFile({
              id: record.id,
            })
            .then((res) => {
              console.log(res, "预览txt的结果");
              const blob = new Blob([res], { type: "text/plain" });
              // 创建一个FileReader对象
              const reader = new FileReader();
              // 定义一个回调函数，当读取操作完成时触发
              reader.onload = function (event) {
                // event.target.result 就是转化后的文本内容
                that.docValue = event.target.result;
                that.docType = "text";
                console.log(that.docValue);
                that.dialogPreviewVisible = true;
              };

              // 使用readAsText方法将blob对象转化为文本
              reader.readAsText(blob);
            });
        } else if (["doc", "docx", "csv"].includes(record.suffix)) {
          console.log(record.suffix);
          fileApi
            .getFilePath({
              id: record.id,
            })
            .then((res) => {
              // 以下内容(+++++++以上)看起来无效，因为公共文件tab页的文件看起来都不能预览，像是没做完
              // 后续做的话 可以参考filetable中的预览
              // console.log(
              //   process.env.VUE_APP_BASE_API + res.data,
              //   "预览word的结果"
              // );
              // that.docValue = process.env.VUE_APP_BASE_API + res.data;
              // that.docType = "office";
              // that.docUrl = process.env.VUE_APP_BASE_API + res.data;
              // that.dialogPreviewVisible = true;
              // +++++++++++++++++++++++++++
              // const blob = new Blob([res], { type: "text/plain" });
              // // 创建一个FileReader对象
              // const reader = new FileReader();
              // // 定义一个回调函数，当读取操作完成时触发
              // reader.onload = function (event) {
              //   // event.target.result 就是转化后的文本内容
              //   that.docValue = event.target.result;
              //   that.docType = 'text'
              //   console.log( that.docValue);
              //   that.dialogPreviewVisible = true;
              // };

              // // 使用readAsText方法将blob对象转化为文本
              // reader.readAsText(blob);
            });
        } else if (["json"].includes(record.suffix)) {
          console.log("json文件");
          fileApi
            .getPreviewFile({
              id: record.id,
            })
            .then((res) => {
              console.log(res, "预览json的结果");
              const blob = new Blob([res], { type: "application/json" });
              // 创建一个FileReader对象
              const reader = new FileReader();
              // 定义一个回调函数，当读取操作完成时触发
              reader.onload = function (event) {
                // event.target.result 就是转化后的文本内容
                that.docValue = event.target.result;
                that.docType = "code";
                that.language = "json";
                that.dialogPreviewVisible = true;
              };

              // 使用readAsText方法将blob对象转化为文本
              reader.readAsText(blob);
            });
        }
      }
    },
    //下载文件
    downloadFile(record) {
      console.log(record, "downloaded file");
      this.downloadLoading = record.id;
      fileApi
        .downloadFolder({
          id: record.id,
        })
        .then((res) => {
          this.downloadLoading = "";
          if (record.isFolder) {
            console.log(res, "打包下载的结果");
            const blob = new Blob([res], { type: "application/zip" });
            saveAs(blob);
          } else {
            if ("download" in document.createElement("a")) {
              // 不是IE浏览器
              let url = window.URL.createObjectURL(res);
              console.log(url, "下载的url");
              let link = document.createElement("a");
              link.style.display = "none";
              link.href = url;
              link.setAttribute("download", record.name);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link); // 下载完成移除元素
              window.URL.revokeObjectURL(url); // 释放掉blob对象
            } else {
              // IE 10+
              window.navigator.msSaveBlob(res, fileName);
            }
          }
        });
    },
    // 上一步
    lastStep() {
      this.currentId = this.pathList.pop();
      this.pagination.current = 1;
      this.getPublicData();
    },
    handleTableChange(pagination, filters, sorter) {
      // 处理分页变化的逻辑
      console.log("Pagination change:", pagination);
      this.pagination.current = pagination.current;
      // 这里可以调用后端接口获取新的数据
      this.getPublicData();
    },
    handSearch(event, resetFlag) {
      if(resetFlag) {
        this.keyword = ""
      }
      this.pagination.current = 1;
      this.getPublicData();
    },
    getPublicData() {
      const method =
        this.currentId === "root" ? "getPublicList" : "getShareSubList";
      this.loading = true;
      fileApi[method]({
        id: this.currentId === "root" ? undefined : this.currentId,
        pageNo: this.pagination.current,
        limit: this.pagination.pageSize,
        fileName: this.keyword,
        order: "ascending",
        sortableProp: "name",
      }).then((res) => {
        this.loading = false;
        console.log(res, "获取分享列表结果");
        this.shareDataList = res.data.records;
        this.pagination.total = res.data.total;
      });
    },
  },
  mounted() {
    this.getPublicData();
  },
};
</script>

<style lang="scss" scoped>
.content-box {
  position: relative;
  .table-header {
    position: absolute;
    top: -56px;
    right: 0;
  }
}

.flex {
  display: flex;
}
.vertical-center {
  align-items: center;
}
.name-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px; /* 根据需要设置最大宽度 */
  cursor: pointer;
}
a.aButton-style {
  color: #1890ff !important;
  font-size: 14px;
  &.disabled-link {
    color: rgba(0, 0, 0, 0.25) !important; /* 改变颜色表示禁用状态 */
    text-decoration: none; /* 移除下划线 */
    cursor: not-allowed; /* 禁用点击事件 */
  }
}
.btn-style {
  border-radius: 8px;
  padding: 0 24px;
  height: 42px;
}
.mr-8 {
  margin-right: 8px;
}
</style>