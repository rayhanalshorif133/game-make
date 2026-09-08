const C3 = self.C3;
self.C3_GetObjectRefTable = function () {
	return [
		C3.Plugins.Sprite
	];
};
self.C3_JsPropNameTable = [
	{spr_full_ui: 0}
];

self.InstanceType = {
	spr_full_ui: class extends self.ISpriteInstance {}
}