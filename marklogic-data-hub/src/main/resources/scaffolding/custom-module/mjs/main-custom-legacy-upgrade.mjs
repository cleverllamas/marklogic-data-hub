function main(content, options) {
  let result = {};
  let legacyOptions = options.options;
  result["uri"] = content.uri;
  result["value"] = require(legacyOptions["mainModuleUri"]).main(content.uri, legacyOptions);
  return result;
}

export default {
    main
};

