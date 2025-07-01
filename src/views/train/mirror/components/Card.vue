<template>
  <div :class="['card', isHidden ? 'hidden' : '']" @click="$parent.toMirrorDetail(data)">
    <div class="image">
      <img src="https://img13.360buyimg.com/n1/jfs/t1/137389/2/35415/135853/64d30e4aF806f20f9/eee4da4000863163.jpg" alt="">
    </div>
    <div class="article">
      <div class="top">
        <h2 class="name">{{data.imageName}}</h2>
        <P class="text">“文化是城市的灵魂。”习近平总书记2019年在上海考察时指出，要妥善处理好保护和发展的关系，注重延续城市历史文脉，像对待“老人”一样尊重和善待城市中的老建筑，保留城市历史文化记忆，让人们记得住历史、记得住乡愁，坚定文化自信，增强家国情怀。</P>
      </div>
      <div class="bottom" v-if="false">高级设置</div>
    </div>
  </div>
</template>

<script>
    export default {
        data () {
          return {

          }
        },
        props: {
          isHidden: Boolean,
          data: Object
        }
    }
</script>
<style>
@media (max-width: 1350px) {
  .main>.card {
    width: 32% !important;
  }
}
</style>
<style lang="scss" scoped>
.card {
  min-width: 250px;
  margin: 6px 0 6px 0;
  width: 24%;
  height: 160px;
  background: #daeaff;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-content: center;
  &.hidden {
    opacity: 0;
  }
  .image {
      width: 110px;
      height: 110px;
      background: skyblue;
      img {
        width: 100%;
        height: 100%;
        border-radius: 8px;
      }
  }
  .article {
    margin-left: 8px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 0;
    .top {
      flex: 1;
      margin-bottom: 8px;
      width: 100%;
      .name {
        font-size: 16px;
        color: #333;
        font-weight: 600;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 4px;
      }
      .text {
        color: #9195a3;
        font-size: 12px;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;    
        -webkit-box-orient: vertical;    
        -webkit-line-clamp: 5; 
        margin: 0;

      }
    }
    .bottom {
      width: 100%;
      color: #3d41ff;
      font-size: 12px;
      cursor: pointer;
      text-align: right;
    }
  }
}
</style>