export type IUnsubscribe = () => void

export type TValueOrPromise<TValue> = TValue | Promise<TValue>

export type UUID = string

export interface IHasUuid {
    uuid: UUID
}
