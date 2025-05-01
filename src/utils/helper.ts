/* eslint-disable no-param-reassign,eqeqeq */
import moment from 'moment-timezone';
import {URL} from "node:url";
import {AppConstant} from "../config/constant";
import {DateString} from "../interface/generic.type";
import {CoordinateObjectInterface,} from "../interface/generic.interface";
import {formatAPI, formatError} from "./format.util";
import validator from 'validator';
import PasswordValidator from "password-validator";
import {ApiInterface} from "../interface/api.interface";
import generateQR from "./qr.util";
import ServerLogger from "../middleware/server_logging.middleware";
import * as randomstring from "randomstring";

// Helper function to sanitize the domain name
export const sanitizeDomainName = (name: string): string => {
    // Replace invalid characters with hyphens and remove leading/trailing hyphens
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric characters with hyphens
        .replace(/^-+|-+$/g, '');    // Remove leading/trailing hyphens
};

export function isValidSubdomain(subdomain: string): boolean {
    // Regular expression to match valid subdomain names
    const subdomainRegex = /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/;
    // Check if the subdomain matches the regex and is between 1 and 63 characters
    return subdomainRegex.test(subdomain) && subdomain.length >= 1 && subdomain.length <= 63;
}

export function validateAndFormatDomainName(domainName: string): { isValid: boolean, plainDomain: string } {
    // const singleLevelDomainRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.[A-Za-z]{2,6}$/;

    // Step 1: Remove http:// or https://
    let plainDomain = domainName.replace(/^(https?:\/\/)?(www\.)?/, '');

    // Step 2: Remove spaces
    plainDomain = plainDomain.replace(/\s+/g, '');

    // Step 3: Convert to lowercase
    plainDomain = plainDomain.toLowerCase();


    const domainRegex = /^(?!-)(?!.*-\.)(?!.*\.-)[A-Za-z0-9-]{1,63}\.[A-Za-z]{2,6}$/;
    const subdomainRegex = /^(?!-)(?!.*-\.)(?!.*\.-)([A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,6}$/;

    // Check if the domain matches the main domain pattern or subdomain pattern
    const isValid = domainRegex.test(plainDomain) || subdomainRegex.test(plainDomain);


    return {isValid, plainDomain};
}


export const getTodayMidnightDate = (futureMidnight: boolean = false): Date => {
    const currentDate = (futureMidnight ? moment().endOf('day') : moment().startOf('day')).tz(AppConstant.defaultTimezone);
    return currentDate.toDate();
}

export const checkIfValidPhone = (phoneNumber?: string): string => {
    if (!phoneNumber) return '';
    let phone = phoneNumber?.toString()
        .replace(/\s/g, ''); // remove all space
    phone = phone.replace(/[^0-9+]/g, ''); // remove everything but number and +
    if (phone.startsWith('00')) phone = phone.replace(/^0+/, '+'); // replace first 00 with +
    phone.replace('-', ''); // remove any - with

    if (!phone.startsWith('+')) { // if phone does not start with +, replace with indian country code
        phone = `${AppConstant.defaultCountryCode}${phone}`;
    }
    if (phone.length < 7 || phone.length > 15) return '';
    return phone;
};

export const checkIfValidEmail = (email?: string): boolean => {
    if (typeof email !== 'string') return false;
    return validator.isEmail(email!.toString());
};

export const getDate = (date?: DateString, format: string = AppConstant.dateFormat) => moment(date ?? Date.now())
    .tz(AppConstant.defaultTimezone).format(format);

export const isLongitude = (num: number | string) => {
    const longitude = parseFloat(num?.toString());
    return Number.isFinite(longitude) && Math.abs(longitude) <= 180;
};
export const isLatitude = (num: number | string) => {
    const latitude = parseFloat(num?.toString());
    return Number.isFinite(latitude) && Math.abs(latitude) <= 90;
};

export const checkCoordinates = (latitude?: CoordinateObjectInterface["latitude"],
                                 longitude?: CoordinateObjectInterface["longitude"],
) => {
    if (!latitude || !longitude) {
        return formatError('Empty Coordinates')
    }
    if (!isLatitude(latitude) && !isLongitude(longitude)) {
        return ({
            data: null,
            success: false,
            message: 'Invalid coordinates.',
        });
    }
    if (!isLatitude(latitude)) {
        return ({
            data: null,
            success: false,
            message: 'Invalid Latitude.',
        });
    }
    if (!isLongitude(longitude)) {
        return ({
            data: null,
            success: false,
            message: 'Invalid Longitude.',
        });
    }
    return ({
        success: true,
    });
};

export const checkCoordinatesArray = (coordinate?: number[]) => coordinate ? checkCoordinates(coordinate[1], coordinate[0]) : false;

export const getName = (customerName?: { first: string, middle?: string, last: string }, fallback: string = 'N/A'): string => {
    let name = '';
    const firstName = customerName?.first;
    const middleName = customerName?.middle;
    const lastName = customerName?.last;
    // if (!firstName && !middleName && !lastName) return name;
    if (firstName) name = firstName;
    if (middleName) name += ` ${middleName}`;
    if (lastName) name += ` ${lastName}`;

    if (!name) name = fallback;

    return name;
};

export function getDurationText(durationInSeconds: string) {
    const duration = parseInt(durationInSeconds, 10);
    if (duration < 60) return duration === 0 ? 'less than a minute' : `${duration}s`;
    if (duration < 60 * 60) {
        const minute = parseInt(<string>(duration / 60).toString(), 10);
        const seconds = duration % 60;
        return seconds === 0 ? `${minute}m` : `${minute}m ${seconds}s`;
    }

    const hours = Math.floor(duration / 3600) < 10 ? (`00${Math.floor(duration / 3600)}`).slice(-2) : Math.floor(duration / 3600);
    const minutes = `00${Math.floor((duration % 3600) / 60)}`.slice(-2);
    const seconds = (`00${(duration % 3600) % 60}`).slice(-2);
    return `${hours}h ${minutes}m ${seconds}s`;
}

export function getDistanceText(rideDistanceInM: number) {
    if (rideDistanceInM < 1000) return `${rideDistanceInM} M`;

    const distanceKM = Math.floor(rideDistanceInM / 1000);
    const distanceM = Math.floor((rideDistanceInM / 1000) % 1000);
    if (distanceM === 0) return `${distanceKM} K.M.`;
    return `${distanceKM} K.M. ${distanceM} M`;
}

export function capitalizeFirstLetter(string: string = '') {
    return (string ?? '').charAt(0)?.toUpperCase() + (string ?? '').slice(1);
}

export function capitalizeWords(string: string): string {
    // Split the string into an array of words
    if (!string) return string;
    let words = string.split(' ');

    // Capitalize the first letter of each word
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i][0].toUpperCase() + words[i].slice(1);
    }

    // Join the words back into a string and return
    return words.join(' ');
}


const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

export function inWords(num: string | number): string {
    num = <string>Number(num).toString()?.trim();
    if (num === '0') return 'Zero';
    if (num.length > 9) return 'overflow';
    const n = (`000000000${num}`).substring(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    // @ts-ignore
    str += (n[1] !== '0') ? `${a[Number(n[1])] || `${b[n[1][0]]} ${a[n[1][1]]}`}crore ` : '';
    // @ts-ignore
    str += (n[2] !== '0') ? `${a[Number(n[2])] || `${b[n[2][0]]} ${a[n[2][1]]}`}lakh ` : '';
    // @ts-ignore
    str += (n[3] !== '0') ? `${a[Number(n[3])] || `${b[n[3][0]]} ${a[n[3][1]]}`}thousand ` : '';
    // @ts-ignore
    str += (n[4] !== '0') ? `${a[Number(n[4])] || `${b[n[4][0]]} ${a[n[4][1]]}`}hundred ` : '';
    // @ts-ignore
    str += (n[5] !== '0') ? `${((str != '') ? 'and ' : '') + (a[Number(n[5])] || `${b[n[5][0]]} ${a[n[5][1]]}`)}only ` : '';
    return capitalizeFirstLetter(str);
}


export const getTodayStartOfTimestamp = (): number => moment().startOf('day').unix();
export const getCurrentTimeStamp = (): number => Math.floor(Date.now() / 1000);

export function hideEmail(email: string) {
    return email.replace(/(.{2})(.*)(?=@)/,
        function (gp1, gp2, gp3) {
            for (let i = 0; i < gp3.length; i++) {
                gp2 += "*";
            }
            return gp2;
        });
}

const slugify = (str: string) =>
    (str?.toString() ?? '')
        ?.trim?.()
        ?.toLowerCase()
        ?.replace(/[^\w\s-]/g, '')
        ?.replace(/[\s_-]+/g, '-')
        ?.replace(/^-+|-+$/g, '');

export function getSlugFromLabel(label: string = ''): string {
    return slugify(label);
}

export function getLabelFromSlug(label: string = ''): string {
    return label.replace(/_/g, ' ');
}

export const isValidNumber = (value: any) => !isNaN(value)
export const parseIntNumber = (value: any) => parseInt((value ?? ''), 10)
export const parseFloatNumber = (value: any) => parseFloat(value ?? '')

export const removeAt = (arr: any[], position: number[] = []) => {
    for (const eachPosition of position) {
        arr.splice(eachPosition, 1);
    }
    return arr;
}

export const isJson = (stringData: string) => {
    try {
        JSON.parse(stringData);
        return true;
    } catch (e) {
        return false;
    }
}

export const checkPasswordStrength = (password: string): boolean => {
    const schema = new PasswordValidator();
    schema
        .is().min(8)                                    // Minimum length 8
        .is().max(100)                                  // Maximum length 100
        .has().uppercase()                              // Must have uppercase letters
        .has().digits(1)                                // Must have at least 2 digits
        .is().not().oneOf(['password', 'password123', '12345678']); // Blacklist these values
    return !!schema.validate(password.toString());
}
export const unitPopulateFn = (unitName: string = 'unit') => ({path: unitName, select: 'unitID _id address name'})
export const dynamicPopulate = function (fieldName: string) {
    return {path: fieldName, select: 'label value'}
}

export const getNumber = (value: number | string) => parseFloat((typeof value === "number" ? value : parseFloat(value)).toFixed(2));

export function isEmptyObject(obj?: Object) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

export const isValidTimeZone = (tz?: string): boolean => {
    try {
        if (!Intl || !Intl.DateTimeFormat().resolvedOptions().timeZone) {
            return false
        }

        if (typeof tz !== 'string') {
            return false
        }

        // throws an error if timezone is not valid
        Intl.DateTimeFormat(undefined, {timeZone: tz})
        return true
    } catch (error) {
        return false
    }
}

export function createQueryString(baseUrl: string, params: Record<string, any>): string | null {
    try {
        const url = new URL(baseUrl);

        // Append new parameters to the existing query string or create a new one
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.set(key, value);
            }
        });

        return url.toString();
    } catch (error) {
        return null
    }
}

export function createReferralCode(prefix: string = '', prefixLength: number = 3, referralCodeLength: number = 7) {
    // Calculate the length of the referral code part
    const referralCodePartLength: number = referralCodeLength - Math.min(prefix.length, prefixLength);

    // Generate random string for referral code part
    let referralCodePart: string = randomstring.generate({
        length: referralCodePartLength,
        charset: 'alphanumeric',
    });

    // Add prefix if specified
    if (prefix && prefix.length > 0) {
        referralCodePart = prefix + referralCodePart;
    }

    return referralCodePart.toLowerCase();
}

export async function embedQrCodeWithUrl(qrContent: string, url?: string, key?: string, width?: number): Promise<ApiInterface<string>> {
    try {
        let qrContentData;
        if (url) {
            qrContentData = createQueryString(url, {
                [key ?? 'token']: qrContent
            }) ?? '';
        } else {
            qrContentData = qrContent;
        }
        const qrCode = await generateQR(qrContentData, width)
        return formatAPI('', qrCode);
    } catch (error) {
        console.error(error);
        ServerLogger.error(error);
        return formatError('Error while generating QR code!');
    }
}

export function truncateParagraph(paragraph: string = '', characterLengthNeeded: number = 10): string {
    const maxIndex = Math.max(paragraph.length, characterLengthNeeded);
    return paragraph.substring(0, maxIndex); // first 20 character
}

export const getValidDomain = (value: any): string | null => {
    try {
        if (!value || typeof value !== "string") return null;
        value = value.replace(/^https?:\/\//i, '')
            .replace(/^http?:\/\//i, '')
            .replace(/^www?:\/\//i, '');
        const {hostname} = new URL(`https://${value}`);
        return hostname; // only part of the plain domain or subdomain
    } catch (error: any) {
        ServerLogger.error(error);
        console.error('Error while validating domain');
        return null;
    }
}

export function extractTwitterStatusIDFromUrl(url: string): string | null {
    const regex = /status\/(\d+)(\/|$)/;
    const match = url.match(regex);
    if (match && match.length >= 2) {
        return match[1];
    }
    return null;
}

// Function to convert field names to labels
export const camelCaseFieldToLabel = (field: string = ''): string => {
    return field?.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export function extractDomain(url?: string): string | null {
    try {
        if (!url) {
            return null;
        }
        // Create a new URL object
        const parsedUrl = new URL(url);
        // Get the hostname from the URL object
        const hostname = parsedUrl.hostname;
        // Split the hostname by '.'
        const domainParts = hostname.split('.');

        // remove the first part and return the rest
        if (domainParts.length > 2) {
            return domainParts.slice(1).join('.');
        }
        return hostname;
    } catch (e) {
        console.error('Invalid URL', e);
    }
    return null;
}
