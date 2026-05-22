const fs = require('fs');

const path = 'src/database/schema/pg-enums.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace import { pgEnum } from "drizzle-orm/pg-core";
content = content.replace('import { pgEnum } from "drizzle-orm/pg-core";', 'import { varchar } from "drizzle-orm/pg-core";');

// Replace export const xyzEnum = pgEnum("xyz", [...]);
// with export const xyzEnum = (name: string) => varchar(name, { length: 50, enum: [...] });
content = content.replace(/export const (\w+) = pgEnum\("([^"]+)", \[\s*([^\]]+)\s*\]\);/g, (match, enumName, pgEnumName, values) => {
    return `export const ${enumName} = <T extends string>(name: string) => varchar(name, { length: 50, enum: [${values}] as [T, ...T[]] });`;
});

// Since the values might be multi-line, the above regex might miss some. 
// A more robust regex:
content = fs.readFileSync(path, 'utf8');
content = content.replace('import { pgEnum } from "drizzle-orm/pg-core";', 'import { varchar } from "drizzle-orm/pg-core";');

content = content.replace(/export const (\w+) = pgEnum\("([^"]+)", (\[[\s\S]*?\])\);/g, (match, enumName, pgEnumName, values) => {
    return `export const ${enumName} = <T extends string>(name: string) => varchar(name, { length: 60, enum: ${values} as unknown as readonly [string, ...string[]] });`;
});

fs.writeFileSync(path, content);
console.log('Rewrote pg-enums.ts successfully.');
