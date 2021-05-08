import {IHasUuid, IUnsubscribe, TValueOrPromise} from './common'
import {TChangeActionType} from './IChanges'

export type TChangeEvent<TItem extends IHasUuid = IHasUuid> = {
    type: TChangeActionType.Put
    oldItems: (TItem|null)[]
    newItems: TItem[]
} | {
    type: TChangeActionType.Delete
    oldItems: TItem[]
}

export interface IDbSubscribe<TItem extends IHasUuid = IHasUuid> {
    onChange(subscriber: () => void): IUnsubscribe
    getChanges(fromSeqNumber: number, count: number): TValueOrPromise<TChangeEvent<TItem>[]>
}
