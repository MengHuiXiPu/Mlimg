<template>
  <iframe class="iframe-page" v-if="url" :src="url"></iframe>
</template>

<script>
  export default {
    name: "IframePage",
    computed: {
      url () {
        return this.$route.meta.url
      }
    }
  }
</script>

<style scoped>
  .iframe-page {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    display: block;
    width: 100%;
    height: 100%;
    border: none;
  }
</style>