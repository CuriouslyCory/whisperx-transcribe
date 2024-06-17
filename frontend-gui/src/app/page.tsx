import Link from "next/link";
import { getServerAuthSession } from "~/server/auth";

export default async function Home() {
  const session = await getServerAuthSession();

  return (
    <main className="mx-10 mt-6">
      <Link href="/conversation/1" className="hover:underline">
        Conversation viewer
      </Link>
    </main>
  );
}
