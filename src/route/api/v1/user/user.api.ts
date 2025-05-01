import RouteURL from "@config/route_url.config";
import {customerController} from "@controller/index";
import {authentication, authorize, getRefreshToken} from "@middleware/access.middleware";
import {defaultLimiter} from "@middleware/limitter.middleware";
import parseValidation from "@middleware/parseValidation.middleware";
import {itemIDValidation} from "@service/validation";
import {Router} from "express";
import {query} from "express-validator";

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
            authentication,
            authorize(),
            [
                query('page').optional(),
                query('pageSize').optional(),
            ],
            customerController.login.bind(customerController))
        .get(RouteURL.customer.current_profile,
            authentication,
            defaultLimiter,
            customerController.currentProfile.bind(customerController))
        .get(RouteURL.customer.customer_detail,
            authentication,
            itemIDValidation,
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

