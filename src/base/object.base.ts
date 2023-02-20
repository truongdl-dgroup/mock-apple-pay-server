interface Object {
  merge: (...objects: any[]) => Record<string, any>;
}

Object.prototype.merge = function (...objects: any[]) {
  return Object.assign({}, ...objects);
};
