import SearchController from './SearchController'
import AccountController from './AccountController'
import AccountImportController from './AccountImportController'
import AccountBalanceController from './AccountBalanceController'
import FixedAssetController from './FixedAssetController'
import CategoryController from './CategoryController'
import TransactionController from './TransactionController'
import IncomeController from './IncomeController'
import PeriodHistoryController from './PeriodHistoryController'
import PeriodComparisonController from './PeriodComparisonController'
import CategoryActualsController from './CategoryActualsController'
import ReconciliationController from './ReconciliationController'
import BudgetController from './BudgetController'
import BalanceSheetController from './BalanceSheetController'
import BalanceSheetImportController from './BalanceSheetImportController'
import TransactionImportController from './TransactionImportController'
import ExchangeRateController from './ExchangeRateController'
import ExchangeRateImportController from './ExchangeRateImportController'
import FinancialSummaryController from './FinancialSummaryController'
import DashboardController from './DashboardController'
import ReportsController from './ReportsController'
import PreferencesController from './PreferencesController'
import Settings from './Settings'

const Controllers = {
    SearchController: Object.assign(SearchController, SearchController),
    AccountController: Object.assign(AccountController, AccountController),
    AccountImportController: Object.assign(AccountImportController, AccountImportController),
    AccountBalanceController: Object.assign(AccountBalanceController, AccountBalanceController),
    FixedAssetController: Object.assign(FixedAssetController, FixedAssetController),
    CategoryController: Object.assign(CategoryController, CategoryController),
    TransactionController: Object.assign(TransactionController, TransactionController),
    IncomeController: Object.assign(IncomeController, IncomeController),
    PeriodHistoryController: Object.assign(PeriodHistoryController, PeriodHistoryController),
    PeriodComparisonController: Object.assign(PeriodComparisonController, PeriodComparisonController),
    CategoryActualsController: Object.assign(CategoryActualsController, CategoryActualsController),
    ReconciliationController: Object.assign(ReconciliationController, ReconciliationController),
    BudgetController: Object.assign(BudgetController, BudgetController),
    BalanceSheetController: Object.assign(BalanceSheetController, BalanceSheetController),
    BalanceSheetImportController: Object.assign(BalanceSheetImportController, BalanceSheetImportController),
    TransactionImportController: Object.assign(TransactionImportController, TransactionImportController),
    ExchangeRateController: Object.assign(ExchangeRateController, ExchangeRateController),
    ExchangeRateImportController: Object.assign(ExchangeRateImportController, ExchangeRateImportController),
    FinancialSummaryController: Object.assign(FinancialSummaryController, FinancialSummaryController),
    DashboardController: Object.assign(DashboardController, DashboardController),
    ReportsController: Object.assign(ReportsController, ReportsController),
    PreferencesController: Object.assign(PreferencesController, PreferencesController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers