import AccountController from './AccountController'
import CategoryController from './CategoryController'
import TransactionController from './TransactionController'
import TransactionImportController from './TransactionImportController'
import Settings from './Settings'

const Controllers = {
    AccountController: Object.assign(AccountController, AccountController),
    CategoryController: Object.assign(CategoryController, CategoryController),
    TransactionController: Object.assign(TransactionController, TransactionController),
    TransactionImportController: Object.assign(TransactionImportController, TransactionImportController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers