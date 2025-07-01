<template>
  <div class="addBusinessStep-content-item params scrollbar">
    <div class="params-top">
      <a-card
        title="依赖通用模型">
        <a-list :data-source="params.universalMirrorList" size="small">
          <a-list-item slot="renderItem" slot-scope="item, index">
            <div class="universalMirrorName">
              {{ item.name }}
            </div>
            <div class="universalMirrorValue">
              <a-tree-select
                v-model="item.value"
                show-search
                style="width: 60%"
                :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
                placeholder="请选择模型"
                allow-clear
                :replaceFields="{
                  key: 'id',
                  value: 'value',
                  children: 'child',
                  title: 'modelName'
                }"
                @select="(val, node) => selectImageChange(val, node, index)"
                :tree-data="params.universalMirror"
              >
              </a-tree-select>
              <a-select v-model="item.id" style="width: 40%">
                <a-select-option v-for="child in item.list" :key="child.id" :value="child.id" :disabled="!child.modelTrainAvl">
                  {{ child.versionLabel }}
                </a-select-option>
              </a-select>
            </div>
          </a-list-item>
        </a-list>
      </a-card>
    </div>
    <div class="params-middle">
      <a-card
        title="依赖外部模型">
        <div class="upload-list">
          <span>目录：</span>
          <a-radio-group v-model="params.selectFileList" @change="changeExternal">
            <a-radio v-for="(item, index) in params.externalList" :key="index" :value="Object.keys(item)[0]">
              {{ Object.keys(item)[0] }}
            </a-radio>
          </a-radio-group>
        </div>
        <div class="upload-content">
          <!-- <a-empty /> -->
          <!-- fileList完全受控状态需要手动往fileList中添加文件 -->
          <a-upload
            name="file"
            :fileList="params.externalDepend"
            @preview="clickFile"
            :remove="uploadFile"
            :defaultFileList="params.externalDepend"
            :before-upload="uploadFile"
          >
            <a-button v-show="!processFile.type && params.externalList.length > 0" type="text" shape="circle" title="新增文件"><a-icon type="plus"></a-icon></a-button>
          </a-upload>
          <template v-if="processFile.type">
            <!-- <a-progress :percent="50" size="small" status="active" /> -->
            <a-progress :percent="processFile.val" size="small" :status="processFile.status" />
          </template>
          <input ref="uploadChange" type="file" style="display: none" @change="uploadChange">
        </div>
      </a-card>
    </div>
    <div class="params-bottom">
      <a-card
        title="算法参数"
        class="bottom">
        <a-empty v-if="!selectImage.algorithmParam"/>
        <template v-else>
          <div class="mirror-params-list">
            <a-tree
              showLine
              :tree-data="algorithmParam"
              :replace-fields="replaceFields"
              @select="selectParamChange"
            ></a-tree>
          </div>
          <a-input
            type="textarea"
            :disabled="!selectObj.name"
            v-model="algorithmParamValue"
            class="text-area algorithmParam"
            @blur="changeAlgorithmParam"
          ></a-input>
          <a-upload
            name="file"
            :showUploadList="false"
            :accept="configFileType.toString()"
            :before-upload="uploadParamsFile">
            <a-button v-show="!processParams.type" type="text" shape="circle" title="重新上传">
              <a-icon type="upload"></a-icon>
            </a-button>
          </a-upload>
          <div class="process" v-if="processParams.type">
            <a-progress :percent="processParams.val" size="small" :status="processParams.status" />
          </div>
        </template>
      </a-card>
    </div>
    <div class="params-bottom footer">
      <a-card
        title="业务参数"
        class="bottom">
        <a-input
          v-model="params.businessParam"
          type="textarea"
          placeholder="请输入业务参数"
          :rows="3"
          @blur="confirmJSON"/>
        <p v-if="showJSONError">当前参数不符合JSON规范，请重新填写</p>
      </a-card>
    </div>
  </div>
</template>

<script>
import { getConfig, getModelDepend, postOperModelFile, modelVersion } from '@/api/modelManage'
export default {
  name: 'AddBusniessStep2',
  props: {
    postData: {
      type: Object,
      default: null
    },
    selectImage: {
      type: Object,
      default: null
    },
    imageId: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      showJSONError: false,
      params: {
        universalMirrorList: [{
          name: 'image1',
          id: ''
        }],
        imageId: '',
        universalMirror: [],
        externalList: [],
        externalDepend: [],
        changeFile: null,
        algorithmParams: '',
        selectFileList: '',
        traceNo: '',
        businessParam: ''
      },
      algorithmParam: [],
      algorithmParamValue: '',
      selectObj: {},
      replaceFields: {
        children: 'childreans',
        title: 'name'
      },
      processFile: {
        val: 0,
        status: 'active',
        type: false
      },
      processParams: {
        val: 0,
        status: 'active',
        type: false
      },
      configFileType: ['.json', '.yaml', '.csv', '.toml']
    }
  },
  watch: {
    params: {
      handler (val) {
        this.$emit('changeStep2Data', val)
      },
      deep: true
    }
  },
  mounted () {
    let externalDepend = []
    if (this.imageId === this.postData.imagesId) {
      externalDepend = JSON.parse(this.postData.externalDepend) || []
      this.$set(this.params, 'businessParam', this.postData.businessParam)
      this.params.universalMirrorList = JSON.parse(this.postData.modelDepend)
      this.params.universalMirrorList.forEach(item => {
        if (!item.list) {
          this.getChildren(item.parentId || item.id).then(res => {
            item.list = [ ...res ]
          })
        }
      })
    } else {
      externalDepend = JSON.parse(this.selectImage.externalDepend) || []
      this.$set(this.params, 'businessParam', this.selectImage.businessParam)
      this.params.universalMirrorList = JSON.parse(this.selectImage.imageDepend).map(item => {
        return {
          id: '',
          value: '',
          name: item.name
        }
      })
    }
    this.$set(this.params, 'traceNo', this.postData.traceNo ? this.postData.traceNo : '')
    this.$set(this.params, 'externalList', [ ...externalDepend ])
    if (this.params.externalList.length > 0) {
      this.$set(this.params, 'selectFileList', Object.keys(this.params.externalList[0])[0])
      this.changeExternal()
    }
    this.getParams()
    this.getModelDependData(this.postData.imagesId)
    this.$set(this.params, 'imageId', this.postData.imagesId)
  },
  methods: {
    changeAlgorithmParam () {
      this.algorithmParam.forEach(item => {
        if (item.key === this.selectObj.key) {
          item.content = this.algorithmParamValue
        } else if (item.childreans) {
          item.childreans.forEach(child => {
            if (child.key === this.selectObj.key) {
              child.content = this.algorithmParamValue
            }
          })
        }
      })
      this.$set(this.params, 'algorithmParams', JSON.stringify(this.algorithmParam))
    },
    changeExternal () {
      // 切换选中的文件目录
      const selectData = this.params.externalList.filter(item => {
        return Object.keys(item)[0] === this.params.selectFileList
      })[0]
      this.params.externalDepend = selectData[this.params.selectFileList].map((item, index) => {
        return {
          uid: String(index),
          name: item,
          status: 'done'
        }
      })
    },
    uploadFile (file, type) {
      if (!file) return false
      const formData = new FormData()
      const param = {
        fileName: file.name,
        fileType: 0,
        folder: this.params.selectFileList,
        imagesId: this.selectImage.id,
        operType: type ? 0 : 1,
        traceNo: this.params.traceNo
      }
      type && formData.append('file', file)
      formData.append('param', new Blob([JSON.stringify(param)], {
        type: 'application/json'
      }))
      this.processFile.type = true
      postOperModelFile(formData, this.uploadProgress).then(res => {
        this.params.traceNo = res.data.traceNo
        if (type) {
          this.params.externalDepend.push({
            name: file.name,
            uid: file.uid,
            stats: 'done'
          })
          this.params.externalList.forEach(item => {
            if (item[this.params.selectFileList]) {
              item[this.params.selectFileList].push(file.name)
            }
          })
        } else {
          this.params.externalDepend = this.params.externalDepend.filter(item => {
            return item.name !== file.name
          })
          this.params.externalList.forEach(item => {
            if (item[this.params.selectFileList]) {
              item[this.params.selectFileList] = item[this.params.selectFileList].filter(val => {
                return val !== file.name
              })
            }
          })
        }
      })
      if (type) return false
    },
    uploadParamsFile (file) {
      if (!file) return false
      if (!this.selectObj.name) {
        this.$message.error('请选择一个算法文件')
        return false
      }
      if (file.size > (1024 * 1024)) {
        this.$message.error('文件大小不能超过1MB')
        return false
      }
      if (!this.configFileType.includes(file.name.substring(file.name.lastIndexOf('.')))) {
        this.$message.error('算法配置文件只能上传json、csv、yaml、toml')
        return false
      }
      const formData = new FormData()
      const param = {
        fileName: this.selectObj.name,
        fileType: 1,
        // folder: this.params.selectFileList,
        imagesId: this.selectImage.id,
        operType: 0,
        traceNo: this.params.traceNo
      }
      formData.append('file', file)
      formData.append('param', new Blob([JSON.stringify(param)], {
        type: 'application/json'
      }))
      this.processParams.type = true
      postOperModelFile(formData, this.uploadProgressParams).then(res => {
        if (res.code === 0) {
          this.params.traceNo = res.data.traceNo
          this.algorithmParamValue = res.data.config
          this.changeAlgorithmParam()
          // JSON.parse(this.postData.algorithmParam).forEach(item => {
          //   Object.keys(item).forEach(val => {
          //     if (val === this.params.selectAlgorithmParams) {
          //       this.params.algorithmParams[val] = res.data.config
          //     } else {
          //       this.params.algorithmParams[val] = item[val]
          //     }
          //   })
          // })
          this.$forceUpdate()
        }
      })
      return false
    },
    clickFile (file) {
      // 点击文件打开文件上传框，这里打开一个隐藏的上传框，然后将回调的文件跟当前的file进行替换
      this.params.changeFile = file
      // this.$refs.uploadChange.click()
      // return false
    },
    uploadChange (e) {
      // 获取到需要替换的文件,将该文件上传到服务器，然后将状态放到defaultFileList（替换掉点击的那个文件）
      // console.log(e.target.files[0])
      this.params.externalDepend = this.params.externalDepend.map(item => {
        if (item.uid === this.params.changeFile.uid) {
          item = {
            uid: item.uid,
            name: e.target.files[0].name,
            url: e.target.files[0].name,
            status: 'done'
          }
        }
        return item
      })
      // this.$forceUpdate()
    },
    selectParamChange (selectedKeys, obj) {
      this.selectObj = { ...obj.node.dataRef }
      if (this.selectObj.type !== 2) return false
      this.algorithmParamValue = this.selectObj.content
    },
    getParams () {
      let data = null
      if (this.imageId === this.postData.imagesId ) {
        data = this.postData.algorithmParam
      } else {
        data = this.selectImage.algorithmParam
      }
      const _data = JSON.parse(data).map((item, index) => {
        if (item.type) {
          let children = null
          if (item.type === 1) {
            children = item.childreans.map((child, childIndex) => {
              return {
                ...child,
                key: `${index}-${childIndex}-${child.name}`
              }
            })
          }
          return {
            ...item,
            childreans: children,
            key: `${index}-${item.name}`
          }
        } else {
          const child = Object.keys(item)[0]
          return {
            name: child,
            type: 2,
            content: item[child],
            key: `${index}-${child}`
          }
        }
      })
      this.algorithmParam = _data
      this.$set(this.params, 'algorithmParams', JSON.stringify(this.algorithmParam))
    },
    async selectImageChange (val, node, index) {
      const list = await this.getChildren(node.eventKey)
      let i = 0
      while (i < list.length) {
        if (list[i].modelTrainAvl) {
          this.params.universalMirrorList[index].id = list[i].id
          break
        } else {
          i++
        }
      }
      this.params.universalMirrorList[index].parentId = node.eventKey
      this.params.universalMirrorList[index].list = [ ...list ]
    },
    async getChildren (id) {
      const res = await modelVersion.getImageVersionList({ sourceVersionId: id })
      if (res.code !== 0) return false
      return res.data
    },
    confirmJSON (e) {
      const val = e.target.value
      if (!val) {
        // 当前参数为空时
        this.showJSONError = false
      } else {
        if (!isNaN(val)) {
          this.showJSONError = true
          return false
        }
        try {
          const jsonString = JSON.parse(val)
          this.showJSONError = false
        } catch (err) {
          this.showJSONError = true
        }
      }
    },
    getModelDependData (id) {
      // 这里记得更换成id
      getModelDepend(this.selectImage.id).then(res => {
        const data = res.data
        this.params.universalMirror = data.map((item, index) => {
          item.child.forEach(child => {
            child.value = child.modelName
            child.disabled = !child.atLeastOneAvl
          })
          return {
            modelName: item.tagType,
            child: item.child,
            value: item.tagType,
            id: '0-' + index,
            disabled: true
          }
        })
      })
    },
    uploadProgress (params) {
      this.processFile.val = Number((params.loaded / params.total * 100).toFixed(2))
      if (this.processFile.val === 100) {
        this.processFile.status = 'success'
        this.processFile.type = false
      }
    },
    uploadProgressParams (params) {
      this.processParams.val = Number((params.loaded / params.total * 100).toFixed(2))
      if (this.processParams.val === 100) {
        this.processParams.status = 'success'
        this.processParams.type = false
      }
    }
  }
}
</script>

<style lang="less">
.params{
  &-top{
    .ant-card-body{
      height: 136px;
      overflow-y: auto;
      .ant-list-items{
        border-radius: 3px;
        li{
          overflow: hidden;
          padding: 5px 0;
          .universalMirrorValue{
            width: 70%;
            .ant-select{
              width: 100%;
            }
          }
        }
      }
    }
  }
  &-middle{
    .upload-list{
      margin-top: 10px;
    }
    .upload-content{
      position: relative;
      .ant-upload{
        display: block;
      }
      .ant-upload-list{
        height: 100px;
        overflow-y: auto;
      }
      button{
        position: absolute;
        right: -15px;
        top: -25px;
        background: rgba(0,0,0,0.3);
        color: #fff;
        z-index: 1;
      }
      .ant-progress{
        position: absolute;
        right: 0;
        top: -23px;
        width: 200px;
      }
    }
  }
  &-bottom{
    position: relative;
    .mirror-params-list{
      margin-top: 10px;
      width: 200px;
      float: left;
      height: 25vh;
      margin-right: 10px;
      overflow-y: auto;
      border-right: 1px solid #e8e8e8;
    }
    .ant-tree li .ant-tree-node-content-wrapper {
      text-overflow: ellipsis;
      overflow: hidden;
      width: calc(100% - 24px);
      &.ant-tree-node-selected{
        background: #0072C6;
        color: #fff;
      }
    }
    .process{
      position: absolute;
      right: 0;
      top: 40px;
      width: 200px;
    }
    .text-area{
      height: 25vh;
      margin: 10px 0px;
      &.algorithmParam{
        width: calc(100% - 210px);
      }
    }
    button{
      position: absolute;
      right: 10px;
      top: 38px;
      background: rgba(0,0,0,0.3);
      color: #fff;
      z-index: 1;
    }
    &.footer{
      .bottom{
        .ant-card-body{
          margin-top: 10px;
        }
      }
      p{
        color: red;
      }
    }
  }
}
</style>