const RouteURL: any = {
    file: {
        upload: '/',
        detail: '/detail/:imageName',
        delete: '/delete/:imageName'
    },
    customer: {
        login: '/login',
        logout: '/logout',
        editProfile: '/edit-profile',
        current_profile: '/current',
        customer_detail: '/detail/:customerID',
        refresh_token: '/refresh-access-token',
        user_list: '/',
    },
    notification: {
        read_all: '/',
        read_detail: '/detail/:notificationID',
        delete: '/delete/:notificationID',
    },
    chat: {
        read_thread: '/thread/:participantID',
        threads: '/',
        delete_thread: '/thread/:threadID',
        messages: '/messages/:threadID',
    },
}

export default RouteURL;
