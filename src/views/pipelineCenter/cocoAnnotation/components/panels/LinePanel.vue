<template>
  <div v-show="line.isActive">
    <PanelButton name="Close Line" @click="line.complete" />
    <PanelButton name="Delete Line" @click="line.deleteLine" />
    <PanelToggle name="Guidance" v-model="line.line.guidance" />
    <PanelToggle name="Auto Select Color" v-model="line.color.auto" />
    <PanelToggle
      v-show="line.color.auto"
      name="Only Black or White"
      v-model="line.color.blackOrWhite"
    />
    <PanelInputString
      name="Stroke Color"
      v-model="line.line.pathOptions.strokeColor"
    />
    <PanelInputNumber
      name="Auto Complete Distance"
      min="0"
      max="1000"
      step="5"
      v-model="line.line.completeDistance"
    />
    <PanelInputNumber
      name="Min Distance"
      min="0"
      max="500"
      step="2"
      v-model="line.line.minDistance"
    />
  </div>
</template>

<script>
import PanelButton from "./PanelButton";
import PanelToggle from "./PanelToggle";
import PanelInputString from "./PanelInputString";
import PanelInputNumber from "./PanelInputNumber";

export default {
  name: "LinePanel",
  components: { PanelButton, PanelToggle, PanelInputString, PanelInputNumber },
  props: {
    line: {
      type: Object,
      required: true
    }
  }
};
</script>
