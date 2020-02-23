import {
	BehaviorSubject,
	CalcObjectBuilder,
	IObservable,
	ISubject,
	ObservableClass,
	Subject,
} from 'webrain'
import {storeWindowState} from '../localStorage'

export function windowIsDestroyed(win: Window) {
	try {
		return !win || win.closed || !win.document
	} catch (ex) {
		return true
	}
}

// from: https://stackoverflow.com/a/1060034/5221762
function bindVisibleChange(window: Window, handler: (visible: boolean) => void) {
	/* tslint:disable:no-conditional-assignment */
	let hidden = 'hidden'
	let unsubscribe

	// Standards:
	if (hidden in window.document) {
		window.document.addEventListener('visibilitychange', onchange)
		unsubscribe = () => { window.document.removeEventListener('visibilitychange', onchange) }
	} else if ((hidden = 'mozHidden') in window.document) {
		window.document.addEventListener('mozvisibilitychange', onchange)
		unsubscribe = () => { window.document.removeEventListener('mozvisibilitychange', onchange) }
	} else if ((hidden = 'webkitHidden') in window.document) {
		window.document.addEventListener('webkitvisibilitychange', onchange)
		unsubscribe = () => { window.document.removeEventListener('webkitvisibilitychange', onchange) }
	} else if ((hidden = 'msHidden') in window.document) {
		window.document.addEventListener('msvisibilitychange', onchange)
		unsubscribe = () => { window.document.removeEventListener('msvisibilitychange', onchange) }
	} else if ('onfocusin' in window.document) {
		// IE 9 and lower:
		(window.document as any).onfocusin = (window.document as any).onfocusout = onchange
		unsubscribe = () => { (window.document as any).onfocusin = (window.document as any).onfocusout = null }
	} else {
		// All others:
		window.onpageshow = window.onpagehide = window.onfocus = window.onblur = onchange
		unsubscribe = () => { window.onpageshow = window.onpagehide = window.onfocus = window.onblur = null }
	}

	function onchange(evt) {
		const v = 'visible'
		const h = 'hidden'
		const evtMap = {
			focus: v,
			focusin: v,
			pageshow: v,
			blur: h,
			focusout: h,
			pagehide: h,
		}

		evt = evt || window.event
		if (evt.type in evtMap) {
			handler(evtMap[evt.type] === 'visible')
		} else {
			handler(!this[hidden])
		}
	}

	// set the initial state (but only if browser supports the Page Visibility API)
	if (window.document[hidden] !== undefined) {
		onchange({type: window.document[hidden] ? 'blur' : 'focus'})
	}

	return unsubscribe
}

function bindFocusChange(window: Window, handler: (focused: boolean) => void) {
	const onFocus = () => {
		handler(true)
	}
	const onBlur = () => {
		handler(false)
	}

	window.addEventListener('focus', onFocus)
	window.addEventListener('blur', onBlur)

	return () => {
		window.removeEventListener('focus', onFocus)
		window.removeEventListener('blur', onBlur)
	}
}

export class WindowSizeController {
	private winController: WindowController
	public width: number
	public height: number
	public borderWidth: number
	public borderHeight: number
	public lastResizeTime: number

	constructor(winController: WindowController) {
		this.winController = winController
	}

	public async init() {
		await this.winController.waitLoad()
		if (!this.winController.isOpened) {
			return
		}

		this.bind()

		if (typeof this.width === 'undefined') {
			this.width = this.winController.win.outerWidth
		}
		if (typeof this.height === 'undefined') {
			this.height = this.winController.win.outerHeight
		}
		this.borderWidth = this.winController.win.outerWidth - this.winController.win.innerWidth
		this.borderHeight = this.winController.win.outerHeight - this.winController.win.innerHeight
		console.log(`Window border size: ${this.borderWidth}, ${this.borderHeight}`)
	}

	public bind() {
		if (!this.winController.isOpened) {
			return
		}

		this.winController.resizeObservable.subscribe(() => {
			if (!this.winController.isOpened) {
				return
			}

			// fix unwanted auto resize, eg. after window.moveTo()
			if (this.lastResizeTime	&& Date.now() - this.lastResizeTime < 1000)
			{
				if (this.winController.win.outerWidth !== this.width || this.winController.win.outerHeight !== this.height) {
					this.winController.win.resizeTo(this.width, this.height)
				}
			} else {
				this.width = this.winController.win.outerWidth
				this.height = this.winController.win.outerHeight
				this.lastResizeTime = Date.now()
			}
		})
	}

	// region methods

	public resizeToInner(width: number, height: number) {
		if (!this.winController.isOpened) {
			return
		}

		return this.resizeToOuter(width + this.borderWidth, height + this.borderHeight)
	}

	public resizeToOuter(width: number, height: number) {
		if (!this.winController.isOpened) {
			return
		}

		// chrome has window width/height limitation = 211/103px
		// see also: https://developer.mozilla.org/en-US/docs/Web/API/Window/open
		width = Math.max(211, width)
		height = Math.max(103, height)
		this.width = width
		this.height = height
		this.lastResizeTime = Date.now()
		return this.winController.win.resizeTo(width, height)
	}

	// endregion
}

export interface IWindowControllerOptions {
	windowName: string,
	win: Window,
	storeWindowState?: boolean,
}

export class WindowController extends ObservableClass {
	public windowName: string
	public win: Window
	public sizeController: WindowSizeController
	private _storeWindowState: boolean

	constructor({
		windowName,
		win,
		// tslint:disable-next-line:no-shadowed-variable
		storeWindowState: _storeWindowState = true,
	}: IWindowControllerOptions) {
		super()

		this.windowName = windowName
		this.win = win
		this._storeWindowState = _storeWindowState
		this.sizeController = new WindowSizeController(this)
		this.init()
	}

	// region State

	public get isDestroyed() {
		const {win} = this
		if (!windowIsDestroyed(win)) {
			return false
		} else {
			if (win && win.close) {
				win.close()
			}
			return true
		}
	}

	public isLoaded: boolean
	public isClosing: boolean
	public get isOpened(): boolean {
		return !this.isDestroyed && !this.isClosing
	}

	public isVisible: boolean
	public isFocused: boolean

	// endregion

	// region waitLoad

	private async _waitLoad() {
		await new Promise(resolve => {
			if (!this.win) {
				resolve()
				return
			}

			this.win.document.body.onload = resolve
			// this.win.addEventListener('load', resolve, false)
			// this.win.addEventListener('DOMContentLoaded', resolve, false)
			if (this.win.document.readyState === 'complete') {
				resolve()
			}
		})

		await new Promise(resolve => {
			if (!this.win) {
				resolve()
				return
			}

			this.win.addEventListener('resize', resolve, false)
			if (this.win.innerWidth !== 0
				&& this.win.innerHeight !== 0
				&& this.win.outerWidth !== 0
				&& this.win.outerHeight !== 0
			) {
				resolve()
			}
		})

		this._waitLoadTask = null
	}

	private _waitLoadTask
	public async waitLoad() {
		if (!this._waitLoadTask) {
			this._waitLoadTask = this._waitLoad()
		}
		return this._waitLoadTask
	}

	// endregion

	// region init

	private async init() {
		await this.waitLoad()
		await this._init()
	}

	private async _init() {
		if (!this.win) {
			return
		}

		if (this._storeWindowState) {
			await storeWindowState(this.windowName, this.win as any)
		}

		this.bind()

		await this.sizeController.init()

		this.onLoad()
	}

	// endregion

	// region onLoad

	private _loadSubject: ISubject<any>

	public get loadObservable(): IObservable<any> {
		let {_loadSubject} = this
		if (!_loadSubject) {
			this._loadSubject = _loadSubject = new BehaviorSubject()
		}
		return _loadSubject
	}

	private onLoad() {
		if (this.isLoaded || !this.isOpened) {
			return
		}
		this.isLoaded = true

		console.log('Window loaded')

		const {_loadSubject} = this
		if (_loadSubject) {
			_loadSubject.emit(null)
		}
	}

	// endregion

	// region onClose

	private _closeSubject: ISubject<any>

	public get closeObservable(): IObservable<any> {
		let {_closeSubject} = this
		if (!_closeSubject) {
			this._closeSubject = _closeSubject = new BehaviorSubject()
		}
		return _closeSubject
	}

	private onClose() {
		if (!this.isOpened) {
			return
		}
		this.isClosing = true
		this.unbind()

		console.log('Window closing')

		const {_closeSubject} = this
		if (_closeSubject) {
			_closeSubject.emit(null)
		}

		console.log('Window closed')
	}

	// endregion

	// region onResize

	private _resizeSubject: ISubject<any>

	public get resizeObservable(): IObservable<any> {
		let {_resizeSubject} = this
		if (!_resizeSubject) {
			this._resizeSubject = _resizeSubject = new Subject()
		}
		return _resizeSubject
	}

	private onResize(e) {
		if (!this.isOpened) {
			return
		}

		const {_resizeSubject} = this
		if (_resizeSubject) {
			_resizeSubject.emit(e)
		}
	}

	// endregion

	// region bind / unbind events

	public bind() {
		if (!this.isOpened) {
			return
		}

		this.win.addEventListener('beforeunload', () => {
			this.onClose()
			return false
		})
		this.win.addEventListener('resize', e => {
			this.onResize(e)
		})
		this._setUnsubscriber('isVisible', bindVisibleChange(this.win, value => {
			this.isVisible = value
		}))
		this._setUnsubscriber('isFocused', bindFocusChange(this.win, value => {
			this.isFocused = value
		}))
	}

	public unbind() {
		if (this.isDestroyed) {
			return
		}

		this.win.removeEventListener('beforeunload', this.onClose)
		this.win.removeEventListener('resize', this.onClose)
		this._setUnsubscriber('isVisible', null)
		this._setUnsubscriber('isFocused', null)
	}

	// endregion

	// region methods

	public show() {
		if (!this.isOpened) {
			return
		}

		if ((this.win as any).restore) {
			(this.win as any).restore()
		}
		this.win.focus()
	}

	public minimize() {
		if (!this.isOpened) {
			return
		}

		if ((this.win as any).minimize) {
			(this.win as any).minimize()
		}
	}

	public close() {
		if (!this.isOpened) {
			return
		}

		const {win} = this
		try {
			this.onClose()
		} finally {
			win.close()
		}
	}

	// endregion
}

new CalcObjectBuilder(WindowController.prototype)
	.writable('isVisible')
	.writable('isFocused')

const WINDOW_STATE_PROPERTY_NAME = '13883806ede0481c92c41c2cda3d99c3'

export function createWindowController(options: IWindowControllerOptions): WindowController {
	if (windowIsDestroyed(options.win)) {
		return null
	}

	let controller: WindowController = options.win[WINDOW_STATE_PROPERTY_NAME]
	if (controller) {
		throw new Error('Window controller already created')
	}

	Object.defineProperty(options.win, WINDOW_STATE_PROPERTY_NAME, {
		enumerable: false,
		configurable: false,
		writable: false,
		value: controller = new WindowController(options),
	})

	return controller
}

export function getWindowController(win: Window): WindowController {
	if (windowIsDestroyed(win)) {
		return null
	}

	return win[WINDOW_STATE_PROPERTY_NAME]
}

export interface IWindowControllerFactoryOptions {
	windowName: string,
	windowFeatures?: string,
	storeWindowState?: boolean,
	replace?: boolean,
}

export class WindowControllerFactory {
	private _storeWindowState: boolean
	private _windowName: string
	private _windowOptions: any[]

	// resizable=no is not worked in browsers because: https://stackoverflow.com/a/15481333/5221762
	constructor({
		windowName,
		// docs: https://developer.mozilla.org/en-US/docs/Web/API/Window/open#Window_features
		windowFeatures = 'width=600,height=400,' +
		 'titlebar=no,resizable=yes,movable=yes,alwaysOnTop=yes,fullscreenable=yes,' +
		 'location=no,toolbar=no,scrollbars=no,menubar=no,status=no,directories=no,' +
		 'dialog=yes,modal=yes,dependent=yes',
		// tslint:disable-next-line:no-shadowed-variable
		storeWindowState = true,
		replace = true,
	}: IWindowControllerFactoryOptions) {
		this._windowName = windowName
		this._windowOptions = [ 'about:blank', windowName, windowFeatures, replace ]
		this._storeWindowState = storeWindowState
	}

	// region get or create windowController

	private _windowController: WindowController
	public get windowController() {
		if (windowIsDestroyed(window)) {
			return null
		}

		if (!this._windowController || !this._windowController.isOpened) {
			console.log('Window open')
			let win = window.open(...this._windowOptions)

			if (!win) {
				console.error('Cannot create popup window')
				return null
			}

			if (getWindowController(win)) {
				win.close()
				win = window.open(...this._windowOptions)
				if (getWindowController(win)) {
					throw new Error('Cannot recreate window with name: ' + this._windowName)
				}
			}

			const onParentWindowUnload = () => {
				window.removeEventListener('beforeunload', onParentWindowUnload)
				win.close()
			}
			window.addEventListener('beforeunload', onParentWindowUnload)

			this.appendCss(win)
			this.appendContainer(win)
			const windowController = createWindowController({
				windowName: this._windowName,
				win,
				storeWindowState: this._storeWindowState,
			})
			this._windowController = windowController
			windowController.loadObservable.subscribe(() => {
				if (!windowController.isOpened) {
					return
				}
				this.onLoad(windowController)
			})
		}
		return this._windowController
	}

	private appendCss(win) {
		const parentStyleElements = Array.from(window.document.querySelectorAll(
			'link[rel="stylesheet"][href^="client/"], style',
		))

		for (let i = 0; i < parentStyleElements.length; i++) {
			const parentStyleElement = parentStyleElements[i]
			let styleElement
			switch (parentStyleElement.tagName) {
				case 'LINK':
					styleElement = win.document.createElement('link')
					styleElement.rel = 'stylesheet'
					styleElement.href = (parentStyleElement as any).href
					break
				case 'STYLE':
					styleElement = win.document.createElement('style')
					styleElement.id = parentStyleElement.id
					styleElement.innerHTML = parentStyleElement.innerHTML
					break
				default:
					throw new Error('Unexpected style element: ' + styleElement.tagName)
			}
			win.document.head.appendChild(styleElement)
		}
	}

	private appendContainer(win) {
		win.container = win.document.createElement('div')
		win.document.body.appendChild(win.container)
	}

	// endregion

	// region onLoad

	private _loadSubject: ISubject<WindowController>

	// tslint:disable-next-line:no-identical-functions
	public get loadObservable(): IObservable<WindowController> {
		let {_loadSubject} = this
		if (!_loadSubject) {
			this._loadSubject = _loadSubject = new Subject()
		}
		return _loadSubject
	}

	private onLoad(windowController: WindowController) {
		const {_loadSubject} = this
		if (_loadSubject) {
			_loadSubject.emit(windowController)
		}
	}

	// endregion

	// // region onClose
	//
	// private _closeSubject: ISubject<WindowController>
	//
	// // tslint:disable-next-line:no-identical-functions
	// public get closeObservable(): IObservable<WindowController> {
	// 	let {_closeSubject} = this
	// 	if (!_closeSubject) {
	// 		this._closeSubject = _closeSubject = new Subject()
	// 	}
	// 	return _closeSubject
	// }
	//
	// private onClose(windowController: WindowController) {
	// 	const {_closeSubject} = this
	// 	if (_closeSubject) {
	// 		_closeSubject.emit(windowController)
	// 	}
	// }
	//
	// // endregion

	public close() {
		if (this._windowController) {
			this._windowController.close()
		}
	}
}