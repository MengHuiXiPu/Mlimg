<template>
  <transition name="fade">
    <div v-if="visible" class="upload-box" :style="messageStyle">
      <header class="header-box" @click="toggleShowList">
        <span :class="showList ? 'el-icon-arrow-up':'el-icon-arrow-down'">&nbsp;&nbsp;{{uploading? '正在上传': '上传完成'}}
          <em>&nbsp;{{ uploading ? '': uploadCount }}</em>
        </span>
        <el-tooltip placement="top" :disabled="!uploading" content="取消上传">
          <span class="el-icon-close close-button" @click.stop="doCloseBox"></span>
        </el-tooltip>
      </header>
      <el-collapse-transition>
        <div class="body-box scrollbar" v-show="showList">
          <div class="list-block" v-for="(item,index) in uploadList" :key="item.name+index">
            <div class="list-main">
              <div class="list-type"><span class="el-icon-files"></span></div>
              <div class="list-info">
                <div class="list-title">{{ item.name }}<span style="font-size: 12px;">{{ `&nbsp;[&nbsp;${item.typeText}&nbsp;]` }}</span></div>
                <div class="list-desc">
                  <span>{{ `${item.loaded}/${item.total} · ` }}</span>
                  <!-- 上传失败 -->
                  <a-popover placement="left" v-if="item.status==='error'">
                    <template slot="content">
                      <a-alert message="Error" :description="item.faillMsg" type="error" show-icon />
                    </template>
                    <span style="cursor: pointer;color: #f5222d">上传失败</span>
                  </a-popover>
                  <!-- 上传成功 -->
                  <span style="color: #52c41a" v-if="item.status==='success'">上传成功</span>
                </div>
              </div>
            </div>
            <a-progress :percent="item.percent" size="small" :showInfo="false" v-show="!['success','error'].includes(item.status)"/>
          </div>
        </div>
      </el-collapse-transition>
    </div>
  </transition>
</template>

<script>
import { uploadDataSet } from "@/api/dataCenter"
import bus from "@/utils/bus.js"
export default {
  data() {
    return {
      visible: false,
      showList: true,
      uploadList: [],
      uploading: false,  //标识是否有文件正在上传，有的话关闭按钮需给出提示,每个上传的进度progressEvent中赋值为true 
      controllers: [],  //axios取消控制器
    };
  },
  computed: {
    messageStyle() {
      return {
        zIndex: 1000,
      };
    },
    uploadCount() {
      if(!this.uploadList.length) return ''
      return `${this.uploadList.filter(item => item.status ==='success').length}/${this.uploadList.length}`
    }
  },
  methods: {
    toggleShowList() {
      this.showList = !this.showList;
    },
    /**
     * @public
     */
    show(propData = {}) {
      this.visible = true;
      this.createTask(propData)
    },
    /**
     * @public
     * 创建上传任务
     */
    createTask(propData) {
      const { type, data, fileList } = propData
      if(type === 'uploadDataset') { //数据集上传
        const formData = new FormData()
        formData.append('file', fileList[0])
        formData.append('dataListInfoAddParam', new Blob([JSON.stringify(data)], {
          type: 'application/json'
        }))
        const listData = this.buildUploadList(type, data)
        // 将完整信息数据添加到上传任务列表
        this.uploadList.push(listData)

        this.uploading = true
        const controller = new AbortController();
        const signal = controller.signal;
        this.controllers.push(controller)
        uploadDataSet(formData, (progressEvent) => {
          // console.log('进度信息:', progressEvent)
          listData.percent = (progressEvent.loaded / progressEvent.total * 100 | 0);
          listData.loaded = this.formatBytes(progressEvent.loaded)
          listData.total = this.formatBytes(progressEvent.total)
          // this.progress.val = Number(percent.toFixed(2))
          this.uploading = true
        },  signal).then(res => {
          if(res.code == 0) {
            listData.status = "success"
            bus.$emit("refreshDataList", {
              pageSize: 10,
              pageIndex: 1,
              isFirst: true,
              dataType: 'add'
            });
          }else {
            listData.status = "error"
            listData.faillMsg = res.msg
          }
        }).catch(e => {
          // abort时，会进入catch,e.message ==='canceld'
          if(e.message =='canceled') {
            this.$message.warning("数据上传已被手动终止")
          }
          listData.status = "error"
          listData.faillMsg = e.response?.data?.msg
        }).finally(() => {
          this.uploading = false
        })
      }
    },
    formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    /**
     * 从上传的数据中获取当前上传控件展示所需要的有用信息
     * @param {*} data 
     */
    buildUploadList (type, data = {}) {
      if(type === 'uploadDataset') {
        const { dlName } = data
        return {
          name: dlName,
          percent: 0,
          loaded: 0,
          total: 0,
          faillMsg: '',
          status: '', //上传状态
          typeText: '数据集',
        }
      }
    },
    doCloseBox() {
      // 如果有上传中的，则abort中止
      if(this.uploading) {
        this.$confirm({
          title: '全部取消上传',
          content: '列表中有未上传完成的文件，确定要放弃上传吗？',
          okText: '取消上传',
          cancelText: '取消',
          onOk: () => {
            this.controllers.forEach(c => {
              c.abort()
            })
            this.$uploadBox().$close()
          },
          onCancel: () => {}
        });
      }else {
        this.$uploadBox().$close()
      }
    },
    // 强制关闭
    forceClose() {
      // 中止上传
      this.controllers.forEach(c => {
        c.abort()
      })
      this.$uploadBox().$close()
    }
  },
  beforeDestroy() {
    bus.$off('closeUploadBox', this.forceClose)
  },
  created() {
    // 监听关闭事件,目前仅在用户登出时触发
    bus.$on('closeUploadBox', this.forceClose)
  }
};
</script>

<style scoped lang="less">
.upload-box {
  width: 300px;
  position: fixed;
  bottom: 20px;
  right: 30px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  background-color: #fff;
  color: #444444;
  .header-box {
    height: 40px;
    line-height: 40px;
    font-size: 16px;
    display: flex;
    justify-content: space-between;
    cursor: pointer;
    padding: 0 10px;
    border-radius: 10px;
    &:hover {
      background-color: #f1f1f1;
    }
    span{
      line-height: 40px;
    }
    .close-button {
      font-size: 16px;
    }
  }
  .body-box {
    width: 100%;
    height: 400px;
    overflow: auto;
    .list-block {
      height: 50px;
      display: flex;
      flex-direction: column;
      margin-bottom: 5px;
      .list-main {
        height: 32px;
        width: 100%;
        display: flex;
        // font-size: 12px;
        .list-type{
          width: 40px;
          text-align: center;
          line-height: 36px;
          font-size: 18px;
        }
        .list-info {
          flex: 1;
          .list-title {
            font-size: 13px;
          }
          .list-desc {
            color: #d4d0d0;
            font-size: 11px;
          }
        }
      }
      /deep/ .ant-progress {
        font-size: 8px;
        line-height: 1;
      }
      /deep/ .ant-progress-bg {
        height: 3px!important;
      }
    }
  }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}
</style>
