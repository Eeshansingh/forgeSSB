export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground sm:flex-row">
        <p className="font-mono uppercase tracking-[0.2em]">
          ForgeSSB · Forged under pressure.
        </p>
        <p className="text-muted-foreground/70">
          Independent preparation platform. Not affiliated with the Ministry of Defence or any SSB centre.
        </p>
      </div>
    </footer>
  );
}
