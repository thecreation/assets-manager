import types from '../../lib/types';

export default function (obj) {
  let filled = {};

  for (let type in types) {
    if (Object.hasOwnProperty.call(obj, type)) {
      filled[type] = obj[type];
    } else {
      filled[type] = [];
    }
  }

  return filled;
}
