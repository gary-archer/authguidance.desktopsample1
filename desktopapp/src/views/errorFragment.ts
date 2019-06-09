import * as $ from 'jquery';
import * as moment from 'moment';
import {AppConfiguration} from '../configuration/appConfiguration';
import {ErrorHandler} from '../plumbing/errors/errorHandler';
import {UIError} from '../plumbing/errors/uiError';
import {HtmlEncoder} from '../plumbing/utilities/htmlEncoder';

/*
 * The error fragment shows within a view to render error details
 */
export class ErrorFragment {

    private readonly _configuration?: AppConfiguration;

    /*
     * Receive the configuration, which controls whether to render developer details
     */
    public constructor(configuration?: AppConfiguration) {
        this._configuration = configuration;
    }

    /*
     * Clear existing errors
     */
    public clear(): void {

        // Clear any content
        const errorList = $('.errorForm');
        errorList.html('');

        // Hide the clear button
        const clearButton = $('#btnClearError');
        if (!clearButton.hasClass('hide')) {
            clearButton.addClass('hide');
        }
    }

    /*
     * Do the GUI work of handling an error
     */
    public execute(exception: any): void {

        // Get the error into an object
        const error = ErrorHandler.getFromException(exception) as UIError;
        if (error.errorCode === 'login_required') {

            // The login required case is an expected error that we handle by moving to the login required view
            if (location.hash.length > 0) {
                const hash = `#loginrequired&return=${encodeURIComponent(location.hash)}`;
                location.hash = hash;
            } else {
                location.hash = `#loginrequired`;
            }

        } else {

            // Otherwise render the error
            this._renderData(error);
        }
    }

    /*
     * Render the error to the UI
     */
    private _renderData(error: UIError): void {

        // Clear any content
        const errorForm = $('.errorForm');
        $('.errorForm').html('');

        // Show the clear button
        const clearButton = $('#btnClearError');
        if (clearButton.hasClass('hide')) {
            clearButton.removeClass('hide');
        }

        // Show the friendly user message
        if (error.message.length > 0) {
            errorForm.append(this._getErrorUserMessageRow(error.message));
        }

        // Display technical details that are OK to show to users
        if (error.area.length > 0) {
            errorForm.append(this._getErrorSupportRow('Area', error.area));
        }

        if (error.errorCode.length > 0) {
            errorForm.append(this._getErrorSupportRow('Error Code', error.errorCode));
        }

        if (error.statusCode > 0) {
            errorForm.append(this._getErrorSupportRow('Status Code', error.statusCode));
        }

        if (error.instanceId > 0) {
            errorForm.append(this._getErrorSupportRow('Id', error.instanceId));
        }

        if (error.utcTime.length > 0) {
            const displayTime = moment(error.utcTime).format('DD MMM YYYY HH:mm:ss');
            errorForm.append(this._getErrorSupportRow('UTC Time', displayTime));
        }

        if (error.details.length > 0) {
            errorForm.append(this._getErrorSupportRow('Details', error.details));
        }

        // Additional overly technical details shown during development
        if (this._configuration && this._configuration.debugErrorDetails) {

            // Show URLs that failed
            if (error.url.length > 0) {
                errorForm.append(this._getErrorSupportRow('URL', error.url));
            }

            // Show stack trace details
            let stack: string = '';
            error.stackFrames.forEach((f) => {
                stack += `${f}<br/>`;
            });
            if (stack.length > 0) {
                errorForm.append(this._getErrorSupportRow('Stack', stack));
            }
        }
    }

    /*
     * Return the user message, which has a larger dark blue font
     */
    private _getErrorUserMessageRow(userMessage: string): string {

        return `<div class='panel panel-default'>
                    <div class='panel-body'>
                        <div class='row errorUserInfo'>
                            <div class='col-xs-12'>
                                ${userMessage}
                            </div>
                        </div>
                    </div>
                </div>`;
    }

    /*
     * Return a field displayed to help with technical support, which uses a smaller light blue font
     */
    private _getErrorSupportRow(title: string, value: any): string {

        let output = value;
        if (typeof value === 'string') {
            output = HtmlEncoder.encode(value);
        }

        return `<div class='panel panel-default'>
                    <div class='panel-body'>
                        <div class='row errorSupportInfo'>
                            <div class='col-xs-2'>
                                ${title}
                            </div>
                            <div class='col-xs-10'>
                                <b>${output}</b>
                            </div>
                        </div>
                    </div>
                </div>`;
    }
}
