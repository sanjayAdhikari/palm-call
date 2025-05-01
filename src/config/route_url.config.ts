const RouteURL: any = {
    file: {
        upload: '/',
        detail: '/detail/:imageName',
        delete: '/delete/:imageName'
    },
    customer: {
        login: '/login',
        logout: '/logout',
        current_profile: '/current',
        customer_detail: '/detail/:itemID',
        refresh_token: '/refresh-access-token/:space',
        user_list: '/',
    },
}

export default RouteURL;
