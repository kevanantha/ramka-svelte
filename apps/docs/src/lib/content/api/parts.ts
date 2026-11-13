import type { ApiPart } from '#lib/components/docs/api/types.js';
import { generatedAttributes, generatedCssVariables, generatedProps } from './generated';
import {
	contextsApiMeta,
	documentViewTransitionMeta,
	imperativeApiMeta,
	lightboxApiMeta,
	type ApiPartMeta
} from './meta';

function toApiPart(meta: ApiPartMeta): ApiPart {
	const props = generatedProps[meta.id];
	const attributes = generatedAttributes[meta.id];
	const cssVariables = generatedCssVariables[meta.id];
	return {
		id: meta.id,
		name: meta.name,
		description: meta.description,
		...(props?.length ? { props } : null),
		...(attributes?.length ? { attributes } : null),
		...(cssVariables?.length ? { cssVariables } : null)
	};
}

export const lightboxApiParts = lightboxApiMeta.map(toApiPart);
export const documentViewTransitionApi = toApiPart(documentViewTransitionMeta);
export const contextsApi = contextsApiMeta.map(toApiPart);
export const imperativeApi = imperativeApiMeta.map(toApiPart);
