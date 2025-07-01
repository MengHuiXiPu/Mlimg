<template>
  <a-modal
      :visible="visible"
      :title="createForm.id ? '修改镜像' : '新增镜像'"
      :ok-button-props="{ props: {
      disabled: loading,
      loading: loading
    }}"
      @ok="createData"
      width="800px"
      @cancel="cancelCreateData"
      :maskClosable="false"
  >
    <a-form-model
        :model="createForm"
        ref="ruleForm"
        :label-col="{ span: 3 }"
        :wrapper-col="{ span: 21 }"
        :rules="rules"
        layout="horizontal"
    >
      <a-form-model-item label="镜像名称" prop="name">
        <a-input v-model="createForm.name" :maxLength="50" />
      </a-form-model-item>
      <a-form-model-item label="上传方式" prop="createType">
        <a-radio-group :defaultValue="1" v-model="createForm.algorithmFetchType" @change="algorithmTypeChange" :disabled="Boolean(createForm.id)">
          <a-radio :value="2">本地上传</a-radio>
          <a-radio :value="1">已存在</a-radio>
        </a-radio-group>
      </a-form-model-item>
      <a-form-model-item label="本地上传" v-if="createForm.algorithmFetchType === 2" prop="ckAddress">
        <a-input v-model="createForm.ckAddress" :disabled="true" />
        <a-upload
            :showUploadList="false"
            :before-upload="algorithmUpload"
            :disabled="Boolean(createForm.id)"
        >
        <a-button type="default" :disabled="Boolean(createForm.id)">
          <a-icon type="upload"></a-icon>上传文件
        </a-button>
        </a-upload>
      </a-form-model-item>
      <!-- <a-form-model-item label="IMAGE:TAG" prop="ckAddress" v-else>
        <a-select v-model="createForm.ckAddress">
          <a-select-option v-for="tag in tagOptions" :key="tag" :value="tag">
            {{ tag }}
          </a-select-option>
        </a-select>
      </a-form-model-item> -->
      <a-form-model-item label="IMAGE:TAG" prop="ckAddress" v-else>
        <a-input v-model="createForm.ckAddress" />
      </a-form-model-item>
      <!-- <a-form-model-item label="安装包">
        <div class="packageList">
          <a-tooltip style="margin-left: 30px;">
            <template slot="title">
              自定义添加环境中已安装的关键安装包名称、版本号
            </template>
            <span style="position: absolute;left: -35px"><a-icon type="question-circle" /></span>
          </a-tooltip>
          <a-form-model-item v-for="(item, index) in packageList" :key="item.name" :label="item.name" style="margin: 0 10px; width: 100px;">
            <a-input v-model="item.value">
              <span slot="addonAfter" @click="deletePackage(index)">
                <a-icon type="close" />
              </span>
            </a-input>
          </a-form-model-item>
        </div>
        <a-form-model
            :model="createPackage"
            ref="createPackage"
            :rules="packageRule"
            layout="inline"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 5 }"
        >
          <a-form-model-item label="安装包" prop="name">
            <a-input v-model="createPackage.name" placeholder="请输入安装包名" width="100" />
          </a-form-model-item>
          <a-form-model-item label="版本号" prop="value">
            <a-input v-model="createPackage.value" placeholder="请输入版本号" />
          </a-form-model-item>
          <span style="line-height: 40px">
            <a-button type="dashed" icon="plus" @click="addPackage">添加</a-button>
          </span>
        </a-form-model>
      </a-form-model-item> -->
      <a-form-model-item label="镜像说明">
        <a-input type="textarea" v-model="createForm.description" />
      </a-form-model-item>
    </a-form-model>
  </a-modal>
</template>

<script>
import { newImage } from '@/api/imageManage'
export default {
  name: 'AddImage',
  data () {
    const check = (rule, value, callback) => {
      const regex = /[,\,:]/
      if (regex.test(value)) {
        return callback(new Error('不能输入","和":"'))
      }
      return callback()
    }
    const checkName = async (rule, value, callback) => {
      if (!value || !value.trim()) {
        return callback(new Error('当前值不能为空'))
      } else {
        if (value === this.imageName) return callback()
        const checkData = await newImage.checkImageName({
          imageName: value
        })
        if (checkData.data) {
          return callback()
        } else {
          return callback(new Error('当前名称已存在，请重新输入'))
        }
      }
    }
    return {
      visible: false,
      createForm: {
        algorithmFetchType : 1,
      },
      createPackage: {
      },
      imageName: '',
      rowId: null,
      loading: false,
      rules: {
        name: [{ required: true, validator: checkName, trigger: 'blur' }],
        ckAddress: [{ required: true, message: '请输入IMAGE:TAG', trigger: 'blur' }],
        dockerFile: [{ required: true, message: '请输入上传文件', trigger: 'blur' }],
      },
      // packageRule: {
      //   name: [{ required: true, message: '当前值不能为空', trigger: 'blur' },
      //     { required: true, validator: check, trigger: 'blur' }],
      //   value: [{ required: true, message: '当前值不能为空', trigger: 'blur' },
      //     { required: true, validator: check, trigger: 'blur' }],
      // },
      mirrorList: [],
      packageList: [],
      uploadFileList: [],
      tagOptions: [],
    }
  },
  mounted () {
  },
  methods: {
    showModal (record) {
      this.visible = true
      if(record != null) {
        this.createForm = {
          ...record,
          algorithmFetchType: record.createType
        }
      }
      this.imageName = record?.name
      if (!this.createForm.installPkg) {
        this.packageList = []
      } else {
        this.packageList = this.createForm.installPkg.split(',').map(item => {
          return {
            name: item.split(':')[0],
            value: item.split(':')[1]
          }
        })
      }
    },
    algorithmUpload (file){
      this.createForm.ckAddress = file.name
      if(this.rowData != null) {
        this.rowData.algorithmName = file.name
      }
      this.algorithmFile = file
      this.$forceUpdate()
      this.$refs.ruleForm.clearValidate(['algorithmName'])
      return false
    },
    algorithmTypeChange (e) {
      // this.$set(this.rowData, 'fromImageId', null)
      // 更改算法代码的属性，触发该事件时需要讲算法URL切换对应的形式
      // this.$refs.ruleForm.clearValidate(['algorithmUrl', 'algorithmName', 'fromImageId'])
      if (e.target.value === 1) {
      // 本地上传
        this.$set(this.rules, 'ckAddress', [{ required: true, message: '请输入上传文件', trigger: 'blur' }]);
      } else {
      // 已存在
        this.$set(this.rules, 'ckAddress', [{ required: true, message: '请输入IMAGE:TAG', trigger: 'blur' }]);
      }
      this.$refs.ruleForm.clearValidate(['ckAddress']);
    },
    addPackage () {
      this.$refs.createPackage.validate(valid => {
        if (!valid) {
          return false
        } else {
          this.packageList.push(JSON.parse(JSON.stringify(this.createPackage)))
          this.$forceUpdate()
          this.$refs.createPackage.resetFields()
        }
      })
    },
    deletePackage (index) {
      this.packageList.splice(index, 1)
      // this.$forceUpdate()
    },
    createData() {
      this.$refs.ruleForm.validate(async valid => {
        if (!valid) return false;
        this.loading = true;
        this.createForm.description = this.createForm.description || '';
        this.createForm.installPkg = this.packageList.map(item => {
          return item.name + ':' + item.value;
        }).join();

        try {
          const formData = {
            ...this.createForm,
            algorithmFetchType: this.createForm.algorithmFetchType
          };
          if (this.createForm.algorithmFetchType == 1) {
            const method = this.createForm.id ? 'put' : 'post';
            const res = await newImage.editImage(this.createForm, method);
            if (res.code !== 0) return false;
            this.$emit('getDataList');
            this.$message.success(this.createForm.id ? '修改成功' : '新建成功');
            this.cancelCreateData();
          } else {
            await this.uploaddata();
          }
        } finally {
          this.loading = false;
        }
      });
    },

    async uploaddata() {
      const enctypeOpt = {
        "Content-Type": "multipart/form-data",
      };
      const fileForm = new FormData();
      fileForm.append("dockerFile", this.algorithmFile);
      // fileForm.append("dockerFile", this.uploadFileList[i]);
      fileForm.append("name", this.createForm.name);
      fileForm.append("installPkg", this.createForm.installPkg);
      fileForm.append("description", this.createForm.description);

      const method = this.createForm.id ? 'put' : 'post'; // 确保定义了 method
      const res = await newImage.editImageFile(fileForm, enctypeOpt);
      if (res.code !== 0) return false;
      this.$emit('getDataList');
      this.$message.success(this.createForm.id ? '修改成功' : '新建成功');
      this.cancelCreateData();
    },
    cancelCreateData () {
      this.createForm = {
        algorithmFetchType : 1
      }
      this.$refs.ruleForm.resetFields()
      // this.$refs.createPackage.resetFields()
      this.visible = false
    }
  }
}
</script>

<style lang="less" scoped>
/deep/ .packageList{
  max-height: 250px;
  overflow-y: auto;
  margin-bottom: 10px;
}

/deep/ .ant-form-item-label {
  min-width: 90px;
}
</style>