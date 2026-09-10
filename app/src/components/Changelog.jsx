import { useState, useEffect } from 'react';
import { t } from '../lib/i18n';

const REPO = 'Mnvv08/dsu-campus-nav';
const API = `https://api.github.com/repos/${REPO}/commits?per_page=8`;
const HISTORY_URL = `https://github.com/${REPO}/commits/main`;

function timeAgo(dateStr, lang) {
  const d = (Date.now() - new Date(dateStr).getTime()) / 1000;
  const units = [
    [31536000, 'y'], [2592000, 'mo'], [604800, 'w'],
    [86400, 'd'], [3600, 'h'], [60, 'm']
  ];
  for (const [secs, label] of units) {
    const n = Math.floor(d / secs);
    if (n >= 1) return `${n}${label} ago`;
  }
  return 'just now';
}

// The first line of a commit message is the summary GitHub itself shows;
// anything after a blank line is body text not meant for a compact list.
const firstLine = msg => msg.split('\n')[0];

export default function Changelog({ lang }) {
  const [commits, setCommits] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(API)
      .then(res => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then(data => { if (!cancelled) setCommits(data); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="band">
      <h2>{t('changelogTitle', lang)}</h2>

      {/* GitHub's public API allows 60 requests per hour per IP address.
          Campus wifi commonly shares one public IP across many devices,
          so hitting that shared limit here is a real possibility, not a
          hypothetical — the fallback below is not a decoration. */}
      {failed && (
        <p className="changelogfail">
          {t('changelogUnavailable', lang)}{' '}
          <a href={HISTORY_URL} target="_blank" rel="noreferrer">
            {t('changelogViewAll', lang)}
          </a>
        </p>
      )}

      {!failed && !commits && <p className="changelogfail">…</p>}

      {commits && (
        <>
          <ul className="changelist">
            {commits.map(c => (
              <li key={c.sha}>
                <a href={c.html_url} target="_blank" rel="noreferrer">
                  {firstLine(c.commit.message)}
                </a>
                <span>{timeAgo(c.commit.author.date, lang)}</span>
              </li>
            ))}
          </ul>
          <a className="changelogall" href={HISTORY_URL} target="_blank" rel="noreferrer">
            {t('changelogViewAll', lang)} →
          </a>
        </>
      )}
    </section>
  );
}
