const host = document.querySelector<HTMLElement>('[data-vue-site-island="search"]');

if (host) {
  const input = host.querySelector<HTMLInputElement>('input[type="search"]');
  if (input) {
    let loading: Promise<void> | undefined;
    let mounted = false;

    const syncSearchState = () => {
      host.dataset.searchInitialQuery = input.value.slice(0, 80);
      const selected = host.querySelector<HTMLButtonElement>('[data-search-filter][aria-pressed="true"]');
      host.dataset.searchInitialCategory = selected?.dataset.searchFilter || 'all';
    };

    const onInput = (event: Event) => {
      if (event.target === input) void activate();
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      const button = target instanceof Element ? target.closest<HTMLButtonElement>('[data-search-filter]') : null;
      if (!button || !host.contains(button)) return;
      host.querySelectorAll<HTMLButtonElement>('[data-search-filter]').forEach(filter => {
        filter.setAttribute('aria-pressed', String(filter === button));
      });
      syncSearchState();
      void activate();
    };

    const activate = () => {
      syncSearchState();
      if (mounted) return Promise.resolve();
      if (!loading) {
        loading = import('./main').then(() => {
          mounted = true;
          host.removeEventListener('input', onInput);
          host.removeEventListener('click', onClick);
        }).catch(error => {
          loading = undefined;
          console.error('Unable to load the search feature.', error);
        });
      }
      return loading;
    };

    host.addEventListener('input', onInput);
    host.addEventListener('click', onClick);
    const params = new URLSearchParams(window.location.search);
    if (params.has('q')) {
      input.value = (params.get('q') || '').slice(0, 80);
      if (input.value) void activate();
    }
  }
}
