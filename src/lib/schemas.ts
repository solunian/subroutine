import * as v from "valibot";
import { Constants } from "$lib/types/database.types";

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

// supabase defined enums
export const SubroutineType = v.picklist(Constants.public.Enums.subroutine_type);

export const RelationshipStatusType = v.picklist(Constants.public.Enums.relationship_status_type);
