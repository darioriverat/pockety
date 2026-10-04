<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        return [
            'user_id' => fn () => auth()->id() ?? User::factory(),
            'code' => fn (array $attributes) => $this->generateUniqueCode($attributes['user_id']),
            'name' => fake()->words(2, true),
            'is_debt_category' => false,
            'is_income_category' => false,
            'is_active' => true,
            'status' => 'active',
        ];
    }

    /**
     * Generate a unique category code for the given user.
     * Starts from C900 to avoid conflicts with template categories (C001-C046).
     */
    private function generateUniqueCode(mixed $userId): string
    {
        // Resolve user_id if it's a Closure
        if ($userId instanceof \Closure) {
            $userId = $userId();
        }

        if ($userId instanceof User) {
            $userId = $userId->id;
        }

        // Start from C900 to avoid template range
        for ($num = 900; $num <= 999; $num++) {
            $code = 'C'.str_pad((string) $num, 3, '0', STR_PAD_LEFT);
            $exists = Category::query()
                ->where('user_id', $userId)
                ->where('code', $code)
                ->exists();

            if (! $exists) {
                return $code;
            }
        }

        // If C900-C999 are all taken, try C100-C899
        for ($num = 100; $num <= 899; $num++) {
            $code = 'C'.str_pad((string) $num, 3, '0', STR_PAD_LEFT);
            $exists = Category::query()
                ->where('user_id', $userId)
                ->where('code', $code)
                ->exists();

            if (! $exists) {
                return $code;
            }
        }

        // Fallback: try C047-C099
        for ($num = 47; $num <= 99; $num++) {
            $code = 'C'.str_pad((string) $num, 3, '0', STR_PAD_LEFT);
            $exists = Category::query()
                ->where('user_id', $userId)
                ->where('code', $code)
                ->exists();

            if (! $exists) {
                return $code;
            }
        }

        // This should never happen in tests
        throw new \RuntimeException('Unable to generate unique category code for user '.$userId);
    }

    public function income(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_income_category' => true,
            'is_debt_category' => false,
            'code' => $this->generateUniqueIncomeCode($attributes['user_id']),
        ]);
    }

    /**
     * Generate a unique income category code for the given user.
     * Starts from I10 to avoid template (I01).
     */
    private function generateUniqueIncomeCode(mixed $userId): string
    {
        // Resolve user_id if it's a Closure
        if ($userId instanceof \Closure) {
            $userId = $userId();
        }

        if ($userId instanceof User) {
            $userId = $userId->id;
        }

        // Start from I10 to avoid template
        for ($num = 10; $num <= 99; $num++) {
            $code = 'I'.str_pad((string) $num, 2, '0', STR_PAD_LEFT);
            $exists = Category::query()
                ->where('user_id', $userId)
                ->where('code', $code)
                ->exists();

            if (! $exists) {
                return $code;
            }
        }

        // Fallback to I02-I09
        for ($num = 2; $num <= 9; $num++) {
            $code = 'I'.str_pad((string) $num, 2, '0', STR_PAD_LEFT);
            $exists = Category::query()
                ->where('user_id', $userId)
                ->where('code', $code)
                ->exists();

            if (! $exists) {
                return $code;
            }
        }

        throw new \RuntimeException('Unable to generate unique income category code for user '.$userId);
    }

    public function debt(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_debt_category' => true,
            'is_income_category' => false,
        ]);
    }
}
