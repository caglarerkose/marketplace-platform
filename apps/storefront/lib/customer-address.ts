import { z } from "zod";

export const addressSchema = z.object({
  title: z.string().trim().min(2).max(60),
  recipientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(10).max(30),
  city: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  neighborhood: z.string().trim().max(120).optional(),
  addressLine: z.string().trim().min(10).max(500),
  postalCode: z.string().trim().max(20).optional(),
});
