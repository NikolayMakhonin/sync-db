import {IHasUuid, TValueOrPromise} from '../contracts/common'
import {IChanges, TChangeAction, TChangeActionWithSeq, TGetChangesOptions} from '../contracts/IChanges'

export class ChangesSimple<TItem extends IHasUuid = IHasUuid> implements IChanges<TItem> {
	_lastSeq = 0
	_changes: TChangeActionWithSeq[] = []

	change(actions: TChangeAction<TItem>[]): TValueOrPromise<void> {
		for (let i = 0, len = actions.length; i < len; i++) {
			const action = actions[i] as TChangeActionWithSeq
			action.seq = ++this._lastSeq
			this._changes.push(action)
		}
	}

	getChanges(options: TGetChangesOptions): TChangeActionWithSeq<TItem>[] {
		const fromSeq = options.fromSeq || 0
		const limit = options.limit
		const result = []
		for (let i = 0, len = this._changes.length; i < len; i++) {
			if (limit === 0 || result.length >= limit) {
				break
			}
			const change = this._changes[i]
			if (change.seq >= fromSeq) {
				result.push(change)
			}
		}
		return result
	}
}
