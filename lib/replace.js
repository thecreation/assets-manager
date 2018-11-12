import toRegExp from './toRegExp';

export default function(content, rules) {
  let keys = Object.keys(rules);

  keys.forEach((search)=> {
    let replacement = rules[search];

    let regex = toRegExp(search);
    if(regex) {
      content = content.replace(regex, replacement);
    } else {
      content = content.split(search).join(replacement);
    }
  });

  return content;
}
