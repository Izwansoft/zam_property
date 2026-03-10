import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Payment Processing - Tenant Portal",
    description: "Processing your payment. Please wait while we confirm the transaction.",
    canonical: "/dashboard/tenant/bills/payment",
  });
}

export default function PaymentProcessingPage() {
  return <PaymentProcessingContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { PaymentProcessingContent } from "./content";
