import * as v from "valibot";

export const NormalStrSchema = v.pipe(v.string("invalid string"), v.normalize());

export const TrimNormalStrSchema = v.pipe(NormalStrSchema, v.trim());

export const EmailSchema = v.pipe(TrimNormalStrSchema, v.email("invalid email"));

export const PasswordSchema = v.pipe(
  TrimNormalStrSchema,
  v.minGraphemes(6, "invalid password: must have a length greater than 6")
);

// idk why this didnt work for nullable() like with the TrimNormalStrSchema. wtf...
export const URLSchema = v.pipe(TrimNormalStrSchema, v.url("invalid url"));

export const DateTimeSchema = v.pipe(TrimNormalStrSchema, v.isoDateTime("invalid iso datetime"));

export const TimestampSchema = v.pipe(TrimNormalStrSchema, v.isoTimestamp("invalid iso timestamp"));
