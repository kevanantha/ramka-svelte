/**
 * Extracts the Lightbox API tables from the ramka-svelte sources and writes
 * src/lib/content/api/generated.ts:
 *
 *   - props from each part's `Lightbox<Part>Props` interface, declared in the
 *     component's `<script lang="ts" module>` block (Svelte's public props)
 *   - data attributes from `*DataAttributes` enums
 *   - CSS variables from `*CssVars` enums (`@type` → Type column)
 *
 * The svelte port of the original's ts-morph generator: the same JSDoc →
 * description / `@default` → Default rules.
 *
 *   pnpm --filter docs docs:api          # write
 *   pnpm --filter docs docs:api:check    # fail if stale
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	Node,
	Project,
	type InterfaceDeclaration,
	type JSDoc,
	type MethodSignature,
	type PropertySignature,
	type SourceFile
} from 'ts-morph';

import { allApiMeta, type EnumExtract, type ExtractSpec } from '../src/lib/content/api/meta.ts';

type PropRow = {
	name: string;
	type: string;
	default?: string;
	description: string;
	required?: boolean;
};
type AttrRow = { name: string; description: string };
type CssVarRow = { name: string; type?: string; description: string };

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lightboxSrc = path.resolve(docsRoot, '../../packages/ramka/src/lib/lightbox');
const outFile = path.join(docsRoot, 'src/lib/content/api/generated.ts');

const project = new Project({ useInMemoryFileSystem: true });

/** `.ts` files load as-is; `.svelte` files contribute their module script. */
function source(file: string): SourceFile | null {
	const full = path.join(lightboxSrc, file);
	const virtual = `/${file}.ts`;
	const existing = project.getSourceFile(virtual);
	if (existing) return existing;
	if (!fs.existsSync(full)) return null;
	let text = fs.readFileSync(full, 'utf8');
	if (file.endsWith('.svelte')) {
		const m = text.match(/<script[^>]*\bmodule\b[^>]*>([\s\S]*?)<\/script>/);
		text = m?.[1] ?? '';
	}
	return project.createSourceFile(virtual, text);
}

function cleanTypeText(text: string): string {
	return text
		.replace(/import\("[^"]+"\)\./g, '')
		.replace(/\s*\|\s*undefined\b/g, '')
		.replace(/\bundefined\s*\|\s*/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Expand a same-file string-literal alias (`LightboxCrossfade` → `'open' | 'close' | 'both'`). */
function typeText(decl: PropertySignature | MethodSignature): string {
	if (Node.isMethodSignature(decl)) {
		const params = decl
			.getParameters()
			.map((p) => p.getText())
			.join(', ');
		return cleanTypeText(`(${params}) => ${decl.getReturnTypeNode()?.getText() ?? 'void'}`);
	}
	const node = decl.getTypeNode();
	if (!node) return 'unknown';
	const text = node.getText().trim();
	if (/^[A-Za-z_]\w*$/.test(text)) {
		const alias = decl.getSourceFile().getTypeAlias(text)?.getTypeNode();
		if (alias && Node.isUnionTypeNode(alias)) {
			const members = alias.getTypeNodes();
			if (members.every((m) => Node.isLiteralTypeNode(m))) return cleanTypeText(alias.getText());
		}
	}
	return cleanTypeText(text);
}

/** JSDoc paragraphs, `- ` bullets and soft-wrapped lines, as the docs renderer reads them. */
function normalize(text: string): string {
	const out: string[] = [];
	let para: string[] = [];
	let list: string[] | null = null;
	const flushPara = () => {
		if (para.length) out.push(para.join(' ').replace(/\s+/g, ' ').trim());
		para = [];
	};
	const flushList = () => {
		if (list) out.push(list.join('\n'));
		list = null;
	};
	for (const line of text.replace(/\r\n/g, '\n').trim().split('\n')) {
		const item = line.match(/^\s*-\s+(.*)$/);
		if (item) {
			flushPara();
			list ??= [];
			list.push(`- ${item[1]!.trim()}`);
		} else if (list && /^\s+\S/.test(line)) {
			list[list.length - 1] = `${list[list.length - 1]} ${line.trim()}`;
		} else if (line.trim() === '') {
			flushPara();
			flushList();
		} else {
			flushList();
			para.push(line.trim());
		}
	}
	flushPara();
	flushList();
	return out.join('\n\n').trim();
}

const description = (docs: JSDoc[]) =>
	normalize(
		docs
			.map((d) => d.getDescription().trim())
			.filter(Boolean)
			.join('\n\n')
	) || '—';

function tag(docs: JSDoc[], name: string): string | undefined {
	for (const doc of docs)
		for (const t of doc.getTags())
			if (t.getTagName() === name) {
				const text = t.getCommentText()?.trim();
				if (text) return text.replace(/\s+/g, ' ');
			}
}

function iface(file: string, name: string): InterfaceDeclaration | null {
	const src = source(file);
	if (!src) return null;
	const found = src.getInterface(name);
	if (found) return found;
	// `type XProps = YProps` (ThumbnailStripTrack reuses ThumbnailGroup's props).
	const target = src.getTypeAlias(name)?.getTypeNode()?.getText();
	if (!target) throw new Error(`Interface ${name} not found in ${file}`);
	const from = src
		.getImportDeclarations()
		.find((d) => d.getNamedImports().some((n) => n.getName() === target))
		?.getModuleSpecifierValue();
	return iface(from ? path.posix.normalize(from) : file, target);
}

function row(member: PropertySignature | MethodSignature, imperative: boolean): PropRow {
	const docs = member.getJsDocs();
	const r: PropRow = {
		name: member.getName(),
		type: typeText(member),
		description: description(docs)
	};
	const def = tag(docs, 'default');
	if (def) r.default = def;
	const optional = Node.isPropertySignature(member)
		? member.hasQuestionToken()
		: member.hasQuestionToken();
	if (!imperative && !optional && !def) r.required = true;
	return r;
}

/** `null`: the source file does not exist yet (part not ported). */
function extractProps(spec: ExtractSpec): PropRow[] | null {
	switch (spec.kind) {
		case 'none':
			return [];
		case 'interface-props':
		case 'interface-members': {
			const found = iface(spec.file, spec.typeName);
			if (!found) return null;
			const exclude = new Set(spec.exclude ?? []);
			return found
				.getMembers()
				.filter(
					(m): m is PropertySignature | MethodSignature =>
						(Node.isPropertySignature(m) || Node.isMethodSignature(m)) && !exclude.has(m.getName())
				)
				.map((m) => row(m, spec.kind === 'interface-members'));
		}
		case 'function-return': {
			const src = source(spec.file);
			if (!src) return null;
			const fn = src.getFunction(spec.functionName);
			if (!fn) throw new Error(`Function ${spec.functionName} not found in ${spec.file}`);
			return [
				{
					name: spec.rowName ?? '(return)',
					type: cleanTypeText(fn.getReturnTypeNode()?.getText() ?? 'unknown'),
					description: description(fn.getJsDocs())
				}
			];
		}
	}
}

function extractEnum(spec: EnumExtract): CssVarRow[] {
	const src = source(spec.file);
	const en = src?.getEnum(spec.enumName);
	if (!en) throw new Error(`Enum ${spec.enumName} not found in ${spec.file}`);
	return en.getMembers().map((member) => {
		const docs = member.getJsDocs();
		const value = member
			.getInitializer()
			?.getText()
			.replace(/^['"]|['"]$/g, '');
		const r: CssVarRow = { name: value ?? member.getName(), description: description(docs) };
		const type = tag(docs, 'type');
		if (type) r.type = type;
		return r;
	});
}

const props: Record<string, PropRow[]> = {};
const attributes: Record<string, AttrRow[]> = {};
const cssVariables: Record<string, CssVarRow[]> = {};

for (const part of allApiMeta) {
	const rows = extractProps(part.extract);
	if (rows === null) throw new Error(`No source for ${part.id} in ramka-svelte`);
	props[part.id] = rows;
	attributes[part.id] = part.attributesFrom
		? extractEnum(part.attributesFrom).map(({ name, description }) => ({ name, description }))
		: [];
	cssVariables[part.id] = part.cssVariablesFrom ? extractEnum(part.cssVariablesFrom) : [];
}

const json = (value: unknown) => JSON.stringify(value, null, '\t');
const next = `/**
 * AUTO-GENERATED by apps/docs/scripts/generate-lightbox-api.ts — do not edit.
 * Update the ramka-svelte props / JSDoc / *DataAttributes / *CssVars, then run:
 *   pnpm --filter docs docs:api
 */
import type { AttrRow, CssVarRow, PropRow } from '#lib/components/docs/api/types.js';

export const generatedProps: Record<string, PropRow[]> = ${json(props)};

export const generatedAttributes: Record<string, AttrRow[]> = ${json(attributes)};

export const generatedCssVariables: Record<string, CssVarRow[]> = ${json(cssVariables)};
`;

if (process.argv.includes('--check')) {
	const prev = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : '';
	if (prev !== next) {
		console.error(
			'Lightbox API docs are out of date with ramka-svelte. Run: pnpm --filter docs docs:api'
		);
		process.exit(1);
	}
	console.log('Lightbox API docs are up to date.');
} else {
	fs.writeFileSync(outFile, next);
	console.log(`Wrote ${path.relative(docsRoot, outFile)}`);
}
