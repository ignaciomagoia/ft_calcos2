export default function AppLoading() {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/16 backdrop-blur-[1px]">
      <div className="inline-flex items-center justify-center rounded-full bg-white/90 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.15)]">
        <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-[var(--color-secondary)] border-t-[var(--color-primary)]" />
      </div>
    </div>
  );
}

