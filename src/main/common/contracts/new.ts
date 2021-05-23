export type TPromiseOrValue<TValue> = Promise<TValue> | TValue

export enum TRequestMethod {
    Get = 'get',
    GetCount = 'getCount',
    GetRange = 'getRange',
    Put = 'put',
    Delete = 'delete',
    DeleteRange = 'deleteRange',
}

export type TRequest<TIndex, TItem> = {
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
} | {
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

export type TResult<TIndex, TItem> = {
    type: TRequestMethod.GetCount
    count: number
} | {
    type: TRequestMethod.Get | TRequestMethod.GetRange
    items: TItem[]
} | {
    type: TRequestMethod.Put
    indexes: TIndex[]
} | {
    type: TRequestMethod.Delete | TRequestMethod.DeleteRange
}
// | {
// 	type: TRequestMethod
// 	error: {
// 		code: string
// 		message: string
// 	}
// }

export type TResults<TIndex, TItem> = {
	requests: TRequest<TIndex, TItem>
	results: TResult<TIndex, TItem>
}

export interface IAsyncHeap<TIndex, TItem> {
    request(requests: TRequest<TIndex, TItem>[]): TPromiseOrValue<TResults<TIndex, TItem>>
}

export interface ITransactionAsyncHeap<TIndex, TItem> {
    requestInTransaction(requests: TRequest<TIndex, TItem>[]): TPromiseOrValue<TResults<TIndex, TItem>>
    useTransaction<T>(func: (transaction: IAsyncHeap<TIndex, TItem>) => TPromiseOrValue<T>): TPromiseOrValue<T>
}
