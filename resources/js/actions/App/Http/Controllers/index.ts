import AccountController from './AccountController'
import AccountBalanceController from './AccountBalanceController'
import CategoryController from './CategoryController'
import TransactionController from './TransactionController'
import ReconciliationController from './ReconciliationController'
import TransactionImportController from './TransactionImportController'
import Settings from './Settings'

const Controllers = {
    AccountController: Object.assign(AccountController, AccountController),
    AccountBalanceController: Object.assign(AccountBalanceController, AccountBalanceController),
    CategoryController: Object.assign(CategoryController, CategoryController),
    TransactionController: Object.assign(TransactionController, TransactionController),
    ReconciliationController: Object.assign(ReconciliationController, ReconciliationController),
    TransactionImportController: Object.assign(TransactionImportController, TransactionImportController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers