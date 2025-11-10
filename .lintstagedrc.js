module.exports = {
    "*.{ts,tsx,js,jsx}": (filenames) => {
        // ファイルを小さなバッチに分割
        const batchSize = 5;
        const commands = [];

        for (let i = 0; i < filenames.length; i += batchSize) {
            const batch = filenames.slice(i, i + batchSize);
            // 警告は許容し、エラーのみをチェック
            commands.push(`eslint --fix ${batch.join(" ")}`);
            commands.push(`prettier --write --ignore-unknown ${batch.join(" ")}`);
        }

        return commands;
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
