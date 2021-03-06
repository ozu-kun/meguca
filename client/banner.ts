// Handles all things related to the top banner

import {config} from './state'
import {defer} from './defer'
import Modal from './modal'
import {ViewAttrs} from './view'
import {banner as lang} from './lang'
import {write, read} from './render'
import {find, HTML} from './util'
import Model from './model'
import View from './view'

// Stores the views of all BannerModal instances
export const bannerModals: {[key: string]: BannerModal} = {}

// View of the modal currently displayed, if any
let visible: BannerModal
const $overlay = document.querySelector("#modal-overlay")

// Highlight options button by fading out and in, if no options are set
function highlightBanner(name: string) {
	const key = name + "_seen"
	if (localStorage.getItem(key)) {
		return
	}

	let out = true,
		clicked: boolean,
		el: Element

	read(() => {
		el = document.querySelector('#banner-' + name)
		el.addEventListener("click", () => {
			clicked = true
			localStorage.setItem(key, '1')
		})
		tick()
	})

	function tick() {
		// Stop
		if (clicked) {
			el.style.opacity = '1'
			return
		}

		el.style.opacity = (+el.style.opacity + (out ? -0.02 : 0.02)).toString()
		const now = +el.style.opacity

		// Reverse direction
		if ((out && now <= 0) || (!out && now >= 1)) {
			out = !out
		}
		requestAnimationFrame(tick)
	}
}

defer(() =>
	["options", "FAQ", "identity", "account"]
	.forEach(highlightBanner))

// A modal element, that is positioned fixed right beneath the banner
export class BannerModal extends Modal<Model> {
	// Are the contents already rendered? Used for lazy rendering.
	isRendered: boolean

	constructor(args: ViewAttrs) {
		let cls = "banner-modal"
		if (args.class) {
			cls += " " + args.class
		}
		args.class = cls
		super(args)
		bannerModals[this.id] = this

		// Add click listener to the toggle button of the modal in the banner
		read(() =>
			document
			.querySelector('#banner-' + (this.id as string).split('-')[0])
			.addEventListener('click', () => this.toggle(), {capture: true}))
		write(() =>
			$overlay.append(this.el))
	}

	// Inert the HTML into the element and set flag to true for lazy rendering
	lazyRender(html: string) {
		write(() => {
			this.el.innerHTML = html
			this.isRendered = true
		})
	}

	// Show the element, if hidden, hide - if shown. Hide already visible
	// banner modal, if any.
	toggle() {
		if (visible) {
			const old = visible
			visible.hide()
			if (old !== this) {
				this.show()
			}
		} else {
			this.show()
		}
	}

	// Unhide the element. If the element has not been rendered yet, do it.
	show() {
		if (!this.isRendered) {
			// All child classes must implement the .render() method.
			// Tell TS to fuck off for this one.
			(this as any).render()
		}
		write(() =>
			this.el.style.display = 'block')
		visible = this
	}

	// Hide the element
	hide() {
		write(() =>
			this.el.style.display = 'none')
		visible = null
	}
}

// A view that supports switching between multiple tabs
export class TabbedModal extends BannerModal {
	constructor(args: ViewAttrs) {
		super(args)
		this.onClick({
			'.tab-link': e =>
				this.switchTab(e),
		})
	}

	// Switch to a tab, when clicking the tab butt
	switchTab(event: Event) {
		write(() => {
			const el = event.target as Element

			// Deselect previous tab
			for (let selected of this.el.querySelectorAll('.tab-sel')) {
				selected.classList.remove('tab-sel')
			}

			// Select the new one
			el.classList.add('tab-sel')
			const id = el.getAttribute('data-id')
			find<Element>(this.el.querySelector(".tab-cont").children, li =>
				li.getAttribute('data-id') === id
			)
				.classList.add('tab-sel')
		})
	}
}

// FAQ and information pannel
class FAQPanel extends BannerModal {
	constructor() {
		super({id: "FAQ"})
	}

	render() {
		const html = HTML
			`meguca is licensed under the
			<a href="https://www.gnu.org/licenses/agpl.html" target="_blank">
				GNU Affero General Public License
			</a>
			<br>
			Source code repository:&nbsp;
			<a href="https://github.com/bakape/meguca" target="_blank">
				github.com/bakape/meguca
			</a>
			<hr>
			${config.FAQ.replace(/\n/g, "<br>")}`

		this.lazyRender(html)
	}
}

// Frequently asked questions and other information modal
defer(() =>
	new FAQPanel())

// Apply localised hover tooltips to banner links
function localiseTitles() {
	for (let id of ['feedback', 'FAQ', 'identity', 'options', 'account']) {
		setTitle('banner-' + id, id)
	}
	setTitle('sync', 'sync')
}

defer(localiseTitles)

// Set the title of an element to a localised string
export const setTitle = (id: string, langID: string) =>
	read(() =>
		document.querySelector('#' + id)
		.setAttribute('title', lang[langID]))
