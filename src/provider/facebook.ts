import { OauthProvider } from "../oauth";
import { OauthUtility } from "../utility";

declare var window: any;
const PROVIDER_NAME = "Facebook";

/*
 * Configuration options for using Facebook oauth
 */
export interface IFacebookOptions {
    clientId?: String;
    appScope?: Array<String>;
    redirectUri?: String;
    authType?: String;
}

export class Facebook extends OauthProvider {

    facebookOptions: IFacebookOptions;
    flowUrl: String;

    constructor(options: IFacebookOptions={}) {
        super();
        if(!options.clientId || options.clientId == "") {
            throw Error("A " + PROVIDER_NAME + " client id must exist");
        }
        if(!options.appScope || options.appScope.length <= 0) {
            throw Error("A " + PROVIDER_NAME + " app scope must exist");
        }
        this.facebookOptions = options;
        this.facebookOptions.redirectUri = options.hasOwnProperty("redirectUri") ? options.redirectUri : "http://localhost/callback";
        this.flowUrl = "https://www.facebook.com/v2.0/dialog/oauth?client_id=" + this.facebookOptions.clientId + "&redirect_uri=" + this.facebookOptions.redirectUri + "&response_type=token&scope=" + this.facebookOptions.appScope.join(",");
        if (options !== undefined && options.hasOwnProperty("authType")) {
            this.flowUrl += "&auth_type=" + options.authType;
        }
    }

    login() {
        return new Promise((resolve, reject) => {
            if (window.cordova) {
                if (window.cordova.InAppBrowser) {
                    var browserRef = window.cordova.InAppBrowser.open(this.flowUrl, "_blank", "location=no,clearsessioncache=yes,clearcache=yes");
                    browserRef.addEventListener("loadstart", (event) => {
                        if ((event.url).indexOf(this.facebookOptions.redirectUri) === 0) {
                            browserRef.removeEventListener("exit", (event) => {});
                            browserRef.close();
                            var parsedResponse = (new OauthUtility()).parseImplicitResponse(((event.url).split("#")[1]).split("&"));
                            if (parsedResponse) {
                                resolve(parsedResponse);
                            } else {
                                reject("Problem authenticating with " + PROVIDER_NAME);
                            }
                        }
                    });
                    browserRef.addEventListener("exit", function(event) {
                        reject("The " + PROVIDER_NAME + " sign in flow was canceled");
                    });
                } else {
                    reject("The Apache Cordova InAppBrowser plugin was not found and is required");
                }
            } else {
                reject("Cannot authenticate with " + PROVIDER_NAME + " via a web browser");
            }
        });
    }

}
