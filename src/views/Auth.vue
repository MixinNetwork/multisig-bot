<template>
  <div class="auth">
    <inline-svg :src="require('@/assets/images/loading-spin.svg')"
       fill="#3D3F4A"
       width="32" />
      {{ $t('loading') }}
  </div>
</template>

<style lang="scss" scoped>
.auth {
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

<script>
import InlineSvg from 'vue-inline-svg'
//import { ApiPostAuthenticate } from '@/api'

export default {
  name: 'Auth',
  components: {
    InlineSvg
  },

  /*
  async mounted() {
    let token = await ApiPostAuthenticate(this.$route.query.code)
    console.log("token", token)
  }
   */
}
</script>
