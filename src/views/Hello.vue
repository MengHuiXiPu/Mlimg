<template>
  <div class="hello">
    <img :src="logo" width="85" height="auto" draggable="false" oncontextmenu="return false;"/>
    <span class="welcome">欢迎您使用<span class="system-name">{{ name }}</span></span>
    <br>
    <br>
    <span style="font-size: 25px">你还没有星舟AI平台使用权限，请去<a style="color: #0E0EFF" @click="gotoApply">开通使用权限</a>，权限申请说明<a style="color: #0E0EFF" @click="seeDoc">参见文档</a></span>
  </div>
</template>

<script>
import system from '../config/system'
import {getSystemConfig} from "@/api/dataCenter";

export default {
  name: 'Hello',
  data() {
    return {
      logo: require('@/assets/ai_logo.png'),
      name: system.name,
      docUrl: ''
    }
  },
  created() {
    this.queryDocsLinkUrl()
  },
  methods: {
    // 查询系统配置的文档链接地址
    queryDocsLinkUrl() {
      getSystemConfig({ keyName: "doc_host_port" }).then(res => {
        this.docUrl = res.data?.valueInfo || null
        console.log(this.docUrl)
      })
    },
    gotoApply(){
      window.open('http://newoa.csot.tcl.com/sys/portal/page.jsp?pageId=1901467bc292ca93313cbae42d491276', '_blank');
    },
    seeDoc(){
      let url = this.docUrl && this.docUrl !== '' ? this.docUrl : 'http://10.110.169.11:30999'
      window.open(url + '/web/#/645830101/221660888', '_blank');
    }
  }
}
</script>

<style lang="less" scoped>
.hello {
  //padding-top: 20%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;

  .welcome{
    font-size: 50px;
    color: #0EA7F0;
  }
  .system-name {
    //position: relative;
    //right: 25px;
    font-size: 55px;
    color: #087EB3;
  }
}
</style>
