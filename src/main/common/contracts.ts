// // region Common
//
// // endregion
//
// // region IDbIo
//
//
// // endregion
//
// // region Change events
//
//
// // endregion
//
// interface IDb extends IDbIo {
//     subscribe(event => void, options: ISubscribeOptions): IUnsubscribe
//     sync(): TValueOrPromise<void>
//     useTransaction((dbIo: IDbIo) => TValueOrPromise<void>): TValueOrPromise<void>
// }
