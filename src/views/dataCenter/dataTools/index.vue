<template>
  <div class="data-tools-container">
    <el-card shadow="hover" class="card-item" :span="8" :body-style="{ padding: '0px' }">
      <img :src="tempMakeImg" class="card-image">
      <div class="card-content">
        <div class="text-center">模版制作工具 - 周期图拼接</div>
        <div class="text-center">
          <el-button type="text" @click="goDetailTool('templateMake')" size="medium">点击进入</el-button>
        </div>
      </div>
    </el-card>
    <el-card shadow="hover" class="card-item" :span="8" :body-style="{ padding: '0px' }">
      <img :src="atsMapImg" class="card-image" style="padding: 18px 30px;background-color: #f5f5f5;">
      <div class="card-content">
        <div class="text-center">ATS MAP参数调优工具</div>
        <div class="text-center">
          <el-button type="text" @click="goDetailTool('ats')" size="medium">点击进入</el-button>
        </div>
      </div>
    </el-card>
    <!-- <el-card shadow="hover" class="card-item" :span="8" :body-style="{ padding: '0px' }">
      <img :src="ocrImg" class="card-image">
      <div class="card-content">
        <div class="text-center">模版制作工具 - OCR字符库</div>
        <div class="text-center">
          <el-button type="text" @click="goDetailTool('ocr')" size="medium">点击进入</el-button>
        </div>
      </div>
    </el-card> -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      tempMakeImg: require("@/assets/images/tempMake.png"),
      atsMapImg: require("@/assets/images/ATSMap.jpg"),
      ocrImg: require("@/assets/images/tempMake.png"),
    }
  },
  methods: {
    goDetailTool(name) {
      name === 'templateMake' && this.$router.push('/dataCenter/dataTools/templateMake')
      name === 'ats' && this.$router.push('/dataCenter/dataTools/ATSMap')
      name === 'ocr' && this.$router.push('/dataCenter/dataTools/ocrCharLib')
    }
  },
}
</script>

<style lang="less" scoped>
.data-tools-container {
  display: flex;
  .card-item {
    width: 250px;
    height: 200px;
    margin: 10px;
    // cursor: pointer;
  }
}

.card-image {
  width: 100%;
  height: 140px;
}
.card-content {
  text-align: center;
  padding-top: 5px;
}
.text-center {
  text-align: center;
}
</style>