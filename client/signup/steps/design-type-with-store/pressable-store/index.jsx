/**
 * External dependencies
 */
import React, { PropTypes, Component } from 'react';
import EmailValidator from 'email-validator';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */

import Gridicon from 'components/gridicon';
import LoggedOutForm from 'components/logged-out-form';
import LoggedOutFormFooter from 'components/logged-out-form/footer';
import LoggedOutFormLinks from 'components/logged-out-form/links';
import LoggedOutFormLinkItem from 'components/logged-out-form/link-item';
import FormTextInput from 'components/forms/form-text-input';
import FormInputValidation from 'components/forms/form-input-validation';
import FormButton from 'components/forms/form-button';
import FormLabel from 'components/forms/form-label';
import FormSectionHeading from 'components/forms/form-section-heading';
import StepHeader from 'signup/step-header';
import Button from 'components/button';
import { localize } from 'i18n-calypso';
import { recordTracksEvent } from 'state/analytics/actions';

import HeroImage from './hero-image';

class PressableStoreStep extends Component {
	constructor(props) {
		super(props);

		this.state = {
			email: '',
			isValid: false,
			error: null,
		};
	}

	componentDidMount() {
		this.props.setRef( this );
	}

	focus = () => {
		if ( this._input ) {
			this._input.focus();
		}
	};

	onEmailChange = ( { target: { value: email } } ) => {
		const isValid = EmailValidator.validate( email );
		const error = this.state.error && isValid
			? null
			: this.state.error;
		this.setState( {
			email,
			isValid,
			error,
		} );
	};

	onSubmit = ( event ) => {
		event.preventDefault();

		if ( ! this.state.isValid ) {
			this.setState( {
				error: this.props.translate( 'Please provide a valid email address.' ),
			} );
			return;
		}

		this.props.partnerClickRecorder();

		window.open( `https://my.pressable.com/signup/ecommerce-five-sites?email=${ encodeURIComponent( this.state.email ) }&utm_source=wordpresscom&utm_medium=signupref&utm_campaign=wpcomecomm2` );
	};

	onEmailInputRef = ( input ) => {
		this._input = input;
	};

	renderStoreForm() {
		return (
			<div>
				<LoggedOutForm className="pressable-store__form" onSubmit={ this.onSubmit }>
					<HeroImage />

					<FormSectionHeading className="pressable-store__heading">{ this.props.translate( 'Get your store for as low as $25 / month' ) }</FormSectionHeading>
					<p className="pressable-store__copy">{ this.props.translate( 'We\'ve partnered with Pressable, a top-notch WordPress hosting provider, and WooCommerce, the go-to eCommerce solution for WordPress, to make setting up your store a snap.' ) }</p>

					<LoggedOutFormFooter>
						<FormLabel className="pressable-store__form-label" htmlFor="email">{ this.props.translate( 'Start by entering your email address:' ) }</FormLabel>
						<div className="pressable-store__form-fields">
							<FormTextInput ref={ (c) => this.onEmailInputRef(c) } isError={ this.state.error } isValid={ this.state.isValid } onChange={ this.onEmailChange } className="pressable-store__form-email is-spaced" type="email" placeholder="Email Address" name="email" />
							<FormButton className="pressable-store__form-submit">{ this.props.translate( 'Get started on Pressable' ) } <Gridicon icon="external" size={ 12 } /></FormButton>
						</div>
						{ this.state.error && <FormInputValidation isError={ true } text={ this.state.error } /> }
					</LoggedOutFormFooter>
				</LoggedOutForm>
				<LoggedOutFormLinks>
					<LoggedOutFormLinkItem className="pressable-store__privacy-policy" target="__blank" href="https://pressable.com/legal/privacy-policy/">
						{ this.props.translate( 'Pressable Privacy Policy', { comment: '“Pressable” is the name of a WordPress.org hosting provider' } ) } <Gridicon icon="external" size={ 12 } />
					</LoggedOutFormLinkItem>
				</LoggedOutFormLinks>
			</div>
		);
	}

	render() {
		return (
			<div className="pressable-store">
				<StepHeader
					headerText={ this.props.translate( 'Create your WordPress Store' ) }
					subHeaderText={ this.props.translate( 'Our partners at Pressable and WooCommerce are here for you.' ) }
				/>
				{ this.renderStoreForm() }
				<div className="pressable-store__back-button-wrapper">
					<Button compact borderless onClick={ this.props.onBackClick }>
						<Gridicon icon="arrow-left" size={ 18 } />
						{ this.props.translate( 'Back' ) }
					</Button>
				</div>
			</div>
		);
	}
}

PressableStoreStep.propTypes = {
	onBackClick: PropTypes.func.isRequired,
	setRef: PropTypes.func
};

const mapDispatchToProps = dispatch => ( {
	partnerClickRecorder: () =>
		dispatch( recordTracksEvent( 'calypso_triforce_partner_redirect', { 'partner_name': 'Pressable' } ) )
} );

export default connect( null, mapDispatchToProps )( localize( PressableStoreStep ) );
