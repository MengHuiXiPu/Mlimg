<template>
  <a-modal
    :visible="visible"
    :title="dataSetTitle"
    wrapClassName="addEditDialog"
    @ok="handleOk"
    @cancel="handleCancel"
    width="50%"
    :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
    :loading="loading"
    :destroyOnClose="true"
    :maskClosable="false"
  >
    <a-spin :spinning="loading">
      <a-form-model
        ref="ruleForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        layout="horizontal"
        :model="rowData"
        :rules="rules">
        <a-form-model-item label="算法名称" prop="imageName">
          <a-input :maxLength="50" v-model="rowData.imageName" :disabled="this.parentData.isVersion || (Boolean(rowData.id) && isVersion)" style="width: 100%" />
          <!-- 目前rowData中没有versionLabel属性 -->
          <!-- <a-input v-model="rowData.versionLabel" disabled style="width: 40%"/> -->
        </a-form-model-item>
        <!-- <a-form-model-item class="form-model-item-title" label="运行环境">
          <a-radio-group v-model="imageUrlType" @change="imageUrlTypeChange" :disabled="(!isVersion && this.parentData.isVersion) || Boolean(rowData.id)">
            <a-radio :value="'url'">仓库地址</a-radio>
          </a-radio-group>
        </a-form-model-item> -->
        <a-form-model-item label="选择镜像" prop="imageId" v-if="imageUrlType === 'url'">
          <!-- <a-input v-model="rowData.imageId" :disabled="Boolean(rowData.id)"/> -->
          <a-select v-model="rowData.imageId" :disabled="Boolean(rowData.id)" showSearch :filter-option="filterOption">
            <a-select-option v-for="item in imageList" :key="item.id" :value="item.id">
              {{ item.name }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item class="form-model-item-title" label="算法代码">
          <a-radio-group :defaultValue="2" v-model="rowData.algorithmFetchType" @change="algorithmTypeChange" :disabled="Boolean(rowData.id)">
            <!-- <a-radio :value="1">URL</a-radio> -->
            <a-radio :value="2">本地上传</a-radio>
            <a-radio :value="3">已存在算法</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item label="算法url" prop="algorithmUrl" v-if="rowData.algorithmFetchType === 1">
          <a-input v-model="rowData.algorithmUrl" placeholder="http://ai.tcl.cn/file.zip" :disabled="Boolean(rowData.id)"/>
        </a-form-model-item>
        <a-form-model-item label="算法包" v-else-if="rowData.algorithmFetchType === 2" prop="algorithmName">
          <a-input v-model="rowData.algorithmName" :disabled="true" class="algorithmName"/>
          <a-upload :showUploadList="false" :before-upload="algorithmUpload" :disabled="Boolean(rowData.id)">
            <a-button type="default" :disabled="Boolean(rowData.id)"><a-icon type="upload"></a-icon>上传文件</a-button>
          </a-upload>
        </a-form-model-item>
        <a-form-model-item label="已存在算法" prop="fromImageId" v-else>
          <a-select
            v-model="rowData.fromImageName"
            :disabled="Boolean(rowData.id)"
            showSearch
            :filter-option="filterOption"
            @change="getChildren"
            style="width: 50%">
            <a-select-option v-for="item in mirrorList" :key="item.id" :value="item.id" :disabled="!item.atLeastOneAvl">
              {{ item.imageName }}
            </a-select-option>
          </a-select>
          <a-select
            v-model="rowData.fromImageId"
            :disabled="Boolean(rowData.id)"
            showSearch
            :filter-option="filterOption"
            style="width: 50%">
            <a-select-option v-for="item in mirrorChildrenList" :key="item.id" :value="item.id" :disabled="item.imageStatus !== 1">
              {{ item.versionLabel }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <!-- <a-form-model-item label="算法(英文名)" prop="algorithm">
          <a-input :maxLength="50" v-model="rowData.algorithm"/>
        </a-form-model-item> -->
        <!-- <a-form-model-item label="接口协议" prop="c11nType">
          <a-select v-model="rowData.c11nType">
            <a-select-option value="0">TCP</a-select-option>
            <a-select-option value="1">HTTP</a-select-option>
          </a-select>
        </a-form-model-item> -->
        <!-- <a-form-model-item label="业务参数" prop="businessParam">
          <a-input v-model="rowData.businessParam" type="textarea" />
        </a-form-model-item> -->
        <a-form-model-item label="算法说明" prop="imagesDescribe">
          <a-input v-model="rowData.imagesDescribe" type="textarea" />
        </a-form-model-item>

        <a-form-model-item label="算法类型" prop="storedDirName">
          <a-tree-select
            :disabled="this.parentData.isVersion || Boolean(rowData.id)"
            showSearch
            allowClear
            :filterTreeNode="fillterFUN"
            v-model="rowData.storedDirName"
            style="width: 100%"
            :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
            :tree-data="treeData"
            :load-data="onLoadData"
            placeholder="Please select"
            @select="onSelect"
          />
        </a-form-model-item>
        <!-- <a-form-model-item label="是否支持分布式训练" prop="supportDistTraining">
          <a-switch v-model = "rowData.supportDistTraining" />
        </a-form-model-item> -->
      </a-form-model>
    </a-spin>
  </a-modal>
</template>

<script>
import { getImageMrgTreeList } from "@/api/dataCenter"
import { saveImageManage, editImageManage, checkImageNameAvl, newImage, getImageManageList, imageVersion } from "@/api/imageManage"
export default {
  name: "AddEditDialog",
  props: {
    dataSetTitle: {
      type: String,
      default: ""
    },
    tagTypeOpt: {
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
  computed: {
    isVersion () {
      return this.parentData.sourceVersionId !== this.parentData.id
    }
  },
  data () {
    const confirmJSON = (rule, value, callback) => {
      if (!value) {
        // callback(new Error('业务参数不能为空'))
        callback()
      } else {
        if (!isNaN(value)) {
          return callback(new Error('当前参数不符合JSON规范，请重新填写'))
        }
        try {
          const jsonString = JSON.parse(value)
        } catch (err) {
          return callback(new Error('当前参数不符合JSON规范，请重新填写'))
        }
        callback()
      }
    }
    const checkName = async (rule, value, callback) => {
      if (!value || !value.trim()) {
        callback(new Error('当前值不能为空'))
      } else {
        if (value === this.parentData.imageName) return callback()
        const checkData = await checkImageNameAvl({
          imageName: value,
          imageType: this.parentData.imageType
        })
        if (checkData.data) {
          callback()
        } else {
          callback(new Error('当前名称已存在，请重新输入'))
        }
      }
    }
    return {
      imageList: [],
      rules: {
        algorithmImage: [
          {
            required: true,
            message: "请输入算法名称",
            trigger: "blur"
          }
        ],
        imageName: [
          {
            required: true,
            message: "请输入算法名称",
            trigger: "blur"
          }, {
            required: true,
            validator: checkName,
            trigger: "blur"
          }
        ],
        imagesDescribe: [
          {
            required: true,
            message: "请输入算法说明",
            trigger: "blur"
          }
        ],
        imageId: [
          {
            required: true,
            message: "请选择镜像",
            trigger: "change"
          }
        ],
        // algorithm: [
        //   {
        //     required: false,
        //     message: "请输入算法(不能输入中文)",
        //     trigger: "blur",
        //     pattern: `^[^\u4e00-\u9fa5]+$`
        //   }
        // ],
        algorithmUrl: [
          {
            required: true,
            message: "请输入算法url",
            trigger: "blur"
          }
        ],
        algorithmName: [
          {
            required: true,
            message: "请上传算法文件",
            trigger: "change"
          }
        ],
        c11nType: [{
          required: true,
          message: "请选择接口协议",
          trigger: "change"
        }],
        fromImageId: [{
          required: true,
          message: "请选择算法版本",
          trigger: "change"
        }],
        // businessParam: [{
        //   validator: confirmJSON,
        //   trigger: 'blur'
        // }],
        storedDirName: [
          { required: true, message: "请选择算法类型", trigger: "change" }
        ]
      },
      treeData: [],
      formIdLink: "",
      rowData: {},
      algorithmFile: null,
      visible: false,
      loading: false,
      imageUrlType: 'url',
      mirrorList: [],
      mirrorChildrenList: []
    }
  },
  mounted () {},
  methods: {
    async showDialog () {
      this.visible = true
      this.treeData = []
      const query = {
        parentId: "0",
        dlType: 1
      }
      getImageMrgTreeList(query).then(res => {
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          this.treeData = this.genTreeNode(data)
        }
      })
      if (this.$refs.ruleForm) {
        this.$refs.ruleForm.resetFields()
      }
      this.rowData = JSON.parse(JSON.stringify(this.parentData))
      console.log(this.rowData, 'rowData');
      if (!this.rowData.id) this.rowData.algorithmName = ''
      if (this.parentData.algorithmFetchType === 2) {
        this.rowData.algorithmName = this.parentData.algorithmUrl
      }
      await this.getMirrorList()
      if (this.parentData.algorithmFetchType === 3) {
        this.$set(this.rowData, 'fromImageId', this.rowData.fromImageVersion)
      }
      if (this.isVersion) {
        if (this.parentData.isVersion) {
          this.rowData.algorithmFetchType = 2
          this.rowData.algorithmName = ''
          this.rowData.algorithmUrl = ''
          this.rowData.versionLabel = ''
        }
      }
      this.getImageList()
    },
    async getImageList () {
      this.loading = true
      const params = {
        limit: 9999
      }
      this.loading = false
      const res = await newImage.getImageList(params)
      if (res.code !== 0) return false
      this.imageList = res.data.records
    },
    async getMirrorList () {
      this.loading = true
      const res = await getImageManageList({
        limit: 9999999,
        pageNo: 1,
        imageType: 1
      })
      this.loading = false
      if (res.code !== 0) return false
      this.mirrorList = res.data.records
    },
    handleOk () {//点击确定触发
        this.loading = true;
        const that = this;
        this.$refs.ruleForm.validate((valid, obj) => {//验证表单数据
        if (!valid) {
            that.loading = false;
            return false;
        }
        else {
            that.rowData.storedDirId = that.formIdLink || this.parentData.storedDirId;
            if (!that.rowData.id) {
                const formData = new FormData();//创建FormData对象
                this.rowData.imageUrl = '';
                if (!this.rowData.algorithmFetchType) this.rowData.algorithmFetchType = 1;
                formData.append('param', new Blob([JSON.stringify(this.rowData)], {
                    type: 'application/json'
                }))
                if (this.rowData.algorithmFetchType === 2) {
                    formData.append('file', this.algorithmFile);//把文件添加到formData后面
                }
                saveImageManage(formData).then(data => {//调用api保存图像数据
                    that.loading = false;
                    if (data.code === 0) {
                        this.$emit("getDataList", {//向父组件发送自定义事件getDataList
                            pageSize: that.rowData.id ? that.pagination.pageSize : 10,
                            pageIndex: that.rowData.id ? that.pagination.current : 1,
                            isFirst: true
                        })
                        this.visible = false;//控制弹窗关闭
                        that.$message.success(
                            "新增成功！"
                        )
                    }
                })
            }
            else {
                if (!this.rowData.algorithmFetchType) this.rowData.algorithmFetchType = 1;
                editImageManage(this.rowData).then(data => {//调用api修改保存的数据
                    that.loading = false
                    if (data.code === 0) {
                        this.$emit("getDataList", {
                            pageSize: that.rowData.id ? that.pagination.pageSize : 10,
                            pageIndex: that.rowData.id ? that.pagination.current : 1,
                            isFirst: true
                        })
                        this.visible = false
                        that.$message.success(
                            "修改成功！"
                        )
                    }
                })
            }
        }
      })
    },
    onSelect (checkedKeys, node) {
      this.$nextTick(() => {
        this.rowData.storedDirName = node.dataRef.titleLink
        this.formIdLink = node.dataRef.idLink
        this.rowData.tagType = node.dataRef.title
      })
    },
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
    handleCancel () {
      this.loading = false
      this.visible = false
    },
    imageUrlTypeChange () {
      // 更改镜像URL的属性，目前只有一种url的方式
    },
    algorithmTypeChange (e) {
      this.$set(this.rowData, 'fromImageId', null)
      // 更改算法代码的属性，触发该事件时需要讲算法URL切换对应的形式
      this.$refs.ruleForm.clearValidate(['algorithmUrl', 'algorithmName', 'fromImageId'])
    },
    algorithmUpload (file) {
      this.rowData.algorithmName = file.name
      this.algorithmFile = file
      this.$forceUpdate()
      this.$refs.ruleForm.clearValidate(['algorithmName'])
      return false
    },
    filterOption(input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      );
    },
    async getChildren (val) {
      const mirror = this.mirrorList.filter(item => item.id === val)
      if (mirror.length === 0) return false
      this.loading = true
      const res = await imageVersion.getImageVersionList({ sourceVersionId: mirror[0].sourceVersionId })
      this.loading = false
      if (res.code !== 0) return false
      this.mirrorChildrenList = res.data
      if (this.mirrorChildrenList.length === 0) return false
      let i = 0
      while (i < res.data.length) {
        if (res.data[i].imageStatus === 1) {
          this.$set(this.rowData, 'fromImageId', this.mirrorChildrenList[i].id)
          break
        } else {
          i++
        }
      }
      this.$refs.ruleForm.clearValidate(['algorithmUrl', 'algorithmName', 'fromImageId'])
    }
  }
}
</script>

<style lang="less">
.addEditDialog {
  .form-model-item-title{
    .ant-form-item-label > label{
      font-weight: bold;
      font-size: 16px;
      &::before{
        content: '';
        //position: absolute;
        //left: -8px;
        //top: 0;
        //width: 3px;
        //height: 100%;
        //background: rgba(0, 0, 0, 0.8);
      }
      &::after{
        content: '';
      }
    }
  }
  .ant-upload.ant-upload-select{
    line-height: inherit;
  }
  .algorithmName{
    width: calc(100% - 110px)
  }
}
</style>
<style lang="less" scoped>
.example-img {
  height: 60px;
  display: inline-block;
  margin: auto;
}
.ant-form-item {
  margin-bottom: 10px;
}
.div-img {
  width: 100%;
  display: flex;
}
</style>
