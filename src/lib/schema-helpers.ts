import { z } from "zod";

// Date fields need to accept both Date objects and ISO strings (for JSON serialization)
export const coercedDate = z.union([
  z.date(),
  z.string().pipe(z.coerce.date()),
]);
