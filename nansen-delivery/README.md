# nansen-delivery

Project delivery and operations tools for Nansen. Helps project managers and client directors track budget health, retainer utilization, and team capacity.

## Skills

| Skill | Description |
|-------|-------------|
| `budget-pulse` | Monthly retainer budget health check. Shows pace (hot/cool/on-track), per-person breakdowns, and weekly activity. Posts to #budget-pulse Slack channel. |

## Dependencies

- **Scoro** (MCP connector) - project data, tasks, time entries, users
- **Slack** (MCP connector) - optional, for posting reports to #budget-pulse

## Who This Is For

- Client directors (portfolio view of retainer health)
- Project managers (detailed per-project burn tracking)
- Team leads (utilization and activity visibility)
