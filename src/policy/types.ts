import { z } from "zod";

export const InvoiceSchema = z.object({
  invoiceId: z.string().min(1),
  vendorId: z.string().min(1),
  vendorName: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
  currency: z.string().length(3).default("USD"),
  poNumber: z.string().optional(),
  invoiceDate: z.string(), // ISO date
  dueDate: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        sku: z.string().optional(),
        description: z.string(),
        quantity: z.number().positive(),
        unitCents: z.number().int().nonnegative(),
      }),
    )
    .default([]),
  paymentRef: z.string().optional(), // opaque ref — never raw bank details
});

export type Invoice = z.infer<typeof InvoiceSchema>;

export const PolicySchema = z.object({
  approvedVendors: z.array(z.string()).min(1),
  autoApproveMaxCents: z.number().int().nonnegative().default(50_000), // $500
  requirePoAboveCents: z.number().int().nonnegative().default(100_000), // $1,000
  blockedVendors: z.array(z.string()).default([]),
  allowedCurrencies: z.array(z.string()).default(["USD"]),
  duplicateWindowDays: z.number().int().positive().default(30),
});

export type Policy = z.infer<typeof PolicySchema>;

export type Decision =
  | { status: "AUTO_APPROVE"; reasons: string[] }
  | { status: "NEEDS_HUMAN"; reasons: string[] }
  | { status: "REJECT"; reasons: string[] };

export type PaymentInstruction = {
  invoiceId: string;
  vendorId: string;
  amountCents: number;
  currency: string;
  /** Opaque payment profile marker resolved inside TEE — never plaintext PII */
  paymentProfilePlaceholder: string;
  decision: Decision;
  decidedAt: string;
};
