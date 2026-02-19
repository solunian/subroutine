# entries table

## required fields

- id
- subroutine_id: uuid -> subroutines fkey
  - cascade del
- created_at

## nullable fields

- location
- title (128 character limit utf-8, max 2^9 bytes)
- description (1024 character limit utf-8, max 2^12 bytes)
- ascii_art
- data: jsonb
