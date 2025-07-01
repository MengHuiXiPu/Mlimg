<template>
  <div>
    <a-form-model :model="form"
                  ref="ruleForm"
                  :label-col="{ span: 6 }"
                  :wrapper-col="{ span: 18 }"
                  :rules="rules"
                  layout="horizontal"
                  style="max-width: 700px;">

        <!--            :disabled="modelInfo"-->
      <a-form-model-item label="发布方式">
        <a-select
            default-value="0"
            v-model="form.attachToAlreadyInfesvr"
            @select="handleSelectPunishType"
        >
          <a-select-option value="0">
            新增应用
          </a-select-option>
          <a-select-option value="1">
            发布到已有服务
          </a-select-option>
        </a-select>
      </a-form-model-item>

      <a-form-model-item label="应用名称" prop="taskName" v-if="form.attachToAlreadyInfesvr === '0'">
        <a-input
            :disabled="currentTask"
            v-model="form.taskName"
            :maxLength="50"
            placeholder="请输入应用名称"
        />
      </a-form-model-item>
      <a-form-model-item label="应用名称" prop="taskId" v-if="form.attachToAlreadyInfesvr === '1'">
        <a-select
            show-search
            v-model="form.taskId"
            placeholder="输入搜索"
            :default-active-first-option="false"
            :show-arrow="false"
            :filter-option="false"
            :not-found-content="'无匹配记录'"
            @search="handleSearchAlreadyInfesvr"
            @change="handleChangeAlreadyInfesvr"
        >
          <a-select-option v-for="option in optionsOfAlreadyExistsInfesvr" :key="option.id" :value="option.id">
            {{ option.infesvrName }}
          </a-select-option>
        </a-select>
      </a-form-model-item>


      <a-form-model-item v-if="form.attachToAlreadyInfesvr === '0'" label="存放目录" prop="storedDirName"
                         style="vertical-align: middle">
        <a-row :gutter="4" type="flex" justify="space-between">
          <a-col span="20">
            <a-tree-select
                v-model="form.storedDirName"
                showSearch
                allowClear
                :filterTreeNode="fillterFUN"
                :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
                :tree-data="treeData"
                :load-data="onLoadData"
                placeholder="请选择存放目录"
                @select="onSelect"
                :disabled="currentTask"
            />
          </a-col>
          <a-col>
            <a-button
                :disabled="currentTask"
                size="small"
                @click="() => this.$refs.createTree.showModal()"
                type="primary">
              新增目录
            </a-button>
          </a-col>
        </a-row>
      </a-form-model-item>
      <a-form-model-item label="服务描述">
        <a-textarea v-model="form.description" :disabled="form.attachToAlreadyInfesvr === '1'"/>
      </a-form-model-item>
      <a-form-model-item label="版本描述">
        <a-textarea v-model="form.versionDescription" :disabled="currentTask"/>
      </a-form-model-item>
      </a-form-model>
    <create-tree ref="createTree"
                 @getTree="getTree"
                 :urlObject="{
      get: dictApiMap[dictType]['getString'],
      post: dictApiMap[dictType]['postString']
    }" />
  </div>
</template>

<script>
import debounce from "lodash/debounce";
import createTree from '@/components/tree/createTree'
import {getModelTreeList, savaModelTreeList, getAppTaskTreeList, savaAppTaskTreeList} from "@/api/dataCenter";
import {listInferserviceInfo} from "@/api/appCenter";
export default {
  name: "publishInfo",
  components: {
    createTree,
  },
  props: {
    form: {
      type: Object,
      default: () => ({})
    },
    // 系统目录分为应用目录和模型目录，对应的吧表不一样
    dictType: { //目录树查询标识， 取值 model /app ，分别对应不同的接口请求
      type: String,
      default: 'model',
      required: true,
    },
  },
  data() {
    const checkName = async (rule, value, callback) => {
      if (!value || !value.trim()) {
        callback(new Error('当前值不能为空'))
      } else {
        callback()
        // const checkData =  await checktaskNameAvl({
        //   taskName: value,
        //   modelType: this.step.modelType
        // })
        console.log("checkData: ", checkData);
        if (true) {
          callback()
        } else {
          callback(new Error('当前名称已存在，请重新输入'))
        }
      }
    }
    return {
      labelCol: { lg: { span: 5 }, sm: { span: 5 } },
      wrapperCol: { lg: { span: 19 }, sm: { span: 19 } },
      treeData: [],
      storedDirId: "",
      rules: {
        taskName: [{
          required: true,
          message: '请输入应用名称!',
          trigger: 'blur'
        }, {
          required: true,
          validator: checkName,
          trigger: "blur"
        }],
        taskId: [{
          required: true,
          message: '请选择要发布的应用!',
          trigger: 'blur'
        }],
        storedDirName: [{ required: true, message: '请选择存放目录!', trigger: 'change' }],
      },
      dictApiMap: {
        model: { 
          getApi: getModelTreeList,
          postApi: savaModelTreeList,
          getString: 'getModelTreeList',
          postString: 'savaModelTreeList',
        },
        app: {
          getApi: getAppTaskTreeList,
          postApi: savaAppTaskTreeList,
          getString: 'getAppTaskTreeList',
          postString: 'savaAppTaskTreeList',
        }
      },
      optionsOfAlreadyExistsInfesvr: [],
    }
  },
  computed: {//用计算方法
    currentTask() {
      return false;
    },
    storedDirId() {
      if(this.form.storedDirName) {
        let index = this.treeData.findIndex(item => item.storedDirName === this.form.storedDirName);
        // console.log("index: ", index);
        if(index !== -1) {
          // console.log("this.treeData[index].storedDirId: ", this.treeData[index].storedDirId)
          this.form.storedDirId = this.treeData[index].storedDirId;
          console.log('this.form.storedDirId: ', this.form.storedDirId)
          return this.treeData[index].storedDirId;
        }
      }
      return ''
    }
  },
  watch: {
    storedDirId(value){
      this.form.storedDirId = value;
    },
  },
  mounted(){
    this.getTree();

    this.form.taskName = "";
    this.form.taskId = "";
    this.form.attachToAlreadyInfesvr = "0";
    this.form.storedDirName = "";
    this.form.description = "";
    this.form.versionDescription = "";
    this.form.storedDirId = "";

  },
  methods: {
    fillterFUN (searchVal, treeNode) {
      return treeNode.data.props.title.includes(searchVal)
    },
    onLoadData (treeNode) {
      const { id, nodeCode, storedDirName, storedDirId } = treeNode.dataRef
      const query = {
        parentId: id,
        parentCode: nodeCode
      }
      return this.dictApiMap[this.dictType]['getApi'](query).then((res) => {
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          treeNode.dataRef.children = this.genTreeNode(data, storedDirName, storedDirId)
          this.treeData = [...this.treeData]

        }
      })
    },
    onSelect (checkedKeys, node) {
      this.$nextTick(() => {
        this.form.storedDirName = node.dataRef.storedDirName
        this.storedDirId = node.dataRef.storedDirId
      })
    },
    getTree () {
      const query = {
        parentId: 0,
        parentCode: '0;'
      }
      this.treeData = []
      this.dictApiMap[this.dictType]['getApi'](query).then(res => {
        const { data = [], code = 0 } = res
        if (res.code === 0) {
          this.treeData = this.genTreeNode(data)
          console.log("this.treeData+++++: ", this.treeData);
        }
      })
    },
    genTreeNode (data, storedDirName, storedDirId) {
      return data.map(item => {
        const { nodeName, nodeCode, id, childNodeNum } = item;
        const names = storedDirName ? `${storedDirName} / ${nodeName}` : nodeName;
        const ids = `${nodeCode}${id};`;
        return {
          id,
          storedDirId: ids,
          storedDirName: names,
          value: ids, // value 设置为ids
          title: nodeName,
          nodeCode,
          // disabled: childNodeNum !== 0,
          isLeaf: childNodeNum === 0
        }
      })
    },
    handleSearchAlreadyInfesvr: debounce(async function handleSearchAlreadyInfesvr(infesvrName) {
      const {code, data, msg} = await listInferserviceInfo({
        infesvrName
      });
      if (code === 0) {
        this.optionsOfAlreadyExistsInfesvr = data.records || [];
      } else {
        this.$message.error(msg);
      }
    }, 300),
    handleChangeAlreadyInfesvr(value) {
      this.form.description = (this.optionsOfAlreadyExistsInfesvr || []).find(item => item.id === value)?.infesvrDescribe;
    },
    handleSelectPunishType: async function handleSelectPunishType(val) {
      if (val === '1') {
        await this.handleSearchAlreadyInfesvr();
      }
    }
  }
}
</script>

<style scoped>

</style>