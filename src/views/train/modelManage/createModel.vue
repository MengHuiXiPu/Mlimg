<template>
  <a-modal
    :visible="visible"
    title="新建模型"
    @ok="handleOk"
    @cancel="handleCancel"
    :maskClosable="false"
    :confirm-loading="confirmLoading"
    width="700px"
  >
    <a-form-model
      ref="ruleForm" class="create-model-form"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
      layout="horizontal"
      :model="formData"
      :rules="formRules">
      <a-form-model-item label="模型名称" prop="modelName">
        <a-input :maxLength="50" v-model="formData.modelName" placeholder="请输入模型名称"/>
      </a-form-model-item>
      <a-form-model-item label="上传模型方式">
        <a-radio-group v-model="isUpload" @change="onChange">
          <a-radio :value="false">选择算法文件</a-radio>
          <a-radio :value="true">上传算法文件</a-radio>
        </a-radio-group>
      </a-form-model-item>
      <a-form-model-item label="算法名称" prop="mirrorName" v-if="isUpload">
        <a-input :maxLength="50" v-model="formData.mirrorName" placeholder="请输入算法名称"/>
      </a-form-model-item>
      <a-form-model-item label="选择镜像" prop="tbImageId" v-if="isUpload">
        <image-select v-model="formData.tbImageId" allowClear width="100%"></image-select>
      </a-form-model-item>
      <a-form-model-item label="算法文件" prop="mirrorId">
        <a-input v-if="isUpload" v-model="formData.mirrorId" disabled placeholder="请上传算法文件">
          <a-upload slot="addonAfter" :before-upload="uploadAlgoCodeFile" :showUploadList="false">
            <a-button type="default"><a-icon type="upload"></a-icon>点击上传</a-button>
          </a-upload>
        </a-input>
        <algorithm-select v-else v-model="formData.mirrorId" width="100%" @change="algorithmChange"></algorithm-select>
      </a-form-model-item>
      <a-form-model-item label="算法类型" prop="tagTypeText" v-if="isUpload">
        <a-tree-select showSearch allowClear placeholder="请选择算法类型"
          :filterTreeNode="fillterFUN"
          v-model="formData.tagTypeText"
          style="width: 100%"
          :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
          :tree-data="treeData"
          :load-data="onLoadData"
          @select="onSelect"
        />
      </a-form-model-item>
      <a-form-model-item label="接口协议" prop="c11nType" v-if="isUpload">
        <a-select v-model="formData.c11nType">
          <a-select-option value="0">TCP</a-select-option>
          <a-select-option value="1">HTTP</a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item label="存放目录" prop="storedDirId">
        <dict-select-tree  @change="handleDictChange" width="100%" size="default"></dict-select-tree>
      </a-form-model-item>
      <a-form-model-item label="模型文件" prop="modelFileName">
        <a-input v-model="formData.modelFileName" disabled placeholder="请上传模型文件">
          <a-upload slot="addonAfter" :showUploadList="false" :before-upload="uploadModelFile">
            <a-button type="default"><a-icon type="upload"></a-icon>点击上传</a-button>
          </a-upload>
        </a-input>
      </a-form-model-item>
      <a-form-model-item label="业务参数" prop="configJson">
        <a-input v-model="formData.configJson" type="textarea" placeholder="分类onnx模型请输入ymap json"/>
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
// 通过上传onnx 手动上传创建模型
import { importModel } from "@/api/modelManage.js"
import { getImageMrgTreeList } from "@/api/dataCenter"
import imageSelect from "@/components/business/imageSelector/index.vue"
import { saveImageManage } from "@/api/imageManage";
import dictSelectTree from "@/components/business/dictSelectTree/index.vue";
import algorithmSelect from "@/components/business/algorithmSelector/index.vue";
import { checkNotSpace } from "@/utils/formValidate.js";
export default {
  components: {
    imageSelect,
    dictSelectTree,
    algorithmSelect,
  },
  data() {
    const validJSON = (rule, value, callback) => {
      if (!value) {
        callback()
      } else {
        try {
          const jsonString = JSON.parse(value)
          callback()
        } catch (err) {
          callback(new Error('当前参数不符合JSON规范，请重新填写'))
        }
      }
    }
    const validMirror = (rule, value, callback) => {
      if(!this.formData.mirrorId && !this.formData.algoCodeFileName) {
        callback(new Error('请选择算法或上传代码文件'))
      }else {
        callback()
      }
    }
    return {
      confirmLoading: false,
      isUpload: false,
      formData: {
        modelName:'',
        mirrorName:'', // 算法name
        tbImageId: '',
        tagType: '',    //算法类型 id这种格式：32;32;12;
        tagTypeText: '', // 算法类型text (例如： 图像/分类)
        tagTypelabel: '',  //算法类型(例如： 分类 或 目标检测)
        modelFileName: '',  //onnx的模型文件名称
        modelFile: null,
        algoCodeFileName: '',   //代码文件名称
        algoCodeFile: null,  
        c11nType: "0",
        storedDirId: '', //存放目录id
        storedDirName: '',
        mirrorId: '',    //算法id， 选择算法时是id，上传算法时 是上传的文件的名称：即algoCodeFileName
        configJson: "", 
      },
      formRules: {
        modelName: [{ required: true, validator: checkNotSpace, trigger: "blur"}],
        modelFileName: [{ required: true, message: "请上传模型文件", trigger: "change"}],
        mirrorName: [{ required: true, validator: checkNotSpace, trigger: "blur"}],
        tbImageId: [{ required: true, message: "请选择镜像", trigger: "blur"}],
        mirrorId: [{ required: true, validator: validMirror, message: "请选择算法或上传代码文件", trigger: "change"}],
        tagTypeText: [{ required: true, message: "请选择算法类型", trigger: "change"}],
        c11nType: [{ required: true, message: "请选择协议名称", trigger: "blur"}],
        storedDirId: [{ required: true, message: "请选择存放目录", trigger: "change"}],
        configJson: [{ validator: validJSON,trigger: 'blur'}],
      },
      treeData: [], //算法类型
      // mirrorFileList: [], //
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
  },
  methods: {
    onChange(){
      // 清除校验的form-item项，只是清除校验
      const props = ['mirrorName', 'tbImageId', 'tagTypeText', 'c11nType', 'storedDirId'];
      this.$refs.ruleForm.clearValidate(props);
      this.formData.algoCodeFileName = '';
      this.formData.algoCodeFile = null;
      this.formData.mirrorId = '';
      this.formData.tagType = '';
      this.formData.tagTypeText = '';
    },
    algorithmChange(obj = {}){
      this.formData.tagTypelabel = obj.tagType || '';
    },
    uploadModelFile (file) {
      this.formData.modelFileName = file.name;
      this.formData.modelFile = file;
      this.$refs.ruleForm.clearValidate(['modelFileName'])
      return false
    },
    uploadAlgoCodeFile (file) {
      this.formData.algoCodeFileName = file.name;
      this.formData.algoCodeFile = file;
      this.formData.mirrorId = file.name;
      // this.mirrorFileList.push(file)
      this.$refs.ruleForm.clearValidate(['mirrorId'])
      return false
    },
    // 先创建一个算法
    saveMirror() {
      const { tbImageId, tagType, algoCodeFile, tagTypeText, c11nType, tagTypelabel, mirrorName } = this.formData
      const formData = new FormData();
      // 这些参数都是后台临时告知 要先调用算法的导入接口保存算法，再走后续，字段与原有算法保存冲突，很乱
      formData.append('param', new Blob([JSON.stringify({
        storedDirId: tagType,
        storedDirName: tagTypeText,
        c11nType,
        tagType: tagTypelabel,
        dsType: 1,
        imageType: 1,
        addType: 1,
        algorithmFetchType: 2,  //表示本地上传
        imageName: mirrorName,
        imageId: tbImageId,
      })], {
          type: 'application/json'
      }))
      formData.append('file', algoCodeFile);//算法文件
      return saveImageManage(formData)
    },
    handleOk() {
      this.$refs.ruleForm.validate(async (valid, obj) => {//验证表单数据
        if (!valid) return false
        try {
          this.confirmLoading = true
          let mirrorId
          if(this.isUpload) {  //代表要使用上传的算法文件
            const saveMirrorRes = await this.saveMirror()
            // 获取生成的算法id
            mirrorId = saveMirrorRes.data;
            // 竟然存在code==0,但data没有算法id的情况
            if(saveMirrorRes.code != 0 || !mirrorId) {
              this.$message.error("算法保存失败")
              console.error("请检查保存算法接口是否保存算法成功，以及是否返回生成的算法id")
              return
            }
          }else {
            mirrorId = this.formData.mirrorId
          }
          const fileForm = new FormData();
          const { modelName, modelFile, storedDirId, storedDirName, tagTypelabel, configJson } = this.formData
          const params = {
            modelName,
            imagesId: mirrorId,   //算法id
            storedDirId,
            storedDirName,
            isPublish: 1,  //固定值
            tagType: tagTypelabel,
            configJson: configJson
          }
          fileForm.append('modelImportDto', new Blob([JSON.stringify(params)], {type: 'application/json'}))
          if(modelFile) {
            fileForm.append('modelFile', modelFile)
          }
          const res = await importModel(fileForm)
          this.confirmLoading = false
          if(res.code == 0) { //
            this.$message.success("已保存")
            this.handleCancel( {},true)
          }
        } catch (error) {
          console.log(error)
          this.confirmLoading = false
        }
      })
    },
    handleCancel($event, refreshFlag) {
      this.$emit("update:visible", false)
      if(refreshFlag) {
        this.$emit('refreshList')
      }
    },
    //
    genTreeNode (data, titleLink) {
      return data.map(item => {
        const { nodeName, nodeCode, id, childNodeNum } = item
        return {
          id,
          idLink: `${nodeCode}${id};`,
          titleLink: titleLink ? `${titleLink} / ${nodeName}` : nodeName,
          // value就是idLink
          value: `${nodeCode}${id};`,
          title: nodeName,
          nodeCode,
          disabled: childNodeNum !== 0,
          isLeaf: childNodeNum === 0
        }
      })
    },
    onLoadData (treeNode) {
      const { id, nodeCode, titleLink } = treeNode.dataRef
      const query = {
        parentId: id,
        dlType: 1,
        parentCode: nodeCode
      }
      return getImageMrgTreeList(query).then(res => {
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          treeNode.dataRef.children = this.genTreeNode(data, titleLink)
          this.treeData = [...this.treeData]
        }
      })
    },
    fillterFUN (searchVal, treeNode) {
      return treeNode.data.props.title.includes(searchVal)
    },
    onSelect (checkedKeys, node) {
      this.$nextTick(() => {
        this.formData.tagTypeText = node.dataRef.titleLink
        this.formData.tagType = node.dataRef.idLink
        this.formData.tagTypelabel = node.dataRef.title
        // this.formData.tagType = node.dataRef.title
      })
    },
    handleDictChange(res = {}) {
      this.formData.storedDirName = res.title
      this.formData.storedDirId = `${res.nodeCode}${res.id};`
    }
  },
  created () {
     // 加载算法类型第一级数据
     getImageMrgTreeList({
      parentId: "0",
      dlType: 1
    }).then(res => {
      const { data = [], code = 0 } = res
      if (res.code === 0) {
        this.treeData = this.genTreeNode(data)
      }
    })
  },
}
</script>

<style lang="less" scoped>
.create-model-form {
  ::v-deep .ant-form-item{
    margin-bottom: 15px;
  }
  ::v-deep .ant-input-group-addon{
    border: none;
    background-color: transparent;
  }
}
</style>