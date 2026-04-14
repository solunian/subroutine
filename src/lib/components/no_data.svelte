<script lang="ts">
  let { height }: { height: number } = $props();
</script>

<div class="cute-tv-screen w-full" style="height: {height}px;">
  <div class="noise"></div>
  <div class="scanlines"></div>
  <div class="message">~ no data ~</div>
</div>

<style>
  /* 1. The Playful Container */
  .cute-tv-screen {
    position: relative;
    width: 100%;
    height: 100vh;
    /* Swapped to a softer, dustier, less bright pastel gradient */
    background: linear-gradient(135deg, #dbc2e8 0%, #dbc2e8 100%);
    overflow: hidden;

    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* 2. The Softer Noise Layer */
  .noise {
    position: absolute;
    top: -50%;
    left: -50%;
    right: -50%;
    bottom: -50%;
    width: 200%;
    height: 200vh;
    background: transparent
      url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E');

    opacity: 0.12;
    mix-blend-mode: overlay;

    animation: playful-jitter 0.4s infinite steps(4);
    pointer-events: none;
  }

  /* 3. Chunky, slow jitter */
  @keyframes playful-jitter {
    0% {
      transform: translate(0, 0);
    }
    25% {
      transform: translate(1%, 2%);
    }
    50% {
      transform: translate(-2%, 1%);
    }
    75% {
      transform: translate(1%, -1%);
    }
    100% {
      transform: translate(0, 0);
    }
  }

  /* 4. Soft, scrolling scanlines */
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
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.15)
    );
    background-size: 100% 8px;
    animation: scroll-lines 8s linear infinite;
    pointer-events: none;
    z-index: 10;
  }

  @keyframes scroll-lines {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 0 100vh;
    }
  }

  /* 5. Fun text styling (Updated) */
  .message {
    font-family: "JetBrains Mono", sans-serif;
    color: white;
    font-size: 1.5rem; /* Reduced from 3rem */
    font-weight: bold;
    /* Softened the shadow to match the less bright background */
    text-shadow: 2px 2px 0px #dbc2e8;
    z-index: 20;
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
