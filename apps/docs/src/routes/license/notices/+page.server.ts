import notices from '../../../../../../packages/ramka/THIRD-PARTY-NOTICES.md?raw';
import { renderLegalMarkdown, splitTitle } from '../legal-markdown';

export function load() {
	const { title, body } = splitTitle(notices, 'THIRD-PARTY-NOTICES.md');
	return { title, html: renderLegalMarkdown(body) };
}
