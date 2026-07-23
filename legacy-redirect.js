(() => {
  const isLegacySite = window.location.hostname === "mayslabs.github.io"
    && window.location.pathname.startsWith("/reduzsimadministrativo");
  if (!isLegacySite) return;

  window.location.replace(
    `https://reduzsim-gestao.pages.dev/${window.location.search}${window.location.hash}`,
  );
})();
