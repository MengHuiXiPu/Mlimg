export default {
  methods: {
    axiosReqestError(message, title) {
      // let options = {
      //   progressBar: true,
      //   positionClass: "toast-bottom-left"
      // };
      
      this.$message.error(message)
      // this.$toastr.error(message, title, options);
    },
    axiosReqestSuccess(message, title) {
      // let options = {
      //   progressBar: true,
      //   positionClass: "toast-bottom-left"
      // };
      this.$message.success(message)
      // this.$toastr.success(message, title, options);
    }
  }
};
