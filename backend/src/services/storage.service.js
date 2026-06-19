const fs = require("fs/promises");
const path = require("path");

async function saveGeneratedServerCode(serverId, code) {
	const outputDir = path.join(__dirname, "..", "generated", "servers");
	const outputPath = path.join(outputDir, `${serverId}.ts`);

	await fs.mkdir(outputDir, { recursive: true });
	await fs.writeFile(outputPath, code, "utf8");

	return outputPath;
}

module.exports = {
	saveGeneratedServerCode
};
