/* * Copyright 2019-2020 Zheng Jie * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance
with the License. * You may obtain a copy of the License at * *
http://www.apache.org/licenses/LICENSE-2.0 * * Unless required by applicable law
or agreed to in writing, software * distributed under the License is distributed
on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied. * See the License for the specific language governing
permissions and * limitations under the License. */

<template>
  <div class="app-container">
    <!-- <p>个人中心</p> -->
    <a-header
      :showNew="false"
      :showSearch="false"
      pageTitle="个人中心"
      :showdelete="false"
      :showReload="false"
      :auth="{ add: 'dataMrg-list-add' }"
      :tab-list="tabList"
      :tab-active-key="tabActiveKey"
      @tab-change="tabOnChange"
    />
    <el-tabs tab-position="left" v-model="tabActiveKey">
      <el-tab-pane key="0">
        <el-card class="box-card" style="height: 500px">
          <span slot="label"><i class="el-icon-user"></i> 基本设置</span>
          <user-info></user-info>
        </el-card>
      </el-tab-pane>
      <el-tab-pane key="1">
        <el-card class="box-card" style="height: 500px">
          <span slot="label"><i class="el-icon-setting"></i> 开发者信息</span>
          <div style="margin-left: 30px">
            <h4 class="my-10">Token</h4>
            <span
              >当前用户的唯一登录信息，你可以在命令行里面使用，完成用户鉴权</span
            >
            <pre class="code flex flex-vertical-align flex-between">
                <code class="text ellipsis">{{getToken()}}</code>
                <copy-to-clipboard :text="getToken()" @copy="handleCopy">
                  <i class="el-icon-copy-document pointer copy" />
                </copy-to-clipboard>
              </pre>
          </div>
        </el-card>
      </el-tab-pane>
      <el-tab-pane key="2">
        <div style="overflow: auto; height: 700px" v-infinite-scroll="loadMoreList">
          <el-card
            class="box-card"
            v-for="tag in versionInfoTotal"
            :key="tag.gitTag"
            style="margin-bottom: 8px"
          >
            <span slot="label">版本信息</span>
            <!-- 按要求双击版本号显示更多信息按钮，点击更多信息再显示各服务更新明细 -->
            <span><strong>版本号：</strong></span>
            <span @dblclick="showMoreInfo(tag)" style="cursor: pointer;"
              ><strong>{{ tag.gitTag }}</strong></span
            ><br />
            <span>更新日期：</span>
            <span>{{ tag.updateTime | moment }}</span>
            <div style="display: flex">
              <span>更新日志：</span>
              <span v-html="tag.updateNote"></span>
            </div>
            <!-- 各服务明细 -->
            <span v-if="tag.showMoreBtn" @click="tag.showMoreContent=!tag.showMoreContent">更多信息：
              <i class="more-btn" :class="tag.showMoreContent ? 'el-icon-d-arrow-left': 'el-icon-d-arrow-right'">
            </i></span>
            <div v-if="tag.showMoreContent">
              <ul v-for="(item) in tag.releaseInformationList || []" :key="item.id" style="display: flex;flex-direction: column;">
                <span>服务名称：{{ item.applicationName }}</span>
                <span>更新时间：{{ item.updateTime | moment }}</span>
                <div style="display: flex;">
                  <span>更新日志：</span>
                  <span style="flex: 1;" v-html="item.updateNote"></span>
                </div>
              </ul>
            </div>
          </el-card>
          <div style="text-align: center;">
            <a-spin v-show="loadingMore"/>
            <span v-if="showNoDataText">无更多数据</span>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    <!-- <el-card class="box-card">
      <el-tabs type="card"  v-model="activeName" @tab-click="handleClick">
        <el-tab-pane name="first" label="基本设置">
          <span slot="label"><i class="el-icon-user"></i> 基本设置</span>
          <user-info></user-info>
        </el-tab-pane>
        <el-tab-pane name="second" label="开发者信息">
          <span slot="label"><i class="el-icon-setting"></i> 开发者信息</span>
          <div style="margin-left: 30px;">
            <h4 class="my-10">Token</h4>
            <span>当前用户的唯一登录信息，你可以在命令行里面使用，完成用户鉴权</span>
            <pre class="code flex flex-vertical-align flex-between">
              <code class="text ellipsis">{{getToken()}}</code>
              <copy-to-clipboard :text="getToken()" @copy="handleCopy">
                <i class="el-icon-copy-document pointer copy" />
              </copy-to-clipboard>
            </pre>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card> -->
  </div>
</template>

<script>
import { Message } from "element-ui";
import CopyToClipboard from "vue-copy-to-clipboard";
import { getToken } from "@/utils/auth";
import UserInfo from "./userInfo.vue";
// import { versionInfo } from "./versionInfo";
import { queryVersionInfo } from '@/api/user.js'

export default {
  name: "Center",
  components: { UserInfo, CopyToClipboard },
  data() {
    return {
      activeName: "first",
      tabActiveKey: "0",
      // version: null,
      // updateDate: '',
      // content: '',
      // version: [],
      // updateDate: [],
      // content: [],
      versionInfoTotal: [],
      tabList: [
        {
          name: "基本设置",
          key: "0",
        },
        {
          name: "开发者信息",
          key: "1",
        },
        {
          name: "版本信息",
          key: "2",
        },
      ],
      loadingMore: false ,
      pagination: {
        pageNo: 1, //版本信息分页num
        total: 0,
        limit: 10
      }
    };
  },
  computed:{
    // 是否显示《无更多数据》文本
    showNoDataText() {
      return this.versionInfoTotal.length >= this.pagination.total
    }
  },
  methods: {
    getToken,
    tabOnChange(e) {
      this.tabActiveKey = e;
    },
    handleCopy() {
      Message.success("复制成功");
    },
    cloneObject(obj) {
      return JSON.parse(JSON.stringify(obj));
    },
    // 双击显示更多信息按钮
    showMoreInfo(tag) {
      tag.showMoreBtn = !tag.showMoreBtn
    },
    loadMoreList() {
      const {pageNo,limit,total } = this.pagination
      if(total <= pageNo * limit) { //无更多数据
        return
      }
      this.pagination.pageNo ++ 
      this.queryVersionInfoList()
    },
    queryVersionInfoList() {
      this.loadingMore = true
      const {pageNo,limit } = this.pagination
      queryVersionInfo({
        pageNo,
        limit
      }).then(res => {
        const list = res?.data?.records || []
        list.forEach(ele=>{ //处理换行问题
          ele.updateNote = ele.updateNote.replace(/\n|#/g, '<br>')
          this.$set(ele, 'showMoreBtn', false)
          this.$set(ele, 'showMoreContent', false)
          if(Array.isArray(ele.releaseInformationList)) {
            ele.releaseInformationList.forEach(serve => {
              serve.updateNote = serve.updateNote.replace(/\n/g, '<br>')
            })
          }
        })
        this.versionInfoTotal = this.versionInfoTotal.concat(list)
        this.pagination.total = res.data.total
      }).finally(()=> {
        this.loadingMore = false
      })
    }
  },
  
  created() {
    this.queryVersionInfoList()
  },
  mounted() {
    // const current = versionInfo.shift()
    // console.log("current: ", current)
    // this.version = current.versionNum
    // this.updateDate = current.date
    // this.content = current.content

  },
  // setup() {
  //   const tabActiveKey = ref("1")
  //   const tabList = [
  //     {
  //       name: "基本设置",
  //       key: "1"
  //     },
  //     {
  //       name: "基本设置",
  //       key: "2"
  //     }
  //   ]
  //   const handleCopy = () => {
  //     Message.success('复制成功');
  //   };

  //   return {
  //     tabActiveKey,
  //     tabList,
  //     handleCopy,
  //     getToken,
  //   };
  // },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "@/assets/styles/variables.scss";
.more-btn{
  rotate: 90deg;
}
::v-deep.el-tabs--left {
  .el-tabs__item.is-left {
    text-align: left;
  }
  .el-tabs__header {
    display: none;
  }

  .el-tabs__item.is-active {
    color: #1f89fc;
    background: #e6f7ff;
  }
}

.code {
  // width: 80%;
  // height: 40px;
  padding: 0 20px;
  margin-top: 20px;
  background: #ebedf0;
}

.copy {
  font-size: 18px;
  color: $primaryColor;
}

::-webkit-scrollbar-track {
  background: #ebedf0;
}
::-webkit-scrollbar-thumb {
  background: #b2b2b2;
  border-radius: 4px;
}
/* Firefox 滚动条 */
* {
  scrollbar-width: thin;
  scrollbar-color: #b2b2b2 #ebedf0;
}
*::-webkit-scrollbar {
  width: 6px;
}
*::-webkit-scrollbar-thumb {
  background-color: #b2b2b2;
  border-radius: 4px;
}
</style>
