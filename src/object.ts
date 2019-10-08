import { Next } from "./types";
import { quoteKey } from "./quote";
import { FunctionParser } from "./function";

function callableToString(
  callable: Function,
  indent: string,
  next: Next,
  key?: string
) {
  const parser = new FunctionParser(callable, indent, next, key);
  let result = parser.stringify();
  if (!key) {
    // Remove 'function ' prefix from getters and setters
    // TODO: Handle in FunctionParser instead?
    result = result.replace(/^function /, "");
  }
  return indent + result.split("\n").join(`\n${indent}`);
}

/**
 * Stringify an object of keys and values.
 */
export function objectToString(obj: any, indent: string, next: Next) {
  const eol = indent ? "\n" : "";

  // Iterate over object keys and concat string together.
  const values = Object.keys(obj)
    .reduce(
      function(values, key) {
        if (typeof obj[key] === "function") {
          values.push(callableToString(obj[key], indent, next, key));
          return values;
        }

        // Handle getters & setters
        const descriptor = Object.getOwnPropertyDescriptor(obj, key);
        if (descriptor && (descriptor.get || descriptor.set)) {
          if (descriptor.get) {
            values.push(callableToString(descriptor.get, indent, next));
          }
          if (descriptor.set) {
            values.push(callableToString(descriptor.set, indent, next));
          }
          return values;
        }

        const result = next(obj[key], key);

        // Omit `undefined` object entries.
        if (result === undefined) return values;

        // String format the value data.
        const value = result.split("\n").join(`\n${indent}`);

        values.push(
          `${indent}${quoteKey(key, next)}:${indent ? " " : ""}${value}`
        );

        return values;
      },
      [] as string[]
    )
    .join(`,${eol}`);

  // Avoid new lines in an empty object.
  if (values === "") return "{}";

  return `{${eol}${values}${eol}}`;
}
