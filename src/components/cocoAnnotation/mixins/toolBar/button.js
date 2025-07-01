export default {
  // template:
  //   "<div><i v-tooltip.right='name' class='fa fa-x' :class='icon' :style='{ color: iconColor }' @click='click'></i><br></div>",
  data() {
    return {
      color: {
        enabled: "#555",
        active: "#0000ff",
        disabled: "gray"
      },
      iconColor: "",
      colorChanging: false,
      delay: 400
    };
  },
  methods: {
    click() {
      if (!this.disabled) {
        this.toggleAnimation();
        this.execute();
      }
    },
    toggleAnimation() {
      this.iconColor = this.color.active;
      this.colorChanging = true;
      setTimeout(() => {
        this.iconColor = this.color.enabled;
        this.colorChanging = false;
      }, this.delay);
    }
  },
  created() {
    this.iconColor = this.color.enabled;
  }
};
