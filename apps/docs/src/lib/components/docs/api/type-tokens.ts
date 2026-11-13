/** Lightweight TS-ish tokenizer for prop type / default cells (the original's type-highlight). */
export type TokenKind =
	'keyword' | 'builtin' | 'string' | 'number' | 'function' | 'type' | 'punctuation' | 'plain';

const KEYWORDS = new Set([
	'boolean',
	'string',
	'number',
	'bigint',
	'symbol',
	'object',
	'void',
	'null',
	'undefined',
	'never',
	'any',
	'unknown',
	'true',
	'false',
	'readonly',
	'const',
	'keyof',
	'infer',
	'extends',
	'typeof',
	'in',
	'as',
	'is'
]);

export const tokenClass: Record<TokenKind, string> = {
	keyword: 'text-blue-600 dark:text-blue-400',
	builtin: 'text-blue-600 dark:text-blue-400',
	string: 'text-emerald-700 dark:text-emerald-400',
	number: 'text-amber-700 dark:text-amber-400',
	function: 'text-rose-600 dark:text-rose-400',
	type: 'text-violet-700 dark:text-violet-300',
	punctuation: 'text-neutral-500 dark:text-neutral-400',
	plain: 'text-neutral-800 dark:text-neutral-200'
};

function classifyIdent(ident: string): TokenKind {
	if (ident === 'function') return 'function';
	if (KEYWORDS.has(ident)) return 'keyword';
	if (/^[A-Z]/.test(ident)) return 'type';
	return 'plain';
}

export function tokenize(input: string): { kind: TokenKind; value: string }[] {
	const out: { kind: TokenKind; value: string }[] = [];
	let i = 0;
	while (i < input.length) {
		const rest = input.slice(i);
		const match = (kind: TokenKind, re: RegExp) => {
			const m = rest.match(re);
			if (!m) return false;
			out.push({ kind, value: m[0] });
			i += m[0].length;
			return true;
		};
		if (match('string', /^('(?:\\.|[^'])*'|"(?:\\.|[^"])*"|`(?:\\.|[^`])*`)/)) continue;
		if (match('number', /^\d+(\.\d+)?/)) continue;
		if (match('punctuation', /^=>/)) continue;
		const ident = rest.match(/^[A-Za-z_$][\w$]*/);
		if (ident) {
			out.push({ kind: classifyIdent(ident[0]), value: ident[0] });
			i += ident[0].length;
			continue;
		}
		if (match('punctuation', /^[{}()<>[\]|&?:,.;=+\-*/!~%]+/)) continue;
		if (match('plain', /^\s+/)) continue;
		out.push({ kind: 'plain', value: rest[0]! });
		i += 1;
	}
	return out;
}
