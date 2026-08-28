# Migrations

These files are the schema. Everything the database does — the campus wall, the
handoff loop, the rate limits, the moderation queue — is here, not in the app.

They were applied to the hosted project through the Supabase API rather than the
CLI, so the numbering here is local and the project keeps its own timestamped
history. This is the mapping, in case the two ever need to be reconciled:

| file | applied as |
|---|---|
| 0001_init | 20260727180140 init |
| 0002_harden_rls | 20260727180422 harden_rls |
| 0004_rules_agreement | 20260826220011 rules_agreement |
| 0005_handoff_confirm | 20260826220024 handoff_confirm |
| 0006_listing_kinds | 20260826231017 listing_kinds |
| 0007_any_campus | 20260827040147 any_campus |
| 0008_preferred_spot | 20260827044455 preferred_spot |
| 0009_coarse_location | 20260827044655 coarse_location |
| 0010_carry_help | 20260827143413 carry_help |
| 0011_listing_schema_and_ratings | 20260828003925 swapup_listing_schema |
| 0012_carry_offers | 20260828032246 carry_offers |
| 0013_listing_photos_bucket | 20260828050450 listing_photos_bucket |
| 0014_founder_metrics | 20260828050547 founder_metrics |
| 0015_lock_down_rpc_surface | 20260828050850 lock_down_rpc_surface |
| 0016_rate_limits_and_reports | 20260828051434 rate_limits_and_reports |
| 0017_founder_moderation_queue | 20260828051457 founder_moderation_queue |
| 0018_rate_limit_message_and_actor | 20260828052045 rate_limit_message_and_actor |

`0003_day7_check` is a local-only helper and was never applied as its own
migration.

To read the authoritative history from the project itself:

```sql
select version, name from supabase_migrations.schema_migrations order by version;
```
