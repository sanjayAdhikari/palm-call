import RouteURL from "@config/route_url.config";
import {customerController} from "@controller/index";
import {UserTypeEnum} from "@interface/generic.enum";
import {authentication, getRefreshToken} from "@middleware/access.middleware";
import {defaultLimiter} from "@middleware/limitter.middleware";
import parseValidation from "@middleware/parseValidation.middleware";
import {
    emailValid,
    enumValid,
    idValidParam,
    stringOptionalValid,
    stringValid
} from "@service/validation/validator.index";
import {Router} from "express";

const initializeCustomerApi: () => Router = () => {
    const router = Router();
    // router.get('/', (req, res)=> res.send('GOOD'));

    router
        .delete(RouteURL.customer.logout,
            getRefreshToken,
            customerController.logout.bind(customerController))
        .post(
            RouteURL.customer.refresh_token,
            customerController.refreshToken.bind(customerController)
        )
        .post(RouteURL.customer.login,
            [
                enumValid(UserTypeEnum, "userType", "user type"),
                emailValid("email"),
                stringValid("password"),
            ],
            parseValidation,
            customerController.login.bind(customerController))
        .put(RouteURL.customer.editProfile,
            authentication,
            [
                stringOptionalValid("name"),
                stringOptionalValid("profileImage"),
            ],
            parseValidation,
            customerController.editProfile.bind(customerController))
        .get(RouteURL.customer.current_profile,
            authentication,
            defaultLimiter,
            customerController.currentProfile.bind(customerController))
        .get(RouteURL.customer.customer_detail,
            authentication,
            [
                idValidParam('customerID', 'customer'),
            ],
            parseValidation,
            customerController.customerProfile.bind(customerController))
        .get(RouteURL.customer.user_list,
            authentication,
            customerController.getPeopleList.bind(customerController))
    ;
    return router;
}

const customerApi = initializeCustomerApi();

export default customerApi;

