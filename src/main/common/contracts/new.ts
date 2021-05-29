export type TPromiseOrValue<TValue> = Promise<TValue> | TValue

// region common

export enum TRequestMethod {
	Get = 'get',
	GetCount = 'getCount',
	GetRange = 'getRange',
	Add = 'add',
	Put = 'put',
	Remove = 'remove',
	RemoveRange = 'removeRange',
}

export type TEntry<TIndex, TItem> = [TIndex, TItem]

export type TRequestsFunc<TRequests, TResults> = (requests: TRequests) => TPromiseOrValue<TResults>

// endregion

// region TGet

export type TGetRequest<TIndex> = {
	type: TRequestMethod.GetCount
} | {
	type: TRequestMethod.Get
	indexes: TIndex[]
} | {
	type: TRequestMethod.GetRange
	indexFrom?: TIndex
	indexTo?: TIndex
	limit?: number
	desc?: boolean
	indexesOnly?: boolean
}

export type TRequestsGet<TIndex> = {
	get: TGetRequest<TIndex>[]
}

export type TGetResult<TIndex, TItem> = {
	type: TRequestMethod.GetCount
	count: number
} | {
	type: TRequestMethod.Get
	entries: TEntry<TIndex, TItem|null>[]
} | {
	type: TRequestMethod.GetRange
	entries: TEntry<TIndex, TItem>[]
} | {
	type: TRequestMethod.GetRange
	indexes: TIndex[]
}

export type TResultsGet<TIndex, TItem> = {
	requests: TRequestsGet<TIndex>
	results: {
		get: TGetResult<TIndex, TItem>[]
	}
}

export type TGet<TIndex, TItem> = TRequestsFunc<TRequestsGet<TIndex>, TResultsGet<TIndex, TItem>>

// endregion

// region TRemove

export type TRemoveRequest<TIndex> = {
	type: TRequestMethod.Remove
	indexes: TIndex[]
} | {
	type: TRequestMethod.RemoveRange
	indexFrom?: TIndex
	indexTo?: TIndex
}

export type TRequestsRemove<TIndex> = {
	remove: TRemoveRequest<TIndex>
}

export type TResultsRemove<TIndex> = {
	requests: {
		remove: TRemoveRequest<TIndex>
	}
}

export type TRemove<TIndex> = TRequestsFunc<TRequestsRemove<TIndex>, TResultsRemove<TIndex>>

// endregion

// region TAdd

export type TAddRequest<TItem> = {
	type: TRequestMethod.Add
	items: TItem[]
	returnIndexes?: boolean
}

export type TRequestsAdd<TItem> = {
	add: TAddRequest<TItem>[]
}

export type TResultsAdd<TIndex, TItem> = {
	requests: TRequestsAdd<TItem>
	results: {
		add?: {
			indexes?: TIndex[]
		}
	}
}

export type TAdd<TIndex, TItem> = TRequestsFunc<TRequestsAdd<TItem>, TResultsAdd<TIndex, TItem>>

// endregion

// region TPut

export type TPutRequest<TIndex, TItem> = {
	type: TRequestMethod.Put
	entries: TEntry<TIndex, TItem>[]
}

export type TRequestsPut<TIndex, TItem> = {
	put: TPutRequest<TIndex, TItem>
}

export type TResultsPut<TIndex, TItem> = {
	requests: TRequestsPut<TIndex, TItem>
}

export type TPut<TIndex, TItem> = TRequestsFunc<TRequestsPut<TIndex, TItem>, TResultsPut<TIndex, TItem>>

// endregion

// region TAddRemove

export type TRequestsAddRemove<TIndex, TItem> =
	TRequestsRemove<TIndex> & TRequestsAdd<TItem>

export type TResultsAddRemove<TIndex, TItem> =
	TResultsRemove<TIndex> & TResultsAdd<TIndex, TItem>

/** operations order: remove, add */
export type TAddRemove<TIndex, TItem> = TRequestsFunc<
	TRequestsAddRemove<TIndex, TItem>,
	TResultsAddRemove<TIndex, TItem>
>

// endregion

// region TPutRemove

export type TRequestsPutRemove<TIndex, TItem> =
	TRequestsRemove<TIndex> & TRequestsPut<TIndex, TItem>

export type TResultsPutRemove<TIndex, TItem> =
	TResultsRemove<TIndex> & TResultsPut<TIndex, TItem>

/** operations order: remove, put */
export type TPutRemove<TIndex, TItem> = TRequestsFunc<
	TRequestsPutRemove<TIndex, TItem>,
	TResultsPutRemove<TIndex, TItem>
>

// endregion

// region change

export type TRequestsChange<TIndex, TItem> =
	TRequestsRemove<TIndex> & TRequestsPut<TIndex, TItem> & TRequestsAdd<TItem>

export type TResultsChange<TIndex, TItem> =
	TResultsRemove<TIndex> & TResultsPut<TIndex, TItem> & TResultsAdd<TIndex, TItem>

/** operations order: remove, put, add */
export type TChange<TIndex, TItem> = TRequestsFunc<
	TRequestsChange<TIndex, TItem>,
	TResultsChange<TIndex, TItem>
>

// endregion

// region INonUpdatableAsyncHeap

export interface INonUpdatableAsyncHeap<TIndex, TItem> {
	readonly get: TGet<TIndex, TItem>
	readonly addRemove: TAddRemove<TIndex, TItem>
}

// endregion

// region IAsyncHeap

export interface IAsyncHeap<TIndex, TItem> {
	readonly get: TGet<TIndex, TItem>
	/** add === put */
	readonly change: TChange<TIndex, TItem>
}

// endregion

// region IChangesAsyncHeap

export type IChangeItem<TIndex, TItem> = {
	type: TRequestMethod.Put
	index: TIndex
	item: TItem
} | {
	type: TRequestMethod.Remove
	index: TIndex
}

export interface IChangesAsyncHeap<TChangeIndex, TIndex, TItem> extends
	INonUpdatableAsyncHeap<TChangeIndex, IChangeItem<TIndex, TItem>>
{ }

export type TGetChanges<TChangeIndex, TIndex, TItem> = TGet<TChangeIndex, IChangeItem<TIndex, TItem>>

// endregion

// region ITransactionAsyncHeap

export interface ITransactionAsyncHeap<TIndex, TItem> {
	readonly getInTransaction: TGet<TIndex, TItem>
	readonly changeInTransaction: TChange<TIndex, TItem>
	/** Forbidden to use get requests after change requests */
	useTransaction<T>(func: (transaction: IAsyncHeap<TIndex, TItem>) => TPromiseOrValue<T>): TPromiseOrValue<T>
}

// endregion

// region IDb

export interface IDb<TChangeIndex, TIndex, TItem> extends ITransactionAsyncHeap<TIndex, TItem> {
	readonly getChanges: TGetChanges<TChangeIndex, TIndex, TItem>
}

// endregion
