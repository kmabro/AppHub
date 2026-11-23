import { z } from "zod";

export const httpUrl = z
  .string()
  .url()
  .max(500)
  .refine((value) => /^https?:\/\//i.test(value), {
    message: "Only http and https links are allowed",
  });
