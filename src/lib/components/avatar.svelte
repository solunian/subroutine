<!-- src/routes/account/Avatar.svelte -->
<script lang="ts">
  import type { SupabaseClient } from "@supabase/supabase-js";

  interface Props {
    size?: number;
    url?: string;
    supabase: SupabaseClient;
    onupload?: () => void;
  }
  let { size = 10, url = $bindable(), supabase, onupload }: Props = $props();

  let avatar_url: string | null = $state(null);
  let uploading = $state(false);
  let files: FileList | undefined = $state();

  const download_image = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from("avatars").download(path);

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);
      avatar_url = url;
    } catch (error) {
      if (error instanceof Error) {
        console.log("Error downloading image: ", error.message);
      }
    }
  };

  const upload_avatar = async () => {
    try {
      uploading = true;

      if (!files || files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${Math.random()}.${fileExt}`;

      const { error } = await supabase.storage.from("avatars").upload(filePath, file);

      if (error) {
        throw error;
      }

      url = filePath;
      setTimeout(() => {
        onupload?.();
      }, 100);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      uploading = false;
    }
  };

  $effect(() => {
    if (url) download_image(url);
  });
</script>

<div>
  {#if avatar_url}
    <img src={avatar_url} alt="avatar_url" style="height: {size}em; width: {size}em;" />
  {:else}
    <div style="height: {size}em; width: {size}em;"></div>
  {/if}
  <input type="hidden" name="avatar_url" value={url} />

  <div style="width: {size}em;" class="relative">
    <label for="single">{uploading ? "uploading" : "upload"}</label>
    <input
      id="single"
      class="absolute hidden"
      type="file"
      accept="image/*"
      bind:files
      onchange={upload_avatar}
      disabled={uploading} />
  </div>
</div>
