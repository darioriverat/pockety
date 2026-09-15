import AccountController from './AccountController'
import AccountImportController from './AccountImportController'
import AccountBalanceController from './AccountBalanceController'
import CategoryController from './CategoryController'
import TransactionController from './TransactionController'
import IncomeController from './IncomeController'
import ReconciliationController from './ReconciliationController'
import TransactionImportController from './TransactionImportController'
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
    DashboardController: Object.assign(DashboardController, DashboardController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers