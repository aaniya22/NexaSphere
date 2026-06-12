import os

import redis
from prometheus_client import Gauge

CELERY_QUEUE_DEPTH = Gauge(
    "celery_queue_depth",
    "Approximate Celery task queue depth (Redis list length)",
    ["queue"],
)


def collect_celery_queue_depth() -> None:
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    try:
        client = redis.from_url(redis_url)
        depth = client.llen("celery")
        CELERY_QUEUE_DEPTH.labels(queue="celery").set(depth)
    except Exception:
        CELERY_QUEUE_DEPTH.labels(queue="celery").set(-1)
