<template>
  <div class="banner">
    <div class="logo">
      <img :src="require('@/assets/tcl.jpg')" alt="Logo">
    </div>
    <h1 class="title">
      算法平台及图形化编程开发系统
    </h1>
  </div>
</template>

<style>
/* 在这里定义你的样式 */
.banner {
  display: flex;
  align-items: center;
  vertical-align: center;
  justify-content: space-between;
  padding: 5px;
  /* border-bottom: 10px solid #f7f9fb; */
  height: 50px;
}

.logo img {
  max-width: 200px; /* 根据实际需要设置logo图片的最大宽度 */
}

.title {
  /* 设置标题居中样式 */
  margin: 0 auto;
  font-size: 30px;
  font-weight: 600;
}
</style>