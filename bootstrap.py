from pathlib import Path
from datetime import date

ROOT = Path.cwd()
OWNER = "Jake Allen"
PROJECT = "AI Operator OS"
VERSION = "0.1.0"
TODAY = date.today().isoformat()

folders = [
    "app", "app/dashboard", "app/pages", "app/components", "app/layouts", "app/assets",
    "backend", "agents", "modules", "integrations", "docs", "memory", "data",
    "roadmap", "scripts", "tests", "assets", "prompts"
]

files = {
"README.md": f"""# {PROJECT}\n\nAI Operator OS is a local-first AI business operating system designed to help one owner run AI-powered businesses while keeping human approval over important decisions.\n\n## Current Version\n\n{VERSION}\n\n## North Star\n\nMaximize owner profit while minimizing owner time.\n\n## Start Here\n\n1. Read `docs/VISION.md`\n2. Read `docs/ARCHITECTURE.md`\n3. Review `docs/ROADMAP.md`\n4. Continue development through issues and sprints\n""",
"VERSION.md": f"""# Version\n\nCurrent Version: {VERSION}\n\nLast Updated: {TODAY}\n\n## Version Rules\n\n- 0.x = foundation and development builds\n- 1.0 = first stable release\n- Patch updates fix bugs\n- Minor updates add modules\n- Major updates change architecture\n""",
"CHANGELOG.md": f"""# Changelog\n\n## {VERSION} - {TODAY}\n\n### Added\n\n- Project bootstrap generator\n- Core folder structure\n- Foundation documentation\n- Roadmap, memory, and development standards\n""",
".gitignore": """# Python\n__pycache__/\n*.pyc\n.env\nvenv/\n.venv/\n\n# OS\n.DS_Store\nThumbs.db\n\n# Secrets\n*.key\n*.pem\nsecrets/\n.env.local\n\n# Logs\n*.log\nlogs/\n""",
"docs/VISION.md": f"""# AI Operator OS Vision\n\nVersion: {VERSION}\nOwner: {OWNER}\nSource of Truth: GitHub\nWorking Office: ChatGPT Project\nLast Updated: {TODAY}\n\n## North Star\n\nAI Operator OS exists to maximize owner profit while minimizing owner time.\n\n## Mission\n\nBuild a business operating system that helps a single owner discover opportunities, make better decisions, automate repetitive work, and maximize profit through AI-assisted workflows while maintaining complete human control.\n\n## Core Principles\n\n1. Profit over complexity.\n2. Human approval for all high-impact actions.\n3. Local-first until cloud creates positive ROI.\n4. Minimize recurring costs.\n5. Maintain one permanent evolving codebase.\n6. Every feature must satisfy at least one:\n   - Increase revenue\n   - Save time\n   - Improve decision quality\n   - Automate repetitive work\n7. Build for long-term maintainability, not short-term demos.\n\n## Philosophy\n\nAI Operator OS is not designed to replace the owner. It is designed to multiply the owner's effectiveness.\n\nAI prepares, recommends, drafts, analyzes, and automates repetitive work. The owner approves direction.\n\n## Long-Term Vision\n\nAI Operator OS becomes the central operating system for every business the owner creates.\n\nIt coordinates:\n\n- Business strategy\n- Research\n- Development\n- Sales\n- Delivery\n- Analytics\n- Knowledge management\n\nThe owner remains CEO. AI acts as specialized departments that continuously produce recommendations, draft work, analyze results, and execute approved workflows.\n\n## Success Metrics\n\n### Financial\n\n- Monthly revenue\n- Monthly profit\n- Operating cost\n- Profit margin\n\n### Automation\n\n- Hours saved\n- Tasks automated\n- Approvals completed\n\n### Business\n\n- Leads generated\n- Clients acquired\n- Projects delivered\n- Owner time required\n- System health\n\n## Constraints\n\n- No feature bloat\n- No unnecessary subscriptions\n- No duplicate systems\n- No multiple codebases\n- No automation without approval for critical actions\n- No feature may increase monthly operating costs unless expected ROI is positive\n""",
"docs/ARCHITECTURE.md": f"""# Architecture\n\nVersion: {VERSION}\nLast Updated: {TODAY}\n\n## Operating Model\n\nGitHub = Brain\nChatGPT Project = Office\nCodex = Developer\nJake = CEO\n\n## System Structure\n\nAI Operator OS is local-first. The first version runs while the owner's computer is on. Future cloud workers are allowed only when ROI is positive.\n\n## Main Departments\n\n- CEO\n- Development\n- Money\n- Research\n- Sales\n- Delivery\n- Analytics\n- Memory\n- Settings\n\n## Approval Architecture\n\nAI may research, draft, analyze, and prepare work. High-impact actions wait in the Approval Queue before execution.\n\nHigh-impact actions include:\n\n- Sending outreach\n- Spending money\n- Changing pricing\n- Signing contracts\n- Deleting data\n- Connecting new services\n- Sending client deliverables\n""",
"docs/ROADMAP.md": f"""# Roadmap\n\nVersion: {VERSION}\nLast Updated: {TODAY}\n\n## Sprint 0.1 - Foundation\n\nGoal: Build the foundation of the OS before building revenue automation.\n\n### Deliverables\n\n- [x] GitHub repository\n- [x] ChatGPT Project\n- [x] Bootstrap Generator\n- [ ] Dashboard\n- [ ] CEO Department\n- [ ] Development Department\n- [ ] Settings\n- [ ] Memory\n- [ ] Roadmap UI\n- [ ] Approval Queue\n- [ ] Cost Tracker\n\n## Sprint 0.2 - Business Builder\n\n- [ ] New Business wizard\n- [ ] Business profile templates\n- [ ] Department generator\n- [ ] Prompt generator\n\n## Sprint 0.3 - Research Department\n\n- [ ] Opportunity Finder\n- [ ] Competitor Research\n- [ ] Offer Builder\n\n## Sprint 0.4 - Sales Department\n\n- [ ] Lead tracker\n- [ ] Outreach drafts\n- [ ] CRM\n- [ ] Follow-up queue\n\n## Sprint 1.0 - First Revenue\n\nGoal: Use AI Operator OS to help land the first paying client.\n""",
"docs/PROJECT_MEMORY.md": f"""# Project Memory\n\nVersion: {VERSION}\nLast Updated: {TODAY}\n\n## Current State\n\nAI Operator OS has a GitHub repository, a ChatGPT Project office, and a bootstrap generator.\n\n## Active Sprint\n\nSprint 0.1 - Foundation\n\n## Current Rules\n\n- GitHub is the brain.\n- ChatGPT Project is the office.\n- Codex is the developer.\n- Jake is the CEO.\n- One permanent codebase.\n- Manual approval first.\n- Keep fixed costs below $30/month until revenue.\n\n## Known Constraints\n\n- No direct automatic GitHub push from ChatGPT chat.\n- Local-first during early build.\n- AI drafts before it executes.\n\n## Next Priorities\n\n1. Commit bootstrap foundation.\n2. Build dashboard shell.\n3. Build Development Department.\n4. Build Approval Queue.\n""",
"docs/DEVELOPMENT.md": f"""# Development Rules\n\nVersion: {VERSION}\nLast Updated: {TODAY}\n\n## Roles\n\n- Jake: CEO and final approver\n- ChatGPT Project: CTO, architect, and product manager\n- Codex: developer\n- GitHub: source of truth\n\n## Development Workflow\n\n1. Create issue\n2. Define business reason\n3. Design architecture\n4. Implement code\n5. Test\n6. Review\n7. Commit\n8. Update roadmap, changelog, and project memory\n\n## Feature Rule\n\nEvery feature must satisfy at least one:\n\n- Make money\n- Save time\n- Improve decisions\n- Automate repetitive work\n\n## Cost Rule\n\nNo feature may add recurring cost unless expected ROI is positive.\n\n## Approval Rule\n\nNo AI action that impacts clients, money, public communication, or data deletion can execute without human approval.\n""",
"docs/BUSINESS_STRATEGY.md": f"""# Business Strategy\n\nVersion: {VERSION}\nLast Updated: {TODAY}\n\n## First Business Goal\n\nUse AI Operator OS to help generate the first $100 in revenue before adding paid infrastructure.\n\n## Preferred Early Revenue Models\n\n- AI lead generation service\n- Local business website audit\n- AI automation setup\n- Short-form content repurposing\n- Resume and job application assistant\n\n## Early Rule\n\nManual approval mode until the system has helped generate at least $1,000.\n""",
"docs/CODING_STANDARDS.md": f"""# Coding Standards\n\nVersion: {VERSION}\nLast Updated: {TODAY}\n\n## Standards\n\n- Simple before complex\n- Readable before clever\n- Modular structure\n- Clear file names\n- No duplicated logic\n- No hidden automation\n- Every critical action must be logged\n- Every risky action must require approval\n\n## Documentation\n\nUpdate documentation whenever behavior changes.\n""",
"roadmap/ISSUES.md": f"""# Issues\n\n## Issue #0001 - Project Bootstrap Generator\n\nStatus: Complete\nPriority: Critical\nReason: Creates the foundation automatically.\n\n## Issue #0002 - Dashboard Shell\n\nStatus: Backlog\nPriority: Critical\nReason: Main control center for the owner.\n\n## Issue #0003 - Development Department\n\nStatus: Backlog\nPriority: High\nReason: Tracks sprints, issues, and development progress.\n\n## Issue #0004 - Approval Queue\n\nStatus: Backlog\nPriority: Critical\nReason: Keeps the owner in control.\n""",
"scripts/README.md": "# Scripts\n\nAutomation and setup scripts live here.\n",
"app/README.md": "# App\n\nFrontend application files live here.\n",
"backend/README.md": "# Backend\n\nBackend services will live here.\n",
"agents/README.md": "# Agents\n\nAI agent prompts, roles, and workflows live here.\n",
"integrations/README.md": "# Integrations\n\nExternal integrations such as Gmail, Google Sheets, n8n, Stripe, and Claude live here.\n",
"memory/README.md": "# Memory\n\nCompany memory files and knowledge stores live here.\n",
"data/README.md": "# Data\n\nLocal data storage lives here. Do not commit secrets.\n",
"tests/README.md": "# Tests\n\nTest files live here.\n",
"prompts/README.md": "# Prompts\n\nReusable system prompts and agent prompts live here.\n",
"modules/README.md": "# Modules\n\nBusiness modules and OS departments live here.\n",
}

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.name == "README.md" and path.parent == ROOT:
        # Preserve existing README by backing it up once.
        backup = ROOT / "README.original.md"
        if not backup.exists():
            backup.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    path.write_text(content, encoding="utf-8")

print("AI Operator OS Bootstrap Generator")
print("Root:", ROOT)

for folder in folders:
    (ROOT / folder).mkdir(parents=True, exist_ok=True)

for name, content in files.items():
    write_file(ROOT / name, content)

print("\nBootstrap complete.")
print("Created foundation folders and documentation.")
print("\nNext steps:")
print("1. Open GitHub Desktop")
print("2. Review changed files")
print("3. Commit with: Bootstrap AI Operator OS foundation")
print("4. Push origin")
