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
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-lg shadow-black/20 transition-all duration-200 hover:border-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            {faviconUrl ? (
              <img src={faviconUrl} alt="Site icon" className="h-4 w-4 rounded-sm" />
            ) : (
              <div className="h-4 w-4 rounded-sm bg-zinc-600" aria-hidden="true" />
            )}
            <h4 className="truncate text-sm font-semibold text-zinc-100">{title}</h4>
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
              className="inline-flex items-center gap-1 break-all text-xs text-indigo-300 hover:text-indigo-200"
            >
              Open link
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <div className="space-y-2">
              <p className="line-clamp-3 whitespace-pre-wrap text-xs text-zinc-300">{content}</p>
              {onCopy && (
                <button
                  type="button"
                  onClick={onCopy}
                  className="saas-btn-ghost border border-zinc-700 px-2 py-1 text-xs"
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
          className="rounded-lg border border-zinc-700 p-2 text-zinc-300 transition-all duration-200 hover:border-red-400 hover:bg-red-500/10 hover:text-red-300"
          aria-label={`Delete resource ${title}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}
