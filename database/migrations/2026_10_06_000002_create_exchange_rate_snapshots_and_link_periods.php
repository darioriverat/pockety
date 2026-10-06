<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('exchange_rate_snapshots', function (Blueprint $table) {
            $table->id();
            $table->date('rate_date');
            $table->string('source', 32); // openexchangerates | manual
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('cad_per_usd', 16, 8);
            $table->decimal('cop_per_usd', 16, 8);
            $table->timestamps();

            $table->index(['rate_date', 'source']);
            $table->index(['user_id', 'rate_date']);
        });

        Schema::table('exchange_rates', function (Blueprint $table) {
            $table->foreignId('snapshot_id')
                ->nullable()
                ->after('period')
                ->constrained('exchange_rate_snapshots')
                ->restrictOnDelete();
        });

        $this->backfillPeriodSnapshots();

        Schema::table('exchange_rates', function (Blueprint $table) {
            $table->dropColumn(['usd_cop', 'usd_cad', 'cad_cop']);
        });

        // Enforce required FK after backfill (SQLite-friendly: recreate nullability via change).
        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            Schema::table('exchange_rates', function (Blueprint $table) {
                $table->foreignId('snapshot_id')->nullable(false)->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exchange_rates', function (Blueprint $table) {
            $table->decimal('usd_cop', 10, 4)->nullable();
            $table->decimal('usd_cad', 10, 4)->nullable();
            $table->decimal('cad_cop', 10, 4)->nullable();
        });

        $rates = DB::table('exchange_rates')->whereNotNull('snapshot_id')->get();
        foreach ($rates as $rate) {
            $snapshot = DB::table('exchange_rate_snapshots')->where('id', $rate->snapshot_id)->first();
            if (! $snapshot) {
                continue;
            }

            $cadPerUsd = (float) $snapshot->cad_per_usd;
            $copPerUsd = (float) $snapshot->cop_per_usd;
            $cadCop = $cadPerUsd > 0 ? $copPerUsd / $cadPerUsd : 0;

            DB::table('exchange_rates')->where('id', $rate->id)->update([
                'usd_cop' => $copPerUsd,
                'usd_cad' => $cadPerUsd,
                'cad_cop' => $cadCop,
            ]);
        }

        Schema::table('exchange_rates', function (Blueprint $table) {
            $table->dropConstrainedForeignId('snapshot_id');
        });

        Schema::dropIfExists('exchange_rate_snapshots');
    }

    private function backfillPeriodSnapshots(): void
    {
        $rows = DB::table('exchange_rates')->orderBy('id')->get();
        /** @var array<string, int> $reuseByKey */
        $reuseByKey = [];

        foreach ($rows as $row) {
            $rateDate = Carbon::createFromFormat('Ym', (string) $row->period)
                ->endOfMonth()
                ->toDateString();

            $cadPerUsd = (string) $row->usd_cad;
            $copPerUsd = (string) $row->usd_cop;
            $reuseKey = implode(':', [
                (string) $row->user_id,
                $rateDate,
                $cadPerUsd,
                $copPerUsd,
            ]);

            if (isset($reuseByKey[$reuseKey])) {
                $snapshotId = $reuseByKey[$reuseKey];
            } else {
                $snapshotId = DB::table('exchange_rate_snapshots')->insertGetId([
                    'rate_date' => $rateDate,
                    'source' => 'manual',
                    'user_id' => $row->user_id,
                    'cad_per_usd' => $cadPerUsd,
                    'cop_per_usd' => $copPerUsd,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $reuseByKey[$reuseKey] = $snapshotId;
            }

            DB::table('exchange_rates')->where('id', $row->id)->update([
                'snapshot_id' => $snapshotId,
            ]);
        }
    }
};
