<?php

namespace App\Http\Controllers;

use App\Domain\Services\Contracts\TransactionServiceInterface;
use App\Services\TransactionService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransactionController extends Controller
{
    public function __construct(
        private readonly TransactionServiceInterface $service
    ) {}

    /**
     * Get all transactions with optional filtering and pagination.
     *
     * GET /api/transactions
     * Query params: period, category_id, category (code), account_id, quincena, currency,
     *               is_recurring, search, sort_by, sort_dir, page, per_page
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'period',
            'category_id',
            'category',
            'account_id',
            'quincena',
            'currency',
            'is_recurring',
            'search',
            'sort_by',
            'sort_dir',
        ]);

        // Alias: ?account=1 → account_id
        if ($request->filled('account') && empty($filters['account_id'])) {
            $filters['account_id'] = $request->query('account');
        }

        $wantsPagination = $request->has('page') || $request->has('per_page');

        if ($wantsPagination) {
            $validated = $request->validate([
                'page' => 'sometimes|integer|min:1',
                'per_page' => ['sometimes', 'integer', Rule::in(TransactionService::ALLOWED_PER_PAGE)],
                'sort_by' => ['sometimes', 'string', Rule::in(TransactionService::ALLOWED_SORT_BY)],
                'sort_dir' => ['sometimes', 'string', Rule::in(['asc', 'desc'])],
            ]);

            $page = (int) ($validated['page'] ?? 1);
            $perPage = (int) ($validated['per_page'] ?? TransactionService::DEFAULT_PER_PAGE);

            $result = $this->service->getPaginated($filters, $page, $perPage);
            $data = array_map(fn ($entity) => $entity->toArray(), $result['data']);

            return response()->json([
                'data' => $data,
                'links' => [
                    'self' => route('transactions.index'),
                ],
                'meta' => [
                    'total' => $result['total'],
                    'page' => $result['page'],
                    'current_page' => $result['page'],
                    'per_page' => $result['per_page'],
                    'last_page' => $result['last_page'],
                    'sort_by' => $filters['sort_by'] ?? TransactionService::DEFAULT_SORT_BY,
                    'sort_dir' => $filters['sort_dir'] ?? TransactionService::DEFAULT_SORT_DIR,
                    'filters' => $filters,
                ],
            ]);
        }

        $request->validate([
            'sort_by' => ['sometimes', 'string', Rule::in(TransactionService::ALLOWED_SORT_BY)],
            'sort_dir' => ['sometimes', 'string', Rule::in(['asc', 'desc'])],
        ]);

        $transactions = $this->service->getAll($filters);

        $data = array_map(fn ($entity) => $entity->toArray(), $transactions);

        return response()->json([
            'data' => $data,
            'links' => [
                'self' => route('transactions.index'),
            ],
            'meta' => [
                'total' => count($data),
                'sort_by' => $filters['sort_by'] ?? TransactionService::DEFAULT_SORT_BY,
                'sort_dir' => $filters['sort_dir'] ?? TransactionService::DEFAULT_SORT_DIR,
                'filters' => $filters,
            ],
        ]);
    }

    /**
     * Get a transaction by ID.
     *
     * GET /api/transactions/{id}
     */
    public function show(int $id): JsonResponse
    {
        $transaction = $this->service->getById($id);

        if (! $transaction) {
            return response()->json([
                'error' => 'Transaction not found',
            ], 404);
        }

        return response()->json([
            'data' => $transaction->toArray(),
            'links' => [
                'self' => route('transactions.show', $id),
                'index' => route('transactions.index'),
            ],
        ]);
    }

    /**
     * Create a new transaction.
     *
     * POST /api/transactions
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'date' => 'required|date_format:Y-m-d',
                'period' => 'required|string|size:6|regex:/^\d{6}$/',
                'quincena' => 'required|in:Q1,Q2',
                'category_id' => 'required|integer|exists:categories,id',
                'account_id' => 'nullable|integer|exists:accounts,id',
                'amount_cad' => 'nullable|numeric|gt:0',
                'amount_usd' => 'nullable|numeric|gt:0',
                'amount_cop' => 'nullable|numeric|gt:0',
                'comments' => 'nullable|string|max:1000',
                'is_recurring' => 'nullable|boolean',
                'is_credit' => 'nullable|boolean',
                'debt_component' => 'nullable|in:principal,interest',
            ], [
                'date.required' => 'Date must be a valid date.',
                'date.date_format' => 'Date must be a valid date.',
                'period.size' => 'The period must be in YYYYMM format.',
                'period.regex' => 'The period must be in YYYYMM format.',
                'quincena.in' => 'The quincena must be Q1 or Q2.',
                'amount_cad.gt' => 'Amount must be a positive number.',
                'amount_usd.gt' => 'Amount must be a positive number.',
                'amount_cop.gt' => 'Amount must be a positive number.',
            ]);

            $transaction = $this->service->create($validated);

            return response()->json([
                'data' => $transaction->toArray(),
                'links' => [
                    'self' => route('transactions.show', $transaction->id),
                    'index' => route('transactions.index'),
                ],
                'message' => 'Transaction created successfully',
            ], 201);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 422);
        } catch (ValidationException $e) {
            throw $e;
        }
    }

    /**
     * Update an existing transaction.
     *
     * PUT/PATCH /api/transactions/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'date' => 'sometimes|required|date_format:Y-m-d',
                'period' => 'sometimes|required|string|size:6|regex:/^\d{6}$/',
                'quincena' => 'sometimes|required|in:Q1,Q2',
                'category_id' => 'sometimes|required|integer|exists:categories,id',
                'account_id' => 'nullable|integer|exists:accounts,id',
                'amount_cad' => 'nullable|numeric|gt:0',
                'amount_usd' => 'nullable|numeric|gt:0',
                'amount_cop' => 'nullable|numeric|gt:0',
                'comments' => 'nullable|string|max:1000',
                'is_recurring' => 'nullable|boolean',
                'is_credit' => 'nullable|boolean',
                'debt_component' => 'nullable|in:principal,interest',
            ], [
                'date.required' => 'Date must be a valid date.',
                'date.date_format' => 'Date must be a valid date.',
                'period.size' => 'The period must be in YYYYMM format.',
                'period.regex' => 'The period must be in YYYYMM format.',
                'quincena.in' => 'The quincena must be Q1 or Q2.',
                'amount_cad.gt' => 'Amount must be a positive number.',
                'amount_usd.gt' => 'Amount must be a positive number.',
                'amount_cop.gt' => 'Amount must be a positive number.',
            ]);

            $transaction = $this->service->update($id, $validated);

            return response()->json([
                'data' => $transaction->toArray(),
                'links' => [
                    'self' => route('transactions.show', $transaction->id),
                    'index' => route('transactions.index'),
                ],
                'message' => 'Transaction updated successfully',
            ]);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 422);
        } catch (ValidationException $e) {
            throw $e;
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Transaction not found',
            ], 404);
        }
    }

    /**
     * Bulk-update multiple transactions (e.g. change category).
     *
     * POST /api/transactions/bulk
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'ids' => 'required|array|min:1|max:500',
                'ids.*' => 'integer|distinct|exists:transactions,id',
                'category_id' => 'required|integer|exists:categories,id',
            ]);

            $collection = $this->service->bulkUpdate(
                $validated['ids'],
                ['category_id' => (int) $validated['category_id']],
            );

            $data = array_map(
                static fn ($entity) => $entity->toArray(),
                $collection->all(),
            );

            return response()->json([
                'data' => $data,
                'links' => [
                    'self' => route('transactions.bulk'),
                    'index' => route('transactions.index'),
                ],
                'meta' => [
                    'updated_count' => $collection->count(),
                ],
                'message' => 'Transactions updated successfully',
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 422);
        } catch (ValidationException $e) {
            throw $e;
        }
    }

    /**
     * Duplicate an existing transaction.
     *
     * POST /api/transactions/{id}/duplicate
     */
    public function duplicate(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'date' => 'sometimes|required|date_format:Y-m-d',
                'period' => 'sometimes|required|string|size:6|regex:/^\d{6}$/',
                'quincena' => 'sometimes|required|in:Q1,Q2',
            ], [
                'date.date_format' => 'Date must be a valid date.',
                'period.size' => 'The period must be in YYYYMM format.',
                'period.regex' => 'The period must be in YYYYMM format.',
                'quincena.in' => 'The quincena must be Q1 or Q2.',
            ]);

            $transaction = $this->service->duplicate($id, $validated);

            return response()->json([
                'data' => $transaction->toArray(),
                'links' => [
                    'self' => route('transactions.show', $transaction->id),
                    'source' => route('transactions.show', $id),
                    'index' => route('transactions.index'),
                ],
                'message' => 'Transaction duplicated successfully',
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 422);
        } catch (ValidationException $e) {
            throw $e;
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Transaction not found',
            ], 404);
        }
    }

    /**
     * Delete a transaction.
     *
     * DELETE /api/transactions/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->delete($id);

            return response()->json([
                'message' => 'Transaction deleted successfully',
            ], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Transaction not found',
            ], 404);
        }
    }

    /**
     * Export transactions to CSV.
     *
     * GET /api/transactions/export
     * Query params: period, category_id, category (code), account_id, quincena, currency, is_recurring
     */
    public function export(Request $request): StreamedResponse
    {
        $filters = $request->only([
            'period',
            'category_id',
            'category',
            'account_id',
            'quincena',
            'currency',
            'is_recurring',
        ]);

        $transactions = $this->service->getAll($filters);

        $filename = 'transactions_'.($filters['period'] ?? 'all').'_'.date('Y-m-d').'.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ];

        $callback = function () use ($transactions) {
            $file = fopen('php://output', 'w');

            if ($file === false) {
                return;
            }

            // CSV header
            fputcsv($file, [
                'Date',
                'Period',
                'Quincena',
                'Category Code',
                'Category Name',
                'Account',
                'Amount CAD',
                'Amount USD',
                'Amount COP',
                'Currency',
                'Amount',
                'Comments',
                'Recurring',
                'Debt Component',
            ]);

            // CSV rows
            foreach ($transactions as $entity) {
                $data = $entity->toArray();
                $accountName = $entity->account !== null ? $entity->account['name'] : '';

                fputcsv($file, [
                    $data['date'],
                    $data['period'],
                    $data['quincena'],
                    $data['category']['code'] ?? '',
                    $data['category']['name_en'] ?? '',
                    $accountName,
                    $data['amount_cad'] ?? '',
                    $data['amount_usd'] ?? '',
                    $data['amount_cop'] ?? '',
                    $data['currency'] ?? '',
                    $data['amount'] ?? '',
                    $data['comments'] ?? '',
                    $data['is_recurring'] ? 'Yes' : 'No',
                    $data['debt_component'] ?? '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
