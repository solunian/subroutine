<script lang="ts">
  import { enhance } from "$app/forms";

  let { data } = $props();
</script>

{#if data.subroutine}
  {data.subroutine.title}

  <form
    method="POST"
    action="?/delete_subroutine"
    use:enhance={() => {
      return async ({ update }) => {
        await update({ reset: false });
      };
    }}>
    <input hidden name="subroutine_id" value={data.subroutine.id} />
    <button>delete</button>
  </form>
{/if}
