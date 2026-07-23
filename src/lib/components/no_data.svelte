<script lang="ts">
  let { height }: { height: number } = $props();
</script>

<div
  class="relative flex h-full w-full items-center justify-center overflow-hidden bg-purple-300/50"
  style="height: {height}px;">
  <div class="scanlines"></div>

  <!-- cute looking SMPTE style color bars like old tvs -->
  <div class="message w-full max-w-xs">
    <div class="flex h-4">
      <span class="w-full bg-white/50"></span>
      <span class="w-full bg-yellow-500/50"></span>
      <span class="w-full bg-cyan-500/50"></span>
      <span class="w-full bg-green-500/50"></span>
      <span class="w-full bg-fuchsia-500/50"></span>
      <span class="w-full bg-red-500/50"></span>
      <span class="w-full bg-blue-500/50"></span>
    </div>
    <div class="bg-black px-4 text-center font-mono text-2xl font-bold text-white">no data</div>
    <div class="flex h-4">
      <span class="w-full bg-blue-500/50"></span>
      <span class="w-full bg-black/50"></span>
      <span class="w-full bg-fuchsia-500/50"></span>
      <span class="w-full bg-black/50"></span>
      <span class="w-full bg-cyan-500/50"></span>
      <span class="w-full bg-black/50"></span>
      <span class="w-full bg-white/50"></span>
    </div>
  </div>
</div>

<style>
  .scanlines {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 0) 50%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.2)
    );
    background-size: 100% 8px;
    animation: scroll-lines 16s linear infinite;
    pointer-events: none;
  }

  @keyframes scroll-lines {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 0 100vh;
    }
  }

  .message {
    animation: bounce 2s infinite ease-in-out;
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }
</style>
