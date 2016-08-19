/**
 * External Dependencies
 */
import React from 'react';
import { partial, noop, truncate } from 'lodash';
import classnames from 'classnames';

/**
 * Internal Dependencies
 */
import Card from 'components/card';
import AuthorAndSite from 'blocks/reader-author-and-site';
import FollowButton from 'reader/follow-button';
import LikeButton from 'reader/like-button';
import CommentButton from 'blocks/comment-button';
import DisplayTypes from 'state/reader/posts/display-types';
import Gravatar from 'components/gravatar';
import Gridicon from 'components/gridicon';

function FeaturedImage( { image, href } ) {
	return (
		<div className="reader-post-card__featured-image">
			<a href={ href }>
			<img src="https://placekitten.com/600/400" />
			</a>
		</div> );
}

function PostByline( { post, site, feed } ) {
	return (
		<div className="reader-post-card__meta ignore-click">
			<Gravatar user={ post.author } />
			<div className="reader-post-card__meta-details">
				<a className="reader-post-card__author reader-post-card__link">Sue Smith</a>
				<a className="reader-post-card__link">catsandfurballs.wordpress.com</a>
				<div className="reader-post-card__timestamp-and-tag">
					<span className="reader-post-card__timestamp">1 hour ago</span>
					<span className="reader-post-card__tag"><Gridicon icon="tag" />Pets</span>
				</div>
			</div>
		</div>
	);
}

export function RefreshPostCard( { post, site, feed, onClick = noop, onCommentClick = noop } ) {
	const featuredImage = post.canonical_image;
	const isPhotoOnly = post.display_type & DisplayTypes.PHOTO_ONLY;
	const title = truncate( post.title, {
		length: isPhotoOnly ? 50 : 140,
		separator: /,? +/
	} );
	const classes = classnames( 'reader-post-card', {
		'has-thumbnail': !! featuredImage,
		'is-photo': isPhotoOnly
	} );

	return (
		<Card className={ classes } onClick={ partial( onClick, { post, site, feed } ) }>
			<PostByline post={ post } site={ site } feed={ feed } />
			<div className="reader-post-card__post">
				{ featuredImage && <FeaturedImage image={ featuredImage } href={ post.URL } /> }
				<div className="reader-post-card__post-details">
					<h1 className="reader-post-card__title">
						<a className="reader-post-card__title-link" href={ post.URL }>{ title }</a>
					</h1>
					<div className="reader-post-card__excerpt">{ post.short_excerpt }</div>
					<ul className="reader-post-card__social ignore-click">
						<li className="reader-post-card__visit"><Gridicon icon="external" /></li>
						<li><Gridicon icon="share" /></li>
						<li><CommentButton
							commentCount={ post.discussion.comment_count }
							tagName="span" showLabel={ false }
							onClick={ onCommentClick }/></li>
						<li><LikeButton siteId={ post.site_ID } postId={ post.ID } tagName="span" showZeroCount={ false } showLabel={ false } /></li>
						<li><Gridicon icon="ellipsis" /></li>
					</ul>
				</div>
			</div>
		</Card>
	);
}

export default RefreshPostCard;