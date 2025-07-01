<template>
  <a-modal
      ref="deployConfigDialog"
      :title="!isEdit  ? '新建项目' : '编辑项目'"
      :visible="modalVisible"
      @ok="handleOk"
      @cancel="handleCancel"
      width="1000px"
  >
    <a-form-model
        :model="form"
        ref="deployConfigForm"
        :label-col="{ span: 3 }"
        :wrapper-col="{ span: 21 }"
        layout="horizontal"
        :rules="rules"
    >
      <a-form-model-item label="项目名称" prop="projectName">
        <a-input placeholder='请输入（字母、下划线、中文，长度限制128）'
                 :maxLength="128"
                 v-model="form.projectName"
        />
      </a-form-model-item>
      <a-form-model-item label="项目归属地" prop="siteSelect">
        <a-row>
          <a-col :span="5">
            <a-select
                placeholder="请选择"
                v-model="form.siteSelect.foundation"
                @change="handleFoundationChange"
            >
              <a-select-option v-for="(item, index) of positions" :key="index" :value="item" :label="item"> {{item}} </a-select-option>
            </a-select>
          </a-col>
          <a-col :span="2" style="text-align: center">
            <span>--</span>
          </a-col>
          <a-col :span="17">
            <a-select
                mode="multiple"
                placeholder="请选择"
                v-model="form.siteSelect.factory"
                @change="handleFactoryChange"
            >
              <a-select-option v-for="(item, index) of factories" :value="item" :label="item">{{item}}</a-select-option>
            </a-select>
          </a-col>
        </a-row>
      </a-form-model-item>
      <a-form-model-item label="项目描述" prop="projectDescription">
        <a-textarea
            :maxLength="512"
            show-word-limit
            placeholder="请输入描述，长度限制512"
            :auto-size="{ minRows: 5, maxRows: 999 }"
            v-model="form.projectDescription"
        />
      </a-form-model-item>
      <a-form-model-item label="项目管理员" prop="projectMembersParamList2">
        <a-select
            mode="multiple"
            placeholder="请选择"
            optionFilterProp="label"
            label-in-value
            :value="form.projectMembersParamList2"
            @change="handleManagerChange"
            @search="fetchUser"
        >
          <a-select-option v-for="(item, index) of managerOptions" :key="index" :value="item.username" :label="item.nickName">{{item.nickName}}</a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item label="算力资源" prop="projectComputingPowerResourceParamList2">
        <div style="margin: 10px">
          <a-row :gutter="24" class="resource-class" v-if="form.projectComputingPowerResourceParamList2.length > 0" v-for="(item, index) of form.projectComputingPowerResourceParamList2">
            <a-col :span="10">
              <a-row>
                <span>资源池名称：</span>
              </a-row>
              <a-row>
                <a-select style="width: 200px" placeholder="请选择" v-model="item.powerResourceId" @change="handleChangeComputility">
                  <a-select-option v-for="(item2, index2) of computilityOptions" :key="index2" :value="item2.id" :label="item2.name" :disabled="item2.selected"> {{item2.name}}  </a-select-option>
                </a-select>
              </a-row>
              <a-row v-if="isExistPowerSpn(item.powerResourceId)">
                <span style="font-size: small; color: #a89028">
                  资源池规格:
                </span>
                <br>
                <span style="font-size: xx-small">
                  {{getTotalComputilitySpn(item.powerResourceId)}}
                </span>
                <br>
                <span style="font-size: small; color: #a89028">
                  已分配规格：
                </span>
                <br>
                <span v-async="getAllocatedSpn(item.powerResourceId)" style="font-size: xx-small"></span>
<!--                <span v-text="getAllocatedSpn(item.powerResourceId)" style="font-size: xx-small"></span>-->

              </a-row>
            </a-col>
            <a-col :span="14">
              <a-row>
                <span>设置配额：</span>
              </a-row>
              <a-row>
                <a-col :span="12">
                  CPU: <a-input-number :max="10000" :min="0" v-model="item.cpuQuota" placeholder="请输入" style="width: 95px"></a-input-number> core
                </a-col>
                <a-col :span="12">
                  内存: <a-input-number :max="10000" :min="0" v-model="item.memoryQuota" placeholder="请输入" style="width: 95px"></a-input-number> GB
                </a-col>
              </a-row>
              <a-row v-if="item.gpus.length > 0" v-for="(item2, index2) of item.gpus">
                <a-col :span="12">
                  GPU:
                  <a-select style="width: 95px" placeholder="请选择" v-model="item2.gpuModel">
                    <a-select-option v-for="(item3, index3) in getGpuOptions(item.powerResourceId, item.gpus)" :key="index3.value" :value="item3.value" :label="item3.value" :disabled="item3.selected"> {{item3.value}} </a-select-option>
                  </a-select>
                </a-col>
                <a-col :span="10">
                  * <a-input-number :max="10000" :min="0" v-model="item2.gpuQuota" placeholder="请输入" style="width: 95px"></a-input-number> 张
                </a-col>
                <a-col :span="2">
                  <a-tooltip placement="leftTop">
                    <template slot="title">删除</template>
                    <a-icon type="delete" style="color: red" @click="delGPU(item2, index)" />
                  </a-tooltip>
                </a-col>
              </a-row>
              <a-button
                  size="small"
                  type="primary"
                  @click="addGPU(index, item.powerResourceId)"
              >
                +新增GPU配额
              </a-button>
            </a-col>
          </a-row>
          <a-row>
            <a-button
                size="small"
                type="primary"
                @click="addComputility"
            >
              +新增算力资源池
            </a-button>
            <a-button
                style="margin-left: 10px"
                v-if="form.projectComputingPowerResourceParamList2.length > 0"
                size="small"
                type="danger"
                @click="delComputility(form.projectComputingPowerResourceParamList2.length - 1)"
            >
              -删除算力资源池
            </a-button>
          </a-row>

        </div>

      </a-form-model-item>

      <a-form-model-item label="存储资源" prop="projectStorageResourceParamList2">
        <div style="margin: 10px">
          <a-row :gutter="24" class="resource-class" v-if="form.projectStorageResourceParamList2.length > 0" v-for="(item, index) of form.projectStorageResourceParamList2">
            <a-col :span="10">
              <a-row>
                <span>资源池名称：</span>
              </a-row>
              <a-row>
                <a-select style="width: 200px" placeholder="请选择" v-model="item.storageResourceId" @change="handleChangeStorage">
                  <a-select-option v-for="(item2, index2) of storageOptions" :key="index2" :value="item2.id" :label="item2.name" :disabled="item2.selected"> {{item2.name}}  </a-select-option>
                </a-select>
              </a-row>
              <a-row v-if="item.storageResourceId">
                <span style="font-size: xx-small; color: #a89028" v-async="getTotalStorageSpn(item)">
                </span>
              </a-row>
            </a-col>
            <a-col :span="14">
              <a-row>
                <span>设置配额：</span>
              </a-row>
              <a-row>
                <a-input-number placeholder="请输入" v-model="item.usedQuota" :max="10000" :min="0" style="width: 95px" ></a-input-number> GB
              </a-row>
            </a-col>
          </a-row>
          <a-row>
            <a-button
                size="small"
                type="primary"
                @click="addStorage()"
            >
              +新增存储资源池
            </a-button>
            <a-button
                style="margin-left: 10px"
                v-if="form.projectStorageResourceParamList2.length > 0"
                size="small"
                type="danger"
                @click="delStorage(form.projectStorageResourceParamList2.length - 1)"
            >
              -删除存储资源池
            </a-button>
          </a-row>
        </div>
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
import * as ProjectApi from "@/api/project";
import {findByNickName, findByNickNameSearch} from "@/api/system/user";
import Vue from "vue";
import {updateProjects} from "@/api/project";

// 正确实现方式
Vue.directive('async', {
  bind(el, binding) {
    const setContent = (val) => el.textContent = val || 'N/A'

    // 创建独立处理函数
    const handleAsyncValue = (promise) => {
      if (promise instanceof Promise) {
        promise
            .then(setContent)
            .catch(() => el.textContent = 'Error')
      } else {
        setContent(promise)
      }
    }

    // 存储处理函数到元素属性
    el._asyncHandler = handleAsyncValue
    handleAsyncValue(binding.value)
  },
  update(el, binding) {
    // 直接调用存储的处理函数
    if (el._asyncHandler) {
      el._asyncHandler(binding.value)
    }
  },
  unbind(el) {
    // 清理引用
    delete el._asyncHandler
  }
})

export default {
  name: "ProjectModal",
  props: {
    // 主页操作栏显示按钮的文本信息
    modalVisible: {
      type: Boolean,
      default: false
    },
    project: {
      type: Object,
      default: {}
    },
    isEdit: {
      type: Object,
      default: false
    }
  },
  data() {
    return {
      projectId: null,

      positions: [],
      factories: [],

      siteSelect: {
        foundation: undefined,
        factory: undefined,
      },
      // projectMembersParamList2: [],
      // projectComputingPowerResourceParamList2: [],
      // projectStorageResourceParamList: [],
      form: {
        id: 0,
        projectName: '',
        site: '',
        siteSelect: {
          foundation: undefined,
          factory: undefined,
        },
        projectDescription: '',
        projectType: 0,
        projectComputingPowerResourceParamList: [],
        projectStorageResourceParamList: [],
        projectMembersParamList: [],

        projectMembersParamList2: [],
        projectComputingPowerResourceParamList2: [],
        projectStorageResourceParamList2: []
      },
      rules: {
        projectName: [
          { required: true, pattern: /^[a-zA-Z_\u4e00-\u9fa5]{1,128}$/, message: '请输入（字母、下划线、中文，长度限制128）', trigger: 'blur' },
          { min: 1, max: 128, message: '长度限制128', trigger: 'blur' },
        ],
        siteSelect: [
            { required: true, validator: (rule, value) => {
            if (!value.foundation) {
              return Promise.reject('请选择基地');
            }
            if (!value.factory || value.factory.length === 0) {
              return Promise.reject('请选择厂区');
            }
            return Promise.resolve();
          },message: '请输入基地厂区', trigger: 'change' }
        ],
        projectDescription: [
          { required: false, message: '请输入项目描述!', trigger: 'change' },
          { min: 1, max: 512, message: '长度限制512', trigger: 'blur' }],
        projectMembersParamList2: [{ type:'array',required: true, message: '请选择项目管理', trigger: 'change' },],
        projectComputingPowerResourceParamList2: [{ type:'array', required: true,
          validator: (rule, value) => {
            // console.log('value', value)
            if (value.length === 0){
              return Promise.reject('请完成算力资源池的数据');
            }
            for (let valueKey of value) {
              // console.log('valueKey', valueKey)
              if (!valueKey.powerResourceId) {
                return Promise.reject('请选择算力资源池');
              }
              if (!valueKey.cpuQuota || !valueKey.memoryQuota) {
                return Promise.reject('请填写CPU、内存');
              }
              if (!valueKey.gpus || valueKey.gpus.length === 0) {
                return Promise.reject('请选择GPU、张数');
              }
            }
            return Promise.resolve();
          },
          // message: '请完成算力资源池的数据',
          trigger: 'blur' }],
        projectStorageResourceParamList2: [{ required: true,
          validator: (rule, value) => {
            // console.log('value', value)
            if (value.length === 0){
              return Promise.reject('请完成存储资源池的数据');
            }
            for (let valueKey of value) {
              // console.log('valueKey', valueKey)
              if (!valueKey.storageResourceId) {
                return Promise.reject('请选择存储资源池');
              }
              if (!valueKey.usedQuota) {
                return Promise.reject('请填写存储配额');
              }
            }
            return Promise.resolve();
          },
          // message: '请完成存储资源池的数据',
          trigger: 'blur' }],
      },
      modalVisible: false,

      computilityOptions: [],
      gpuOptions: [],
      storageOptions: [],

      managerOptions: []
    }
  },
  watch: {
    projectId(val){
      console.log('val', val)
      this.resetForm()
      if (val){
        this.getProjectById(val)
      }
    }
  },
  async created() {
    console.log('created')
    await this.getManagers()
    if (this.project && this.project.id){
      this.projectId = this.project.id
      await this.getProjectById(this.projectId)
    }
  },
  mounted() {
    this.getPositions()
    this.getFactories()
    this.getComputilityOptions()
    // this.getGpuOptions()
    this.getStorageOptions()
  },
  methods: {
    resetForm(){
      this.projectId = null
      this.form = {
        id: this.projectId,
        projectName: '',
        site: '',
        siteSelect: {
          foundation: undefined,
          factory: undefined,
        },
        projectDescription: '',
        projectType: 0,
        projectComputingPowerResourceParamList: [],
        projectStorageResourceParamList: [],
        projectMembersParamList: [],

        projectMembersParamList2: [],
        projectComputingPowerResourceParamList2: [],
        projectStorageResourceParamList2: []
      }
    },
    getPositions(){
      this.positions = [ '深圳','广州','惠州','武汉','苏州']
    },
    getFactories(){
      this.factories = ['T1','T2','T3','T4','T5','T6','T7','T8']
    },
    async getManagers(){
      const res = await findByNickName()
      const temp = res.map(item => {
        return {
          ...item,
          memberName: item.username,
        }
      })
      this.managerOptions = temp
    },
    async getComputilityOptions() {
      this.computilityOptions = []

      await ProjectApi.queryComputePool().then(async res => {
        if (res instanceof Array){
          this.computilityOptions = res
          this.computilityOptions = this.computilityOptions.map(m => {
            return {
              ...m,
              selected: false
            }
          })
        }

      }).catch((err) => {
        console.log(err)
      })
    },
    getGpuOptions(powerResourceId, gpus){
      if (!powerResourceId){
        return
      }
      if (this.computilityOptions.length === 0){
        return
      }
      const powerSpn = this.computilityOptions.filter(f=>f.id === powerResourceId)[0]

      let totalGpuModel = []
      // let totalGpuQuantity = 0
      if (powerSpn.poolComputeCardQuotas.length > 0){
        powerSpn.poolComputeCardQuotas.forEach(f=>{
          if (f.gpuModel !== '' && f.gpuQuantity !== null){
            let selected = gpus.filter(g=>g.gpuModel === f.gpuModel)
            totalGpuModel.push({
              value: f.gpuModel,
              selected: selected.length > 0 ? true : false
            })
          }
        })
        return totalGpuModel
      }else{
        return totalGpuModel
      }
    },
    getStorageOptions(){
      this.storageOptions = []
      ProjectApi.queryStoragePool().then(res=>{
        if (res instanceof Array){
          this.storageOptions = res
          this.storageOptions = this.storageOptions.map(m=>{
            return {
              ...m,
              selected: false
            }
          })
        }
      }).catch((err)=>{
        console.log(err)
      })
    },

    async getProjectById(id){
      await ProjectApi.getProjectById(id)
          .then(async res => {

            // 算力资源池
            let projectComputingPowerResourceParamList2 = []
            if (res.projectComputingPowerResourceDtoList && res.projectComputingPowerResourceDtoList.length > 0){
              const groupedObject = res.projectComputingPowerResourceDtoList.reduce((acc, item) => {
                // 如果分组中还没有该类别，初始化为一个空数组
                if (!acc[item.powerResourceId]) {
                  acc[item.powerResourceId] = [];
                }
                // 将当前对象添加到对应类别的数组中
                acc[item.powerResourceId].push(item);
                return acc;
              }, {});
              projectComputingPowerResourceParamList2 = Object.entries(groupedObject).map(([key, value]) => {
                let k = 0
                value = value.map(m => {
                  k += 1
                  return {
                    ...m,
                    key: k
                  }
                })

                // 把大于0的cpu的值抽离出来
                const filter = value.filter(f => f.cpuQuota > 0);
                let cpuAndMemary = {
                  cpuQuota: 0,
                  memoryQuota: 0
                }
                if (filter.length > 0){
                  cpuAndMemary = filter[0]
                }

                this.handleChangeComputility(value[0].powerResourceId) // 更改选择状态

                return {
                  key: Number(key),
                  projectId: this.projectId,
                  powerResourceId: value[0].powerResourceId,
                  powerResourceName: value[0].powerResourceName,
                  moduleConfig: value[0].moduleConfig,
                  cpuQuota: cpuAndMemary.cpuQuota, //value[0].cpuQuota,
                  memoryQuota: cpuAndMemary.memoryQuota, // value[0].memoryQuota,
                  gpus: value
                }
              });
              // this.form.projectComputingPowerResourceParamList2 = projectComputingPowerResourceParamList2
              // console.log('form.projectComputingPowerResourceParamList2', this.form.projectComputingPowerResourceParamList2)
            }


            // 存储资源池
            let projectStorageResourceParamList2 = []
            if (res.projectStorageResourceDtoList && res.projectStorageResourceDtoList.length > 0){
              projectStorageResourceParamList2 = res.projectStorageResourceDtoList
              // this.form.projectStorageResourceParamList2 = projectStorageResourceParamList2
              projectStorageResourceParamList2.forEach(f=>{
                this.handleChangeStorage(f.storageResourceId) // 更改选择状态
              })
            }

            // site 字段
            let siteSelect = {
              foundation: undefined,
              factory: undefined,
            }
            if (res.site){
              const [foundation, factory] = res.site.split('-');
              const factoryArray = factory.match(/T\d/g) || [];
              siteSelect = {
                foundation: foundation.trim(),
                factory: factoryArray,
              }
            }


            // 项目管理员
            let projectMembersParamList = []
            let projectMembersParamList2 = []
            if (res.projectMembersDtoList && res.projectMembersDtoList.length > 0){
              projectMembersParamList = res.projectMembersDtoList.map(m => {
                return {
                  ...m,
                  username: m.memberName,
                }
              })
              // 回显已选择的项目管理员
              projectMembersParamList2 = res.projectMembersDtoList.map(m => {
                return {
                  ...m,
                  username: m.memberName,
                  key: m.memberName,
                  value: m.memberName,
                  label: m.nickName,
                }
              })
            }


            this.form = {
              id: res.id,
              projectName: res.projectName,
              site: res.site,
              projectDescription: res.projectDescription,
              projectType: res.projectType,

              projectComputingPowerResourceParamList: res.projectComputingPowerResourceDtoList,
              projectStorageResourceParamList: res.projectStorageResourceDtoList,
              projectMembersParamList: projectMembersParamList,

              siteSelect: siteSelect,
              projectMembersParamList2: projectMembersParamList2,
              projectComputingPowerResourceParamList2: projectComputingPowerResourceParamList2,
              projectStorageResourceParamList2: projectStorageResourceParamList2
            }

            console.log('this.form', this.form)
          })
          .catch(err => {
            console.log(err);
          })
    },

    addComputility(){
      const newKey = this.form.projectComputingPowerResourceParamList2.length ? this.form.projectComputingPowerResourceParamList2[this.form.projectComputingPowerResourceParamList2.length - 1].key + 1 : 1
      this.form.projectComputingPowerResourceParamList2.push({
        key: newKey,
        projectId: this.projectId,
        powerResourceId: undefined,
        powerResourceName: null,
        cpuQuota: 0,
        memoryQuota: 0,
        moduleConfig: null,
        gpus: [
          {
            key: 1,
            id: null,
            cpuQuota: 0,
            memoryQuota: 0,
            gpuModel: null,
            gpuQuota: 0
          }
        ]
      });

      this.handleChangeComputility(null)

    },
    delComputility(index){
      const item = this.form.projectComputingPowerResourceParamList2[index]
      if (this.computilityOptions.length !== 0){
        this.computilityOptions = this.computilityOptions.map(m=>{
          if (m.id === item.powerResourceId){
            return {
              ...m,
              selected: false
            }
          }else{
            return m
          }
        })
      }

      this.form.projectComputingPowerResourceParamList2.splice(index, 1)
    },
    addGPU(index, powerResourceId){
      if (!powerResourceId){
        return
      }
      const newKey = this.form.projectComputingPowerResourceParamList2[index].gpus.length ?
          this.form.projectComputingPowerResourceParamList2[index].gpus[this.form.projectComputingPowerResourceParamList2[index].gpus.length - 1].key + 1 : 1
      this.form.projectComputingPowerResourceParamList2[index].gpus.push({
        ...this.form.projectComputingPowerResourceParamList2[index].gpus[0],
        key: newKey,
        id: null,
        cpuQuota: 0,
        memoryQuota: 0,
        gpuModel: null,
        gpuQuota: 0
      });
    },
    //删除行
    delGPU(record, index) {
      this.form.projectComputingPowerResourceParamList2[index].gpus = this.form.projectComputingPowerResourceParamList2[index].gpus.filter(item => item.key !== record.key)
    },
    addStorage(){
      const newKey = this.form.projectStorageResourceParamList2.length ? this.form.projectStorageResourceParamList2[this.form.projectStorageResourceParamList2.length - 1].key + 1 : 1
      this.form.projectStorageResourceParamList2.push({
        key: newKey,
        projectId: this.projectId,
        storageResourceId: undefined,
        storageQuota: 0,
        usedQuota: 0
      });

      this.handleChangeStorage(null)
    },
    delStorage(index){
      const item = this.form.projectStorageResourceParamList2[index]
      if (this.storageOptions.length !== 0){
        this.storageOptions = this.storageOptions.map(m=>{
          if (m.id === item.storageResourceId){
            return {
              ...m,
              selected: false
            }
          }else{
            return m
          }
        })
      }
      this.form.projectStorageResourceParamList2.splice(index, 1)
    },

    async fetchUser(value) {
      const res = await findByNickNameSearch(value);
      const temp = res.map(item => {
        return {
          ...item,
          memberName: item.username,
        }
      })
      this.managerOptions = temp
    },
    handleManagerChange(value) {
      this.form.projectMembersParamList2 = value
    },

    handleFoundationChange(value){
      this.form.siteSelect.foundation = value;
    },
    handleFactoryChange(value){
      this.form.siteSelect.factory = value;
    },

    handleOk(e){
      this.$nextTick(()=>{
        // 重组算力资源池参数
        let projectComputingPowerResourceParamList = []
        if (this.form.projectComputingPowerResourceParamList2.length > 0){
          this.form.projectComputingPowerResourceParamList2.forEach((item, index) => {
            if (item.gpus.length > 0){
              item.gpus.forEach((item2, index) => {
                let cpuQuota = 0
                let memoryQuota = 0
                // 将原来的CPU配额大于零的，重新赋值
                if (item2.cpuQuota > 0 || index === 0){
                  cpuQuota = item.cpuQuota
                }
                // 将原来的内存配额大于零的，重新赋值
                if (item2.memoryQuota > 0 || index === 0){
                  memoryQuota = item.memoryQuota
                }

                projectComputingPowerResourceParamList.push({
                  projectId: this.projectId,
                  powerResourceId: item.powerResourceId,
                  powerResourceName: item.powerResourceName,
                  moduleConfig: item.moduleConfig,
                  id: item2.id,
                  cpuQuota: cpuQuota,
                  memoryQuota: memoryQuota,
                  gpuModel: item2.gpuModel,
                  gpuQuota: item2.gpuQuota,
                })
              })
            }else {
              projectComputingPowerResourceParamList.push(item)
            }
          })
        }

        // 重组存储资源池参数
        let projectStorageResourceParamList = this.form.projectStorageResourceParamList2.map(m=>{
          return {
            ...m,
            id: m.storageResourceId,
            storageQuota: m.usedQuota
          }
        })

        // 重组地区厂区参数
        let foundation = this.form.siteSelect.foundation
        let site = '';
        if (this.form.siteSelect.factory){
          const factory = this.form.siteSelect.factory.join("").toUpperCase();
          site = foundation.trim() + '-' + factory.trim()
        }
        // 重组项目管理员参数
        let projectMembersParamList = this.form.projectMembersParamList2.map(m=>{
          return {
            ...m,
            memberName: m.key,
            username: m.key,
            nickName: m.label
          }
        })

        let param = {
          ...this.form,
          projectMembersParamList: projectMembersParamList,
          projectComputingPowerResourceParamList: projectComputingPowerResourceParamList,
          projectStorageResourceParamList: projectStorageResourceParamList,
          site: site,
        }

        console.log('param', param)

        const _this = this

        _this.$refs.deployConfigForm.validate(valid => {
          if (valid) {
            // TODO 保存项目信息
            if (param.id === null || param.id === 0 || param.id === undefined){
              ProjectApi.addProjects(param).then(res=>{
                if (res.status===10002){
                  _this.$message.error('新增失败：'+ res.msg)
                }else {
                  console.log('新增成功')
                  _this.$message.success('新增成功')
                  // _this.resetForm() // 重置
                  _this.$emit('handleOk', false)
                  _this.modalVisible = false
                }
              }).catch(err=>{
                _this.$message.error('新增失败：'+ err)
              })
            }else {
              ProjectApi.updateProjects(param).then(res=>{
                console.log('修改成功')
                _this.$message.success('修改成功')
                // _this.resetForm() // 重置
                _this.$emit('handleOk', false)
                _this.modalVisible = false
              }).catch(err=>{
                _this.$message.error('修改失败：'+ err)
              })
            }
          } else {
            console.log('error submit!!');
            return false;
          }
        });
      });
    },
    handleCancel(){
      // this.resetForm() // 重置
      this.$emit('handleCancel', false)
      this.modalVisible = false
    },

    handleChangeComputility(powerResourceId){
      if (this.computilityOptions.length !== 0){
        this.computilityOptions = this.computilityOptions.map(m=>{
          if (m.id === powerResourceId){
            m = {
              ...m,
              selected: true
            }
          }else{
            let filter = this.form.projectComputingPowerResourceParamList2.filter(f=>f.powerResourceId === m.id);
            if (filter.length > 0){
              m = {
                ...m,
                selected: true
              }
            }else {
              m = {
                ...m,
                selected: false
              }
            }
          }
          return m
        })
      }
    },
    handleChangeStorage(storageResourceId){
      if (this.storageOptions.length !== 0){
        this.storageOptions = this.storageOptions.map(m=>{
          if (m.id === storageResourceId){
            m = {
              ...m,
              selected: true
            }
          }else{
            let filter = this.form.projectStorageResourceParamList2.filter(f=>f.storageResourceId === m.id);
            if (filter.length > 0){
              m = {
                ...m,
                selected: true
              }
            }else {
              m = {
                ...m,
                selected: false
              }
            }
          }
          return m
        })
      }

    },
    isExistPowerSpn(powerResourceId){
      if (!powerResourceId){
        return
      }
      if (this.computilityOptions.length === 0){
        return
      }
      const powerSpns = this.computilityOptions.filter(f=>f.id === powerResourceId)
      if (powerSpns.length > 0){
        // console.log('powerSpns[0].poolComputeCardQuotas', powerSpns[0].poolComputeCardQuotas)
        if (powerSpns[0].poolComputeCardQuotas.length > 0){
          return true
        }
        return false
      }
      return false
    },
    getTotalComputilitySpn(powerResourceId){
      if (!powerResourceId){
        return
      }
      if (this.computilityOptions.length === 0){
        return
      }
      const powerSpn = this.computilityOptions.filter(f=>f.id === powerResourceId)[0]

      let totalCpuCapacity = 0
      let totalMemCapacity = 0
      let totalGpu = []
      // let totalGpuQuantity = 0
      // console.log('powerSpn.poolComputeCardQuotas', powerSpn.poolComputeCardQuotas)
      if (powerSpn.poolComputeCardQuotas.length > 0){
        powerSpn.poolComputeCardQuotas.forEach(f=>{
          totalCpuCapacity += f.cpuCapacity
          totalMemCapacity += f.memCapacity
          if (f.gpuModel !== '' && f.gpuQuantity !== null){
            totalGpu.push(f.gpuModel +'*'+f.gpuQuantity+'卡')
          }
        })
        return totalCpuCapacity+`Core `+totalMemCapacity+`GB ` + totalGpu
      }else{
        return totalCpuCapacity+`Core `+totalMemCapacity+`GB ` + totalGpu
      }
    },
    async getAllocatedSpn(powerResourceId) {
      if (!powerResourceId){
        return
      }
      let totalCpuCapacity = 0
      let totalMemCapacity = 0
      let totalGpu = []
      const quotaInfo = await ProjectApi.getPowerQuotaInfo(powerResourceId)
      // console.log('quotaInfo', quotaInfo)
      if (quotaInfo.projectComputingPowerResourceList && quotaInfo.projectComputingPowerResourceList.length > 0) {
        quotaInfo.projectComputingPowerResourceList.forEach(f => {
          totalCpuCapacity += f.cpuQuota
          totalMemCapacity += f.memoryQuota
          if (f.gpuModel !== '' && f.gpuQuota !== null){
            totalGpu.push(f.gpuModel + '*' + f.gpuQuota + '卡')
          }
        })
        return "" + totalCpuCapacity + `Core ` + totalMemCapacity + `GB ` + totalGpu
      } else {
        return "" + totalCpuCapacity + `Core ` + totalMemCapacity + `GB ` + totalGpu
      }
    },

    async getTotalStorageSpn(item) {
      const storageResourceId = item.storageResourceId
      const quotaInfo = await ProjectApi.getStorageQuotaInfo(storageResourceId)
      let usedQuota = 0
      if (quotaInfo && quotaInfo.storageResourceQuota) {
        usedQuota = quotaInfo.storageResourceQuota
      }
      if (!storageResourceId) {
        return
      }
      if (this.storageOptions.length === 0) {
        return
      }
      const storageSpn = this.storageOptions.filter(f => f.id === storageResourceId)[0]

      return `资源池规格：${storageSpn.totalResource} GB\n
                已分配规格：${usedQuota} GB\n
                空闲空间： ${storageSpn.totalResource - usedQuota} GB`
      // return `<span style="font-size: xx-small; color: #a89028">
      //           资源池规格：${storageSpn.totalResource} GB
      //         </span>
      //   <br>
      //           <span style="font-size: xx-small; color: #a89028">
      //           已分配规格：${usedQuota} GB
      //         </span>
      //     <br>
      //           <span style="font-size: xx-small; color: #a89028">
      //           空闲空间： ${storageSpn.totalResource - usedQuota} GB
      //         </span>`
    },
  }
}
</script>

<style scoped>
.resource-class {
  border: 2px solid #00c4ff;
  margin: 2px;
  border-radius: 5px;
}
</style>
