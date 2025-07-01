<template>
  <div class="avatar">
    <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
      <div class="avatar-wrapper">
        <img :src="avatar" class="user-avatar" />
        <i class="el-icon-caret-bottom" />
      </div>
      <el-dropdown-menu slot="dropdown">
        <router-link to="/user/center">
          <el-dropdown-item>
            个人中心
          </el-dropdown-item>
        </router-link>
        <span style="display: block;" @click="open">
            <el-dropdown-item divided>
              退出登录
            </el-dropdown-item>
          </span>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
// import avatarDefault from "@/assets/images/avatar.png";
import avatarDefault from "@/assets/avatar.png";
import {isURL} from "@/utils";
import {messageSource} from "@/api/appCenter";
export default {
  name: "Avatar",
  data(){
    return {
      // 被激活的链接地址
      // activePath: "",
      imageUrl: '',
    }
  },
  mounted() {
    // this.$nextTick(() => {
    //   console.log("layout-header height: ", this.$refs.header.offsetHeight);
    //   this.$emit("getHeaderHeight", this.$refs.header.offsetHeight);
    // });
    // this.imageUrl = require(`${system.logo}`);
    // console.log("this.imageUrl: ", this.imageUrl)
  },
  methods: {
    handler({ key }) {
      switch (key) {
        case 'logout':
          this.logout()
          break
      }
    },
    helper() {
      this.$message.warning('未定义业务跳转地址')
    },

    open() {
      this.$confirmEle('确定注销并退出系统吗？', '提示', {
        cancelButtonText: '取消',
        confirmButtonText: '确定',
        type: 'warning',
      }).then(() => {
            this.logout();
          }
      ).catch(()=>{})

    },
    logout() {
      this.$store.dispatch('LogOut').then(() => {
        this.$store.commit('request/resetMenus')
        this.$store.commit('RESET_USER')
        this.$router.push("/login");
      });
    },

  },
  computed: {
    avatar() {
      return this.$store.state.user.avatar || avatarDefault
    },
    username() {
      return this.$store.state.user.name
    },
    customButton() {
      return this.system.customButton || []
    },
    logo() {
      return require(system.logo + '')
    }
  }
}
</script>

<style lang="less" scoped>
.avatar {
  align-items: center;
  width: 36px;
  height: 36px;

  .button {
    display: flex;
    align-items: center;
    margin-right: 20px;
    cursor: pointer;
    transition: color .3s;

    &:hover {
      color: @primary-color;
    }

    &-icon {
      margin-right: 10px;
      font-size: 14px;
      transition: 0.3s;

      &.tcl-avatar {
        margin-right: 4px;
      }
    }
  }
}

.avatar:hover .button-icon {
  transform: scale(1.25);
  transition: 0.3s;
}

.avatar-container {
  margin-right: 30px;

  .avatar-wrapper {
    position: relative;
    .user-avatar {
      width: 36px;
      height: 36px;
      cursor: pointer;
      border-radius: 50%;
    }

    .el-icon-caret-bottom {
      position: absolute;
      top: 25px;
      right: -20px;
      font-size: 12px;
      cursor: pointer;
    }
  }
}

/deep/ .avatar-container .avatar-wrapper .el-icon-caret-bottom {
  display: none;
}
</style>

<style lang="less">
.header-dropdown {
  width: 160px;
  padding-bottom: 10px;
  box-shadow: 0 2px 6px 0 rgba(4, 12, 44, 0.25);
  border-radius: 4px;
  border: 1px solid #E6E7EA;
  background-color: #fff;

  .user-info {
    display: flex;
    align-items: center;
    height: 45px;
    padding-left: 8px;
    padding-right: 8px;
    border-bottom: 1px solid #F0F1F3;

    .user-name {
      flex: 1;
      width: 0;
      margin-left: 10px;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  .ant-menu {
    border-right: none;

    &-item {
      height: 30px;
      line-height: 30px;
      margin-top: 0;
      margin-bottom: 0 !important;

      &:hover {
        background: #F2F3F4;
      }
    }
  }
}
</style>