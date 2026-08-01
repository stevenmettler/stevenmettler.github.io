import { notFound, redirect } from "next/navigation";
import { auth, isOwnerSession } from "@/auth";

export default async function GoalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Signed out gets a chance to sign in; anyone else is not told this exists.
  if (!session) redirect("/api/auth/signin?callbackUrl=/goals");
  if (!isOwnerSession(session)) notFound();

  return children;
}
