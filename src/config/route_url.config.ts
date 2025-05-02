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
        read_thread_by_participant: '/thread/participant/:participantID',
        read_thread: '/thread/detail/:threadID',
        threads: '/threads',
        delete_thread: '/thread/delete/:threadID',
        messages: '/messages/:threadID',
        send_messages: '/messages',
    },
}

export default RouteURL;
