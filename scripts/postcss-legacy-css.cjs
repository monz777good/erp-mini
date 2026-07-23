function splitTopLevel(value, separator = ",") {
  const parts = [];
  let start = 0;
  let depth = 0;
  let bracketDepth = 0;
  let quote = "";

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const previous = value[index - 1];

    if (quote) {
      if (char === quote && previous !== "\\") quote = "";
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "[") bracketDepth += 1;
    else if (char === "]") bracketDepth = Math.max(0, bracketDepth - 1);
    else if (char === "(") depth += 1;
    else if (char === ")") depth = Math.max(0, depth - 1);
    else if (char === separator && depth === 0 && bracketDepth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
}

function findMatchingParen(value, openIndex) {
  let depth = 0;
  let bracketDepth = 0;
  let quote = "";

  for (let index = openIndex; index < value.length; index += 1) {
    const char = value[index];
    const previous = value[index - 1];

    if (quote) {
      if (char === quote && previous !== "\\") quote = "";
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "[") bracketDepth += 1;
    else if (char === "]") bracketDepth = Math.max(0, bracketDepth - 1);
    else if (bracketDepth === 0 && char === "(") depth += 1;
    else if (bracketDepth === 0 && char === ")") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
}

function expandModernPseudo(selector) {
  const pseudoNames = [":where(", ":is("];
  let found = null;

  for (const pseudoName of pseudoNames) {
    const index = selector.indexOf(pseudoName);
    if (index !== -1 && (found === null || index < found.index)) {
      found = { index, pseudoName };
    }
  }

  if (found === null) return [selector];

  const openIndex = found.index + found.pseudoName.length - 1;
  const closeIndex = findMatchingParen(selector, openIndex);
  if (closeIndex === -1) return [selector];

  const before = selector.slice(0, found.index);
  const inner = selector.slice(openIndex + 1, closeIndex);
  const after = selector.slice(closeIndex + 1);

  return splitTopLevel(inner).flatMap((option) =>
    expandModernPseudo(`${before}${option}${after}`),
  );
}

function normalizeSelector(selector) {
  return splitTopLevel(selector)
    .flatMap((part) => expandModernPseudo(part))
    .join(", ");
}

module.exports = () => ({
  postcssPlugin: "postcss-legacy-css",
  Once(root, { postcss }) {
    root.walkAtRules("layer", (atRule) => {
      if (!atRule.nodes || atRule.nodes.length === 0) {
        atRule.remove();
        return;
      }

      atRule.replaceWith(...atRule.nodes);
    });

    root.walkAtRules("property", (atRule) => {
      atRule.remove();
    });

    root.walkRules((rule) => {
      const normalized = normalizeSelector(rule.selector);
      if (normalized !== rule.selector) rule.selector = normalized;
    });

    root.append(
      postcss.rule({ selector: ".min-h-\\[100svh\\], .min-h-\\[100dvh\\]" }).append({
        prop: "min-height",
        value: "100vh",
      }),
    );
  },
});

module.exports.postcss = true;
