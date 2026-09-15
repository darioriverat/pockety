import AccountController from './AccountController'
import AccountImportController from './AccountImportController'
import AccountBalanceController from './AccountBalanceController'
import CategoryController from './CategoryController'
import TransactionController from './TransactionController'
import IncomeController from './IncomeController'
import ReconciliationController from './ReconciliationController'
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
    CategoryController: Object.assign(CategoryController, CategoryController),
    TransactionController: Object.assign(TransactionController, TransactionController),
    IncomeController: Object.assign(IncomeController, IncomeController),
    ReconciliationController: Object.assign(ReconciliationController, ReconciliationController),
    TransactionImportController: Object.assign(TransactionImportController, TransactionImportController),
    ExchangeRateController: Object.assign(ExchangeRateController, ExchangeRateController),
    ExchangeRateImportController: Object.assign(ExchangeRateImportController, ExchangeRateImportController),
    BudgetController: Object.assign(BudgetController, BudgetController),
    FinancialSummaryController: Object.assign(FinancialSummaryController, FinancialSummaryController),
    DashboardController: Object.assign(DashboardController, DashboardController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers