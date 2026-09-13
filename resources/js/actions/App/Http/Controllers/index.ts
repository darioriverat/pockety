import CategoryController from './CategoryController'
import Settings from './Settings'

const Controllers = {
    CategoryController: Object.assign(CategoryController, CategoryController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers