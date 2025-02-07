/*
 * Collect IDs plugin
 *
 * @param options - a map containing options. Options are sent from Java
 *
 * @return - an array of ids or uris
 */
function collect(options) {
  // return all URIs for the 'load-acme-tech' collection
  const uris = cts.uris(null, null, cts.collectionQuery('load-acme-tech'));
  return uris;
}

module.exports = {
  collect: collect
};
