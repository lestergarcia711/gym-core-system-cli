export function splitSqlStatements(script) {
  const statements = [];
  const length = script.length;
  let current = '';
  let quote = null;
  let i = 0;

  const pushCurrent = () => {
    const statement = current.trim();
    if (statement) statements.push(statement);
    current = '';
  };

  while (i < length) {
    const ch = script[i];
    const next = script[i + 1];

    if (quote === null) {
      const isDashComment = ch === '-' && next === '-' && (i + 2 >= length || /\s/.test(script[i + 2]));
      if (isDashComment || ch === '#') {
        while (i < length && script[i] !== '\n') i++;
        continue;
      }
      if (ch === '/' && next === '*') {
        const end = script.indexOf('*/', i + 2);
        if (end === -1) throw new Error('El archivo SQL está incompleto o dañado (comentario sin cerrar).');
        i = end + 2;
        current += ' ';
        continue;
      }
      if (ch === '\\') {
        current += ch + (next ?? '');
        i += 2;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') {
        quote = ch;
        current += ch;
        i++;
        continue;
      }
      if (ch === ';') {
        pushCurrent();
        i++;
        continue;
      }
      current += ch;
      i++;
    } else {
      if (quote !== '`' && ch === '\\') {
        current += ch + (next ?? '');
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      current += ch;
      i++;
    }
  }

  if (quote !== null) throw new Error('El archivo SQL está incompleto o dañado (cadena sin cerrar).');
  if (current.trim()) throw new Error('El archivo SQL está incompleto o dañado (la última sentencia no termina en ";").');

  return statements;
}