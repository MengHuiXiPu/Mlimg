<template>
  <a-breadcrumb class="breadcrumb">
      <!--呈现一组面包屑导航-->
      <a-breadcrumb-item v-for="(item, index) in breadList" :key="item.path">
          <router-link v-if="item.path != path && index != 1"
                       :to="{ path: item.path === '' ? '/' : item.path }">{{ item.meta.title }}</router-link>
          <span v-else>{{ item.meta.title }}</span>
      </a-breadcrumb-item>
  </a-breadcrumb>
</template>

<script>
export default {
  data () {
    return {
      path: '',
      breadList: []
    }
  },
  created () {
    this.getBreadcrumb()
  },
  methods: {
    getBreadcrumb () {
      this.breadList = []
      // this.breadList.push({name: 'index', path: '/dashboard/', meta: {title: '首页'}})

      this.path = this.$route.path
      this.$route.matched.forEach(item => {
        // item.name !== 'index' && this.breadList.push(item)
        this.breadList.push(item)
      })
    }
  },
  watch: {
    $route () {
      this.getBreadcrumb()
    }
  }
}
</script>

<style scoped>
</style>
