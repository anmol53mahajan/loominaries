import { ExternalLink, Trash2 } from 'lucide-react'

const KIND_LABELS = {
  'ai-output': 'AI Output',
  openingSpeech: 'Opening Speech',
  pois: 'POIs',
  positionIdeas: 'Position Ideas',
  liveSpeech: 'Live Speech',
}

function getFavicon(link) {
  try {
    const hostname = new URL(link).hostname
    return `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`
  } catch {
    return ''
  }
}

export default function ResourceCard({ title, link, content, kind, onCopy, onDelete }) {
  const faviconUrl = getFavicon(link)
  const isLinkResource = Boolean(link)
  const badgeLabel = KIND_LABELS[kind]

  return (
    <article className="rounded-xl border border-slate-700 bg-slate-800/80 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            {faviconUrl ? (
              <img src={faviconUrl} alt="Site icon" className="h-4 w-4 rounded-sm" />
            ) : (
              <div className="h-4 w-4 rounded-sm bg-slate-600" aria-hidden="true" />
            )}
            <h4 className="truncate text-sm font-semibold text-white">{title}</h4>
          </div>

          {badgeLabel && (
            <span className="mb-2 inline-flex rounded-full border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-200">
              {badgeLabel}
            </span>
          )}

          {isLinkResource ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 break-all text-xs text-blue-300 hover:text-blue-200"
            >
              Open link
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <div className="space-y-2">
              <p className="line-clamp-3 whitespace-pre-wrap text-xs text-slate-300">{content}</p>
              {onCopy && (
                <button
                  type="button"
                  onClick={onCopy}
                  className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  Copy Output
                </button>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-slate-600 p-2 text-slate-300 transition hover:border-rose-400 hover:text-rose-300"
          aria-label={`Delete resource ${title}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}
