<template>
  <div class="loading-screen">
    <div class="spinner">
      <div class="double-bounce1"></div>
      <div class="double-bounce2"></div>
    </div>
  </div>
</template>
<script>

export default {
  created() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      console.log("urlParams", urlParams)
      const code = urlParams.get('code');
      console.log("code", code)
      if (code) {
        this.exchangeCodeForToken(code);
      }
    }catch (e) {
      const hostname = window.location.hostname;
      if (hostname === "ai.csot.tcl.com" || hostname === "testai.csot.tcl.com") {
        this.$router.push({ path: "/ts/login" }).catch(err => {
          console.log(err);
        });
        this.$message.warning('SSO登录失败，切换至逃生通道登录');
      } else {
        this.$router.push({ path: "/local/login" }).catch(err => {
          console.log(err);
        });
        this.$message.warning('SSO登录失败，切换至本地登录');
      }
    }

  },
  methods: {
    exchangeCodeForToken(code) {
      this.$store
          .dispatch("SSOLogin", code)
          .then(() => {
            // this.loading = false;
            // this.$router.push({ path: '/' });
            this.$router
                .push({
                  path: "/",
                })
                .catch((err) => {
                  console.log(err);
                });
          })
          .catch((err) => {
            this.$message.error('用户未授权，请联系管理员');
            // this.loading = false;
            // this.getCode();
            this.$router
                .push({
                  path: "/hello",
                })
                .catch((err) => {
                  console.log(err);
                })
          });
    }
  }
}
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  //background-color: #282c34;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.spinner {
  width: 100px;
  height: 100px;
  position: relative;
}

.double-bounce1, .double-bounce2 {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #61dafb;
  opacity: 0.6;
  position: absolute;
  top: 0;
  left: 0;
  animation: bounce 2.0s infinite ease-in-out;
}

.double-bounce2 {
  animation-delay: -1.0s;
}

@keyframes bounce {
  0%, 100% {
    transform: scale(0.0);
  }
  50% {
    transform: scale(1.0);
  }
}

.loading-text {
  color: #ffffff;
  font-size: 1.5em;
  margin-top: 20px;
  animation: fadeIn 2s infinite alternate;
}

@keyframes fadeIn {
  from {
    opacity: 0.5;
  }
  to {
    opacity: 1;
  }
}
</style>
