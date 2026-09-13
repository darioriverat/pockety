import CategoryController from './CategoryController'
import TransactionController from './TransactionController'
import Settings from './Settings'

const Controllers = {
    CategoryController: Object.assign(CategoryController, CategoryController),
    TransactionController: Object.assign(TransactionController, TransactionController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers