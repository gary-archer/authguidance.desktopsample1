import * as AppAuth from '@openid/appauth';
import * as Opener from 'opener';
import {LoginEvents} from './loginEvents';

/*
 * An override of the default authorization handler
 */
export class BrowserAuthorizationRequestHandler extends AppAuth.AuthorizationRequestHandler {

    /*
     * Inputs and outputs
     */
    private readonly _loginEvents: LoginEvents;
    private _authorizationPromise: Promise<AppAuth.AuthorizationRequestResponse> | null;

    /*
     * Set up the base class
     */
    public constructor(loginEvents: LoginEvents) {

        super(new AppAuth.BasicQueryStringUtils(), new AppAuth.DefaultCrypto());
        this._loginEvents = loginEvents;
        this._authorizationPromise = null;
    }

    /*
     * Use the AppAuth class to form the OAuth URL, then make the login request on the system browser
     */
    public performAuthorizationRequest(
        metadata: AppAuth.AuthorizationServiceConfiguration,
        request: AppAuth.AuthorizationRequest): void {

        // Form the OAuth request
        const oauthUrl = this.buildRequestUrl(metadata, request);

        // Create a promise to handle the response from the browser
        this._authorizationPromise = new Promise<AppAuth.AuthorizationRequestResponse>((resolve, reject) => {

            // Wait for a response event from the loopback web server
            this._loginEvents.once(LoginEvents.ON_AUTHORIZATION_RESPONSE, (queryParams: any) => {

                // Package up data into an object and then resolve our promise
                const completeResponse = this._handleBrowserLoginResponse(queryParams, request);
                resolve(completeResponse);

                // Ask the base class to call our completeAuthorizationRequest
                this.completeAuthorizationRequestIfPossible();
            });
        });

        // Invoke the browser
        Opener(oauthUrl);
    }

    /*
     * Return data back to the authenticator's notifier
     */
    protected async completeAuthorizationRequest(): Promise<AppAuth.AuthorizationRequestResponse | null> {

        return this._authorizationPromise;
    }

    /*
     * Collect response data to return to the caller
     */
    private _handleBrowserLoginResponse(
        queryParams: any,
        request: AppAuth.AuthorizationRequest): AppAuth.AuthorizationRequestResponse {

        // Get strongly typed fields
        const authFields = queryParams as (AppAuth.AuthorizationResponseJson & AppAuth.AuthorizationErrorJson);

        // Initialize the result
        let authorizationResponse: AppAuth.AuthorizationResponse | null = null;
        let authorizationError: AppAuth.AuthorizationError | null = null;

        // Process the login response message
        const state = authFields.state;
        const code = authFields.code;
        const error = authFields.error;

        if (error) {

            // Handle error responses if required
            const errorUri = authFields.error_uri;
            const errorDescription = authFields.error_description;

            const errorJson = {
                error,
                error_description: errorDescription,
                error_uri: errorUri,
                state,
            } as AppAuth.AuthorizationErrorJson;
            authorizationError = new AppAuth.AuthorizationError(errorJson);
        } else {

            // Create a success response containing the code, which we will next swap for tokens
            const responseJson = {
                code,
                state,
            };
            authorizationResponse = new AppAuth.AuthorizationResponse(responseJson);
        }

        // Return the full authorization response data
        return {
            request,
            response: authorizationResponse,
            error: authorizationError,
        } as AppAuth.AuthorizationRequestResponse;
    }
}
