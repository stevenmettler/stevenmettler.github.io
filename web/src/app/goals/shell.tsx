import Link from "next/link";
import { SiteBackground } from "../site-background";
import { ThemeToggle } from "../theme-toggle";
import styles from "./goals.module.css";

/** The site frame shared by the goals index and each goal's detail page. */
export function GoalsShell({
  title,
  note,
  breadcrumb,
  children,
}: {
  title: string;
  note?: string;
  breadcrumb?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`sm-site ${styles.page}`}>
      <SiteBackground />
      <div className="sm-sheet">
        <nav className="sm-nav">
          <Link href="/">steven mettler</Link>
          <div className="sm-nav-links">
            {breadcrumb}
            <Link href="/">home</Link>
            <ThemeToggle />
          </div>
        </nav>

        <header className={styles.header}>
          <h1>{title}</h1>
          {note ? <p className={styles.headerNote}>{note}</p> : null}
        </header>

        {children}

        <footer className="sm-footer">
          <span>&copy; 2026 steven mettler</span>
          <span>eastern time</span>
        </footer>
      </div>
    </div>
  );
}
