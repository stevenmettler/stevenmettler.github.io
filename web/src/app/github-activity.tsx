const GITHUB_USERNAME = "stevenmettler";
const ACCENT_HEX = "d05a3f";

type GitHubEvent = {
  id: string;
  type: string;
  repo: { name: string };
  created_at: string;
};

function describeEvent(event: GitHubEvent): string | null {
  const repo = event.repo.name.split("/")[1] ?? event.repo.name;
  switch (event.type) {
    case "PushEvent":
      return `pushed to ${repo}`;
    case "PullRequestEvent":
      return `opened a PR in ${repo}`;
    case "CreateEvent":
      return `created ${repo}`;
    case "WatchEvent":
      return `starred ${repo}`;
    case "IssuesEvent":
      return `opened an issue in ${repo}`;
    case "ForkEvent":
      return `forked ${repo}`;
    case "PublicEvent":
      return `made ${repo} public`;
    default:
      return null;
  }
}

export async function GitHubActivity() {
  let events: GitHubEvent[] = [];

  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/events/public`,
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 3600 },
      }
    );
    if (res.ok) {
      events = await res.json();
    }
  } catch {
    // GitHub activity is decorative — never let a failed fetch break the page.
  }

  const recent = events
    .map((event) => ({
      id: event.id,
      text: describeEvent(event),
      date: event.created_at,
    }))
    .filter(
      (event): event is { id: string; text: string; date: string } =>
        event.text !== null
    )
    .slice(0, 5);

  return (
    <div className="sm-github-activity">
      <img
        src={`https://ghchart.rshah.org/${ACCENT_HEX}/${GITHUB_USERNAME}`}
        alt={`${GITHUB_USERNAME}'s GitHub contribution graph`}
        className="sm-github-chart"
      />
      {recent.length > 0 && (
        <ul className="sm-github-events">
          {recent.map((event) => (
            <li key={event.id}>
              <span>{event.text}</span>
              <span className="sm-github-event-date">
                {new Date(event.date)
                  .toISOString()
                  .slice(0, 10)
                  .replaceAll("-", "·")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
