/**
 * Old Listing Route Redirect
 *
 * Redirects from /listing/:id to /listings/:id (new canonical route).
 * Kept for backward compatibility with old URLs.
 */

import { redirect } from "next/navigation";

interface OldListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function OldListingRedirect({
  params,
}: OldListingPageProps) {
  const { id } = await params;
  redirect(`/listings/${id}`);
}