<template>
  <div class="guide">
    <div class="tips">
      <img src="@/statics/images/tips.svg" alt="tips" />
    </div>
    <div class="body">
      <ul v-html="$t('guide')"></ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.guide {
}
.tips {
  text-align: center;
  padding-top: 14rem;
  margin-bottom: 6rem;
}
.body {
  padding: 0 2.4rem;
}
ul {
  padding-left: 1rem;
}
::v-deep(.body) {
  li {
    margin-bottom: 1rem;
    position: relative;
    &:before {
      content: "";
      position: absolute;
      left: -1rem;
      top: .8rem;
      background: #333;
      display: inline-block;
      width: .4rem;
      height: .4rem;
      border-radius: .2rem;
    }
  }
}
</style>
