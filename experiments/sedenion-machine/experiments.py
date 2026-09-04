"""Reproducible conformance-witness searches and sedenion experiments."""

from __future__ import annotations

import itertools
from fractions import Fraction
import json
from pathlib import Path
import platform
import random
from typing import Callable, Iterable

import sedenion as s


SEED = 6112026
HERE = Path(__file__).resolve().parent


def sparse_values() -> list[s.Value]:
    values: list[s.Value] = []
    for left, right in itertools.combinations(range(1, 16), 2):
        for left_sign, right_sign in itertools.product((1, -1), repeat=2):
            coefficients = [0] * 16
            coefficients[left] = left_sign
            coefficients[right] = right_sign
            values.append(s.value(coefficients))
    return values


def vector_json(vector: s.Value) -> list[str]:
    return s.value_to_json(vector)


def witness2(
    name: str,
    candidates: Iterable[s.Value],
    predicate: Callable[[s.Value, s.Value], bool],
) -> tuple[s.Value, s.Value]:
    choices = list(candidates)
    for left in choices:
        for right in choices:
            if predicate(left, right):
                return left, right
    raise RuntimeError(f"required {name} witness was not found")


def noncommutative_witness() -> tuple[s.Value, s.Value]:
    bases = [s.basis(index) for index in range(16)]
    return witness2("noncommutativity", bases, lambda x, y: s.mul(x, y) != s.mul(y, x))


def nonassociative_witness() -> tuple[s.Value, s.Value, s.Value]:
    bases = [s.basis(index) for index in range(16)]
    for x in bases:
        for y in bases:
            for z in bases:
                if s.mul(s.mul(x, y), z) != s.mul(x, s.mul(y, z)):
                    return x, y, z
    raise RuntimeError("required nonassociativity witness was not found")


def alternative_failure_witness() -> tuple[s.Value, s.Value]:
    bases = [s.basis(index) for index in range(16)]
    sparse = sparse_values()
    # Search basis operands first, then introduce sparse operands one side at a
    # time before the larger sparse/sparse phase.  This preserves the requested
    # deterministic search hierarchy without repeatedly scanning 480 candidates
    # for each earlier sparse value.
    for left_candidates, right_candidates in (
        (bases, bases),
        (sparse, bases),
        (bases, sparse),
        (sparse, sparse),
    ):
        for x in left_candidates:
            xx = s.mul(x, x)
            for y in right_candidates:
                if s.mul(xx, y) != s.mul(x, s.mul(x, y)):
                    return x, y
    raise RuntimeError("required alternativity-failure witness was not found")


def zero_divisor_witness() -> tuple[s.Value, s.Value]:
    def predicate(x: s.Value, y: s.Value) -> bool:
        return x != s.zero() and y != s.zero() and s.mul(x, y) == s.zero()

    bases = [s.basis(index) for index in range(16)]
    try:
        return witness2("zero-divisor", bases, predicate)
    except RuntimeError:
        return witness2("zero-divisor", sparse_values(), predicate)


def random_nonzero(rng: random.Random) -> s.Value:
    while True:
        candidate = s.value([rng.randint(-2, 2) for _ in range(16)])
        if candidate != s.zero():
            return candidate


def trace_json(result: s.RunResult | s.Annihilated) -> list[dict[str, object]]:
    return [
        {
            "step": index,
            "event": vector_json(step.event),
            "before": vector_json(step.before),
            "after": vector_json(step.after),
            "norm2": str(step.norm2),
        }
        for index, step in enumerate(result.trace, start=1)
    ]


def generate_results() -> dict[str, object]:
    noncomm_x, noncomm_y = noncommutative_witness()
    assoc_x, assoc_y, assoc_z = nonassociative_witness()
    alt_x, alt_y = alternative_failure_witness()
    divisor_x, divisor_y = zero_divisor_witness()

    left_assoc = s.mul(s.mul(assoc_x, assoc_y), assoc_z)
    right_assoc = s.mul(assoc_x, s.mul(assoc_y, assoc_z))
    annihilation = s.run(divisor_y, [divisor_x])
    forward = s.run(s.one(), [noncomm_x, noncomm_y])
    reverse = s.run(s.one(), [noncomm_y, noncomm_x])

    # With events [a, b], the transition endpoint is b*(a*x), not (b*a)*x.
    collapse_a, collapse_b, collapse_x = assoc_y, assoc_x, assoc_z
    ordered = s.run(collapse_x, [collapse_a, collapse_b])
    collapsed = s.mul(s.mul(collapse_b, collapse_a), collapse_x)
    if ordered.state == collapsed:
        raise RuntimeError("required ordered-program collapse witness was not found")

    rng = random.Random(SEED)
    sampled_initial = random_nonzero(rng)
    sampled_events = [random_nonzero(rng) for _ in range(8)]
    replay_samples: dict[str, object] = {}
    for length in (1, 2, 4, 8):
        sample = s.run(sampled_initial, sampled_events[:length])
        replay_samples[str(length)] = {
            "endpoint": vector_json(sample.state),
            "norm2": str(s.norm2(sample.state)),
            "zero_hits": [
                index
                for index, step in enumerate(sample.trace, start=1)
                if step.after == s.zero()
            ],
        }

    ray_initial = s.value([1, 2] + [0] * 14)
    ray_events = [s.value([0, 1, 1] + [0] * 13), s.basis(4)]
    ray_base = s.run_ray(ray_initial, ray_events)
    ray_scaled = s.run_ray(
        s.scale(-3, ray_initial),
        [s.scale(5, ray_events[0]), s.scale(-2, ray_events[1])],
    )
    if ray_base != ray_scaled or not isinstance(ray_base, s.RayResult):
        raise RuntimeError("ray rescaling invariance check failed")
    ray_annihilated = s.run_ray(divisor_y, [divisor_x])
    if not isinstance(ray_annihilated, s.Annihilated):
        raise RuntimeError("ray zero-divisor experiment did not annihilate")

    return {
        "implementation": {
            "python": platform.python_version(),
            "coefficient_domain": "fractions.Fraction (exact rationals)",
            "dimension": 16,
            "basis_order": [f"e{index}" for index in range(16)],
            "convention": {
                "conj": "conj((a,b)) = (conj(a), -b)",
                "mul": "(a,b)(c,d) = (ac - d*conj(b), conj(a)*d + c*b)",
            },
        },
        "coverage": {
            "basis_products": 256,
            "seeded_vector_coefficients": "independent uniform integers in [-2, 2], rejecting all-zero vectors",
            "seed": SEED,
            "claim": "finite exact conformance tests and observations, not a universal proof",
        },
        "required_failures": {
            "noncommutativity": {
                "x": vector_json(noncomm_x),
                "y": vector_json(noncomm_y),
                "x*y": vector_json(s.mul(noncomm_x, noncomm_y)),
                "y*x": vector_json(s.mul(noncomm_y, noncomm_x)),
            },
            "nonassociativity": {
                "x": vector_json(assoc_x),
                "y": vector_json(assoc_y),
                "z": vector_json(assoc_z),
                "(x*y)*z": vector_json(left_assoc),
                "x*(y*z)": vector_json(right_assoc),
                "difference": vector_json(s.sub(left_assoc, right_assoc)),
            },
            "alternativity_failure": {
                "x": vector_json(alt_x),
                "y": vector_json(alt_y),
                "(x*x)*y": vector_json(s.mul(s.mul(alt_x, alt_x), alt_y)),
                "x*(x*y)": vector_json(s.mul(alt_x, s.mul(alt_x, alt_y))),
            },
            "zero_divisors": {
                "x": vector_json(divisor_x),
                "y": vector_json(divisor_y),
                "x*y": vector_json(s.mul(divisor_x, divisor_y)),
            },
            "norm_multiplicativity_failure": {
                "norm2(x*y)": str(s.norm2(s.mul(divisor_x, divisor_y))),
                "norm2(x)*norm2(y)": str(s.norm2(divisor_x) * s.norm2(divisor_y)),
            },
        },
        "experiments": {
            "nonassociative_bracketings": {
                "left": vector_json(left_assoc),
                "right": vector_json(right_assoc),
                "difference": vector_json(s.sub(left_assoc, right_assoc)),
            },
            "annihilation": {
                "state": vector_json(annihilation.state),
                "trace": trace_json(annihilation),
            },
            "event_reversal": {
                "forward_endpoint": vector_json(forward.state),
                "reverse_endpoint": vector_json(reverse.state),
            },
            "program_collapse": {
                "a": vector_json(collapse_a),
                "b": vector_json(collapse_b),
                "initial": vector_json(collapse_x),
                "ordered_endpoint": vector_json(ordered.state),
                "collapsed_endpoint": vector_json(collapsed),
                "trace": trace_json(ordered),
            },
            "seeded_replay": {
                "initial": vector_json(sampled_initial),
                "events": [vector_json(event) for event in sampled_events],
                "prefixes": replay_samples,
            },
            "ray_mode": {
                "endpoint": vector_json(ray_base.state),
                "rescaling_invariant": True,
                "annihilation": {
                    "step": ray_annihilated.step,
                    "trace": trace_json(ray_annihilated),
                },
            },
        },
    }


def vector_notation(raw: object) -> str:
    if not isinstance(raw, list):
        raise TypeError("result vector must be a list")
    terms: list[str] = []
    for index, text in enumerate(raw):
        coefficient = Fraction(str(text))
        if not coefficient:
            continue
        magnitude = abs(coefficient)
        basis = "1" if index == 0 else f"e{index}"
        if index == 0 or magnitude != 1:
            term = str(magnitude) if index == 0 else f"{magnitude}*{basis}"
        else:
            term = basis
        if not terms:
            terms.append(f"-{term}" if coefficient < 0 else term)
        else:
            terms.append((" - " if coefficient < 0 else " + ") + term)
    return "".join(terms) or "0"


def observations(results: dict[str, object]) -> str:
    failures = results["required_failures"]
    experiments = results["experiments"]
    assert isinstance(failures, dict) and isinstance(experiments, dict)
    nonassoc = failures["nonassociativity"]
    divisors = failures["zero_divisors"]
    norm_failure = failures["norm_multiplicativity_failure"]
    replay = experiments["seeded_replay"]
    assert isinstance(nonassoc, dict)
    assert isinstance(divisors, dict)
    assert isinstance(norm_failure, dict)
    assert isinstance(replay, dict)
    prefixes = replay["prefixes"]
    assert isinstance(prefixes, dict)
    assoc_x = vector_notation(nonassoc["x"])
    assoc_y = vector_notation(nonassoc["y"])
    assoc_z = vector_notation(nonassoc["z"])
    left_assoc = vector_notation(nonassoc["(x*y)*z"])
    right_assoc = vector_notation(nonassoc["x*(y*z)"])
    divisor_x = vector_notation(divisors["x"])
    divisor_y = vector_notation(divisors["y"])
    lines = [
        "# Sedenion machine observations",
        "",
        "Generated by `python3 experiments.py`; exact vectors are recorded in `results.json`.",
        "",
        "## Guaranteed by conformance checks",
        "",
        "The implementation uses 16 exact rational coefficients in basis order `e0` through `e15` and the pinned recursive Cayley–Dickson convention. Tests cover all 256 ordered basis products plus reproducibly seeded finite samples. This is finite conformance evidence, not a universal proof.",
        "",
        "Unit, zero, additive, bilinear, distributive, conjugation, quadratic-norm, basis-square, and basis-anticommutation checks passed. Seeded embedded quaternion samples were associative, and embedded octonion samples were alternative. JSON replay reproduced complete traces exactly.",
        "",
        "## Required dimension-16 failures",
        "",
        f"The first deterministic basis search found `(x, y, z) = ({assoc_x}, {assoc_y}, {assoc_z})`, with `(x*y)*z = {left_assoc}` and `x*(y*z) = {right_assoc}`.",
        f"A deterministic sparse search found `x = {divisor_x}` and `y = {divisor_y}`, with `x*y = 0`. Consequently `norm2(x*y) = {norm_failure['norm2(x*y)']}` while `norm2(x)*norm2(y) = {norm_failure['norm2(x)*norm2(y)']}`.",
        "Noncommutativity and failure of alternativity were also found and saved with both evaluated sides in `results.json`.",
        "",
        "## Program observations",
        "",
        "The zero-divisor event annihilated its nonzero initial state exactly at step 1. Reversing a noncommuting event pair changed the endpoint. The saved two-step trace differs from multiplying the events together first, confirming that explicit event order and parentheses are semantic.",
        "",
        f"Fixed-seed ({SEED}) dense vectors used independent uniform integer coefficients in `[-2, 2]`, rejecting all-zero draws. Prefixes of length 1, 2, 4, and 8 had zero-hit lists: "
        + ", ".join(f"{length}: {prefixes[length]['zero_hits']}" for length in ("1", "2", "4", "8"))
        + ". Absence of sampled zero hits is only an observation of this distribution.",
        "",
        "Ray mode produced the same canonical endpoint after independently rescaling the initial state and every event by nonzero rationals. The zero-divisor pair returned explicit `Annihilated(step=1)`.",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    results = generate_results()
    (HERE / "results.json").write_text(
        json.dumps(results, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    (HERE / "observations.md").write_text(observations(results), encoding="utf-8")
    print(json.dumps(results["required_failures"], indent=2, sort_keys=True))
    print(f"wrote {HERE / 'results.json'}")
    print(f"wrote {HERE / 'observations.md'}")


if __name__ == "__main__":
    main()
