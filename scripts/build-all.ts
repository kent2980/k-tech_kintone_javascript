/* eslint-env node */
/**
 * inputMapに含まれるすべてのエントリーポイントを動的にビルドするスクリプト
 */
const { execSync } = require("child_process");
const { Project } = require("ts-morph");
const { join } = require("path");

// vite.config.tsからinputMapを抽出する
function extractInputMap() {
    const project = new Project();
    const configPath = join(process.cwd(), "vite.config.ts");
    const sourceFile = project.addSourceFileAtPath(configPath);

    // inputMapの変数宣言を探す
    const inputMapVar = sourceFile.getVariableDeclaration("inputMap");
    if (!inputMapVar) {
        throw new Error("vite.config.tsからinputMapを抽出できませんでした");
    }

    const initializer = inputMapVar.getInitializer();
    if (!initializer) {
        throw new Error("inputMapの初期化式が見つかりませんでした");
    }

    const inputMap = {};
    
    // ObjectLiteralExpressionとして扱う
    if (initializer.getKindName() !== "ObjectLiteralExpression") {
        throw new Error("inputMapはObjectLiteralExpressionである必要があります");
    }
    
    const objExpr = initializer;
    const properties = objExpr.getProperties();
    
    for (const prop of properties) {
        if (prop.getKindName() === "PropertyAssignment") {
            const propAssignment = prop;
            const targetName = propAssignment.getName();
            const targetValue = propAssignment.getInitializer();
            
            if (targetValue && targetValue.getKindName() === "ObjectLiteralExpression") {
                inputMap[targetName] = {};
                const innerProps = targetValue.getProperties();
                
                for (const innerProp of innerProps) {
                    if (innerProp.getKindName() === "PropertyAssignment") {
                        const innerPropAssignment = innerProp;
                        const innerName = innerPropAssignment.getName();
                        const innerValue = innerPropAssignment.getInitializer();
                        
                        if (innerValue && innerValue.getKindName() === "StringLiteral") {
                            const path = innerValue.getText().replace(/^"|"$/g, "");
                            inputMap[targetName][innerName] = path;
                        }
                    }
                }
            }
        }
    }

    return inputMap;
}

const inputMap = extractInputMap();

const buildTargets = Object.keys(inputMap);

console.log(`ビルド対象: ${buildTargets.join(", ")}`);
console.log(`合計 ${buildTargets.length} 個のエントリーポイントをビルドします\n`);

let successCount = 0;
let failCount = 0;

for (const target of buildTargets) {
    console.log(`\n[${target}] ビルド開始...`);
    try {
        execSync(`cross-env BUILD_TARGET=${target} vite build`, {
            stdio: "inherit",
            cwd: process.cwd(),
        });
        console.log(`[${target}] ビルド成功`);
        successCount++;
    } catch (error) {
        console.error(`[${target}] ビルド失敗:`, error);
        failCount++;
    }
}

console.log(`\n=== ビルド完了 ===`);
console.log(`成功: ${successCount} 個`);
console.log(`失敗: ${failCount} 個`);

if (failCount > 0) {
    process.exit(1);
}

