<script lang="ts">
  let { data } = $props();
</script>

<div class="flex flex-col gap-4">
  <div class="text-xl">@{data.username}</div>

  <div class="text-lg">{data.profile.name}</div>

  <!-- nullable -->
  {#if data.profile.bio}
    <div>{data.profile.bio}</div>
  {/if}
</div>
