import AccountController from './AccountController'
import AccountImportController from './AccountImportController'
import AccountBalanceController from './AccountBalanceController'
import FixedAssetController from './FixedAssetController'
import CategoryController from './CategoryController'
import TransactionController from './TransactionController'
import IncomeController from './IncomeController'
import PeriodHistoryController from './PeriodHistoryController'
import CategoryActualsController from './CategoryActualsController'
import ReconciliationController from './ReconciliationController'
import BalanceSheetController from './BalanceSheetController'
import BalanceSheetImportController from './BalanceSheetImportController'
import TransactionImportController from './TransactionImportController'
import ExchangeRateController from './ExchangeRateController'
import ExchangeRateImportController from './ExchangeRateImportController'
import BudgetController from './BudgetController'
import FinancialSummaryController from './FinancialSummaryController'
import DashboardController from './DashboardController'
import Settings from './Settings'

const Controllers = {
    AccountController: Object.assign(AccountController, AccountController),
    AccountImportController: Object.assign(AccountImportController, AccountImportController),
    AccountBalanceController: Object.assign(AccountBalanceController, AccountBalanceController),
    FixedAssetController: Object.assign(FixedAssetController, FixedAssetController),
    CategoryController: Object.assign(CategoryController, CategoryController),
    TransactionController: Object.assign(TransactionController, TransactionController),
    IncomeController: Object.assign(IncomeController, IncomeController),
    PeriodHistoryController: Object.assign(PeriodHistoryController, PeriodHistoryController),
    CategoryActualsController: Object.assign(CategoryActualsController, CategoryActualsController),
    ReconciliationController: Object.assign(ReconciliationController, ReconciliationController),
    BalanceSheetController: Object.assign(BalanceSheetController, BalanceSheetController),
    BalanceSheetImportController: Object.assign(BalanceSheetImportController, BalanceSheetImportController),
    TransactionImportController: Object.assign(TransactionImportController, TransactionImportController),
    ExchangeRateController: Object.assign(ExchangeRateController, ExchangeRateController),
    ExchangeRateImportController: Object.assign(ExchangeRateImportController, ExchangeRateImportController),
    BudgetController: Object.assign(BudgetController, BudgetController),
    FinancialSummaryController: Object.assign(FinancialSummaryController, FinancialSummaryController),
    DashboardController: Object.assign(DashboardController, DashboardController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers