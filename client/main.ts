// Client entry point

 // TODO: Remove, when proper structure done
import * as options from './options'
import * as client from './client'
import BoardNavigation from './page/boardNavigation'
import {exec, defer} from './defer'
import * as threadCreation from './posts/threadCreation'
const o = options // Prevents the compiler from removing as an unused import
const c = client
const t = threadCreation

import {displayLoading} from './state'
import {start as connect} from './connection'
import {loadFromDB, loadBoardConfig} from './state'
import {open} from './db'
import {renderBoard} from './page/board'

// Clear cookies, if versions mismatch.
const cookieVersion = 4
if (localStorage.getItem("cookieVersion") !== cookieVersion.toString()) {
	for (let cookie of document.cookie.split(";")) {
		const eqPos = cookie.indexOf("="),
			name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
		document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT"
	}
	localStorage.setItem("cookieVersion", cookieVersion.toString())
}

defer(() =>
	new BoardNavigation())

// Load all stateful modules in dependancy order
async function start() {
	// Load asynchronously and concurently as fast as possible
	const boardConf = loadBoardConfig()
	await open()
	await loadFromDB()
	await boardConf
	renderBoard()
	connect()
	exec()
	displayLoading(false)
}

start()
