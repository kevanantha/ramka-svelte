const assetBase = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models';

/** Shared square frame for every trigger + Media so tiles match in the grid. */
export const FRAME_SIZE = 1024;

export interface Product {
	id: string;
	name: string;
	material: string;
	src: string;
}

/** Each product mounts its own lightbox; trigger + Media each get a Three.js canvas. */
export const products: Product[] = [
	{
		id: 'shoe',
		name: 'Materials Variants Shoe',
		material: 'Leather · multi-variant',
		src: `${assetBase}/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb`
	},
	{
		id: 'chair',
		name: 'Damask Chair',
		material: 'Purple & gold fabric',
		src: `${assetBase}/ChairDamaskPurplegold/glTF-Binary/ChairDamaskPurplegold.glb`
	},
	{
		id: 'bottle',
		name: 'Water Bottle',
		material: 'Brushed metal',
		src: `${assetBase}/WaterBottle/glTF-Binary/WaterBottle.glb`
	},
	{
		id: 'helmet',
		name: 'Damaged Helmet',
		material: 'Sci-fi prop',
		src: `${assetBase}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb`
	}
];
