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

// endregion

// region get

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
    noIndexes?: boolean
    noItems?: boolean
}

export type TGetResult<TIndex, TItem> = {
    type: TRequestMethod.GetCount
    count: number
} | {
    type: TRequestMethod.Get
    items: TItem[]
} | {
    type: TRequestMethod.GetRange
    items: TItem[]
} | {
    type: TRequestMethod.GetRange
    indexes: TIndex[]
    items?: TItem[]
}

export type TGetResults<TIndex, TItem> = {
	requests: TGetRequest<TIndex>
	results: TGetResult<TIndex, TItem>
}

export type TGet<TIndex, TItem> = (requests: TGetRequest<TIndex>[])
    => TPromiseOrValue<TGetResults<TIndex, TItem>>

// endregion

// region addDelete

export type TAddDeleteRequest<TIndex, TItem> = {
    type: TRequestMethod.Add
    items: TItem[]
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
    indexes: TIndex[]
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

// region change

export type TChangeRequest<TIndex, TItem> = {
    type: TRequestMethod.Put | TRequestMethod.Add
    items: TItem[]
} | {
    type: TRequestMethod.Delete
    indexes: TIndex[]
} | {
    type: TRequestMethod.DeleteRange
    indexFrom?: TIndex
    indexTo?: TIndex
}

export type TChangeResult<TIndex> = {
    type: TRequestMethod.Put
    indexes: TIndex[]
} | {
    type: TRequestMethod.Delete | TRequestMethod.DeleteRange
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
