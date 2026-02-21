import sys
from pathlib import Path
import os

os.environ.setdefault("CELERY_TASK_ALWAYS_EAGER", "true")
os.environ.setdefault("RUNTIME_BROKER_URL", "memory://")
os.environ.setdefault("RUNTIME_RESULT_BACKEND", "cache+memory://")

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
