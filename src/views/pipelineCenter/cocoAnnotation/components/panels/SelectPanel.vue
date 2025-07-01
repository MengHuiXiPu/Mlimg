<template>
  <div v-show="select.isActive">
    <PanelButton name="Clear Annotation" @click="clearAnnotation" />
    <PanelToggle name="Show Hover Text" v-model="select.hover.showText" />
  </div>
</template>

<script>
import PanelToggle from "./PanelToggle";
import PanelButton from "./PanelButton";
export default {
  name: "SelectPanel",
  components: { PanelToggle,PanelButton },
  props: {
    select: {
      type: Object,
      required: true
    }
  },
  methods: {
    clearAnnotation() {
      const categories = this.$parent.$refs.category
      if(categories && categories.length && this.$parent.current.category !== -1) {
        // let category = categories[this.$parent.current.category];
        //   let annotations = category.$refs.annotation
        //   console.log(annotations)
        this.$parent.clearArgs()
      }
    }
  },
};
</script>
