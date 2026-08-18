# GIE Mariama SAGNA — Instructions Claude Code

App de gestion (membres, terrains, logements, offres) — Vite + React + TypeScript + Supabase, déployée sur Vercel.

## Déploiement — autonomie accordée (19/08/2026)

L'utilisateur a explicitement demandé de gérer les prochains déploiements en autonomie, sans validation à chaque fois.

### Git / Vercel

- `git push` sur `master` est autorisé sans confirmation.
- ⚠️ **L'auto-deploy GitHub → Vercel ne se déclenche plus depuis le 24/04/2026** (constaté le 19/08/2026 : aucun déploiement Vercel ni webhook GitHub pour les commits poussés depuis, alors que le projet est bien lié en Git côté Vercel — cause exacte non identifiée, à vérifier un jour côté dashboard Vercel → Settings → Git si besoin de la restaurer).
- **En attendant, après chaque `git push` sur `master`, déclencher le déploiement manuellement via l'API REST Vercel** (le token `VERCEL_TOKEN` est dans `.env.local`) :

```bash
export VERCEL_TOKEN=$(grep VERCEL_TOKEN .env.local | cut -d= -f2)
SHA=$(git rev-parse HEAD)

curl -s -X POST "https://api.vercel.com/v13/deployments?teamId=team_3XvfJiqyPfISceMxZohHze3A" \
  -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"giemariamasagna\",\"project\":\"prj_LrAkC01b9FpQ5yy59sgkZ6PI3aIa\",\"target\":\"production\",\"gitSource\":{\"type\":\"github\",\"repoId\":1218093826,\"ref\":\"master\",\"sha\":\"$SHA\"}}"
```

Récupérer l'`id` (`dpl_...`) de la réponse, puis poller jusqu'à `"readyState":"READY"` :

```bash
curl -s "https://api.vercel.com/v13/deployments/<dpl_id>?teamId=team_3XvfJiqyPfISceMxZohHze3A" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | grep -o '"readyState":"[A-Z]*"'
```

**Ne jamais faire `vercel login`** avec ce token (ni aucun autre) — la session CLI Vercel est partagée entre tous les projets de la machine ([[feedback_vercel_cli_shared_auth]]). Toujours passer par `--token=...` sur la CLI ou par l'API REST directement (comme ci-dessus).

### Supabase — migrations de schéma

Le projet est lié en CLI (`supabase link --project-ref llgewoldnhkbqoplzlit`). Les credentials sont dans `.env.local` (gitignoré, jamais commité) :
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

**Workflow pour toute évolution de schéma :**

```bash
# 1. Créer une nouvelle migration
npx supabase migration new <nom_descriptif>

# 2. Écrire le SQL dans supabase/migrations/<timestamp>_<nom>.sql

# 3. Toujours vérifier en dry-run avant d'appliquer
export SUPABASE_ACCESS_TOKEN=$(grep SUPABASE_ACCESS_TOKEN .env.local | cut -d= -f2)
npx supabase db push --dry-run --password "$(grep SUPABASE_DB_PASSWORD .env.local | cut -d= -f2)"

# 4. Si le dry-run est cohérent, appliquer pour de vrai
npx supabase db push --password "$(grep SUPABASE_DB_PASSWORD .env.local | cut -d= -f2)"
```

Ne pas redemander confirmation pour `git push` ou `supabase db push` sur ce repo — l'autorisation est déjà durablement posée. **Toujours faire le `--dry-run` avant** de pousser une migration.

**⚠️ Docker n'est pas installé sur cette machine** : `supabase db pull` et `supabase db diff` ne fonctionnent pas (ils nécessitent un conteneur local). Pour inspecter l'état réel de la base sans Docker, utiliser l'API Management directement :

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/llgewoldnhkbqoplzlit/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"select ..."}'
```

**Historique des migrations :** `supabase/migrations/20260422163746_schema_initial.sql` et `20260423090147_offres.sql` sont des copies exactes de `supabase/schema.sql` et `supabase/migration_offres.sql` (anciens scripts appliqués manuellement via le SQL Editor avant la mise en place du CLI, le 19/08/2026). Ces deux fichiers ont été marqués `applied` via `supabase migration repair` **après vérification directe** (requête sur `information_schema.tables`, `pg_policies` et comptage de lignes) que le contenu était bien déjà live — jamais de `repair --status applied` à l'aveugle. Les fichiers `.sql` d'origine à la racine de `supabase/` sont conservés comme archive (annotés en tête de fichier) mais ne doivent plus être exécutés manuellement.
