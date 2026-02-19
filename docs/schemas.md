# user table

- profile image
- banner
- bio
- points
- arcs
- visibility: private (default), friends, public
- -> to all subroutines

# subroutine table

types:

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

# entry table

all items must have:

- uuid (owner)
  - only owner can delete!
- time
- location (nullable)
- visiblity
  - view type: private (default), friends, public
  - editable set {}
  - viewable set {}
  - banned set {}
- title (nullable, 128 character limit utf-8, max 2^9 bytes)
- description (nullable, 1024 character limit utf-8, max 2^12 bytes)
- ascii art (nullable)
- ...(subroutine specific data)...
