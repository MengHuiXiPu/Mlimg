<template>
  <div class="block-item-container">
    <div class="space-between">
      <h5 class="title">
        <span class="title-content">python代码</span>
        <a-tooltip title="按规范输入或上传python代码片段">
          <a-icon type="question-circle-o" style="vertical-align: 2px;" />
        </a-tooltip>
      </h5>
      <a-button type="link" @click="enterModalEditor" icon="edit" style="margin-top: 5px;">编辑</a-button>
    </div>
    <div class="code-content scrollbar">
      <code-mirror ref="codeEditor" v-model="nodeData.codeContent"
        :options="{ ...editorOptions, readOnly: 'nocursor' }"></code-mirror>
    </div>
    <a-modal v-model="showEditModal" width="60%" :keyboard="false" :maskClosable="false"
      :bodyStyle="{ paddingTop: '5px' }" :dialog-style="{ top: '7vh' }">
      <span slot="title">
        编辑函数算子
        <el-link type="primary" @click="linkToDoc" :disabled="!Boolean(docUrl)">查看函数算子编写规范说明文档</el-link>
      </span>
      <a-upload :showUploadList="false" :before-upload="handleUpload" accept=".py" :openFileDialogOnClick="false"
        ref="upload">
        <el-button type="text" @click="callUploadAction" size="large">本地上传python文件</el-button>
      </a-upload>
      <code-mirror ref="codeEditorInModal" v-model="codeSnippet"
        :options="{ ...editorOptions, placeholder }"></code-mirror>
      <div slot="footer" style="text-align: center;">
        <a-button key="back" @click="handleCancel" size="small">取消</a-button>
        <a-button key="confirm" type="primary" :loading="confirmLoading" @click="handleOk" size="small"
          :disabled="!codeSnippet || codeSnippet == nodeData.codeContent">保存</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror';
import 'codemirror/lib/codemirror.css'; // 引入 CodeMirror 样式
import 'codemirror/mode/python/python'; // 引入 Python 语法高亮模式
// import 'codemirror/theme/dracula.css'; // 引入 dracula 主题
// 调整scrollbar样式,配合scrollbarStyle配置项
// import 'codemirror/addon/scroll/simplescrollbars.css'
// import 'codemirror/addon/scroll/simplescrollbars.js';
import 'codemirror/addon/display/placeholder.js'; // 引入 placeholder 插件
import { parseAndSaveCode } from "@pipeline/Editor/common/pyOperator.js";
import { selectNodeById } from "@pipeline/Editor/common/cell";
import { getSystemConfig } from "@/api/dataCenter";

export default {
  name: 'pyConfig',
  components: {
    codeMirror: codemirror,
  },
  data() {
    return {
      confirmLoading: false,
      codeSnippet: ``,
      docUrl: "",
      placeholder: `
函数示例：
def engine_main(input1: int, input2: int) -> int:
  res = input1 + input2
  return res
      `,
      showEditModal: false, //
      editorOptions: {
        mode: {
          name: "python",
          version: 3,
        }, // 设置为 Python 语法高亮
        lineNumbers: true, // 显示行号
        // theme: 'dracula', // 设置编辑器主题
        theme: 'default',
        tabSize: 2, // 设置 Tab 大小
        matchBrackets: true,     // 启用括号匹配功能
        // 调整scrollbar样式功能
        // scrollbarStyle: 'overlay',
        // 设置 placeholder
      },
    }
  },
  props: {
    cell: {
      type: Object,
      default: () => ({})
    },
    nodeData: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    // 打开modal弹框来编辑代码
    enterModalEditor() {
      this.showEditModal = true;
      // 取已保存的代码到编辑器
      this.codeSnippet = this.nodeData.codeContent || ""
      this.$nextTick(() => {
        console.log('codemirror', this.$refs.codeEditorInModal.codemirror)
        this.$refs.codeEditorInModal.codemirror.setSize("auto", "65vh");
      });
    },
    // 根据是否存在代码，来给出提示，手动触发文件选择框
    callUploadAction() {
      if (!this.codeSnippet || !this.codeSnippet.trim()) {
        this.$refs.upload.$refs.uploadRef.$refs.uploaderRef.onClick()
        return
      }
      this.$confirmEle(`上传文件会替换已有代码，请确认是否继续?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        // console.log(this.$refs.upload.$refs.uploadRef)
        this.$refs.upload.$refs.uploadRef.$refs.uploaderRef.onClick()
      }).catch((e) => {
        console.error(e)
      });
    },
    async handleUpload(file) {
      try {
        // 文件大小限制 2MB
        const MAX_SIZE = 2 * 1024 * 1024; // 2MB
        if (file.size > MAX_SIZE) {
          this.$message.error('文件大小不能超过 2MB');
          return false; // 阻止上传
        }
        // 检查文件类型
        if (!file.name.endsWith('.py')) {
          this.$message.error('只支持上传 Python 文件');
          return false; // 阻止上传
        }
        // 读取文件内容
        const fileContent = await this.readFileContent(file);
        this.codeSnippet = fileContent; // 将内容写入到 textarea
        return false; // 阻止上传
      } catch (error) {
        this.$message.error('文件解析失败');
        console.error(error);
      }
      return false; // 阻止自动上传
    },
    // 使用 FileReader 读取文件内容
    readFileContent(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target.result);
        };
        reader.onerror = () => {
          reject(new Error('文件读取失败'));
        };
        reader.readAsText(file, 'utf-8');
      });
    },
    handleOk() {
      // 获取编辑器中的代码
      const code = this.$refs.codeEditorInModal.codemirror.getValue();
      this.confirmLoading = true;
      // 调用解析函数
      parseAndSaveCode(this.cell, code).then(() => {
        this.confirmLoading = false;
        this.showEditModal = false;
        this.nodeData.codeContent = code; //更新到nodeData
        // 重新选中节点，触发更新nodeData->进而更新右侧视图
        selectNodeById(this.cell.id)
        this.$message.success("保存成功")
      }).catch((error) => {
        if (error.type === "parseError") {
          // 解析失败时，装逼，弹框写一些没卵用的信息
          const h = this.$createElement;
          this.$error({
            title: '检测到您编写的函数，不符合基础规范，请重新编写，可能原因',
            width: "600px",
            content: h('div', {}, [
              h('p', '1.  不含main主函数'),
              h('p', '2. 入口函数的输入/输出参数未明确指定数据类型；'),
              h('p', '正确示例如下：'),
              h('pre', {}, [
                h('code', 'def engine_main(input1: int, input2: int) -> int:'),
                h('br'),
                h('code', '     res = input1 + input2'),
                h('br'),
                h('code', '     return res'),
              ]),
              h('p', `具体报错信息：${error.msg}，请仔细检查与修改后再保存；`),
            ]),
            // onOk() { },
          });
        }
      }).finally(() => {
        this.confirmLoading = false;
      })
    },
    handleCancel() {
      this.showEditModal = false;
    },
    /**
     * @public
     */
    reRenderCodemirror() {
      console.log("codeEditor vue实例：", this.$refs.codeEditor)
      this.$refs.codeEditor.refresh()
    },
    linkToDoc() {
      window.open(this.docUrl)
    }
  },
  created() {
    getSystemConfig({ keyName: "python_operator_doc_url" }).then(res => {
      this.docUrl = res.data?.valueInfo || null
    })
  }
}
</script>

<style lang="less" scoped>
.block-item-container {
  .title {
    color: #333333;
    font-weight: 700;
    font-size: 15px;
    margin: 10px 0;

    .title-content::after {
      content: "*";
      color: #F56C6C;
      margin: 0 3px;
    }
  }

  &::v-deep .anticon {
    vertical-align: 0;
  }

  // &::v-deep .el-table {
  //   border-radius: unset;

  //   .el-table__header th.el-table__cell {
  //     padding: 6px 0;
  //     background-color: #f2f2f2 !important;
  //   }
  // }

  // &::v-deep .el-input-number--mini {
  //   width: 100px;
  // }
}
</style>