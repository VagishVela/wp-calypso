/**
 * External dependencies
 */
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import { createReducer } from 'state/utils';
import {
	DOCUMENT_HEAD_LINK_ADD,
	DOCUMENT_HEAD_META_ADD,
	DOCUMENT_HEAD_TITLE_SET,
	DOCUMENT_HEAD_UNREAD_COUNT_SET
} from 'state/action-types';

export const title = createReducer( '', {
	[ DOCUMENT_HEAD_TITLE_SET ]: ( state, action ) => action.title
} );

export const unreadCount = createReducer( 0, {
	[ DOCUMENT_HEAD_UNREAD_COUNT_SET ]: ( state, { count } ) => count
} );

export const meta = createReducer( [], {
	[ DOCUMENT_HEAD_META_ADD ]: ( state, action ) => [ ...state, action.meta ]
} );

export const link = createReducer( [], {
	[ DOCUMENT_HEAD_LINK_ADD ]: ( state, action ) => [ ...state, action.link ]
} );

export default combineReducers( {
	link,
	meta,
	title,
	unreadCount
} );
