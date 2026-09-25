import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface Rule {
  file: string;
  prelude: string;
  atRules: string[];
  declarations: Map<string, string>;
}

const squash = (text: string) => text.replace(/\s+/g, ' ').trim();

// Enough of a CSS reader for the token files: blocks, nesting and declarations.
function parseRules(file: string): Rule[] {
  const path = resolve(import.meta.dirname, '../../src/styles', file);
  const source = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: Rule[] = [];
  const open: Rule[] = [];
  let buffer = '';

  const declare = () => {
    const rule = open.at(-1);
    const colon = buffer.indexOf(':');
    if (rule && colon > 0) {
      rule.declarations.set(squash(buffer.slice(0, colon)), squash(buffer.slice(colon + 1)));
    }
    buffer = '';
  };

  for (const char of source) {
    if (char === '{') {
      const rule: Rule = {
        file,
        prelude: squash(buffer),
        atRules: open.map((parent) => parent.prelude),
        declarations: new Map(),
      };
      open.push(rule);
      rules.push(rule);
      buffer = '';
    } else if (char === '}') {
      declare();
      open.pop();
    } else if (char === ';') {
      declare();
    } else {
      buffer += char;
    }
  }
  return rules;
}

const tokens = parseRules('tokens.css');
const skins = parseRules('skins.css');
const all = [...tokens, ...skins];

const followsOs = (rule: Rule) =>
  rule.atRules.some((at) => /prefers-color-scheme\s*:\s*dark/.test(at));
const followsToggle = (rule: Rule) =>
  !followsOs(rule) && /data-theme\s*=\s*['"]?dark['"]?\s*\]/.test(rule.prelude);
const isSwitch = (rule: Rule) => followsOs(rule) || followsToggle(rule);

const merged = (rules: Rule[]) =>
  Object.fromEntries(rules.flatMap((rule) => [...rule.declarations]));

const osDark = merged(all.filter(followsOs));
const toggleDark = merged(all.filter(followsToggle));

// The default skin's light values. A pure alias such as `--ring: var(--accent)`
// follows its source into dark on its own, so it needs no dark value.
const themedTokens = [
  ...(tokens.find((rule) => rule.prelude === ':root' && rule.declarations.has('--canvas'))
    ?.declarations ?? []),
]
  .filter(([name, value]) => !name.startsWith('--dark-') && !/^var\(--[\w-]+\)$/.test(value))
  .map(([name]) => name);

const darkValues = all.flatMap((rule) =>
  isSwitch(rule)
    ? []
    : [...rule.declarations.keys()]
        .filter((name) => name.startsWith('--dark-'))
        .map((name) => ({ name, where: `${rule.file} "${rule.prelude}"` })),
);

describe('dark theme tokens', () => {
  it('switch to dark by pointing each token at its dark value, never by restating a colour', () => {
    const switches = all.filter(isSwitch);
    expect(switches.length).toBeGreaterThan(0);

    for (const rule of switches) {
      for (const [name, value] of rule.declarations) {
        expect(value, `${name} in ${rule.file} "${rule.prelude}"`).toBe(
          `var(--dark-${name.slice(2)})`,
        );
      }
    }
  });

  it('switch the same tokens whether the OS or the toggle asks for dark', () => {
    expect(osDark).toEqual(toggleDark);
  });

  it('give every themed colour a light value, a dark value and a switch', () => {
    expect(themedTokens).toContain('--canvas');

    const darkDefaults = tokens.flatMap((rule) =>
      rule.prelude === ':root' ? [...rule.declarations.keys()] : [],
    );
    for (const name of themedTokens) {
      expect(osDark[name], `${name} is not switched`).toBe(`var(--dark-${name.slice(2)})`);
      expect(darkDefaults, `${name} has no dark value`).toContain(`--dark-${name.slice(2)}`);
    }
    for (const name of Object.keys(osDark)) {
      expect(themedTokens, `${name} is switched but has no light value`).toContain(name);
    }
  });

  it('read every dark value that is declared', () => {
    expect(darkValues.length).toBeGreaterThan(0);

    const switched = new Set(Object.values(osDark));
    for (const { name, where } of darkValues) {
      expect(switched, `${name} in ${where} is never read`).toContain(`var(${name})`);
    }
  });

  it('let preset skins supply dark values without restating the switch', () => {
    expect(skins.filter(isSwitch)).toEqual([]);
  });
});
