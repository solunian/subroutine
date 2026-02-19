# profiles table

- id: uuid -> auth.users fkey
  - cascade del
- username (unique, char_length >= 3)
- updated_at
- banner
- bio

- points
- arcs
- visibility: private (default), friends, public
