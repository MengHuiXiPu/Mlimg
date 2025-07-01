<template>
  <a-modal
    :visible="visible"
    :title="dataSetTitle"
    @ok="handleOk"
    @cancel="handleCancel"
    width="720px"
    :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
    :loading="loading"
    :maskClosable="false"
    destroyOnClose
    centered
  >
    <a-spin :spinning="loading">
      <a-form-model
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        ref="ruleForm"
        layout="horizontal"
        :model="rowData"
        :rules="rules"
      >
        <a-form-model-item label="选择数据源" prop="sourceFromType">
          <a-radio-group
            v-model="rowData.sourceFromType"
            @change="changeDsType"
          >
            <a-radio :value="1">本地文件源</a-radio>
            <a-radio :value="2">NAS文件源</a-radio>
            <a-radio :value="3">NFS文件源</a-radio>
            <a-radio :value="4">已存在数据集</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <template v-if="rowData.sourceFromType === 1">
          <a-form-model-item label="文件路径" required>
            <a-input v-model="rowData.uploadFilePath" disabled style="width:200px;margin-right:10px;" />
            <a-upload
              name="file"
              :showUploadList="false"
              :multiple="false"
              :headers="headers"
              :action="action"
              @change="handleChange"
              :beforeUpload="uploadError"
              accept=".zip"
              :customRequest="uploadFilesCustomRequest"
            >
              <template v-if="!dlRealDirDisable">
                <a-button :disabled="dlRealDirDisable">
                  <a-icon type="upload" />
                  {{ dlRealDirText }}
                  <!-- <a-spin size="small" style="margin-left: 5px" v-if="dlRealDirDisable" /> -->
                </a-button>
              </template>
            </a-upload>
            <div v-if="dlRealDirDisable" style="display: inline-block;width: 200px">
              <!-- <a-progress percent="50" size="small" status="active" /> -->
              <a-progress :percent="progress.val" size="small" :status="progress.status" />
            </div>
          </a-form-model-item>
          <div style="margin-left:121px;margin-bottom:10px;">
            文件上传有严格规范，请查看
            <a-popover title="文档上传说明" destroyTooltipOnHide>
              <template slot="content" >
                <p class="example">
                  <template v-if="rowData.dlType === '3'  ">
                    文件仅支持（1）zip格式的压缩包，压缩包大小请控制在10GB以内；（2）指定网盘共享目录的文件夹路径；
                  </template>
                  <!-- <template v-else-if="rowData.dlTagType === '分类'">
                    文件仅支持（1）zip格式的压缩包，压缩包大小请控制在10GB以内；（2）指定网盘共享目录的文件夹路径；Images为固定文件夹名称，其下的文件夹名即是标签名，只能包含字母/数字/下划线。图片命名不能以.开头。
                  </template> -->
                  <template v-else>
                    文件仅支持（1）zip格式的压缩包，压缩包大小请控制在10GB以内；（2）指定网盘共享目录的文件夹路径；Images、Anotations为固定文件夹名称，其下的文件夹名即是标签名，只能包含字母/数字/下划线。图片命名不能以.开头。其中，Images、Annotations下的标签名与文件名应同名对应。
                  </template>
                </p>
                <div class="div-img">
                  <img :src="require('@/assets/img/kaidan.png')" class="example-img" v-if="rowData.dlType == '3'"/>
                  <!-- <img :src="exampleImg[0]" class="example-img" v-else-if="rowData.dlTagType === '分类'"/> -->
                  <!-- <img :src="exampleImg[1]" class="example-img" v-else/> -->
                  <img :src="require('@/assets/images/datasetIntro.png')" class="example-img" v-else>
                </div>
              </template>
              <a href="#">上传说明</a>
            </a-popover>
          </div>
        </template>
        <template v-else-if="rowData.sourceFromType === 2 || rowData.sourceFromType === 3">
          <a-form-model-item label="选择数据源" prop="nasId">
            <a-select
              v-model="rowData.nasId"
              @change="changeNasSource()">
              <a-select-option
                v-for="(item,key) in nasSourceList"
                :key="key"
                :value="item.id"
              >{{ item.dsName }}</a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item label="文件路径" prop="remoteFilePath">
            <a-tree-select
              v-model="rowData.remoteFilePath"
              show-search
              :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
              placeholder="请选择文件路径"
              allow-clear
              :tree-data="nasDirectory"
              :load-data="onLoadDirectory"
            >
            </a-tree-select>
          </a-form-model-item>
        </template>
        <template v-else-if="rowData.sourceFromType === 4">
          <a-form-model-item label="数据集类型" prop="dlTagType" v-if="parentData.dlType !== 3">
            <a-select v-model="rowData.dlTagType" @change="getParentDlList">
              <a-select-option
                v-for="(item,key) in dlTagTypeOpt"
                :key="key"
                :value="item.value"
              >{{ item.text }}</a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item label="选择数据集" prop="parentId">
            <a-select v-model="rowData.parentId" @change="getCodeList" showSearch :filter-option="filterOption">
              <a-select-option v-for="item in parentDlList" :key="item.dlId" :value="item.dlId">
                {{ item.dlName }}
              </a-select-option>
            </a-select>
          </a-form-model-item>
          <a-form-model-item label="追加方式" prop="dsChildType">
            <a-radio-group v-model="rowData.dsChildType">
              <a-radio :value="1">全部</a-radio>
              <a-radio :value="2">按Code</a-radio>
            </a-radio-group>
          </a-form-model-item>
          <a-form-model-item label="选择Code" prop="codeList" v-if="rowData.dsChildType === 2">
            <a-select
              v-model="rowData.codeList"
              mode="multiple"
              allowClear
              showSearch
              :filterOption="filterOption"
            >
              <a-select-option
                v-for="item in codeFilterList"
                :key="item.categoryName"
                :value="item.categoryName">
                <span>{{item.categoryName}}</span>
                <span style="float:right;color:#8c8c8c">({{item.number}})</span>
              </a-select-option>
            </a-select>
          </a-form-model-item>
        </template>
      </a-form-model>
    </a-spin>
  </a-modal>
</template>

<script>
import img1 from "@/assets/img/class.jpg"
import img2 from "@/assets/img/classTwo.jpg"
import img3 from '@/assets/img/kaidan.png'
import Cookie from "js-cookie"
import { rootDomain } from "@/utils/util"
import {
  getAllNasList,
  getSelectedNasDirectory,
  getDataListByDlTag,
  pushData
} from "@/api/dataCenter"
import { getFileCategoryAndCount } from '@/api/modelManage'
import debounce from 'lodash.debounce'
import { axios } from '@/utils/request'
export default {
  name: "pushData",
  props: {
    dataSetTitle: {
      type: String,
      default: ""
    },
    dlTagTypeOpt: {
      type: Array,
      default: () => []
    },
    parentData: {
      type: Object,
      default: () => {}
    },
    pagination: {
      type: Object,
      default: () => {}
    }
  },
  data () {
    return {
      rules: {
        sourceFromType: [
          {
            required: true,
            message: "请选择数据集类型",
            trigger: "change"
          }
        ],
        dlTagType: [
          {
            required: true,
            message: "请选择标注类型",
            trigger: "change"
          }
        ],
        uploadFilePath: [
          {
            required: true,
            message: "请上传文件",
            trigger: "change"
          }
        ],
        parentId: {
          required: true,
          message: "请选择数据集",
          trigger: "change"
        },
        dsChildType: {
          required: true,
          message: "请选择追加方式",
          trigger: "change"
        },
        codeList: {
          required: true,
          message: "请选择Code",
          trigger: "change"
        },
        remoteFilePath: {
          required: true,
          message: "请选择文件路径",
          trigger: "change"
        },
        nasId: {
          required: true,
          message: "请选择数据源",
          trigger: "change"
        }
      },
      codeFilterList: [],
      formIdLink: "",
      rowData: {},
      visible: false,
      loading: false,
      exampleImg: [img1, img2, img3],
      headers: {},
      dlRealDirText: "",
      dlRealDirDisable: false,
      action: "/api/v1/datacenter/file/upload",
      nasSourceList: [],
      nasDirectory: null,
      progress: {
        val: 0,
        status: 'active'
      },
      parentDlList: [],
      hideCodeList: true,
      searchValue: '',
      dataSetVisible: false,
      createTreeData: {}
    }
  },
  mounted () {
    if(window._env_) {
      const tokenType = Cookie.get(
        window._env_.COOKIE_TOKENTYPE_KEY || "token_type",
        { domain: rootDomain() }
      )
      const token = Cookie.get(window._env_.COOKIE_TOKEN_KEY || "access_token", {
        domain: rootDomain()
      })
      if (token && tokenType) {
        this.headers["Authorization"] = tokenType + " " + token
      }
    }
  },
  methods: {
    showDialog () {
      this.visible = true
      this.progress = {
        val: 0,
        status: 'active'
      }
      if (this.$refs.ruleForm) {
        this.$refs.ruleForm.resetFields()
      }
      // this.rowData = { ...this.parentData }
      const { id, dlTagType } = this.parentData
      this.rowData = {
        currentDlId: id,
        parentId: '',
        codeMap: '',
        uploadFilePath: '',
        remoteFilePath: '',
        sourceFromType: 1,
        dsChildType: 1,
        dlTagType: dlTagType,
        nasId: ''
      }
      this.$set(this.rowData, 'dsChildType', 1)
      this.changeDsType()
      this.dlRealDirText = "上传文件"
    },
    handleOk () {
      this.$refs.ruleForm.validate(valid => {
        if (!valid) {
          return false
        } else {
          console.log("当前数据",this.rowData)
          if (!this.rowData.uploadFilePath && this.rowData.sourceFromType === 1) {
            this.$message.error("请上传文件！")
            return false
          } else {
            this.loading = true
            if (this.rowData.dsChildType === 1) {
              this.$set(this.rowData, 'codeMap', this.codeFilterList.map(item => item.categoryName))
            } else {
              this.$set(this.rowData, 'codeMap', this.rowData.codeList)
            }
            const { currentDlId, codeMap, parentId, uploadFilePath, remoteFilePath, sourceFromType, nasId } = this.rowData
            const params = { currentDlId, codeMap, parentId, uploadFilePath, remoteFilePath, sourceFromType, nasId }
            pushData(params).then(data => {
              this.loading = false
              if (data.code === 0) {
                this.$emit("getDataList", {
                  pageSize: this.pagination.pageSize,
                  pageIndex: this.pagination.current,
                  isFirst: false,
                  dataType: 'add'
                })
                this.visible = false
                this.$message.success('操作成功')
              }
            }).catch(err => {
              this.loading = false;
              this.$message.error(
                err?.response?.data?.msg || err?.response?.data?.message
              )
            })
          }
        }
      })
    },
    fileFormatter(data) {
      let file = {
        // uid: data.uuid,    // 文件唯一标识，建议设置为负数，防止和内部产生的 id 冲突
        name: data.data,   // 文件名
        status: 'done', // 状态有：uploading done error removed
        response: '{"status": "success"}', // 服务端响应内容
      }
      return file
    },
    uploadFilesCustomRequest(data){
      this.dlRealDirDisable = true
      const formData = new FormData();
      formData.append('file', data.file);
      axios.post(this.action, formData, {
        onUploadProgress: progressEvent => {
          let percent = (progressEvent.loaded / progressEvent.total * 100 | 0);
          this.progress.val = Number(percent.toFixed(2))
        }
      }).then((response) => {
            if (response.code == 0) {
              let file = this.fileFormatter(response);
              // this.downloadFiles.push(file);
              this.rowData.uploadFilePath = file.name;
              this.dlRealDirDisable = false
              this.dlRealDirText = "替换文件"
            } else {
              this.$message.error(response.msg);
              this.$message.error("上传错误")
              this.dlRealDirDisable = false
              this.dlRealDirText = "上传文件"
            }
          })
          .catch((error) => {
            console.error('Upload Error:', error);
            this.$message.error("上传错误")
            this.dlRealDirDisable = false
            this.dlRealDirText = "上传文件"
          });
    },
    handleChange (file) {
      this.progress.status = 'active'
      if (file.event) {
        this.progress.val = Number(file.event.percent.toFixed(2))
        if (file.event.percent === 100) {
          this.progress.status = 'success'
        }
      }
      if (file.file.status === "done") {
        this.rowData.uploadFilePath = file.file.response.data
        this.dlRealDirDisable = false
        this.dlRealDirText = "替换文件"
      }
      if (file.file.status === "error") {
        this.$message.error("上传错误")
        this.dlRealDirDisable = false
        this.dlRealDirText = "上传文件"
      }
      if (file.file.status === "uploading") {
        this.dlRealDirDisable = true
        // this.dlRealDirText = `文件上传中(${this.progress}%)`
      }
    },
    handleCancel () {
      this.dlRealDirDisable = false
      this.nasDirectory = []
      this.progress = {
        val: 0,
        status: 'active'
      }
      this.visible = false
    },
    changeDsType () {
      this.rowData = {
        ...this.rowData,
        parentId: '',
        codeMap: '',
        uploadFilePath: '',
        remoteFilePath: '',
        dsChildType: 1,
        nasId: ''
      }
      this.dlRealDirText = "上传文件";
      // 移除表单项的校验结果。
      if (this.$refs.ruleForm) {
        this.$refs.ruleForm.clearValidate()
      }
      if (this.rowData.sourceFromType === 1) return false
      if (this.rowData.sourceFromType === 2 || this.rowData.sourceFromType === 3) {
        const params = {
          dsType: this.rowData.sourceFromType === 2 ? 'NAS' : 'NFS'
        }
        getAllNasList(params).then(res => {
          this.nasSourceList = res.data
        })
      }
      if (this.rowData.sourceFromType === 4) {
        this.getParentDlList()
      }
    },
    async changeNasSource (val) {
      const params = {
        id: this.rowData.nasId,
        selectedPath: val
      }
      const res = await getSelectedNasDirectory(params)
      if (res.code !== 0) return false
      const data = res.data
      this.rowData.remoteFilePath = ''
      this.nasDirectory = this.traverseObject(data.children, '/')
    },
    searchDirectory: debounce(function(val) {
      if (!this.rowData.nasId) {
        this.$message.warning('请先选择一个数据源')
        return false
      }
      // this.changeNasSource(val)
      return false
    }, 300),
    async onLoadDirectory (treeNode) {
      const { children, key } = treeNode.dataRef
      const params = {
        id: this.rowData.nasId,
        path: key
      }
      const res = await getSelectedNasDirectory(params)
      if (res.code !== 0) return false
      treeNode.dataRef.children = this.genDirectoryTreeNode(res.data.children, key)
      this.nasDirectory = [ ...this.nasDirectory]
    },
    genDirectoryTreeNode (data, key) {
      return data.map(item => {
        const { name, children } = item
        return {
          key: key + name + '/',
          value: key + name + '/',
          title: name,
          isLeaf: children
        }
      })
    },
    traverseObject (data, parentKey) {
      return data.map((key, index) => {
        const currentKey = parentKey + key.name + '/'
        return {
          key: currentKey,
          value: key.name,
          title: key.name,
          parentKey: parentKey,
          children: key.children ? this.traverseObject(key.children, currentKey) : undefined
        }
      })
    },
    uploadError (file) {
      if (file.name.substring(file.name.lastIndexOf('.') + 1) !== 'zip') {
        this.$message.error('请上传zip格式文件')
        return false
      }
      if (file.size > (1024 * 1024 * 10240)) {
        this.$message.error('文件大小不能超过10GB')
        return false
      }
    },
    async getParentDlList () {
      const params = {
        dlTagType: this.rowData.dlTagType,
        dlType: this.parentData.dlType
      }
      this.loading = true
      const res = await getDataListByDlTag(params)
      this.loading = false
      if (res.code !== 0) return false
      this.parentDlList = res.data
      this.$set(this.rowData, 'parentId', res.data[0].dlId)
      this.getCodeList(res.data[0].dlId)
    },
    async getCodeList (id) {
      this.loading = true
      const res = await getFileCategoryAndCount({
        id,
        markRange: 0,
        reviewRange: 0
      })
      this.loading = false
      if (res.code !== 0) return false
      if (res.data?.DataListCategory) {
        this.codeFilterList = res.data.DataListCategory.map((item, index) => {
          return {
            categoryName: item,
            number: res.data.DataListCategoryNum[index],
            categoryValue: res.data.DataListCategoryNum[index],
            parentValue: 0
          }
        })
      }
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
    changeAllValue (val) {
      this.codeFilterList.forEach((item, index) => {
        const number = this.rowData.pickCountType === 1 ? item.number : 100
        item.categoryValue = val > number ? number : val
        item.parentValue = number - item.categoryValue
      })
    },
  }
}
</script>

<style scoped lang="less">
.example{
  width: 600px;
}
.example-img {
  width: 400px;
  height: 270px;
  display: inline-block;
  margin: auto;
}
.ant-row-flex{
  display: block;
}
.code-list{
  &-title{
    margin: 0 0 5px 160px;
    span{
      width: 36%;
      display: inline-block;
    }
  }
  .code{
    padding-left: 50px!important;
    .number{
      margin: 0 15px 0 5px;
      color: #ccc;
      width: 60px;
      display: inline-block;
      &:last-child{
        display: inline;
      }
    }
    .ant-input-number{
      width: 50%;
    }
    &.show-parent{
      .ant-input-number{
        width: 20%;
      }
    }
  }
}
.div-img {
  width: 100%;
  display: flex;
}
.ant-select-tree-node-content-wrapper{
  .create{
    float: right;
    display: none;
  }
  &:hover{
    .treeName{
      .create{
        display: inline;
      }
    }
  }
}
</style>
