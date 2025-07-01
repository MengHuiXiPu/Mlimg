<template>
  <div v-show="bbox.isActive">
    <PanelButton name="Delete BBox" @click="bbox.deleteBbox" />
    <PanelToggle name="Auto Select Color" v-model="bbox.color.auto" />
    <PanelToggle
      v-show="bbox.color.auto"
      name="Only Black or White"
      v-model="bbox.color.blackOrWhite"
    />
    <PanelInputString
      name="Stroke Color"
      v-model="bbox.polygon.pathOptions.strokeColor"
    />
  </div>
</template>

<script>
import PanelButton from "./PanelButton";
import PanelToggle from "./PanelToggle";
import PanelInputString from "./PanelInputString";
import PanelInputNumber from "./PanelInputNumber";

export default {
  name: "BBoxPanel",
  components: { PanelButton, PanelToggle, PanelInputString, PanelInputNumber },
  props: {
    bbox: {
      type: Object,
      required: true
    }
  }
};
</script>
