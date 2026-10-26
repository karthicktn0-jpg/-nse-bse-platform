import os
from pathlib import Path
from datetime import datetime

ROOT_DIR = Path(r"D:\Projects\nse-bse-platform")
OUTPUT_FILE = ROOT_DIR / "PROJECT_FULL_SOURCE_CODE_REPORT.md"

# List of files in logical presentation order
FILES = [
    # --- Project Info & Config ---
    "backend/requirements.txt",
    "backend/.env.example",
    "backend/run.py",
    "backend/app/config.py",
    "backend/app/database.py",
    "backend/app/main.py",

    # --- Data Models ---
    "backend/app/models/instrument.py",

    # --- Core Backend Services ---
    "backend/app/services/instrument_service.py",
    "backend/app/services/live_quote_fetcher.py",
    "backend/app/services/market_data_service.py",
    "backend/app/services/prediction_service.py",
    "backend/app/services/ai_analyst_service.py",
    "backend/app/services/derivatives_service.py",
    "backend/app/services/analytics_service.py",
    "backend/app/services/universe_service.py",
    "backend/app/services/ml_model_service.py",

    # --- Sync Architecture & Exchange Providers ---
    "backend/app/sync/provider_base.py",
    "backend/app/sync/kite_provider.py",
    "backend/app/sync/upstox_provider.py",
    "backend/app/sync/change_detector.py",
    "backend/app/sync/sync_service.py",

    # --- FastAPI API Routers ---
    "backend/app/routers/instruments.py",
    "backend/app/routers/prediction.py",
    "backend/app/routers/ai_copilot.py",
    "backend/app/routers/market_data.py",
    "backend/app/routers/derivatives.py",
    "backend/app/routers/universes.py",
    "backend/app/routers/models_lab.py",
    "backend/app/routers/sync.py",

    # --- Frontend Config & Core ---
    "frontend/package.json",
    "frontend/vite.config.ts",
    "frontend/tailwind.config.js",
    "frontend/src/main.tsx",
    "frontend/src/App.tsx",
    "frontend/src/index.css",
    "frontend/src/types/index.ts",
    "frontend/src/api/client.ts",

    # --- Frontend Components ---
    "frontend/src/components/Navbar.tsx",
    "frontend/src/components/AllStocksTable.tsx",
    "frontend/src/components/PredictionView.tsx",
    "frontend/src/components/StockAiModal.tsx",
    "frontend/src/components/FloatingAiButton.tsx",
    "frontend/src/components/InstrumentDetailModal.tsx",
    "frontend/src/components/OptionChainView.tsx",
    "frontend/src/components/FuturesDashboard.tsx",
    "frontend/src/components/SearchBarModal.tsx",
    "frontend/src/components/BrokerSettingsModal.tsx",
    "frontend/src/components/SyncManagerView.tsx",
    "frontend/src/components/UniverseManagerView.tsx",
    "frontend/src/components/ModelLabView.tsx",

    # --- Automation Scripts ---
    "start.bat",
    "setup_new_pc.bat",
    "start.sh",
    "setup_new_pc.sh"
]

def get_language(filepath: str) -> str:
    ext = os.path.splitext(filepath)[1].lower()
    mapping = {
        ".py": "python",
        ".ts": "typescript",
        ".tsx": "tsx",
        ".js": "javascript",
        ".json": "json",
        ".css": "css",
        ".bat": "batch",
        ".sh": "bash",
        ".env": "env",
        ".example": "env",
        ".txt": "text"
    }
    return mapping.get(ext, "text")

lines = []
lines.append("# PROJECT SOURCE CODE COMPREHENSIVE REPORT")
lines.append(f"**Project Name:** NSE & BSE Full Market Coverage Financial Terminal with AI Copilot  ")
lines.append(f"**Date Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  ")
lines.append(f"**Architecture:** FastAPI (Python 3.10+) Backend + React / TypeScript / Vite Frontend + SQLite Master Database  ")
lines.append(f"**Total Source Files Documented:** {len(FILES)}  ")
lines.append("\n---\n")

lines.append("## 📑 Table of Contents\n")
for idx, f in enumerate(FILES, 1):
    anchor = f.replace('/', '').replace('\\', '').replace('.', '').replace('-', '').replace('_', '').lower()
    lines.append(f"{idx}. [{f}](#file-{idx}-{anchor})")
lines.append("\n---\n")

total_code_lines = 0

for idx, rel_path in enumerate(FILES, 1):
    full_path = ROOT_DIR / rel_path
    anchor = rel_path.replace('/', '').replace('\\', '').replace('.', '').replace('-', '').replace('_', '').lower()
    lang = get_language(rel_path)

    lines.append(f"### <a id=\"file-{idx}-{anchor}\"></a> File {idx}: `{rel_path}`\n")
    if not full_path.exists():
        lines.append(f"> *File not found on disk at {full_path}*\n")
        continue

    try:
        content = full_path.read_text(encoding="utf-8")
    except Exception:
        try:
            content = full_path.read_text(encoding="latin-1")
        except Exception as e:
            content = f"Error reading file: {e}"

    file_lines = content.count('\n') + 1
    total_code_lines += file_lines

    lines.append(f"- **Path:** `{rel_path}`")
    lines.append(f"- **Lines of Code:** {file_lines}")
    lines.append(f"- **Language:** `{lang}`\n")
    lines.append(f"```{lang}")
    lines.append(content)
    lines.append("```\n")
    lines.append("---\n")

lines.insert(5, f"**Total Lines of Source Code:** {total_code_lines:,} lines  ")

OUTPUT_FILE.write_text("\n".join(lines), encoding="utf-8")
print(f"Report generated successfully at: {OUTPUT_FILE}")
print(f"Files included: {len(FILES)}, Total Code Lines: {total_code_lines:,}")
