from services.recommendation_evaluation import (
    average_precision_at_k,
    build_recommendation_explanation,
    coverage,
    evaluate_recommendations,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
)


def test_precision_at_k():
    recommended = ["event-1", "event-2", "event-3"]
    relevant = {"event-1", "event-3"}

    assert precision_at_k(recommended, relevant, k=3) == 2 / 3


def test_recall_at_k():
    recommended = ["event-1", "event-2", "event-3"]
    relevant = {"event-1", "event-3", "event-4"}

    assert recall_at_k(recommended, relevant, k=3) == 2 / 3


def test_average_precision_at_k():
    recommended = ["event-1", "event-2", "event-3"]
    relevant = {"event-1", "event-3"}

    assert average_precision_at_k(recommended, relevant, k=3) == (1 / 1 + 2 / 3) / 2


def test_ndcg_at_k_returns_valid_score():
    recommended = ["event-1", "event-2", "event-3"]
    relevant = {"event-1", "event-3"}

    score = ndcg_at_k(recommended, relevant, k=3)

    assert 0 <= score <= 1


def test_coverage():
    recommendations = {
        "user-1": ["event-1", "event-2"],
        "user-2": ["event-2", "event-3"],
    }
    catalog_items = ["event-1", "event-2", "event-3", "event-4"]

    assert coverage(recommendations, catalog_items) == 3 / 4


def test_evaluate_recommendations():
    recommendations = {
        "user-1": ["event-1", "event-2", "event-3"],
        "user-2": ["event-3", "event-4"],
    }
    ground_truth = {
        "user-1": {"event-1", "event-3"},
        "user-2": {"event-4"},
    }
    catalog_items = ["event-1", "event-2", "event-3", "event-4", "event-5"]

    result = evaluate_recommendations(recommendations, ground_truth, catalog_items, k=3)

    assert set(result.keys()) == {
        "precision_at_k",
        "recall_at_k",
        "map_at_k",
        "ndcg_at_k",
        "coverage",
    }
    assert 0 <= result["precision_at_k"] <= 1
    assert 0 <= result["recall_at_k"] <= 1
    assert 0 <= result["map_at_k"] <= 1
    assert 0 <= result["ndcg_at_k"] <= 1
    assert result["coverage"] == 4 / 5


def test_build_recommendation_explanation():
    explanation = build_recommendation_explanation(
        user_interests=["AI", "Hackathon", "Cloud"],
        event_tags=["ai", "startup", "cloud"],
        content_score=0.8,
        collaborative_score=0.5,
        content_weight=0.7,
    )

    assert explanation["matched_tags"] == ["ai", "cloud"]
    assert explanation["content_score"] == 0.8
    assert explanation["collaborative_score"] == 0.5
    assert explanation["final_score"] == 0.71
