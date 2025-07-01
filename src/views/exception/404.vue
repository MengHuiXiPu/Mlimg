<template>
  <div v-if="isSSOLogin">
    <Hello></Hello>
  </div>
  <div v-else><exception-page type="404" /></div>
</template>

<script>
import { ExceptionPage } from '@/components'
import Hello from "@/views/Hello.vue";

export default {
  components: {
    Hello,
    ExceptionPage
  },
  computed: {
    isSSOLogin() {
      return this.$store.state.user.user.roles[0].name == 'SSOLogin'
    }
  }
}
</script>

<style scoped>

</style>
