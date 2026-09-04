from fractions import Fraction
import json
import random
import unittest

import sedenion as s


def random_value(rng: random.Random, active: int = s.DIMENSION) -> s.Value:
    coefficients = [rng.randint(-2, 2) if index < active else 0 for index in range(16)]
    return s.value(coefficients)


class ArithmeticTests(unittest.TestCase):
    def setUp(self) -> None:
        self.rng = random.Random(6112026)

    def test_constructors_and_validation(self) -> None:
        self.assertEqual(s.one(), s.basis(0))
        self.assertEqual(s.zero(), s.value([0] * 16))
        self.assertEqual(s.basis(15)[15], 1)
        with self.assertRaisesRegex(ValueError, "16 coefficients"):
            s.value([0] * 15)
        with self.assertRaisesRegex(ValueError, "not a valid rational"):
            s.value(["not-a-fraction"] + [0] * 15)
        with self.assertRaisesRegex(TypeError, "immutable tuple"):
            s.add([Fraction(0)] * 16, s.zero())  # type: ignore[arg-type]

    def test_unit_zero_additive_and_scalar_laws(self) -> None:
        for _ in range(40):
            x, y, z = (random_value(self.rng) for _ in range(3))
            a, b = Fraction(self.rng.randint(-3, 3)), Fraction(
                self.rng.randint(-3, 3)
            )
            self.assertEqual(s.mul(s.one(), x), x)
            self.assertEqual(s.mul(x, s.one()), x)
            self.assertEqual(s.mul(s.zero(), x), s.zero())
            self.assertEqual(s.mul(x, s.zero()), s.zero())
            self.assertEqual(s.add(x, s.zero()), x)
            self.assertEqual(s.sub(x, x), s.zero())
            self.assertEqual(s.add(x, y), s.add(y, x))
            self.assertEqual(s.add(s.add(x, y), z), s.add(x, s.add(y, z)))
            self.assertEqual(s.scale(a + b, x), s.add(s.scale(a, x), s.scale(b, x)))
            self.assertEqual(s.mul(s.scale(a, x), y), s.scale(a, s.mul(x, y)))
            self.assertEqual(s.mul(x, s.scale(a, y)), s.scale(a, s.mul(x, y)))
            self.assertEqual(s.mul(s.add(x, y), z), s.add(s.mul(x, z), s.mul(y, z)))
            self.assertEqual(s.mul(x, s.add(y, z)), s.add(s.mul(x, y), s.mul(x, z)))

    def test_conjugation_and_quadratic_norm(self) -> None:
        for _ in range(80):
            x, y = random_value(self.rng), random_value(self.rng)
            self.assertEqual(s.conj(s.conj(x)), x)
            self.assertEqual(s.conj(s.mul(x, y)), s.mul(s.conj(y), s.conj(x)))
            expected = s.scale(s.norm2(x), s.one())
            self.assertEqual(s.mul(x, s.conj(x)), expected)
            self.assertEqual(s.mul(s.conj(x), x), expected)

    def test_imaginary_basis_rules(self) -> None:
        minus_one = s.scale(-1, s.one())
        for index in range(1, 16):
            self.assertEqual(s.mul(s.basis(index), s.basis(index)), minus_one)
        for left in range(1, 16):
            for right in range(left + 1, 16):
                self.assertEqual(
                    s.mul(s.basis(left), s.basis(right)),
                    s.scale(-1, s.mul(s.basis(right), s.basis(left))),
                )

    def test_all_256_ordered_basis_products_are_signed_basis_values(self) -> None:
        for left in range(16):
            for right in range(16):
                product = s.mul(s.basis(left), s.basis(right))
                nonzero = [coefficient for coefficient in product if coefficient]
                self.assertEqual(len(nonzero), 1)
                self.assertIn(nonzero[0], (Fraction(-1), Fraction(1)))
                self.assertEqual(s.norm2(product), 1)

    def test_recursive_complex_quaternion_and_octonion_embeddings(self) -> None:
        for active in (2, 4, 8):
            for _ in range(20):
                left = random_value(self.rng, active)
                right = random_value(self.rng, active)
                lower_product = s._mul(left[:active], right[:active])
                self.assertEqual(
                    s.mul(left, right), lower_product + (Fraction(0),) * (16 - active)
                )

    def test_embedded_quaternions_are_associative(self) -> None:
        for _ in range(100):
            x, y, z = (random_value(self.rng, 4) for _ in range(3))
            self.assertEqual(s.mul(s.mul(x, y), z), s.mul(x, s.mul(y, z)))

    def test_embedded_octonions_are_alternative(self) -> None:
        for _ in range(100):
            x, y = random_value(self.rng, 8), random_value(self.rng, 8)
            self.assertEqual(s.mul(s.mul(x, x), y), s.mul(x, s.mul(x, y)))
            self.assertEqual(s.mul(s.mul(y, x), x), s.mul(y, s.mul(x, x)))


class ProgramTests(unittest.TestCase):
    def test_expression_parentheses_are_preserved(self) -> None:
        x, y, z = s.basis(1), s.basis(2), s.basis(4)
        left = {
            "op": "mul",
            "left": {"op": "mul", "left": s.literal(x), "right": s.literal(y)},
            "right": s.literal(z),
        }
        right = {
            "op": "mul",
            "left": s.literal(x),
            "right": {"op": "mul", "left": s.literal(y), "right": s.literal(z)},
        }
        self.assertEqual(s.evaluate(left), s.mul(s.mul(x, y), z))
        self.assertEqual(s.evaluate(right), s.mul(x, s.mul(y, z)))

    def test_events_match_nested_expression(self) -> None:
        initial, first, second = s.basis(4), s.basis(2), s.basis(1)
        result = s.run(initial, [first, second])
        expression = {
            "op": "mul",
            "left": s.literal(second),
            "right": {
                "op": "mul",
                "left": s.literal(first),
                "right": s.literal(initial),
            },
        }
        self.assertEqual(result.state, s.evaluate(expression))
        self.assertEqual(result.trace[0].before, initial)
        self.assertEqual(result.trace[1].before, result.trace[0].after)

    def test_empty_and_zero_programs(self) -> None:
        initial = s.basis(7)
        self.assertEqual(s.run(initial, []).state, initial)
        result = s.run(initial, [s.zero(), s.basis(3)])
        self.assertEqual(result.state, s.zero())
        self.assertEqual(result.trace[0].after, s.zero())
        self.assertEqual(result.trace[1].before, s.zero())

    def test_json_round_trip_replays_complete_trace(self) -> None:
        initial = s.value(["1/3", "-2", "0", "1"] + ["0"] * 12)
        events = [s.basis(5), s.value(["0", "2/7"] + ["0"] * 14)]
        document = s.serialize_run(initial, events)
        decoded = json.loads(document)
        self.assertEqual(decoded["initial"][0], "1/3")
        self.assertEqual(s.replay_serialized(document), s.run(initial, events))
        decoded["trace"][0]["norm2"] = "999"
        with self.assertRaisesRegex(ValueError, "does not match exact replay"):
            s.replay_serialized(json.dumps(decoded))

    def test_ray_rescaling_and_annihilation(self) -> None:
        initial = s.value([1, 2] + [0] * 14)
        events = [s.value([0, 1, 1] + [0] * 13), s.basis(4)]
        baseline = s.run_ray(initial, events)
        rescaled = s.run_ray(
            s.scale(-3, initial),
            [s.scale(5, events[0]), s.scale(-2, events[1])],
        )
        self.assertEqual(baseline, rescaled)
        annihilated = s.run_ray(initial, [s.zero()])
        self.assertIsInstance(annihilated, s.Annihilated)
        self.assertEqual(annihilated.step, 1)  # type: ignore[union-attr]


if __name__ == "__main__":
    unittest.main()
