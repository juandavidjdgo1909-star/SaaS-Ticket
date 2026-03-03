import { addDays, differenceInDays } from 'date-fns';

export const calculateExpirationDate = (startDate=new Date()) => {
    return addDays(startDate, 30);
};

export const isExpired = (expiryDate) => {
    return new Date() > new Date(expiryDate);
};

export const getRemainingDays = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const remainingDays = differenceInDays(expiry, today);
    return remainingDays > 0 ? remainingDays : 0;
}