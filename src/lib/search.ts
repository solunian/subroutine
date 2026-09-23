import * as v from "valibot";

export const SearchResultSchema = v.object({
  users: v.array(
    v.object({
      id: v.string(),
      username: v.string(),
      name: v.nullable(v.string()),
    })
  ),
  has_more: v.boolean(),
  next_offset: v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0))),
});

export type SearchResult = v.InferOutput<typeof SearchResultSchema>;
