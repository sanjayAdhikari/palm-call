import qr from "qrcode";

const generateQR = async (codeText: string, width?: number): Promise<string> => {
    const options: Record<string, any> = {
        type: 'image/jpeg',
        rendererOpts: {
            quality: 100
        },
    }
    if (width) {
        options.width = width
    }
    return qr.toDataURL(codeText, options);
}

export default generateQR;

