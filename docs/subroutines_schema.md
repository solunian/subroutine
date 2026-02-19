# subroutines table

subroutine_type enum:

- directory
  - summit (long-term)
  - blaze (short-term)
- atomic
  - dot (increment)
  - semaphore (increment/decrement)
  - loop (percentage)
  - torch (tap on/off)
  - nudge (reminder)
  - ping (remind friend)
  - ledger (punish/reward with friend)
  - journal

## required fields

- id
- user_id: uuid -> auth.users fkey
  - cascade del
- type
- title

- visiblity
  - view type: private (default), friends, public
  - editable []
  - viewable []
  - banned []

## nullable fields

- description
- deadline
