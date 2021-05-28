export type TPromiseOrValue<TValue> = Promise<TValue> | TValue

export enum TRequestMethod {
    Get = 'get',
    GetCount = 'getCount',
    GetRange = 'getRange',
    Put = 'put',
    Delete = 'delete',
    DeleteRange = 'deleteRange',
}

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
}

export type TChangeRequest<TIndex, TItem> = {
    type: TRequestMethod.Put
    items: TItem[]
} | {
    type: TRequestMethod.Delete
    indexes: TIndex[]
} | {
    type: TRequestMethod.DeleteRange
    indexFrom?: TIndex
    indexTo?: TIndex
}

export type TGetResult<TItem> = {
    type: TRequestMethod.GetCount
    count: number
} | {
    type: TRequestMethod.Get | TRequestMethod.GetRange
    items: TItem[]
}

export type TChangeResult<TIndex> = {
    type: TRequestMethod.Put
    indexes: TIndex[]
} | {
    type: TRequestMethod.Delete | TRequestMethod.DeleteRange
}

export type TGetResults<TIndex, TItem> = {
	requests: TGetRequest<TIndex>
	results: TGetResult<TItem>
}

export type TChangeResults<TIndex, TItem> = {
	requests: TChangeRequest<TIndex, TItem>
	results: TChangeResult<TIndex>
}

export interface IAsyncHeap<TIndex, TItem> {
    get(requests: TGetRequest<TIndex>[]): TPromiseOrValue<TGetResults<TIndex, TItem>>
    change(requests: TChangeRequest<TIndex, TItem>[]): TPromiseOrValue<TChangeResults<TIndex, TItem>>
}

export interface ITransactionAsyncHeap<TIndex, TItem> {
    get(requests: TGetRequest<TIndex>[]): TPromiseOrValue<TGetResults<TIndex, TItem>>
    changeInTransaction(requests: TChangeRequest<TIndex, TItem>[]): TPromiseOrValue<TChangeResults<TIndex, TItem>>
    /** Forbidden to use get requests after change requests */
    useTransaction<T>(func: (transaction: IAsyncHeap<TIndex, TItem>) => TPromiseOrValue<T>): TPromiseOrValue<T>
}
