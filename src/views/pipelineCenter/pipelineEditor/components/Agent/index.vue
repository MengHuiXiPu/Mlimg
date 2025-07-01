<template>
  <div class="wrapper">
    <a-button icon="plus" size="" type="primary" block @click="callModal">Agent组件生成</a-button>
    <a-modal :visible="visible" :title="`Agent算子自动生成`" @cancel="handleCancel" :maskClosable="false" width="50%" v-if="visible">
      <div class="main">
        <div class="left scrollbar">
          <div style="margin-bottom: 15px;"><span>算子名称: </span><a-input placeholder="请输入算子名称" v-model="dataset.name" class="name-input"/></div>
          <!--  -->
          <a-upload slot="addonAfter" :showUploadList="false" :before-upload="beforeUpload" accept="image/*">
            <a-button type="primary"><a-icon type="upload"></a-icon>导入图片</a-button>
          </a-upload>
          <!--  -->
          <div class="img-box">
            <a-progress type="circle" :percent="uploadProgress" :width="60" style="position: absolute;top: 30px;left:100px;" v-if="uploadProgress && !dataset.exampleImgUrl"/>
            <img :src="dataset.exampleImgUrl" v-show="dataset.exampleImgUrl"/>
          </div>
          <div class="img-box" v-show="dataset.resImgUrl">
            <img :src="dataset.resImgUrl"/>
          </div>
          <!-- prompt -->
          <div class="prompt-container">
            <a-textarea class="prompt-input" placeholder="请输入提示信息" :rows="3" v-model="dataset.promptText" @pressEnter="doPromptEnter"/>
            <a-button class="prompt-btn" type="primary" size="small" @click="doPromptEnter">确认</a-button>
          </div>
          
        </div>
        <div class="right scrollbar">
          <a-spin tip="结果生成中..." v-if="loading" class="right-spin"></a-spin>
          <pre class="line-numbers" v-show="dataset.codeSnippet"><code class="language-python">{{ dataset.codeSnippet }}</code></pre>
        </div>
      </div>
      <template slot="footer">
        <a-button type="primary"  @click="doFinish" :loading="confirmLoading">完成</a-button>
        <a-button type="primary" @click="handleCancel"> 取消</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script>
import Prism from 'prismjs';
// 需要单独引入你所需的语言支持
import 'prismjs/components/prism-python';
// 引入行号插件
import 'prismjs/plugins/line-numbers/prism-line-numbers';
// 引入主题样式
import 'prismjs/themes/prism-okaidia.css';
// 引入行号插件的样式
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
export default {
  data() {
    return {
      visible: false,
      dataset: {
        name: '',
        exampleImgUrl: '',  //导入的样例图片url
        resImgUrl: '', //响应的图片url
        promptText: '', //提示信息
        codeSnippet: null,
      },
      uploadProgress: 0,
      loading: false, 
      confirmLoading: false,
    }
  },
  methods: {
    beforeUpload (file) {
      this.dataset.exampleImgUrl = ""
      const timer = setInterval(() => {
        this.uploadProgress = this.uploadProgress + 10
      }, 200)
      setTimeout(() => {
        const reader = new FileReader();
        reader.onload = () => {
          this.dataset.exampleImgUrl = reader.result;
          clearInterval(timer)
          this.uploadProgress = 0
        };
        // 注意要先设置回调再读取文件
        reader.readAsDataURL(file);
      }, 2000)
      return false
    },
    doPromptEnter() {
      if(!this.dataset.exampleImgUrl) return this.$message.warning('请上传图片')
      if(!this.dataset.promptText) return this.$message.warning('请输入提示信息')
      this.dataset.resImgUrl  = this.getImageSrc()
      this.dataset.codeSnippet = ""
      this.loading = true
      setTimeout(() => {
        this.dataset.resImgUrl = require("./response.png")
        this.dataset.codeSnippet = `
from tools import set_pannel_template, template_match

def construct_template(image: str, template: str) -> List[Dict[str, Any]]:
    """
    Match the panel layout determined by the template.

    Parameters:
        image_path (str): The path to the image.
        template (str): The path to the template.

    Returns:
        List[Dict[str, Any]]: A list of dictionaries containing label,
            and mask of the defect area.
    """

    # Set the panel layout template
    flag = set_pannel_template(template)

    # Match panel layout determined by template
    layout = template_match(image, template, thresh=0.8)

    # return the result
    return {"flag": flag, "name": template, "mask": layout}
        `
        this.highlight();
        this.loading = false;
      }, 5000)
    },
    doFinish() {
      this.confirmLoading = true
      setTimeout(() => {
        this.confirmLoading = false
        this.handleCancel()
        this.$emit('finish')
      }, 1000)
    },
    getImageSrc(url){
      return url || require("@/assets/images/place.gif");
    },
    highlight() {
      this.$nextTick(() => {
        Prism.highlightAll();
      });
    },
    callModal() {
      this.visible = true
      if(this.dataset.codeSnippet) {
        this.highlight()
      }
    },
    handleCancel(e) {
      this.visible = false;
    },
  },
  mounted() {
    
  },
}
</script>

<style lang="less" scoped>
@import "~prismjs/themes/prism-okaidia.css";
@import "~prismjs/plugins/line-numbers/prism-line-numbers.css";
.wrapper {
  padding:  10px 16px;
}
.main {
  height: 500px;
  display: flex;
  .left {
    width: 300px;
    border-right: 1px solid #ccc;
    padding-right: 20px;
    overflow: auto;
    .name-input {
      // display: inline-block;
      width: 75%;
    }
    .img-box {
      height: 138px;
      cursor: pointer;
      padding: 4px;
      position: relative;
      box-sizing: border-box;
      border-radius: 3px;
      border: 5px solid #ccc;
      margin: 10px 0;
      img {
        width: 260px;
        height: 120px;
      }
    }
    .prompt-container {
      position: relative;
      .prompt-input {
        padding-bottom: 30px;
      }
      .prompt-btn {
        position: absolute;
        right: 15px;
        bottom: 5px;
      }
    }
  }
  .right{
    flex: 1;
    overflow: auto;
    position: relative;
    .right-spin {
      position: absolute;
      left: 50%;
      top: 50%;
    }
  }
}
</style>