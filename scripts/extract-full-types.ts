#!/usr/bin/env tsx
/**
 * Script to extract full type definitions from yahoo-finance2 interface files
 * This copies the actual type definitions so ts-to-zod can process them
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const nodeModulesPath = join(
  process.cwd(),
  "node_modules/yahoo-finance2/esm/src/modules"
);
const outputFile = join(process.cwd(), "lib/models/yahoo-finance-types.ts");

console.log("🔄 Extracting full type definitions from yahoo-finance2...");

let output = `// This file is used by ts-to-zod to generate Zod schemas
// Full type definitions extracted from yahoo-finance2 package
// DO NOT EDIT MANUALLY - Run 'pnpm extract:types' to regenerate
//
// Generated at: ${new Date().toISOString()}

`;

// Extract QuoteSummaryResult
console.log("📥 Extracting QuoteSummaryResult...");
const quoteSummaryIface = readFileSync(
  join(nodeModulesPath, "quoteSummary-iface.d.ts"),
  "utf-8"
);

// Extract the QuoteSummaryResult interface and all its dependencies
// We need to extract everything that QuoteSummaryResult depends on
const quoteSummaryMatch = quoteSummaryIface.match(
  /export interface QuoteSummaryResult[\s\S]*?(?=export|\n\n\/\/|$)/
);
if (quoteSummaryMatch) {
  // Extract all interfaces/types that QuoteSummaryResult uses
  // Get everything from the file but clean it up
  let quoteSummaryContent = quoteSummaryIface;

  // Remove imports and keep only type definitions
  quoteSummaryContent = quoteSummaryContent.replace(/import[^;]*;/g, "");
  quoteSummaryContent = quoteSummaryContent.replace(
    /export type \* from[^;]*;/g,
    ""
  );

  // Keep all interface/type definitions
  output += "// QuoteSummaryResult and related types\n";
  output += quoteSummaryContent;
  output += "\n\n";
} else {
  console.warn("⚠️  Could not find QuoteSummaryResult interface");
}

// Extract InsightsResult
console.log("📥 Extracting InsightsResult...");
const insightsFile = readFileSync(
  join(nodeModulesPath, "insights.d.ts"),
  "utf-8"
);

// Extract InsightsResult interface and related types
const insightsMatch = insightsFile.match(
  /export interface InsightsResult[\s\S]*?(?=export interface|\n\n\/\/|$)/
);
if (insightsMatch) {
  // Get all type definitions from insights file
  let insightsContent = insightsFile;
  insightsContent = insightsContent.replace(/import[^;]*;/g, "");
  insightsContent = insightsContent.replace(/export type \* from[^;]*;/g, "");
  insightsContent = insightsContent.replace(
    /export default function[\s\S]*?;/g,
    ""
  );
  insightsContent = insightsContent.replace(/export declare const[^;]*;/g, "");
  // Remove function declarations completely
  insightsContent = insightsContent.replace(
    /export default function[\s\S]*?\{[\s\S]*?\}/g,
    ""
  );
  // Remove JSDoc comments that are malformed
  insightsContent = insightsContent.replace(
    /\/\*\*[\s\S]*?\*\/\s*docs for examples/g,
    ""
  );

  output += "// InsightsResult and related types\n";
  output += insightsContent;
  output += "\n\n";
} else {
  console.warn("⚠️  Could not find InsightsResult interface");
}

// Extract ChartResultArray
console.log("📥 Extracting ChartResultArray...");
const chartFile = readFileSync(join(nodeModulesPath, "chart.d.ts"), "utf-8");

// Extract ChartResult and related types
let chartContent = chartFile;
chartContent = chartContent.replace(/import[^;]*;/g, "");
chartContent = chartContent.replace(/export type \* from[^;]*;/g, "");
chartContent = chartContent.replace(/export default function[\s\S]*?;/g, "");
chartContent = chartContent.replace(/export declare const[^;]*;/g, "");
// Remove function declarations completely
chartContent = chartContent.replace(
  /export default function[\s\S]*?\{[\s\S]*?\}/g,
  ""
);
// Remove JSDoc comments that are malformed
chartContent = chartContent.replace(
  /\/\*\*[\s\S]*?\*\/\s*docs for examples/g,
  ""
);
chartContent = chartContent.replace(/docs for examples[\s\S]*?@see/g, "");

output += "// ChartResultArray and related types\n";
output += chartContent;
output += "\n\n";

// Store FundamentalsTimeSeries extraction for later (after cleanup)
let fundamentalsTimeSeriesContent: string | null = null;
console.log("📥 Extracting FundamentalsTimeSeriesResult...");
try {
  const fundamentalsTimeSeriesPath = join(
    nodeModulesPath,
    "fundamentalsTimeSeries.d.ts"
  );
  console.log(`   Looking for file at: ${fundamentalsTimeSeriesPath}`);
  const fundamentalsTimeSeriesFile = readFileSync(
    fundamentalsTimeSeriesPath,
    "utf-8"
  );

  // Extract FundamentalsTimeSeriesResult and related types
  fundamentalsTimeSeriesContent = fundamentalsTimeSeriesFile;
  fundamentalsTimeSeriesContent = fundamentalsTimeSeriesContent.replace(
    /import[^;]*;/g,
    ""
  );
  fundamentalsTimeSeriesContent = fundamentalsTimeSeriesContent.replace(
    /export type \* from[^;]*;/g,
    ""
  );
  fundamentalsTimeSeriesContent = fundamentalsTimeSeriesContent.replace(
    /export default function[\s\S]*?;/g,
    ""
  );
  fundamentalsTimeSeriesContent = fundamentalsTimeSeriesContent.replace(
    /export declare const[^;]*;/g,
    ""
  );
  // Remove function declarations completely
  fundamentalsTimeSeriesContent = fundamentalsTimeSeriesContent.replace(
    /export default function[\s\S]*?\{[\s\S]*?\}/g,
    ""
  );
  // Remove the large JSDoc block at the start (but keep type definitions)
  fundamentalsTimeSeriesContent = fundamentalsTimeSeriesContent.replace(
    /^\/\*\*[\s\S]*?\*\/\s*/m,
    ""
  );
  // Remove JSDoc comments that are malformed
  fundamentalsTimeSeriesContent = fundamentalsTimeSeriesContent.replace(
    /\/\*\*[\s\S]*?\*\/\s*docs for examples/g,
    ""
  );
  fundamentalsTimeSeriesContent = fundamentalsTimeSeriesContent.replace(
    /docs for examples[\s\S]*?@see/g,
    ""
  );
  // Remove source maps
  fundamentalsTimeSeriesContent = fundamentalsTimeSeriesContent.replace(
    /\/\/# sourceMappingURL=.*/g,
    ""
  );

  console.log("   ✅ Successfully extracted FundamentalsTimeSeriesResult");
} catch (error) {
  console.warn(
    "⚠️  Could not extract FundamentalsTimeSeriesResult:",
    error instanceof Error ? error.message : String(error)
  );
  console.warn(
    `   Attempted path: ${join(nodeModulesPath, "fundamentalsTimeSeries.d.ts")}`
  );
}

// Clean up the output
output = output.replace(/\n{3,}/g, "\n\n"); // Remove excessive newlines

// Fix interfaces with both 'extends' and index signatures (ts-to-zod limitation)
// Remove index signatures from interfaces that extend other interfaces
output = output.replace(
  /export interface (\w+)([^\{]*extends[^\{]*)\{([^}]*)\[key: string\]: unknown;([^}]*)\}/g,
  (match, name, extendsPart, before, after) => {
    // Remove the index signature but keep other properties
    const body = (before + after).trim();
    return `export interface ${name}${extendsPart} {${body}}`;
  }
);

// Handle interfaces with only index signature and extends
output = output.replace(
  /export interface (\w+)([^\{]*extends[^\{]*)\{\s*\[key: string\]: unknown;\s*\}/g,
  (match, name, extendsPart) => {
    return `export interface ${name}${extendsPart} {}`;
  }
);

// Remove index signatures from regular interfaces (keep them but make them optional via passthrough)
// Actually, let's keep index signatures but remove them from extends interfaces only
// The issue is specifically with extends + index signature combo

// Also fix union types with undefined that cause issues
// Convert: type X = Y | undefined to type X = Y (make it optional in the interface instead)
output = output.replace(/:\s*(\w+)\s*\|\s*undefined/g, ": $1 | null");

// Remove problematic Omit and Pick utility types (simplify them)
output = output.replace(
  /Omit<[^,>]+,\s*"[^"]+"\s*>/g,
  "Record<string, unknown>"
);
output = output.replace(
  /Pick<[^,>]+,\s*"[^"]+"\s*>/g,
  "Record<string, unknown>"
);

// Fix malformed interfaces with extends (missing newline after extends)
output = output.replace(/extends (\w+)\s+(\{)/g, "extends $1 {\n    ");

// Flatten FundPerformanceTrailingReturns extends PeriodRange to work around ts-to-zod limitation
// This interface causes validation issues, so we'll inline the PeriodRange properties
const periodRangeProps = `    asOfDate?: Date;
    ytd?: number;
    oneMonth?: number;
    threeMonth?: number;
    oneYear?: number;
    threeYear?: number;
    fiveYear?: number;
    tenYear?: number;`;

output = output.replace(
  /export interface FundPerformanceTrailingReturns extends PeriodRange \{([^}]*)\}/,
  `export interface FundPerformanceTrailingReturns {
    [key: string]: unknown;
${periodRangeProps}$1}`
);

// Remove function declarations that got through
output = output.replace(/export default function[\s\S]*?;/g, "");
output = output.replace(/export default function[\s\S]*?\{[\s\S]*?\}/g, "");

// Remove malformed JSDoc and duplicate content
output = output.replace(
  /docs for examples[\s\S]*?@see[\s\S]*?docs for examples/g,
  ""
);
output = output.replace(/\/\*\*[\s\S]*?\*\/\s*docs for examples/g, "");
output = output.replace(/\*\s*docs for examples[\s\S]*?\*\//g, "");
// Remove JSDoc blocks that contain function documentation (not type definitions)
output = output.replace(/\/\*\*[\s\S]*?Fetch historical[\s\S]*?\*\/\s*$/gm, "");
output = output.replace(/\*\*[\s\S]*?Fetch historical[\s\S]*?\*\//g, "");
// Remove duplicate {@link} patterns
output = output.replace(
  /\{@link[^}]+\}\s*\{@link[^}]+\}\s*\{@link[^}]+\}\s*\{@link[^}]+\}/g,
  ""
);
// Remove JSDoc that references functions
output = output.replace(
  /\/\*\*[\s\S]*?@returns[\s\S]*?@throws[\s\S]*?\*\/\s*$/gm,
  ""
);

// Remove source map comments
output = output.replace(/\/\/# sourceMappingURL=.*/g, "");

// Add FundamentalsTimeSeries content AFTER all cleanup is done
// This prevents the aggressive cleanup regexes from removing it
if (fundamentalsTimeSeriesContent) {
  output += "// FundamentalsTimeSeriesResult and related types\n";
  output += fundamentalsTimeSeriesContent;
  output += "\n\n";
}

// Add missing type definitions
if (!output.includes("type DateInMs")) {
  output = output.replace(
    /\/\/ QuoteSummaryResult and related types/,
    "// QuoteSummaryResult and related types\n\ntype DateInMs = number;\n"
  );
}

writeFileSync(outputFile, output, "utf-8");
console.log(`✅ Full type definitions extracted to: ${outputFile}`);
console.log("📋 Next: Run 'pnpm generate:schemas' to generate Zod schemas");
