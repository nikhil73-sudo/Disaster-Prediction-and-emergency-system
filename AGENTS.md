<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Leaflet map is lazy-loaded inside <ClientOnly> (src/components/LiveMap.tsx) — Leaflet touches window and breaks SSR.
- Live alerts/incidents come from realtime subscriptions in one hook (use-live-data) — single channel avoids duplicate subscriptions.
