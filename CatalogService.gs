function CatalogService_listActive_() {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'catalog-active-v1';
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const products = CatalogRepository_listActive_();
  cache.put(cacheKey, JSON.stringify(products), APP_CONFIG.catalogCacheSeconds);
  return products;
}
