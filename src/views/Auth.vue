<template>
  <div>
    <inline-svg :src="require('@/assets/images/loading-spin.svg')"
      fill=" #3D3F4A"
      width="32" />
      {{ message }}
  </div>
</template>

<script>
import InlineSvg from 'vue-inline-svg'
import mixin from 'bot-api-js-client'

console.log(mixin.util.challenge())

export default {
  name: 'Auth',
  components: {
    InlineSvg
  },
  data() {
    return {
      message: 'Hello',
    }
  }
}
</script>
