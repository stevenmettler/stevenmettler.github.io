import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/reader");
  }

  return children;
}
