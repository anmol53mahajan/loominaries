export default function GoogleSignInButton({ onClick, disabled, loadingText = 'Please wait...' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        aria-hidden="true"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-xs font-bold"
      >
        G
      </span>
      <span>{disabled ? loadingText : 'Continue with Google'}</span>
    </button>
  )
}
