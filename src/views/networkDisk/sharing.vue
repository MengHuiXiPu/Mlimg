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
    <image-viewer
      :file-list="shareDataList"
      :status="showImage"
      ref="imageview"
      @hideImageViewer="hideImageViewer"
      :initial-index="imageViewerIndex"
    ></image-viewer>
    <el-dialog title="预览" :visible.sync="dialogPreviewVisible">
      <VueDocPreview
        :value="docValue"
        :type="docType"
        :mdStyle="mdStyle"
        :language="language"
        :url="docUrl"
      />
    </el-dialog>
    <el-dialog
      title="预览PDF"
      :visible.sync="dialogPreviewPDFVisible"
      fullscreen="true"
    >
      <iframe :src="pdfUrl" width="100%" height="100%" />
    </el-dialog>
    <el-dialog
      title="预览Word"
      :visible.sync="dialogPreviewWordVisible"
      fullscreen="true"
    >
      <div ref="file"></div>
    </el-dialog>
    <el-dialog
      title="预览Excel"
      :visible.sync="dialogPreviewExcelVisible"
      fullscreen="true"
    >
      <div
        id="luckysheet"
        style="margin: 0px; padding: 0px; width: 100%; height: 100%"
      ></div>
    </el-dialog>
  </div>
</template>

<script>
import fileApi from "@/api/file-api";
import { saveAs } from "file-saver";
import ImageViewer from "./components/imgViewer";
import VueDocPreview from "vue-doc-preview";
import { renderAsync } from "docx-preview";
import { read, utils } from "xlsx";
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
  components: {
    ImageViewer,
    VueDocPreview,
  },
  data() {
    return {
      dialogPreviewExcelVisible: false,
      dialogPreviewWordVisible: false,
      dialogPreviewPDFVisible: false,
      dialogPreviewVisible: false, //预览窗口
      showImage: false,
      pdfUrl: "",
      docValue: "",
      docType: "",
      docUrl: "",
      mdStyle: {
        pre: {
          "background-color": "rgb(248, 248, 248)",
        },
        code: {
          "background-color": "rgb(248, 248, 248)",
          "line-height": "28px",
        },
      },
      language: "javascript",
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
      imageViewerIndex: 0, // 初始预览的图片 index
      imageViewerList: [], // 预览图片列表
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
    hideImageViewer() {
      this.showImage = false;
    },
    //处理列数
    strToNum(str) {
      let result = 0;
      for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        console.log(code);
        result = result * 26 + (parseInt(code) - 65);
      }
      return result;
    },

    //转换数据格式
    convertSheetData(sheetData) {
      const luckysheetData = [];

      // 解析数据范围
      // const refMatch = sheetData["!ref"].match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
      // const startCol = refMatch[1];
      // const startRow = parseInt(refMatch[2]);
      // const startCol = 0;
      const startRow = 1;

      // 遍历每个单元格
      for (const cell in sheetData) {
        if (cell !== "!ref" && cell !== "!margins") {
          // console.log(cell);
          const match = cell.match(/([A-Z]+)(\d+)/);
          // console.log(match,'匹配结果');
          const col = match[1];
          const row = parseInt(match[2]);
          // console.log(match,'匹配结果')
          const rowIndex = row - startRow;
          const colIndex = this.strToNum(col) - 1;
          // 构建 Luckysheet 格式数据
          luckysheetData.push({
            r: rowIndex,
            c: colIndex,
            v: {
              ct: { fa: "General", t: "g" },
              m: sheetData[cell].w,
              v: sheetData[cell].w,
            },
          });
        }
      }

      return luckysheetData;
    },
    openItem(record) {
      let that = this;
      if (record.isFolder) {
        this.pathList.push(this.currentId);
        this.currentId = record.id;
        this.pagination.current = 1;
        this.getSharingData();
      } else {
        if (["jpg", "jpeg", "png"].includes(record?.suffix?.toLowerCase())) {
          this.showImage = true;
          this.imageViewerIndex = this.getImageClickIndex(record);
          this.imageViewerIndex = this.imageViewerIndex === -1 ? 0 : this.imageViewerIndex
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
        } else if (["doc", "docx"].includes(record.suffix)) {
          console.log(record.suffix);
          fileApi
            .getPreviewFile({
              id: record.id,
            })
            .then((res) => {
              // const file = new Blob([res], { type: 'application/octet-stream' });
              // const fileUrl = window.URL.createObjectURL(file);
              console.log(res, "doc");
              this.dialogPreviewWordVisible = true;
              renderAsync(res, this.$refs.file); // 渲染到页面
            });
        } else if (["xlsx"].includes(record.suffix)) {
          fileApi
            .getPreviewFile({
              id: record.id,
            })
            .then((res) => {
              this.dialogPreviewExcelVisible = true;
              const excelBlob = new Blob([res], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              });
              const reader = new FileReader();
              reader.onload = (e) => {
                const arrayBuffer = e.target.result;
                const workbook = read(arrayBuffer, { type: "array" });
                console.log(workbook);
                const sheetData = workbook.Sheets[workbook.SheetNames[0]];
                const convertedData = this.convertSheetData(sheetData);
                const luckysheetData = utils.sheet_to_json(convertedData, {
                  header: 1,
                });
                console.log(convertedData, luckysheetData, "查看表格数据");

                this.$nextTick(() => {
                  $(function () {
                    luckysheet.create({
                      container: "luckysheet", // 设定DOM容器的id
                      title: "Luckysheet Demo", // 设定表格名称
                      lang: "zh", // 设定表格语言
                      row: 36,
                      col: 18,
                      data: [
                        {
                          name: "Cell", //工作表名称
                          color: "", //工作表颜色
                          index: 0, //工作表索引
                          status: 1, //激活状态
                          order: 0, //工作表的下标
                          hide: 0, //是否隐藏
                          row: 36, //行数
                          column: 18, //列数
                          defaultRowHeight: 19, //自定义行高
                          defaultColWidth: 100, //自定义列宽
                          celldata: convertedData, //初始化使用的单元格数据
                          config: {
                            merge: {}, //合并单元格
                            rowlen: {}, //表格行高
                            columnlen: {}, //表格列宽
                            rowhidden: {}, //隐藏行
                            colhidden: {}, //隐藏列
                            borderInfo: {}, //边框
                            authority: {}, //工作表保护
                          },
                          data: [],
                          scrollLeft: 0, //左右滚动条位置
                          scrollTop: 0, //上下滚动条位置
                          luckysheet_select_save: [], //选中的区域
                          calcChain: [], //公式链
                          isPivotTable: false, //是否数据透视表
                          pivotTable: {}, //数据透视表设置
                          filter_select: {}, //筛选范围
                          filter: null, //筛选配置
                          luckysheet_alternateformat_save: [], //交替颜色
                          luckysheet_alternateformat_save_modelCustom: [], //自定义交替颜色
                          luckysheet_conditionformat_save: {}, //条件格式
                          frozen: {}, //冻结行列配置
                          chart: [], //图表配置
                          zoomRatio: 1, // 缩放比例
                          image: [], //图片
                          showGridLines: 1, //是否显示网格线
                          dataVerification: {}, //数据验证配置
                        },
                      ],
                    });
                  });
                });
                // luckysheet.create(options);
                // luckysheet.loadData(luckysheetData);
              };
              reader.readAsArrayBuffer(excelBlob);
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
        } else if (["pdf"].includes(record.suffix)) {
          console.log("json文件");
          fileApi
            .getPreviewFile({
              id: record.id,
            })
            .then((res) => {
              console.log(res, "预览json的结果");
              const blob = new Blob([res], { type: "application/pdf" });
              this.pdfUrl = window.URL.createObjectURL(blob);
              this.dialogPreviewPDFVisible = true;
            });
        }
      }
    },
    //下载文件
    downloadFile(record) {
      console.log(record, "downloaded file");
      this.downloadLoading = record.id;
      if (record.isFolder) {
        fileApi
          .downloadFolder({
            id: record.id,
          })
          .then((res) => {
            this.downloadLoading = "";
            console.log(res, "打包下载的结果");
            const blob = new Blob([res], { type: "application/zip" });
            saveAs(blob);
          });
      } else {
        fileApi
          .downloadFile({
            id: record.id,
          })
          .then((res) => {
            this.downloadLoading = "";
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
          });
      }
      return;
      // fileApi
      //   .downloadFolder({
      //     id: record.id,
      //   })
      //   .then((res) => {
      //     this.downloadLoading = ''
      //     if (record.isFolder) {
      //       console.log(res, "打包下载的结果");
      //       const blob = new Blob([res], { type: "application/zip" });
      //       saveAs(blob);
      //     } else {
      //       console.log(res, "下载接口返回的结果")
      //       if ("download" in document.createElement("a")) {
      //         // 不是IE浏览器
      //         let url = window.URL.createObjectURL(res);
      //         console.log(url, "下载的url");
      //         let link = document.createElement("a");
      //         link.style.display = "none";
      //         link.href = url;
      //         link.setAttribute("download", record.name);
      //         document.body.appendChild(link);
      //         link.click();
      //         document.body.removeChild(link); // 下载完成移除元素
      //         window.URL.revokeObjectURL(url); // 释放掉blob对象
      //       } else {
      //         // IE 10+
      //         window.navigator.msSaveBlob(res, fileName);
      //       }
      //     }
      //   });
    },
    // 上一步
    lastStep() {
      this.currentId = this.pathList.pop();
      this.pagination.current = 1;
      this.getSharingData();
    },
    handleTableChange(pagination, filters, sorter) {
      // 处理分页变化的逻辑
      console.log("Pagination change:", pagination);
      this.pagination.current = pagination.current;
      // 这里可以调用后端接口获取新的数据
      this.getSharingData();
    },
    handSearch(event, resetFlag) {
      if(resetFlag) {
        this.keyword = ''
      }
      this.pagination.current = 1;
      this.getSharingData();
    },
    getSharingData() {
      const method =
        this.currentId === "root" ? "getShareList" : "getShareSubList";
      this.loading = true;
      fileApi[method]({
        id: this.currentId === "root" ? undefined : this.currentId,
        pageNo: this.pagination.current,
        limit: this.pagination.pageSize,
        fileName: this.keyword,
        order: "ascending",
        sortableProp: "name",
      })
        .then((res) => {
          this.loading = false;
          console.log(res, "获取分享列表结果");
          this.shareDataList = res.data.records;
          this.pagination.total = res.data.total;
          this.getImageViewerList();
        })
        .finally(() => {
          this.loading = false;
        });
    },
    // 获取图片预览列表
    getImageViewerList(){
      this.imageViewerList = this.shareDataList.filter(item => ["jpg", "jpeg", "png"].includes(item?.suffix?.toLowerCase()));
    },
    // 获取到当前图片在预览图片列表中index下标
    getImageClickIndex(record){
      return this.imageViewerList.findIndex(item => item.id === record.id);
    },
  },
  mounted() {
    this.getSharingData();
  },
};
</script>

<style lang="scss" scoped>
::v-deep .is-fullscreen {
  .el-dialog__body {
    height: 100%;
  }
}

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