import {IHasUuid, TValueOrPromise, UUID} from './common'

// region common

export enum TChangeActionType {
    Put = 'put',
    Delete = 'delete',
    Clear = 'clear',
}

export type TChangeAction<TItem extends IHasUuid = IHasUuid> = {
    type: TChangeActionType.Put
    items: TItem[]
} | {
    type: TChangeActionType.Delete
    uuids: UUID[]
} | {
    type: TChangeActionType.Clear
}

export enum TChangeType {
    Add = 'add',
    Update = 'update',
    Delete = 'delete',
}

export type TChange<TItem extends IHasUuid = IHasUuid> = {
    items: TItem[]
} | {
    items: TItem[]
    oldItems: TItem[]
} | {
    oldItems: TItem[]
}

// endregion

// region db

export type TGetOptions = {
    uuids: string[],
} | {
    all: true,
} | {
    uuidFrom: string
    uuidTo?: string
} | {
    uuidFrom?: string
    uuidTo: string
}

export interface IDb<TItem extends IHasUuid = IHasUuid> {
    change(actions: TChangeAction<TItem>[]): TValueOrPromise<void>
    get(options: TGetOptions): TValueOrPromise<TItem[]>
    subscribe(subscriber: (actions: TChangeAction<TItem>[]) => void)
}

// endregion

// region changes

export type TChangeActionWithSeq<TItem extends IHasUuid = IHasUuid> = TChangeAction<TItem> & {
    seq: number
}

export type TGetChangesOptions = {
    fromSeq?: number
    limit?: number
}

export interface IChanges<TItem extends IHasUuid = IHasUuid> {
    /** Auto optimize adding actions */
    change(actions: TChangeAction<TItem>[]): TValueOrPromise<void>
    getChanges(options: TGetChangesOptions): TChangeActionWithSeq<TItem>[]
}

// endregion
