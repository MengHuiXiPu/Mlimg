<template>
  <div>
    <a-modal
      title="类别选择"
      :visible="showDialog"
      @ok="handleOk"
      @cancel="handleCancel"
      destroyOnClose
      okText="保存"
    >
      <div class="container">
        <input class="show-result-area"
            style="
              
            "
            :value="activeItem.label"
            disabled
          />
        <ul class="category-ul">
          <li v-for="option in categoryList" 
            class="category-li" 
            :key="option.name" 
            :class="{ active: activeItem.name == option.name }"
            @click="doClickCategory(option)"
            >{{option.label}} </li>
        </ul>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { useState } from "../hooks/state.js";
import { ref } from "vue";
export default {
  name: 'SelectCategory',
  data() {
    return {
      showDialog: false,
      state: {}, // 用于存储model开启关闭状态对应的promise的resolve和reject
      activeItem: {},  //
    }
  },

  methods: {
    /**
     * @public
     * @description: 显示model，返回promise
     */
    invoke(params = {}) {
      if(!this.categoryList || !this.categoryList.length) {
        this.parseParameter(this.configData.inputParams)
      }
      this.showDialog = true
      return new Promise((resolve,reject) => {
        this.state = {
          resolve,
          reject
        }
      })
    },
    doClickCategory(option) {
      this.activeItem = option
    },
    handleOk() {
      if(!this.activeItem.name) return this.$message.warning("请选择参数类别")
      this.showDialog = false
      // 关闭弹框  resolve state
      this.state.resolve(this.activeItem)  
    },
    handleCancel() {
      this.showDialog = false
      // 关闭弹框  reject state
      this.state.reject('cancel')
    }
  },
  setup() {
    const categoryList = ref([])
    const { configData } = useState()
    const parseParameter = (inputJson) => {
      try {
        const jsonData = JSON.parse(inputJson);
        const inputs = jsonData.inputs;
        categoryList.value = inputs.filter( i => i.type ==='rect').map(s => { return {
          name: s.name,
          label: s.label
        }})
      }catch (e) {
        console.error("inputParams参数格式异常，无法解析渲染配置表单", inputJson)
      }
    }
    return {
      categoryList,
      configData,
      parseParameter,
    }
  }
}
</script>

<style lang="less" scoped>
.container {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  color: #333333;
  .show-result-area {
    width: 80%;
    padding-left: 10px;
    margin: 0 auto 5px;
    border: none;
    outline: none;
    border-bottom: 1px solid #000;
  }
  .category-ul {
    width: 80%;
    height: 200px;
    overflow-y: auto;
    list-style: none;
    border: 1px solid gray;
    padding: 10px 0 0 0 ;
    margin: 0 auto;
  }
  .category-li {
    padding-left: 15px;
    height: 25px;
    line-height: 25px;
    text-align: left;
    cursor: pointer;
  }
  .category-li:hover {
    background-color: #d9d9d9;
  }
  .active {
    background-color: #d9d9d9;
  }
}
</style>