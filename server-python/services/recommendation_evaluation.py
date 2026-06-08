from __future__ import annotations

import math
from typing import Dict, Iterable, List, Sequence, Set, Tuple


def _top_k(items: Sequence[str], k: int) -> List[str]:
    if k <= 0:
        return []
    return list(items[:k])


def precision_at_k(recommended: Sequence[str], relevant: Iterable[str], k: int = 5) -> float:
    top_items = _top_k(recommended, k)
    if not top_items:
        return 0.0

    relevant_set: Set[str] = set(relevant)
    hits = sum(1 for item in top_items if item in relevant_set)
    return hits / len(top_items)


def recall_at_k(recommended: Sequence[str], relevant: Iterable[str], k: int = 5) -> float:
    relevant_set: Set[str] = set(relevant)
    if not relevant_set:
        return 0.0

    top_items = _top_k(recommended, k)
    hits = sum(1 for item in top_items if item in relevant_set)
    return hits / len(relevant_set)


def average_precision_at_k(recommended: Sequence[str], relevant: Iterable[str], k: int = 5) -> float:
    relevant_set: Set[str] = set(relevant)
    if not relevant_set:
        return 0.0

    top_items = _top_k(recommended, k)
    score = 0.0
    hits = 0

    for index, item in enumerate(top_items, start=1):
        if item in relevant_set:
            hits += 1
            score += hits / index

    return score / min(len(relevant_set), k)


def ndcg_at_k(recommended: Sequence[str], relevant: Iterable[str], k: int = 5) -> float:
    relevant_set: Set[str] = set(relevant)
    if not relevant_set:
        return 0.0

    top_items = _top_k(recommended, k)

    dcg = 0.0
    for index, item in enumerate(top_items, start=1):
        if item in relevant_set:
            dcg += 1 / math.log2(index + 1)

    ideal_hits = min(len(relevant_set), k)
    ideal_dcg = sum(1 / math.log2(index + 1) for index in range(1, ideal_hits + 1))

    if ideal_dcg == 0:
        return 0.0

    return dcg / ideal_dcg


def coverage(recommendations: Dict[str, Sequence[str]], catalog_items: Iterable[str]) -> float:
    catalog_set: Set[str] = set(catalog_items)
    if not catalog_set:
        return 0.0

    recommended_items: Set[str] = set()
    for user_recommendations in recommendations.values():
        recommended_items.update(user_recommendations)

    return len(recommended_items & catalog_set) / len(catalog_set)


def evaluate_recommendations(
    recommendations: Dict[str, Sequence[str]],
    ground_truth: Dict[str, Iterable[str]],
    catalog_items: Iterable[str],
    k: int = 5,
) -> Dict[str, float]:
    users = [user_id for user_id in ground_truth if user_id in recommendations]

    if not users:
        return {
            "precision_at_k": 0.0,
            "recall_at_k": 0.0,
            "map_at_k": 0.0,
            "ndcg_at_k": 0.0,
            "coverage": coverage(recommendations, catalog_items),
        }

    precision_scores = []
    recall_scores = []
    map_scores = []
    ndcg_scores = []

    for user_id in users:
        recommended = recommendations[user_id]
        relevant = ground_truth[user_id]

        precision_scores.append(precision_at_k(recommended, relevant, k))
        recall_scores.append(recall_at_k(recommended, relevant, k))
        map_scores.append(average_precision_at_k(recommended, relevant, k))
        ndcg_scores.append(ndcg_at_k(recommended, relevant, k))

    return {
        "precision_at_k": sum(precision_scores) / len(users),
        "recall_at_k": sum(recall_scores) / len(users),
        "map_at_k": sum(map_scores) / len(users),
        "ndcg_at_k": sum(ndcg_scores) / len(users),
        "coverage": coverage(recommendations, catalog_items),
    }


def build_recommendation_explanation(
    user_interests: Iterable[str],
    event_tags: Iterable[str],
    content_score: float,
    collaborative_score: float,
    content_weight: float = 0.7,
) -> Dict[str, object]:
    user_interest_set = {interest.lower() for interest in user_interests}
    event_tag_set = {tag.lower() for tag in event_tags}
    matched_tags = sorted(user_interest_set & event_tag_set)

    collaborative_weight = 1 - content_weight
    final_score = (content_score * content_weight) + (collaborative_score * collaborative_weight)

    return {
        "matched_tags": matched_tags,
        "content_score": round(content_score, 4),
        "collaborative_score": round(collaborative_score, 4),
        "content_weight": round(content_weight, 4),
        "collaborative_weight": round(collaborative_weight, 4),
        "final_score": round(final_score, 4),
    }
