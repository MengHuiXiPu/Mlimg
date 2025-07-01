<template>
  <a-modal
    :visible="visible"
    :title="dataSetTitle"
    wrapClassName="addBusinessDialog"
    @ok="handleOk"
    @cancel="handleCancel"
    width="50%"
    centered
    :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
    :loading="loading"
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
          <a-input :maxLength="50" v-model="rowData.imageName" :disabled="this.parentData.isVersion || (Boolean(rowData.id) && isVersion)" style="width: 60%"  />
          <a-input v-model="rowData.versionLabel" disabled style="width: 40%"/>
        </a-form-model-item>
        <!-- <a-form-model-item class="form-model-item-title" label="运行环境">
          <a-radio-group v-model="imageUrlType" @change="imageUrlTypeChange" :disabled="(!isVersion && this.parentData.isVersion) || Boolean(rowData.id)">
            <a-radio :value="'url'">仓库地址</a-radio>
          </a-radio-group>
        </a-form-model-item> -->
        <a-form-model-item label="选择镜像" prop="imageId" v-if="imageUrlType === 'url'">
          <!-- <a-input v-model="rowData.imageId" :disabled="Boolean(rowData.id)"/> -->
          <a-select v-model="rowData.imageId" :disabled="Boolean(rowData.id)">
            <a-select-option v-for="item in imageList" :key="item.id" :value="item.id">
              {{ item.name }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item class="form-model-item-title" label="业务代码">
          <a-radio-group :defaultValue="2" v-model="rowData.algorithmFetchType" @change="algorithmTypeChange" :disabled="Boolean(rowData.id)">
            <!-- <a-radio :value="1">URL</a-radio> -->
            <a-radio :value="2">本地上传</a-radio>
            <a-radio :value="3">已存在算法</a-radio>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item label="代码URL" prop="algorithmUrl" v-if="rowData.algorithmFetchType === 1">
          <a-input v-model="rowData.algorithmUrl" placeholder="http://ai.tcl.cn/file.zip" :disabled="Boolean(rowData.id)"/>
        </a-form-model-item>
        <a-form-model-item label="代码文件" v-else-if="rowData.algorithmFetchType === 2" prop="algorithmName">
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
            @change="getMirrorChildren"
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
        <a-form-model-item class="form-model-item-title universalMirror" label="通用算法">
          <a-list :data-source="universalMirrorList" size="small">
            <a-list-item slot="renderItem" slot-scope="item, index">
              <div class="universalMirrorName">
                {{ item.name }}
              </div>
              <div class="universalMirrorValue">
                <a-tree-select
                  v-model="item.value"
                  show-search
                  style="width: 100%"
                  :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
                  placeholder="请选择算法"
                  allow-clear
                  :replaceFields="{
                    key: 'id',
                    value: 'value',
                    children: 'child',
                    title: 'imageName'
                  }"
                  @select="function (value, node, extra) { treeChange(value, node, extra, index) }"
                  :tree-data="universalMirror"
                >
                </a-tree-select>
              </div>
              <div class="universalMirrorVersion">
                <a-select placeholder="请选择版本" v-model="item.version" @change="$forceUpdate()">
                  <a-select-option v-for="version in item.list" :key="version.id" :value="version.id" :disabled="version.imageStatus !== 1">
                    {{ version.name }}
                  </a-select-option>
                </a-select>
              </div>
              <div class="deleteUniversalMirror">
                <span @click="deleteUniversalMirror(index)"><a-icon type="delete"></a-icon></span>
              </div>
            </a-list-item>
            <!-- <div slot="header">
              Header
            </div> -->
            <div slot="footer">
              <a-form-model
                hideRequiredMark
                :rules="addUniversalMirrorRule"
                ref="addUniversalMirrorData"
                :model="addUniversalMirrorData"
                class="addUniversalMirror">
                <a-form-model-item prop="name">
                  <a-input placeholder="请输入算法名称" v-model="addUniversalMirrorData.name"></a-input>
                </a-form-model-item>
                <a-form-model-item prop="id">
                  <a-tree-select
                    placeholder="请选择算法"
                    v-model="addUniversalMirrorData.value"
                    show-search
                    width="100%"
                    :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
                    allow-clear
                    :replaceFields="{
                      key: 'id',
                      value: 'value',
                      children: 'child',
                      title: 'imageName'
                    }"
                    @select="selectImage"
                    :tree-data="universalMirror"
                  >
                  </a-tree-select>
                </a-form-model-item>
                <a-form-model-item prop="version">
                  <a-select placeholder="请选择版本" v-model="addUniversalMirrorData.version">
                    <a-select-option v-for="version in addUniversalMirrorData.list" :value="version.id" :key="version.id" :disabled="version.imageStatus !== 1">
                      {{ version.name }}
                    </a-select-option>
                  </a-select>
                </a-form-model-item>
                <a-form-item style="line-height: 40px">
                  <a-button type="text" @click="addUniversalMirror" v-tooltip="'点击 + 添加通用算法'"><a-icon type="plus"></a-icon></a-button>
                </a-form-item>
              </a-form-model>
            </div>
          </a-list>
        </a-form-model-item>
        <!-- <a-form-model-item label="业务参数" prop="businessParam">
          <a-input v-model="rowData.businessParam" type="textarea" />
        </a-form-model-item> -->
        <a-form-model-item label="算法说明" prop="imagesDescribe">
          <a-input v-model="rowData.imagesDescribe" type="textarea" />
        </a-form-model-item>
        <!-- <a-form-model-item label="算法类型" prop="storedDirName">
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
        </a-form-model-item> -->
      </a-form-model>
    </a-spin>
  </a-modal>
</template>

<script>
import { getImageMrgTreeList } from "@/api/dataCenter"
import { saveImageManage,
  editImageManage,
  getImageListTree,
  checkImageNameAvl,
  newImage,
  imageVersion,
  getImageManageList
} from "@/api/imageManage"
export default {
  name: "AddBusinessDialog",
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
        fromImageId: [{
          required: true,
          message: "请选择算法版本",
          trigger: "change"
        }],
        c11nType: [{
          required: true,
          message: "请选择接口协议",
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
      addUniversalMirrorRule: {
        name: [{ required: true, message: '请输入算法名称', trigger: 'blur' }],
        value: [{ required: true, message: '请选择通用算法', trigger: 'change' }],
        version: [{ required: true, message: '请选择版本', trigger: 'change' }]
      },
      treeData: [],
      formIdLink: "",
      rowData: {},
      algorithmFile: null,
      visible: false,
      loading: false,
      imageUrlType: 'url',
      algorithmName: '',
      universalMirrorList: [],
      addUniversalMirrorData: {
        name: '',
        id: '',
        value: null,
        list: [],
        version: ''
      },
      universalMirror: null,
      mirrorChildrenList: []
    }
  },
  mounted () {},
  methods: {
    async showDialog () {
      this.visible = true
      this.treeData = []
      this.activeData()
      const query = {
        parentId: "0",
        dlType: 2
      }
      await this.getImageListTreeData()
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
      if (this.parentData.imageDepend) this.universalMirrorList = JSON.parse(this.parentData.imageDepend)
      this.universalMirrorList.forEach((item, index) => {
        if (!item.parentId) item.parentId = item.id
        item.value = this.getImageName(item.parentId)
        item.version = item.id
        this.getChildren(item.parentId).then(res => {
          this.$set(this.universalMirrorList[index], 'list', res)
        })
      })
    },
    getImageName (id) {
      let name = ''
      this.universalMirror.forEach(item => {
        item.child.forEach(child => {
          if (child.id === id) name = child.imageName
        })
      })
      return name
    },
    async getImageList () {
      const params = {
        limit: 9999
      }
      const res = await newImage.getImageList(params)
      if (res.code !== 0) return false
      this.imageList = res.data.records
    },
    async getMirrorList () {
      this.loading = true
      const res = await getImageManageList({
        limit: 9999999,
        pageNo: 1,
        imageType: 2
      })
      this.loading = false
      if (res.code !== 0) return false
      this.mirrorList = res.data.records
    },
    activeData () {
      this.rowData = {}
      this.algorithmName = ''
      this.universalMirrorList = []
    },
    getImageListTreeData () {
      getImageListTree().then(res => {
        const data = res.data
        this.universalMirror = data.map((item, index) => {
          item.child.forEach(child => {
            child.value = child.imageName
            child.parentId = child.id
            child.disabled = !child.atLeastOneAvl
          })
          return {
            imageName: item.tagType,
            child: item.child,
            value: item.tagType,
            id: '0-' + index,
            disabled: true
          }
        })
      })
    },
    handleOk () {
      // const that = this
      this.loading = true
      this.$refs.ruleForm.validate(valid => {
        if (!valid) {
          this.loading = false
          return false
        } else {
          // this.rowData.storedDirId = this.formIdLink || this.parentData.storedDirId
          this.rowData.tagType = "业务算法"
          this.rowData.storedDirId = "0;0;0;"
          this.rowData.imageDepend = JSON.stringify(this.universalMirrorList.map(item => {
            const { version: id, name, value, parentId } = item
            return {
              id, name, value, parentId
            }
          }))
          if (!this.rowData.id) {
            const formData = new FormData()
            if (!this.rowData.algorithmFetchType) this.rowData.algorithmFetchType = 1
            this.rowData.imageUrl = ''
            formData.append('param', new Blob([JSON.stringify(this.rowData)], {
              type: 'application/json'
            }))
            if (this.rowData.algorithmFetchType === 2) {
              formData.append('file', this.algorithmFile)
            }
            saveImageManage(formData).then(data => {
              this.loading = false
              if (data.code === 0) {
                this.$emit("getDataList", {
                  pageSize: this.rowData.id ? this.pagination.pageSize : 10,
                  pageIndex: this.rowData.id ? this.pagination.current : 1,
                  isFirst: true
                })
                this.visible = false
                this.$message.success(
                  "新增成功！"
                )
              }
            }).catch(e => { this.loading = false })
          } else {
            editImageManage(this.rowData).then(data => {
              this.loading = false
              if (data.code === 0) {
                this.$emit("getDataList", {
                  pageSize: this.rowData.id ? this.pagination.pageSize : 10,
                  pageIndex: this.rowData.id ? this.pagination.current : 1,
                  isFirst: true
                })
                this.visible = false
                this.$message.success(
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
        dlType: 2,
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
      this.rowData = {}
      this.addUniversalMirrorData = {
        name: '',
        id: '',
        value: '',
        list: [],
        version: '',
        parentId: ''
      }
      this.$refs.addUniversalMirrorData.resetFields()
      this.visible = false
    },
    imageUrlTypeChange () {
      // 更改镜像URL的属性，目前只有一种url的方式
    },
    algorithmTypeChange (e) {
      // 更改算法代码的属性，触发该事件时需要讲算法URL切换对应的形式
      this.$refs.ruleForm.clearValidate(['algorithmUrl', 'algorithmName', 'fromImageId'])
    },
    algorithmUpload (file) {
      this.rowData.algorithmName = file.name
      this.algorithmFile = file
      this.$forceUpdate()
      return false
    },
    addUniversalMirror () {
      this.$refs['addUniversalMirrorData'].validate(valid => {
        if (valid) {
          this.universalMirrorList.push(this.addUniversalMirrorData)
          this.addUniversalMirrorData = {
            name: '',
            id: '',
            value: '',
            list: [],
            version: '',
            parentId: ''
          }
        }
      })
    },
    deleteUniversalMirror (index) {
      this.universalMirrorList.splice(index, 1)
    },
    async selectImage (val, node) {
      const list = await this.getChildren(node.eventKey)
      let i = 0
      while (i < list.length) {
        if (list[i].imageStatus === 1) {
          this.addUniversalMirrorData = {
            ...this.addUniversalMirrorData,
            list,
            id: list[i].id,
            version: list[i].id,
            parentId: list[i].parentId,
            imageStatus: list[i].imageStatus
          }
          break
        } else {
          i++
        }
      }
    },
    async treeChange (val, node, extra, index) {
      const { id, value } = node.dataRef
      const list = await this.getChildren(id)
      let i = 0
      while (i < list.length) {
        if (list[i].imageStatus === 1) {
          this.$set(this.universalMirrorList, index, {
            ...this.universalMirrorList[index],
            parentId: id,
            id: list[i].id, value, list, version: list[i].id, imageStatus: list[i].imageStatus
          })
          break
        } else {
          i++
        }
      }
    },
    async getChildren (id) {
      this.loading = true
      const res = await imageVersion.getImageVersionList({ sourceVersionId: id })
      this.loading = false
      if (res.code !== 0) return false
      return [
        ...res.data.map(item => {
        return {
          id: item.id,
          name: item.versionLabel,
          parentId: item.parentVersionId,
          imageStatus: item.imageStatus
        }
      })]
    },
    async getMirrorChildren (val) {
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
.addBusinessDialog{
  .form-model-item-title{
    &>.ant-form-item-label > label{
      font-weight: bold;
      font-size: 16px;
      &::before{
        content: '';
        position: absolute;
        left: -8px;
        top: 0;
        width: 3px;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
      }
      &::after{
        content: '';
      }
    }
    &.universalMirror{
      .ant-empty-normal{
        margin: 0;
      }
      .ant-list-items{
        border: 1px solid #ccc;
        padding: 0 5px;
        border-radius: 3px;
        max-height: 200px;
        overflow-y: auto;
        li{
          overflow: hidden;
          padding: 2px 0;
          .universalMirrorName{
            float: left;
            text-align: center;
            width: 30%;
          }
          .universalMirrorValue{
            width: 45%;
            float: left;
          }
          .universalMirrorVersion{
            width: 20%;
            float: left;
          }
          .deleteUniversalMirror{
            width: 5%;
            float: left;
            text-align: center;
            span{
              cursor: pointer;
            }
          }
        }
      }
    }
    .addUniversalMirror{
      .ant-form-item{
        width: 35%;
        float: left;
        margin-right: 0;
        padding-right: 10px;
        &:nth-child(3){
          width: 22%;
        }
        &:last-child{
          width: 8%;
          padding-right: 0;
        }
        .ant-form-item-control-wrapper{
          width: 100%;
        }
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
.div-img {
  width: 100%;
  display: flex;
}
</style>
