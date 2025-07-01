<template>
  <a-modal title="共享" :visible="showModal" @ok="handleOk"  @cancel="handleCancel" destroyOnClose width="50%">
    <div class="user-search">
      <a-input-search  placeholder="请输入用户名检索" v-model="keyword" @change="filterUserList"/>
      <!-- 设置/取消设置公共共享 -->
      <a-button type="primary" @click="setPublic">{{publicButtonText}}</a-button>
    </div>
    <!-- @change="handleTableChange" :pagination="pagination.total > 10 ? pagination : false" -->
    <a-table size="mini"
      :columns="userColumns"
      :data-source="userList"
      :row-selection="{ selectedRowKeys: selectedUserKeys, onChange: onSelectChange }"
      :rowKey="(record) => record.username"
      v-loading="confirmLoading" 
      element-loading-text="保存中..."
      
      :scroll="{y: 450}">        
      <template slot="roles" slot-scope="text, record"><span>{{ getUserRoles(record) }}</span></template>
      <template slot="enabled" slot-scope="text, record"> <span>{{ record.enabled ? "激活" : "锁定" }}</span></template>
    </a-table>
    <template slot="footer">
      <p style="position: absolute;">已选用户数量：{{ selectedUserKeys.length }}</p>
      <a-button key="back" @click="handleCancel"> 取消</a-button>
      <a-button key="submit" type="primary" @click="handleOk">确定</a-button>
    </template>
  </a-modal>
</template>
<script>
/**
 * 会存在数据缓存，使用时可使用v-if重新创建
 */
import { ref, reactive } from 'vue';
import crudUser from "@/api/system/user";
import debounce from 'lodash.debounce';
// import { axios } from "@/utils/request";
import { message as $message } from '@/utils/resetMessgae'
import { shareMap } from "./config.js";
export default {
  name: 'shareModal',
  data() {
    return {
      userColumns: [
        { title: "用户名", dataIndex: "username", key: "username", width: 120, ellipsis: true},
        { title: "昵称", dataIndex: "nickName", key: "nickName", width: 80, ellipsis: true},
        { title: "角色", dataIndex: "roles", key: "roles", width: 80, scopedSlots: { customRender: "roles" }},
        { title: "状态", dataIndex: "enabled", key: "enabled", width: 80, scopedSlots: { customRender: "enabled" }}
      ]
    }
  },
  methods: {
    getUserRoles(record) {
      const roles = record.roles || [];
      const names = roles.map((role) => role.name);
      return names.join("<br/>") || "-";
    }
  },
  props: {
    // 组件内部无作用，外部可传递该值，使用v-if来重新渲染
    visible: {
      type: Boolean,
      default: false
    }
  },
  setup (props, { emit }) {
    const showModal = ref(false)
    const userList = ref([])
    let allUserList = []
    let outOptions = {}   //用于记录invokeModal方法传进来的参数
    const state = ref({})
    const keyword = ref("")
    const publicButtonText = ref("设置公共共享")
    const selectedUserKeys = ref([])
    const confirmLoading = ref(false)
    // 要共享给的用户List(选中的用户)
    // const targetUsers = ref([])
    const pagination = reactive({
      pageSize: 10,
      current: 1,
      total: 0
    })
    const onSelectChange = (selectedRowKeys, selectedRows) => {
      selectedUserKeys.value = selectedRowKeys;
      // targetUsers.value = selectedRows;
    }
    // const handleTableChange = (pagi, filters, sorter) => {
    //   pagination.current = pagi.current;
    //   pagination.pageSize = pagi.pageSize;
    //   fetchUserList()
    // }
    // createShare
    const handleOk = async () => {
      const config = shareMap[outOptions.type]
      const data = outOptions.data
      // const users = targetUsers.value.map(u => u.username)
      try {
        confirmLoading.value = true
        const res = await config['createShare']({
          id: data.id,
          shareType: config['shareType'],
          users: selectedUserKeys.value
        })
        confirmLoading.value = false
        if(res.code !==0 ) return
        showModal.value = false
        emit('update:visible', false)
        $message.success("设置成功")
        state.value.resolve(res)  
      }catch(e) {
        confirmLoading.value = false
      }
    }
    const handleCancel = () => {
      showModal.value = false
      emit('update:visible', false)
      state.value.reject(null) 
    }
    const fetchUserList = () => {
      crudUser.list({ 
        current: pagination.current, 
        // size: pagination.pageSize 
        size: 500
      }).then(res => {
        allUserList = userList.value = res.result || []
        pagination.total = res?.page?.total
      })
    }
    // 获取某条数据已共享给的用户列表
    const fetchSharedUsers = () => {
      const config = shareMap[outOptions.type]
      config['getSharedUsers']({
        id: outOptions.data?.id,
        shareType: config['shareType']
      }).then(res => {
        if(res.code == 0) {
          selectedUserKeys.value = res.data || []
        }
      })
    }
    // 设置公共共享
    const setPublic = () => {
      const config = shareMap[outOptions.type]
      const data = outOptions.data
      const isPublic = !data.isPublic
      confirmLoading.value = true
      config['setPublic']({
        isPublic,
        shareType: config['shareType'],
        id: data.id
      }).then(res => {
        if(res.code !==0 ) return
        showModal.value = false
        emit('update:visible', false)
        $message.success("设置成功")
        state.value.resolve(res)  
      }).finally(() => {
        confirmLoading.value = false
      })
    }
    const initState = (options) => {
      if(options.data?.isPublic) {
        publicButtonText.value = "取消公共共享"
      }else {
        publicButtonText.value = "设置公共共享"
      }
    }
    const filterUserList = debounce(() => {
      const word = keyword.value.trim()
      if(!word) return
      userList.value = allUserList.filter( item => item.username.indexOf(word) > -1)
    }, 500)
    /**
     * @public, 调用并创建一个共享选择modal实例，并返回一个Promise
     * @param {*} options  data+type(数据集/训练任务/模型/算法)
     * type: 会关联config中的配置key，限定 dataSet/, 有共享需求可增加
     */
    const invokeModal = (options) => {
      outOptions = options
      showModal.value = true
      // 获取用户列表
      fetchUserList()
      // 获取已共享给的用户列表
      fetchSharedUsers()
      // 
      initState(options)
      return new Promise((resolve, reject) => {
        state.value = { resolve, reject }
      })
    }
    return {
      showModal,
      keyword,
      publicButtonText,
      userList,
      pagination,
      confirmLoading,

      selectedUserKeys,
      onSelectChange,
      // handleTableChange,
      filterUserList,
      setPublic,

      handleOk,
      handleCancel,
      invokeModal,
    }
  }
}
</script>

<style lang="less" scoped>
@import "~@/config/theme.less";
::v-deep .ant-modal-body {
  padding: 10px 24px 0;
  min-height: 550px;
}
.user-search {
  display: flex;
  width: 100%;
  text-align: right;
  margin-bottom: 8px;
  ::v-deep .ant-input-affix-wrapper {
    margin-right: 8px;
  }
}
</style>