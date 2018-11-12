/*eslint no-useless-escape: "off"*/
/*eslint no-empty: "off"*/

const regexpWithFlags = /^\/((?:\\\/|[^\/])+)\/([gimy]{0,4})$/;

export default function(string) {
  try {
    let matches = regexpWithFlags.exec(string);

    if (matches) {
      let regex = matches[1];

      if (matches.length === 3 && matches[2]) {
        return new RegExp(regex, matches[2]);
      }

      return new RegExp(regex);
    }
  } catch (err) {}

  return null;
}
