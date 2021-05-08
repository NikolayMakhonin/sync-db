export class UnstableMap<K, V> {
	_map = new Map<K, V>()
	_clone: (value: V) => V
	_damage: (value: V) => void
	_interrupt: () => Promise<void>

	constructor({
		clone,
		damage,
		interrupt,
	}: {
		clone: (value: V) => V,
		damage: (value: V) => void,
		interrupt: () => Promise<void>,
	}) {
		this._clone = clone
		this._damage = damage
		this._interrupt = interrupt
	}

	async set(key: K, value: V): Promise<void> {
		const clonedValue = this._clone(value)
		const damagedValue = this._clone(value)
		this._damage(damagedValue)

		await this._interrupt()
		this._map.delete(key)
		await this._interrupt()
		this._map.set(key, damagedValue)
		await this._interrupt()
		this._map.set(key, clonedValue)
		await this._interrupt()
	}

	async get(key: K): Promise<V> {
		await this._interrupt()
		const value = this._clone(this._map.get(key))
		await this._interrupt()
		return value
	}
}
