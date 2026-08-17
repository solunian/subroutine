# subroutine

subroutine is a web app for recording routines and reviewing how they change over time. each routine is stored as a stream of timestamped entries, which the app turns into charts, activity grids, totals, and history.

## tracker types

- **dot** — log a completion with one click.
- **semaphore** — record a numeric value that can increase or decrease.
- **torch** — start and stop a timer for activities such as work, practice, or any duration; see total, daily, and weekly time.

## features

- email and password authentication
- a dashboard grouped by tracker type
- optional descriptions and deadlines for routines
- optimistic entry updates, entry history, and activity visualizations
- user profiles, profile search, and friend requests
- editable profile details and light/dark themes

## project status

subroutine is in early development. `dot`, `semaphore`, and `torch` are the currently implemented tracker types. additional types appear in the interface but are placeholders.

## built with

[SvelteKit](https://svelte.dev/), [Supabase](https://supabase.com/), [Tailwind CSS](https://tailwindcss.com/), and [D3](https://d3js.org/).
