/** @ssr-ready **/

/**
 * External dependencies
 */
import {
	filter,
	find,
	flowRight as compose,
	get,
	has,
	map,
	partialRight,
	some,
	split,
	includes,
} from 'lodash';

/**
 * Internal dependencies
 */
import config from 'config';
import { isHttps, withoutHttp } from 'lib/url';

/**
 * Internal dependencies
 */
import createSelector from 'lib/create-selector';
import { fromApi as seoTitleFromApi } from 'components/seo/meta-title-editor/mappings';
import versionCompare from 'lib/version-compare';
import getComputedAttributes from 'lib/site/computed-attributes';

/**
 * Returns a raw site object by its ID.
 *
 * @param  {Object}  state  Global state tree
 * @param  {Number}  siteId Site ID
 * @return {?Object}        Site object
 */
export const getRawSite = ( state, siteId ) => {
	return state.sites.items[ siteId ] || null;
};

/**
 * Returns a normalized site object by its ID. Intends to replicate
 * the site object returned from the legacy `sites-list` module.
 *
 *
 * @param  {Object}  state  Global state tree
 * @param  {Number}  siteId Site ID
 * @return {?Object}        Site object
 */
export const getSite = createSelector(
	( state, siteId ) => {
		const site = getRawSite( state, siteId );

		if ( ! site ) {
			return null;
		}

		return {
			...site,
			...getComputedAttributes( site ),
			hasConflict: isSiteConflicting( state, siteId ),
			title: getSiteTitle( state, siteId ),
			slug: getSiteSlug( state, siteId ),
			domain: getSiteDomain( state, siteId ),
			is_previewable: isSitePreviewable( state, siteId )
		};
	},
	( state ) => state.sites.items
);

/**
 * Returns a filtered array of WordPress.com site IDs where a Jetpack site
 * exists in the set of sites with the same URL.
 *
 * @param  {Object}   state Global state tree
 * @return {Number[]}       WordPress.com site IDs with collisions
 */
export const getSiteCollisions = createSelector(
	( state ) => {
		return map( filter( state.sites.items, ( wpcomSite ) => {
			const wpcomSiteUrlSansProtocol = withoutHttp( wpcomSite.URL );
			return ! wpcomSite.jetpack && some( state.sites.items, ( jetpackSite ) => {
				return (
					jetpackSite.jetpack &&
					wpcomSiteUrlSansProtocol === withoutHttp( jetpackSite.URL )
				);
			} );
		} ), 'ID' );
	},
	( state ) => state.sites.items
);

/**
 * Returns true if a collision exists for the specified WordPress.com site ID.
 *
 * @param  {Object}  state  Global state tree
 * @param  {Number}  siteId Site ID
 * @return {Boolean}        Whether collision exists
 */
export function isSiteConflicting( state, siteId ) {
	return includes( getSiteCollisions( state ), siteId );
}

/**
 * Returns true if site has only a single user, false if the site not a single
 * user site, or null if the site is unknown.
 *
 * @param  {Object}   state  Global state tree
 * @param  {Number}   siteId Site ID
 * @return {?Boolean}        Whether site is a single user site
 */
export function isSingleUserSite( state, siteId ) {
	return get( getSite( state, siteId ), 'single_user_site', null );
}

/**
 * Returns true if site is a Jetpack site, false if the site is hosted on
 * WordPress.com, or null if the site is unknown.
 *
 * @param  {Object}   state  Global state tree
 * @param  {Number}   siteId Site ID
 * @return {?Boolean}        Whether site is a Jetpack site
 */
export function isJetpackSite( state, siteId ) {
	const site = getRawSite( state, siteId );
	if ( ! site ) {
		return null;
	}

	return site.jetpack;
}

/**
 * Returns true if the site is a Jetpack site with the specified module active,
 * or false if the module is not active. Returns null if the site is not known
 * or is not a Jetpack site.
 *
 * @param  {Object}   state  Global state tree
 * @param  {Number}   siteId Site ID
 * @param  {String}   slug   Module slug
 * @return {?Boolean}        Whether site has Jetpack module active
 */
export function isJetpackModuleActive( state, siteId, slug ) {
	const modules = getSiteOption( state, siteId, 'active_modules' );
	if ( ! modules ) {
		return null;
	}

	return includes( modules, slug );
}

/**
 * Returns true if the Jetpack site is running a version meeting the specified
 * minimum, or false if the Jetpack site is running an older version. Returns
 * null if the version cannot be determined or if not a Jetpack site.
 *
 * @param  {Object}   state   Global state tree
 * @param  {Number}   siteId  Site ID
 * @param  {String}   version Minimum version
 * @return {?Boolean}         Whether running minimum version
 */
export function isJetpackMinimumVersion( state, siteId, version ) {
	const isJetpack = isJetpackSite( state, siteId );
	if ( ! isJetpack ) {
		return null;
	}

	const siteVersion = getSiteOption( state, siteId, 'jetpack_version' );
	if ( ! siteVersion ) {
		return null;
	}

	return versionCompare( siteVersion, version, '>=' );
}

/**
 * Returns the slug for a site, or null if the site is unknown.
 *
 * @param  {Object}  state  Global state tree
 * @param  {Number}  siteId Site ID
 * @return {?String}        Site slug
 */
export function getSiteSlug( state, siteId ) {
	const site = getRawSite( state, siteId );
	if ( ! site ) {
		return null;
	}

	if ( getSiteOption( state, siteId, 'is_redirect' ) || isSiteConflicting( state, siteId ) ) {
		return withoutHttp( getSiteOption( state, siteId, 'unmapped_url' ) );
	}

	return withoutHttp( site.URL ).replace( /\//g, '::' );
}

/**
 * Returns the domain for a site, or null if the site is unknown.
 *
 * @param  {Object}  state  Global state tree
 * @param  {Number}  siteId Site ID
 * @return {?String}        Site domain
 */
export function getSiteDomain( state, siteId ) {
	if ( getSiteOption( state, siteId, 'is_redirect' ) || isSiteConflicting( state, siteId ) ) {
		return getSiteSlug( state, siteId );
	}

	const site = getRawSite( state, siteId );

	if ( ! site ) {
		return null;
	}

	return withoutHttp( site.URL );
}

/**
 * Returns a title by which the site can be canonically referenced. Uses the
 * site's name if available, falling back to its domain. Returns null if the
 * site is not known.
 *
 * @param  {Object}  state  Global state tree
 * @param  {Number}  siteId Site ID
 * @return {?String}        Site title
 */
export function getSiteTitle( state, siteId ) {
	const site = getRawSite( state, siteId );
	if ( ! site ) {
		return null;
	}

	if ( site.name ) {
		return site.name.trim();
	}

	return getSiteDomain( state, siteId );
}

/**
 * Returns true if the site can be previewed, false if the site cannot be
 * previewed, or null if preview ability cannot be determined. This indicates
 * whether it is safe to embed iframe previews for the site.
 *
 * @param  {Object}   state  Global state tree
 * @param  {Number}   siteId Site ID
 * @return {?Boolean}        Whether site is previewable
 */
export function isSitePreviewable( state, siteId ) {
	if ( ! config.isEnabled( 'preview-layout' ) ) {
		return false;
	}

	const site = getRawSite( state, siteId );
	if ( ! site ) {
		return null;
	}

	if ( site.is_vip ) {
		return false;
	}

	const unmappedUrl = getSiteOption( state, siteId, 'unmapped_url' );
	return !! unmappedUrl && isHttps( unmappedUrl );
}

/**
 * Returns a site option for a site
 *
 * @param  {Object}  state  Global state tree
 * @param  {Number}  siteId Site ID
 * @param  {String}  optionName The option key
 * @return {*}  The value of that option or null
 */
export function getSiteOption( state, siteId, optionName ) {
	const site = getRawSite( state, siteId );
	if ( ! site || ! site.options ) {
		return null;
	}
	return site.options[ optionName ];
}

/**
 * Returns true if we are requesting all sites.
 * @param {Object}    state  Global state tree
 * @return {Boolean}        Request State
 */
export function isRequestingSites( state ) {
	return !! state.sites.requestingAll;
}

/**
 * Returns true if a network request is in progress to fetch the specified, or
 * false otherwise.
 *
 * @param  {Object}  state  Global state tree
 * @param  {Number}  siteId Site ID
 * @return {Boolean}        Whether request is in progress
 */
export function isRequestingSite( state, siteId ) {
	return !! state.sites.requesting[ siteId ];
}

/**
 * Returns object describing custom title format
 * strings for SEO given a site object.
 *
 * @see client/components/seo/meta-title-editor
 *
 * @param  {Object} site Selected site
 * @return {Object} Formats by type e.g. { frontPage: { type: 'siteName' } }
 */
export const getSeoTitleFormatsForSite = compose(
	seoTitleFromApi,
	partialRight( get, 'options.advanced_seo_title_formats', {} )
);

/**
 * Returns object describing custom title format
 * strings for SEO.
 *
 * @see client/components/seo/meta-title-editor
 *
 * @param  {Object} state  Global app state
 * @param  {Number} siteId Selected site
 * @return {Object} Formats by type e.g. { frontPage: { type: 'siteName' } }
 */
export const getSeoTitleFormats = compose(
	getSeoTitleFormatsForSite,
	getRawSite
);

export const buildSeoTitle = ( titleFormats, type, { site, post = {}, tag = '', date = '' } ) => {
	const processPiece = ( piece = {}, data ) =>
		'string' === piece.type
			? piece.value
			: get( data, piece.type, '' );

	const buildTitle = ( format, data ) =>
		get( titleFormats, format, [] )
			.reduce( ( title, piece ) => title + processPiece( piece, data ), '' );

	switch ( type ) {
		case 'frontPage':
			return buildTitle( 'frontPage', {
				siteName: site.name,
				tagline: site.description
			} ) || site.name;

		case 'posts':
			return buildTitle( 'posts', {
				siteName: site.name,
				tagline: site.description,
				postTitle: get( post, 'title', '' )
			} ) || get( post, 'title', '' );

		case 'pages':
			return buildTitle( 'pages', {
				siteName: site.name,
				tagline: site.description,
				pageTitle: get( post, 'title', '' )
			} );

		case 'groups':
			return buildTitle( 'groups', {
				siteName: site.name,
				tagline: site.description,
				groupTitle: tag
			} );

		case 'archives':
			return buildTitle( 'archives', {
				siteName: site.name,
				tagline: site.description,
				date: date
			} );

		default:
			return post.title || site.name;
	}
};

export const getSeoTitle = ( state, type, data ) => {
	if ( ! has( data, 'site.ID' ) ) {
		return '';
	}

	const titleFormats = getSeoTitleFormats( state, data.site.ID );

	return buildSeoTitle( titleFormats, type, data );
};

/**
 * Returns a site object by its URL.
 *
 * @param  {Object}  state Global state tree
 * @param  {String}  url   Site URL
 * @return {?Object}       Site object
 */
export function getSiteByUrl( state, url ) {
	const slug = withoutHttp( url ).replace( /\//g, '::' );
	const site = find( state.sites.items, ( item, siteId ) => {
		return getSiteSlug( state, siteId ) === slug;
	} );

	if ( ! site ) {
		return null;
	}

	return site;
}

/**
 * Returns a site's theme showcase path.
 *
 * @param  {Object}  state  Global state tree
 * @param  {Number}  siteId SiteId
 * @return {?String}        Theme showcase path
 */
export function getSiteThemeShowcasePath( state, siteId ) {
	const site = getRawSite( state, siteId );
	if ( ! site || site.jetpack ) {
		return null;
	}

	const [ type, slug ] = split( getSiteOption( state, siteId, 'theme_slug' ), '/', 2 );

	// to accomodate a8c and other theme types
	if ( ! includes( [ 'pub', 'premium' ], type ) ) {
		return null;
	}

	const siteSlug = getSiteSlug( state, siteId );
	return type === 'premium'
		? `/theme/${ slug }/setup/${ siteSlug }`
		: `/theme/${ slug }/${ siteSlug }`;
}

/**
 * Returns a site's plan object by site ID.
 *
 * The difference between this selector and sites/plans/getPlansBySite is that the latter selectors works
 * with the /sites/$site/plans endpoint while the former selectors works with /sites/$site endpoint.
 * Query these endpoints to see if you need the first or the second one.
 *
 * @param  {Object}  state  Global state tree
 * @param  {Number}  siteId Site ID
 * @return {?Object}        Site's plan object
 */
export function getSitePlan( state, siteId ) {
	const site = getRawSite( state, siteId );

	if ( ! site ) {
		return null;
	}

	if ( get( site.plan, 'expired', false ) ) {
		if ( site.jetpack ) {
			return {
				product_id: 2002,
				product_slug: 'jetpack_free',
				product_name_short: 'Free',
				free_trial: false,
				expired: false
			};
		}

		return {
			product_id: 1,
			product_slug: 'free_plan',
			product_name_short: 'Free',
			free_trial: false,
			expired: false
		};
	}

	return site.plan;
}

/**
 * Returns true if the current site plan is a paid one
 *
 * @param  {Object}   state         Global state tree
 * @param  {Number}   siteId        Site ID
 * @return {?Boolean}               Whether the current plan is paid
 */
export function isCurrentPlanPaid( state, siteId ) {
	const sitePlan = getSitePlan( state, siteId );

	if ( ! sitePlan ) {
		return null;
	}

	return sitePlan.product_id !== 1 && sitePlan.product_id !== 2002;
}

/**
 * Returns true if site is currently subscribed to supplied plan and false otherwise.
 *
 * @param  {Object}   state         Global state tree
 * @param  {Number}   siteId        Site ID
 * @param  {Number}   planProductId Plan product_id
 * @return {?Boolean}               Whether site's plan matches supplied plan
 */
export function isCurrentSitePlan( state, siteId, planProductId ) {
	if ( planProductId === undefined ) {
		return null;
	}

	const sitePlan = getSitePlan( state, siteId );

	if ( ! sitePlan ) {
		return null;
	}

	return sitePlan.product_id === planProductId;
}
