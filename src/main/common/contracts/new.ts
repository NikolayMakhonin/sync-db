export type TPromiseOrValue<TValue> = Promise<TValue> | TValue

// region common

export enum TRequestMethod {
    Get = 'get',
    GetCount = 'getCount',
    GetRange = 'getRange',
    Add = 'add',
    Put = 'put',
    Delete = 'delete',
    DeleteRange = 'deleteRange',
}

export type TEntry<TIndex, TItem> = [TIndex, TItem]

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

export type TGetResults<TIndex, TItem> = {
	requests: TGetRequest<TIndex>
	results: TGetResult<TIndex, TItem>
}

export type TGet<TIndex, TItem> = (requests: TGetRequest<TIndex>[])
    => TPromiseOrValue<TGetResults<TIndex, TItem>>

// endregion

// region TDelete

export type TDeleteRequest<TIndex> = {
    type: TRequestMethod.Delete
    indexes: TIndex[]
} | {
    type: TRequestMethod.DeleteRange
    indexFrom?: TIndex
    indexTo?: TIndex
}

// TODO
export type TDeleteResult = {
    type: TRequestMethod.Delete | TRequestMethod.DeleteRange
}

// TODO
export type TDeleteResults<TIndex> = {
	requests: TDeleteRequest<TIndex>
	results: TDeleteResult
}

export type TDelete<TIndex, TItem> = (requests: TDeleteRequest<TIndex>[])
    => TPromiseOrValue<TDeleteResults<TIndex, TItem>>

// endregion

// region TAdd

export type TAddRequest<TItem> = {
    type: TRequestMethod.Add
    items: TItem[]
    returnIndexes?: boolean
}

export type TAddResult<TIndex> = {
    type: TRequestMethod.Add
    indexes?: TIndex[]
}

export type TAddResults<TIndex, TItem> = {
	requests: TAddRequest<TItem>
	results: TAddResult<TIndex>
}

export type TAdd<TIndex, TItem> = (requests: TAddRequest<TItem>[])
    => TPromiseOrValue<TAddResults<TIndex, TItem>>

// endregion

// region TPut

export type TPutRequest<TIndex, TItem> = {
    type: TRequestMethod.Put
    entries: TEntry<TIndex, TItem>[]
}

// TODO
export type TPutResult = {
    type: TRequestMethod.Put
}

// TODO
export type TPutResults<TIndex, TItem> = {
	requests: TPutRequest<TIndex, TItem>
	results: TPutResult<TIndex>
}

export type TPut<TIndex, TItem> = (requests: TPutRequest<TIndex, TItem>[])
    => TPromiseOrValue<TPutResults<TIndex, TItem>>

// endregion

// region TAddDelete

export type TAddDeleteRequest<TIndex, TItem> = {
    type: TRequestMethod.Add
    items: TItem[]
    returnIndexes?: boolean
} | {
    type: TRequestMethod.Delete
    indexes: TIndex[]
} | {
    type: TRequestMethod.DeleteRange
    indexFrom?: TIndex
    indexTo?: TIndex
}

export type TAddDeleteResult<TIndex> = {
    type: TRequestMethod.Add
    indexes?: TIndex[]
} | {
    type: TRequestMethod.Delete | TRequestMethod.DeleteRange
}

export type TAddDeleteResults<TIndex, TItem> = {
	requests: TAddDeleteRequest<TIndex, TItem>
	results: TAddDeleteResult<TIndex>
}

export type TAddDelete<TIndex, TItem> = (requests: TAddDeleteRequest<TIndex, TItem>[])
    => TPromiseOrValue<TAddDeleteResults<TIndex, TItem>>

// endregion

// region TPutDelete

export type TPutDeleteRequest<TIndex, TItem> = {
    type: TRequestMethod.Add
    items: TItem[]
    returnIndexes?: boolean
} | {
    type: TRequestMethod.Put
    entries: TEntry<TIndex, TItem>[]
} | {
    type: TRequestMethod.Delete
    indexes: TIndex[]
} | {
    type: TRequestMethod.DeleteRange
    indexFrom?: TIndex
    indexTo?: TIndex
}

export type TPutDeleteResult<TIndex> = {
    type: TRequestMethod.Add
    indexes?: TIndex[]
} | {
    type: TRequestMethod.Put | TRequestMethod.Delete | TRequestMethod.DeleteRange
}

export type TPutDeleteResults<TIndex, TItem> = {
	requests: TPutDeleteRequest<TIndex, TItem>
	results: TPutDeleteResult<TIndex>
}

export type TPutDelete<TIndex, TItem> = (requests: TPutDeleteRequest<TIndex, TItem>[])
    => TPromiseOrValue<TPutDeleteResults<TIndex, TItem>>

// endregion

// region change

export type TChangeRequest<TIndex, TItem> = {
    type: TRequestMethod.Add
    items: TItem[]
    returnIndexes?: boolean
} | {
    type: TRequestMethod.Put
    entries: TEntry<TIndex, TItem>[]
} | {
    type: TRequestMethod.Delete
    indexes: TIndex[]
} | {
    type: TRequestMethod.DeleteRange
    indexFrom?: TIndex
    indexTo?: TIndex
}

export type TChangeResult<TIndex> = {
    type: TRequestMethod.Add
    indexes?: TIndex[]
} | {
    type: TRequestMethod.Put | TRequestMethod.Delete | TRequestMethod.DeleteRange
}

export type TChangeResults<TIndex, TItem> = {
	requests: TChangeRequest<TIndex, TItem>
	results: TChangeResult<TIndex>
}

export type TChange<TIndex, TItem> = (requests: TChangeRequest<TIndex, TItem>[])
    => TPromiseOrValue<TChangeResults<TIndex, TItem>>

// endregion

// region INonUpdatableAsyncHeap

export interface INonUpdatableAsyncHeap<TIndex, TItem> {
    readonly get: TGet<TIndex, TItem>
    readonly addDelete: TAddDelete<TIndex, TItem>
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
    type: TRequestMethod.Delete
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
