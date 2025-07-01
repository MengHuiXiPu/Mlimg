<template>
  <div class="notify-container">
    <span v-for="(item, index) in content" :key="index" class="notify-item">
      {{item}}
      <br/>
    </span>
  </div>
</template>
<script>
import {axios} from "@/utils/request";

export default {
  name: "alarmRecordDetail",
  mounted() {
    let originId = this.$route.query.originId;
    this.getAlarmContentByOriginId(originId)

  },
  data(){
    return{
      content: []
    }
  },
  methods: {
    getAlarmContentByOriginId(originId){
      axios({
        url: '/api/v1/alert/notify/detail/'+ originId,
        method: 'get'
      }).then(res => {
        const parts = res.data.content.split('】')
        for (let i = 0; i < parts.length; i ++) {
          if (i !== (parts.length - 1)){
            this.content.push(parts[i] + '】');
          }
        }
        console.log('this.content', this.content)
      })
    }
  }
}
</script>
<style scoped>
.notify-container{
  font-size: 15px;
}
</style>