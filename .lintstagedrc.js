module.exports = {
    "*.{ts,tsx}": (filenames) => {
        // 生成されたファイル、スクリプトファイル、特定のパスを除外
        const filteredFilenames = filenames.filter(
            (filename) =>
                !filename.includes("/generated/") &&
                !filename.includes("/scripts/") &&
                !filename.endsWith("generate-fields.js") &&
                !filename.includes("node_modules")
        );

        if (filteredFilenames.length === 0) {
            return [];
        }

        return [
            `eslint --fix ${filteredFilenames.join(" ")}`,
            `prettier --write ${filteredFilenames.join(" ")}`,
        ];
    },
    "*.{js,jsx}": (filenames) => {
        // JavaScriptファイルも同様に除外
        const filteredFilenames = filenames.filter(
            (filename) =>
                !filename.includes("/generated/") &&
                !filename.includes("/scripts/") &&
                !filename.endsWith("generate-fields.js") &&
                !filename.includes("node_modules")
        );

        if (filteredFilenames.length === 0) {
            return [];
        }

        return [`prettier --write ${filteredFilenames.join(" ")}`];
    },
    "*.{json,md,css}": (filenames) => {
        const batchSize = 20;
        const commands = [];

        for (let i = 0; i < filenames.length; i += batchSize) {
            const batch = filenames.slice(i, i + batchSize);
            commands.push(`prettier --write --ignore-unknown ${batch.join(" ")}`);
        }

        return commands;
    },
};
