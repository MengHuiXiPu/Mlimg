<template>
  <div class="app-container">
    <a-button @click="addGroup" type="primary"><a-icon type="plus" />创建用户组</a-button>

    <a-table :columns="columns" :data-source="dataGroup" rowKey="key">

      <span slot="action" slot-scope="text, record">
        <a @click="editGroup(record)">编辑</a>
        <a-divider type="vertical" />
        <a @click="deleteGroup(record)">删除</a>
      </span>
    </a-table>
    <!-- 用户组表单弹窗 -->
    <a-modal
        title="创建用户组"
        :visible="visibleModal"
        @ok="nextStep"
        :ok-button-props="{
          props: {
            disabled: loading,
            loading: loading
         }}"
        :okText="okText"
        :destroyOnClose="true"
        @cancel="handleCancel"
        :closable="true"
        :maskClosable="true"
        width="50%">

      <a-steps class="steps" :current="currentTab" size="small">
        <a-step title="创建用户组" />
        <a-step title="添加用户组成员" />
      </a-steps>

      <!--      第一步表单-->
      <a-form-model
          ref="ruleForm"
          :model="groupForm"
          :rules="rules"
          v-if="visibleFirst"
          :label-col="{ span: 5 }"
          :wrapper-col="{ span: 12 }"
      >
        <a-form-model-item ref="name" label="用户组名称" prop="name">
          <a-input v-model="groupForm.name" @blur=" () => { $refs.name.onFieldBlur(); }" />
        </a-form-model-item>
        <a-form-model-item label="用户组描述" prop="desc">
          <a-input v-model="groupForm.desc" type="textarea" />
        </a-form-model-item>
      </a-form-model>

      <!--      第二步穿梭框-->
      <a-transfer
          v-if="!visibleFirst"
          :data-source="mockData"
          :titles="['未选择用户', '已选择用户']"
          :target-keys="targetKeys"
          :selected-keys="selectedKeys"
          :render="item => item.nickName"
          :disabled="disabled"
          @change="handleChange"
          @selectChange="handleSelectChange"
          @scroll="handleScroll"
      />
    </a-modal>
  </div>
</template>

<script>
import {
  list,
  add,
  edit,
  del,
  getUserListByGroup,
  getUngroupedUsers,
  updateGroupUsers,
  deleteUserFromGroup,
  updateUserState,
  updateUserRoles,
  deleteGroupUsers,
} from '@/api/system/userGroup';

export default {
  name: 'UserGroup',
  data(){
    return {
      visibleModal: false, // 用户组表单弹窗
      loading: false,

      groupForm: {
        name: "",
        desc: ""
      },
      currentTab: 0, // 当前选中的步骤

      visibleFirst: true,

      rules: {
        name: [
          { required: true, message: '请输入用户组名称', trigger: 'blur' },
          // { min: 3, max: 5, message: 'Length should be 3 to 5', trigger: 'blur' },
        ],
        // desc: [{ required: true, message: '请输入用户组描述', trigger: 'blur' }],
      },

      mockData: [],
      targetKeys: [],
      selectedKeys: [],
      disabled: false,

      columns: [
        {
          dataIndex: 'id',
          key: 'id',
          title: 'ID',
        },
        {
          title: '名称',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: '描述',
          dataIndex: 'description',
          key: 'description',
        },
        {
          title: '操作',
          key: 'action',
          scopedSlots: { customRender: 'action' },
        },
      ],
      dataGroup: [],
      // dataGroup: [
      //   {
      //     key: '1',
      //     name: 'John Brown',
      //     age: 32,
      //     address: 'New York No. 1 Lake Park',
      //     tags: ['nice', 'developer'],
      //   },
      //   {
      //     key: '2',
      //     name: 'Jim Green',
      //     age: 42,
      //     address: 'London No. 1 Lake Park',
      //     tags: ['loser'],
      //   },
      //   {
      //     key: '3',
      //     name: 'Joe Black',
      //     age: 32,
      //     address: 'Sidney No. 1 Lake Park',
      //     tags: ['cool', 'teacher'],
      //   },
      // ],
    }
  },
  computed: {
    okText(){
      return this.currentTab===0? "下一步":"完成";
    }
  },
  async mounted() {
    this.mockData = await getUngroupedUsers();
    // const res = await getUngroupedUsers();
    // for(let s of res) {
    //   this.mockData.push(s.nickName);
    // }

    // for (let i = 0; i < 20; i++) {
    //   this.mockData.push({
    //     key: i.toString(),
    //     nikeName: `content${i + 1}`,
    //     title: `content${i + 1}`,
    //     description: `description of content${i + 1}`,
    //     disabled: i % 3 < 1,
    //   });
    // }
    console.log("mockData: ", this.mockData);
    await this.getGroup();
    // console.log("this.dataGroup: ", this.dataGroup);
  },
  methods: {
    list,
    del,
    addGroup() {
      this.visibleModal = true;
    },
    async getGroup(){
      const res = await this.list({
        current: 1,
        size: 20,
      });
      this.dataGroup = res.result;
      console.log("this.dataGroup: ", this.dataGroup);
      for(let item of this.dataGroup) {
        item.key = item.id;
      }
    },
    nextStep() {
      if(this.currentTab === 0) {
        // 下一步
        this.$refs.ruleForm.validate(async valid => {
          if (valid) {
            //
            const res = await add(this.groupForm);
            console.log("下一步res: ", res);
            if(res.code !== 200){
              this.$message.error(res.msg);
              return ;
            }

            this.visibleFirst = false;
            this.currentTab = 1;
          } else {
            return false;
          }
        });
      }else{
        this.handleCancel();
        this.visibleModal = false;
      }
      this.getGroup();
    },
    // 编辑用户组
    editGroup(record) {

    },
    // 删除用户组
    deleteGroup(record){
      const that = this;
      this.$confirm({
        title: '提示',
        content: '确认删除此用户组',
        onOk() {
          that.del(record.id).then(res => {
            that.getGroup();
            console.log("del res: ", res);
          });
        },
        onCancel() {},
      });
    },
    handleCancel() {
      this.visibleModal = false;
      this.currentTab = 0;
      this.visibleFirst = true;
      this.groupForm.name = "";
      this.groupForm.desc = "";
      console.log("handleCancel");
    },
    handleChange(nextTargetKeys, direction, moveKeys) {
      this.targetKeys = nextTargetKeys;

      console.log('targetKeys: ', nextTargetKeys);
      console.log('direction: ', direction);
      console.log('moveKeys: ', moveKeys);
    },
    handleSelectChange(sourceSelectedKeys, targetSelectedKeys) {
      this.selectedKeys = [...sourceSelectedKeys, ...targetSelectedKeys];

      console.log('sourceSelectedKeys: ', sourceSelectedKeys);
      console.log('targetSelectedKeys: ', targetSelectedKeys);
    },
    handleScroll(direction, e) {
      console.log('direction:', direction);
      console.log('target:', e.target);
    },
    handleDisable(disabled) {
      this.disabled = disabled;
    },
  }
}
</script>

<style lang="scss" scoped>

.steps {
  max-width: 80%;
  margin: 10px;
}
</style>