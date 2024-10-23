import { $ } from "bun";

await $`bun build --minify ./app/index.js >> ./dist.js`;

const targets = ["linux", "windows", "darwin"];
const arch = ["x64-modern", "arm64-modern", "x64-baseline", "arm64-baseline"];

const combos = [];

for (let i = 0; i < targets.length; i++) {
	for (let j = 0; j < arch.length; j++) {
		combos.push(`bun-${targets[i]}-${arch[j]}`);
	}
}

for (const combo of combos) {
	try {
		await $`bun build --compile --target=${combo} ./dist.js --outfile dist/${combo.replace(
			"bun",
			"string",
		)}`;
	} catch {
		console.log(`Attempted to build unsupported target: ${combo}`);
	}
}
