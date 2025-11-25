# Scripts

## Set Admin

Torna um usuário admin pelo email.

### Uso

```bash
npm run set-admin <email>
```

### Exemplo

```bash
npm run set-admin admin@example.com
```

Ou diretamente com ts-node:

```bash
ts-node scripts/set-admin.ts admin@example.com
```

## Alternativa: SQL Direto

Se preferir fazer direto no banco de dados:

```sql
UPDATE users SET role = 'admin' WHERE email = 'seu-email@example.com';
```

