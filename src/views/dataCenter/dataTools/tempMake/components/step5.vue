<template>
  <div class="step5-wrapper">
    <a-spin :spinning="spinning">
      <div class="step5-content">
        <a-button type="primary" size="medium" @click="callGenerateDat" :loading="spinning">生成DAT模版文件</a-button>
        <template v-if="datFile.name">
           <div class="desc-item">
            <span class="desc-label">dat文件</span>
            <span class="desc-text"> {{ datFile.name }}
              <a-tooltip title="点击下载">
                <a-icon type="download" class="download-icon" @click="downLoadDat" />
              </a-tooltip>
            </span>
          </div>
          <div class="desc-item">
            <span class="desc-label"> dat文件最近生成时间</span>
            <span class="desc-text">{{ datFile.createdAt | moment}}</span>
          </div>
        </template>
        <a-empty style="line-height: 30;" :image="simpleImage" description="暂无DAT 信息，请点击生成按钮生成" v-else></a-empty>
      </div>
    </a-spin>
  </div>
</template>

<script>
import { saveAs } from "file-saver";
import { Empty } from 'ant-design-vue';
import { downloadDatFile, generateDat } from "@/api/tempMake.js";
export default {
  name: 'step5',
  data() {
    return {
      spinning: false,
      downloadIng: false,
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
      datFile: {
        name: '',
        createdAt: ''
      }
    }
  },
  props: {
    tempData: {
      type: Object,
      default: () => ({})
    },
  },
  methods: {
    callGenerateDat() {
      if (this.datFile.name) { //已存在要二次确认
        this.$confirmEle(`该操作会重新生成dat文件，请确认`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }).then(() => {
          this.generateDatFile()
        }).catch(() => {
        });
      } else {
        this.generateDatFile()
      }
    },
    generateDatFile() {
      this.spinning = true
      generateDat(this.tempData.id).then(res => {
        if (res.code === 0) {
          this.$message.success('生成成功')
          // 更新名称和时间
          this.datFile.name = res.data.name
          this.datFile.createdAt = res.data.createdAt
        }
      }).catch(err => {
        this.$message.error(err.response?.data?.msg || '生成失败')
      }).finally(() => {
        this.spinning = false
      })
    },
    downLoadDat() {
      if (this.downloadIng) {
        return this.$message.warning("资源传输中，请稍后...")
      }
      this.downloadIng = true
      this.$message.warning("资源已开始传输，请稍后...")
      downloadDatFile(this.tempData.id).then(res => {
        const blob = new Blob([res], { type: "application/zip" });
        saveAs(blob, `${this.datFile?.name || this.tempData.name}.zip`);
        // 已下载
        this.$message.success('已完成下载')
      }).finally(() => {
        this.downloadIng = false
      })
    },
  },
  activated() {
    this.datFile.name = this.tempData?.datFile?.name || ""
    this.datFile.createdAt = this.tempData?.datFile?.createdAt || ""
  },
}
</script>

<style lang="less" scoped>
.step5-wrapper {
  height: 100%;
  width: 100%;
  .step5-content {
    width: 500px;
    height: calc(100vh - 110px);
    padding: 100px 0;
    margin: 0 auto;
  }
}
.desc-item {
  display: flex;
  align-items: center;
  margin: 20px 0;
  .desc-label {
    width: 150px;
    color: #303133;
    font-size: 14px;
    font-weight: 700;
  }
  .desc-text {
    color: #606266;
    font-size: 14px;
  }
  .download-icon {
    margin-left: 10px;
    font-size: 18px;
    color: #409eff;
    cursor: pointer;
  }
}
</style>