import Link from "next/link";
import { getApprovedGuestbookEntries } from "@/lib/guestbook";
import { submitGuestbookEntry } from "./actions";

export const dynamic = "force-dynamic";

export default async function GuestbookPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
  const entries = await getApprovedGuestbookEntries();

  return (
    <div className="sm-site">
      <div className="sm-sheet">
        <nav className="sm-nav">
          <Link href="/">steven mettler</Link>
          <div className="sm-nav-links">
            <Link href="/">&larr; back</Link>
          </div>
        </nav>

        <header className="sm-hero">
          <h1>GUESTBOOK</h1>
          <p className="sm-subtitle">leave a note</p>
        </header>

        {submitted && (
          <div className="sm-guestbook-notice">
            Thanks — your note is in for review and will show up here once
            approved.
          </div>
        )}

        <section className="sm-section">
          <div className="sm-section-label">SIGN</div>
          <div className="sm-section-content">
            <form action={submitGuestbookEntry} className="sm-guestbook-form">
              <input
                type="text"
                name="name"
                placeholder="name"
                maxLength={80}
                required
              />
              <textarea
                name="message"
                placeholder="say something..."
                maxLength={500}
                required
              />
              <button type="submit">sign</button>
            </form>
          </div>
        </section>

        <section className="sm-section">
          <div className="sm-section-label">ENTRIES</div>
          <div className="sm-section-content">
            {entries.length === 0 ? (
              <p>no entries yet &mdash; be the first!</p>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="sm-guestbook-entry">
                  <p>{entry.message}</p>
                  <span>&mdash; {entry.name}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <footer className="sm-footer">
          <span>&copy; 2026 steven mettler</span>
          <span>set in fragment mono</span>
        </footer>
      </div>
    </div>
  );
}
