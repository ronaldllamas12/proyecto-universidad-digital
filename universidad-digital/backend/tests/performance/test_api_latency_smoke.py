from __future__ import annotations

from time import perf_counter
from typing import Sequence

import pytest

from tests.factories import RoleFactory, UserFactory


pytestmark = [pytest.mark.performance]


def _percentile(values: Sequence[float], percentile: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = int(round((len(ordered) - 1) * percentile))
    return ordered[index]


def _ms(seconds: float) -> float:
    return round(seconds * 1000, 2)


@pytest.mark.asyncio
async def test_login_latency_profile_p50_p95_p99(api_client, db):
    admin_role = RoleFactory(name="Administrador")
    admin_user = UserFactory(roles=[admin_role])
    db.flush()

    samples_ms: list[float] = []
    for _ in range(15):
        started = perf_counter()
        response = await api_client.post(
            "/auth/login",
            json={"email": admin_user.email, "password": "testpassword"},
        )
        elapsed_ms = _ms(perf_counter() - started)
        samples_ms.append(elapsed_ms)
        assert response.status_code == 200

    p50 = _percentile(samples_ms, 0.50)
    p95 = _percentile(samples_ms, 0.95)
    p99 = _percentile(samples_ms, 0.99)

    print(
        f"PERF login: p50={p50}ms p95={p95}ms p99={p99}ms "
        f"(n={len(samples_ms)})"
    )

    assert p50 <= 600
    assert p95 <= 1200
    assert p99 <= 1500


@pytest.mark.asyncio
async def test_protected_endpoints_latency_profile(api_client, authorized_client):
    endpoints = ["/auth/me", "/users", "/roles"]

    for endpoint in endpoints:
        samples_ms: list[float] = []
        for _ in range(10):
            started = perf_counter()
            response = await authorized_client.get(endpoint, follow_redirects=True)
            elapsed_ms = _ms(perf_counter() - started)
            samples_ms.append(elapsed_ms)
            assert response.status_code == 200

        p50 = _percentile(samples_ms, 0.50)
        p95 = _percentile(samples_ms, 0.95)
        p99 = _percentile(samples_ms, 0.99)

        print(
            f"PERF {endpoint}: p50={p50}ms p95={p95}ms p99={p99}ms "
            f"(n={len(samples_ms)})"
        )

        assert p95 <= 900
        assert p99 <= 1200


@pytest.mark.asyncio
async def test_auth_me_light_peak_burst(api_client, authorized_client):
    all_samples: list[float] = []
    for _ in range(5):
        for _ in range(8):
            started = perf_counter()
            response = await authorized_client.get("/auth/me", follow_redirects=True)
            elapsed_ms = _ms(perf_counter() - started)
            all_samples.append(elapsed_ms)
            assert response.status_code == 200

    p50 = _percentile(all_samples, 0.50)
    p95 = _percentile(all_samples, 0.95)
    p99 = _percentile(all_samples, 0.99)

    print(
        f"PERF /auth/me burst: p50={p50}ms p95={p95}ms p99={p99}ms "
        f"(n={len(all_samples)})"
    )

    assert p95 <= 1200
    assert p99 <= 1600


@pytest.mark.asyncio
@pytest.mark.stress
async def test_auth_me_sustained_high_stress_profile(authorized_client):
    all_samples: list[float] = []
    waves = 20
    requests_per_wave = 20

    for _ in range(waves):
        for _ in range(requests_per_wave):
            started = perf_counter()
            response = await authorized_client.get("/auth/me", follow_redirects=True)
            elapsed_ms = _ms(perf_counter() - started)
            all_samples.append(elapsed_ms)
            assert response.status_code == 200

    p50 = _percentile(all_samples, 0.50)
    p95 = _percentile(all_samples, 0.95)
    p99 = _percentile(all_samples, 0.99)

    print(
        f"PERF /auth/me sustained-stress: p50={p50}ms p95={p95}ms p99={p99}ms "
        f"(n={len(all_samples)}, waves={waves}, per_wave={requests_per_wave})"
    )

    assert p50 <= 800
    assert p95 <= 1700
    assert p99 <= 2200
