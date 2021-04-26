<template>
  <div class="loading">
    <inline-svg :src="require('@/statics/images/loading-spin.svg')"
       fill="#3D3F4A"
       width="32" />
      {{ $t('loading') }}
  </div>
</template>

<script>
export default {
  name: "Loading"
}
</script>

<style>
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding-bottom: 16rem;
  svg {
    margin-bottom: 2rem;
  }
}
</style>
