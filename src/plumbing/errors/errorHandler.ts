import {ErrorCodes} from './errorCodes';
import {UIError} from './uiError';

/*
 * A class to handle error processing
 */
export class ErrorHandler {

    /*
     * Return an error based on the exception type or properties
     */
    public static getFromException(exception: any): UIError {

        // Already handled errors
        if (exception instanceof UIError) {
            return exception;
        }

        // Create the error
        const error = new UIError(
            'Desktop UI',
            ErrorCodes.generalUIError,
            'A technical problem was encountered in the UI',
            exception.stack);

        // Set technical details from the received exception
        error.details = ErrorHandler._getExceptionMessage(exception);
        return error;
    }

    /*
     * A login required error is thrown to short circuit execution when the UI cannot get an access token
     */
    public static getFromLoginRequired(): UIError {

        return new UIError(
            'Login',
            ErrorCodes.loginRequired,
            'No access token is available and a login is required');
    }

    /*
     * Handle errors triggering the sign in request, such as CORS errors contacting endpoints
     */
    public static getFromLoginRequest(exception: any, errorCode: string): UIError {

        // Already handled errors
        if (exception instanceof UIError) {
            return exception;
        }

        // Create the error
        const error = new UIError(
            'Login',
            errorCode,
            `A technical problem occurred during login processing`,
            exception.stack);

        // Set technical details from the received exception
        error.details = ErrorHandler._getOAuthExceptionMessage(exception);
        return error;
    }

    /*
     * Handle sign in response errors, which may have an OAuth error and error_description
     */
    public static getFromLoginResponse(exception: any, errorCode: string): UIError {

        // Already handled errors
        if (exception instanceof UIError) {
            return exception;
        }

        // Create the error
        const error = new UIError(
            'Login',
            errorCode,
            `A technical problem occurred during login processing`,
            exception.stack);

        // Set technical details from the received exception
        error.details = ErrorHandler._getOAuthExceptionMessage(exception);
        return error;
    }

    /*
     * Handle sign out request errors
     */
    public static getFromLogoutRequest(exception: any, errorCode: string): UIError {

        // Already handled errors
        if (exception instanceof UIError) {
            return exception;
        }

        // Create the error
        const error = new UIError(
            'Logout',
            errorCode,
            `A technical problem occurred during logout processing`,
            exception.stack);

        // Set technical details from the received exception
        error.details = ErrorHandler._getOAuthExceptionMessage(exception);
        return error;
    }

    /*
     * Handle errors to the token endpoint
     */
    public static getFromTokenError(exception: any, errorCode: string): UIError {

        // Already handled errors
        if (exception instanceof UIError) {
            return exception;
        }

        // Create the error
        const error = new UIError(
            'Token',
            errorCode,
            `A technical problem occurred during token processing`,
            exception.stack);

        // Set technical details from the received exception
        error.details = ErrorHandler._getOAuthExceptionMessage(exception);
        return error;
    }

    /*
     * Return an object for Ajax errors
     */
    public static getFromApiError(exception: any, url: string): UIError {

        // Already handled errors
        if (exception instanceof UIError) {
            return exception;
        }

        // Calculate the status code
        let statusCode = 0;
        if (exception.status) {
            statusCode = exception.status;
        }

        let error = null;
        if (statusCode === 0) {

            // This status is generally an availability problem
            error = new UIError(
                'Network',
                ErrorCodes.apiNetworkError,
                'A network problem occurred when the UI called the server',
                exception.stack);
            error.details = this._getExceptionMessage(exception);

        } else if (statusCode >= 200 && statusCode <= 299) {

            // This status is generally a JSON parsing error
            error = new UIError(
                'Data',
                ErrorCodes.apiDataError,
                'A technical problem occurred parsing received data',
                exception.stack);
            error.details = this._getExceptionMessage(exception);

        } else {

            // Create a default API error
            error = new UIError(
                'API',
                ErrorCodes.apiResponseError,
                'A technical problem occurred when the UI called the server',
                exception.stack);
            error.details = this._getExceptionMessage(exception);

            // Override the default with a server response when received and CORS allows us to read it
            if (exception.responseJSON) {
                ErrorHandler._updateFromApiErrorResponse(error, exception.responseJSON);
            }
        }

        error.statusCode = statusCode;
        error.url = url;
        return error;
    }

    /*
     * Try to update the default API error with response details
     */
    private static _updateFromApiErrorResponse(error: UIError, apiError: any): void {

        // Attempt to read the API error response
        if (apiError) {

            // Set the code and message, returned for both 4xx and 5xx errors
            if (apiError.code && apiError.message) {
                error.errorCode = apiError.code;
                error.details = apiError.message;
            }

            // Set extra details returned for 5xx errors
            if (apiError.area && apiError.id && apiError.utcTime) {
                error.setApiErrorDetails(apiError.area, apiError.id, apiError.utcTime);
            }
        }
    }

    /*
     * Get the message from an OAuth exception
     */
    private static _getOAuthExceptionMessage(exception: any): string {

        let oauthError = '';
        if (exception.error) {
            oauthError = exception.error;
            if (exception.errorDescription) {
                oauthError += ` : ${exception.errorDescription}`;
            }
        }

        if (oauthError) {
            return oauthError;
        } else {
            return ErrorHandler._getExceptionMessage(exception);
        }
    }

    /*
     * Get the message from an exception and avoid returning [object Object]
     */
    private static _getExceptionMessage(exception: any): string {

        if (exception.message) {
            return exception.message;
        }

        const details = exception.toString();
        if (details !== {}.toString()) {
            return details;
        }

        return '';
    }
}
