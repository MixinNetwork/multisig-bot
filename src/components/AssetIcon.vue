<template>
  <div class="icon">
    <img :src="asset.icon_url" class="asset" />
    <img :src="asset.chain.icon_url" class="chain" />
  </div>
</template>

<script>
export default {
  name: 'AssetIcon',
  props: {
    asset: Object,
  }
}
</script>

<style lang="scss" scoped>
.icon {
  width: 4.2rem;
  position: relative;
  .chain {
    border: 2px solid white;
    border-radius: .8rem;
    width: 1.6rem;
    position: absolute;
    top: 60%;
    left: 0%;
    z-index: 99;
  }
}
</style>
