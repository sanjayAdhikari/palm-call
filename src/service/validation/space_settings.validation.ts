import {
    booleanOptionalValid,
    idValid,
    launchCollectionAnyID,
    numberOptionalValid,
    stringMultipleOptionalValid,
    stringOptionalValid,
    urlOptionalValid
} from "./validator.index";
import {body, param} from "express-validator";
import {SocialMediaIntegrationEnum} from "../../interface/generic.enum";

export const spaceSettingsUpdateValidation = [
    stringOptionalValid('crossMint.secret', 'cross mint secret'),
    stringOptionalValid('crossMint.key', 'cross mint key'),
    stringOptionalValid('crossMint.chain', 'cross mint chain'),

    stringOptionalValid('aws.key', 'AWS key'),
    stringOptionalValid('aws.secret', 'AWS secret'),
    stringOptionalValid('aws.region', 'AWS region'),
    stringOptionalValid('aws.bucketName', 'AWS bucket name'),
    stringOptionalValid('aws.emailQueueUrl', 'AWS email Queue URL'),

    stringOptionalValid('stripe.accountID', 'Stripe account ID'),
    stringOptionalValid('stripe.secret', 'Stripe secret'),
    stringOptionalValid('stripe.webhook_secret', 'Stripe webhook secret'),

    urlOptionalValid('privacyPolicy', 'Privacy Policy'),

    stringMultipleOptionalValid('reservedDomains', 'reserved domain'),
    body('frontend.IpAddress').optional().isIP(4).withMessage('Frontend IP address is invalid'),
    stringOptionalValid('frontend.cName', 'CNAME'),
    body('frontend.studioPort').optional().isInt({min: 0, max: 65535})
        .withMessage('Studio Port must be a valid port number between 0 and 65535'),
    body('frontend.storefrontPort').optional().isInt({min: 0, max: 65535})
        .withMessage('Storefront Port must be a valid port number between 0 and 65535'),
    body('frontend.nginxServicePort').optional().isInt({min: 0, max: 65535})
        .withMessage('Nginx Port must be a valid port number between 0 and 65535'),

    body('backend.IpAddress').optional().isIP(4).withMessage('Backend IP address is invalid'),
    body('backend.portNumber').optional().isInt({min: 0, max: 65535})
        .withMessage('Backend Port must be a valid port number between 0 and 65535'),

    stringOptionalValid(`socialMedia.${SocialMediaIntegrationEnum.TWITTER}.bearerToken`, 'Twitter Bearer Token'),
    stringOptionalValid(`socialMedia.${SocialMediaIntegrationEnum.TWITTER}.clientID`, 'Twitter Client ID'),
    stringOptionalValid(`socialMedia.${SocialMediaIntegrationEnum.TWITTER}.clientSecret`, 'Twitter Client Secret'),

    stringOptionalValid(`socialMedia.${SocialMediaIntegrationEnum.GOOGLE}.clientID`, 'Google Client ID'),
    stringOptionalValid(`socialMedia.${SocialMediaIntegrationEnum.GOOGLE}.clientSecret`, 'Google Client ID'),

    stringOptionalValid(`socialMedia.${SocialMediaIntegrationEnum.EMAIL}.email`, 'Twitter Bearer Token'),

]

export const launchSettingsUpdateValidation = [
    param('launch').isMongoId().withMessage('Launch ID is required'),
    booleanOptionalValid('referral.isActivated', 'referral activation'),
    numberOptionalValid('referral.referredPoint', 'referred point'),
    numberOptionalValid('referral.referrerPoint', 'referrer point'),
]

export const totemSelectValidation = [
    idValid('totem', 'totem'),
    launchCollectionAnyID,
]


export const staticTotemValidation = [
    stringOptionalValid('name'),
    stringOptionalValid('description'),
    numberOptionalValid('maxCap', 'Totem Quantity'),
    stringOptionalValid('backgroundImage', 'background image'),
    launchCollectionAnyID,
]


export const pointSystemUpdateValidation = [
    stringOptionalValid('name'),
    stringOptionalValid('description'),
    stringOptionalValid('icon'),
]

export const aggregatorSettingsUpdateValidation = [
    numberOptionalValid('signupPoint'),
]
