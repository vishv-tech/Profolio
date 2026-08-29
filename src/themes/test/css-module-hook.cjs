const classNames = new Proxy({}, {
  get(_target, property) {
    return typeof property === "string" ? property : undefined;
  },
});

require.extensions[".css"] = function loadCssModule(module) {
  module.exports = {
    __esModule: true,
    default: classNames,
  };
};
