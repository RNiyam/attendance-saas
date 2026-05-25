const fs = require('fs');
const path = 'src/database/schema/pg-enums.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/export const (\w+) = <T extends string>\(name: string\) => varchar\(name, { length: 60, enum: (\[[\s\S]*?\]) as unknown as readonly \[string, \.\.\.string\[\]\] }\);/g, (match, enumName, values) => {
    const cleanValues = values.replace(/\s+/g, ' ');
    return `export const ${enumName} = (name: string) => varchar(name, { length: 60, enum: ${values} as ${cleanValues} });`;
});

fs.writeFileSync(path, content);
console.log('Fixed TS string literal inference.');
