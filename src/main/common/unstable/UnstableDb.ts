import {UnstableMap} from './UnstableMap'

function cloneChange<T>(cloneValue: (value: T) => T, change: TChange<T>): TChange<T> {
	const clonedChange = {...change}
	clonedChange.oldItem = clonedChange.oldItem && cloneValue(clonedChange.oldItem)
	clonedChange.newItem = clonedChange.newItem && cloneValue(clonedChange.newItem)
	return clonedChange
}

function damageChange<T>(cloneValue: (value: T) => T, damageValue: (value: T) => void, change: TChange<T>) {
	if (change.oldItem) {
		damageValue(change.oldItem)
	} else if (change.newItem) {
		change.oldItem = cloneValue(change.newItem)
		damageValue(change.oldItem)
	}
	if (change.newItem) {
		damageValue(change.newItem)
	} else if (change.oldItem) {
		change.newItem = cloneValue(change.oldItem)
		damageValue(change.newItem)
	}
}

export type TChange<T> = {
	oldItem: T
	newItem: T
}

const UNSTABLE_CHANGE_NUMBER_KEY = 'UNSTABLE_CHANGE_NUMBER_1sys28rnmhs'
const STABLE_CHANGE_NUMBER_KEY = 'STABLE_CHANGE_NUMBER_1sys28rnmhs'

export class UnstableDb<K, V> {
	_changes: UnstableMap<number, TChange<V>>
	_data: UnstableMap<K, V>
	_state: UnstableMap<string, number>

	constructor({
		clone,
		damage,
		interrupt,
	}: {
		clone: (value: V) => V,
		damage: (value: V) => void,
		interrupt: () => Promise<void>,
	}) {
		this._changes = new UnstableMap<number, TChange<V>>({
			clone : (value) => cloneChange(clone, value),
			damage: (value) => damageChange(clone, damage, value),
			interrupt,
		})
		this._data = new UnstableMap<K, V>({
			clone,
			damage,
			interrupt,
		})
	}

	async set(key: K, value: V): Promise<void> {
		const changeNumber = (await this._state.get(UNSTABLE_CHANGE_NUMBER_KEY)) + 1
		const oldItem = await this._data.get(key)
		const newItem = value
		const change: TChange<V> = {
			oldItem,
			newItem,
		}
		await this._changes.set(changeNumber, change)
		await this._state.set(UNSTABLE_CHANGE_NUMBER_KEY, changeNumber)
		await this._data.set(key, value)
		await this._state.set(STABLE_CHANGE_NUMBER_KEY, changeNumber)
	}

	async get(key: K): Promise<V> {
		const value = await this._data.get(key)
		return value
	}

	useTransaction() {

	}
}
