/* eslint-disable @typescript-eslint/no-magic-numbers */

export const MAX_MESSAGE_LENGTH = 1000;
export const MESSAGE_WAIT_TIME = 800;

export enum HOLIDAY_TYPE {
    Active = 1,
    Relaxed = 2
}

export enum HOLIDAY_LOCATION {
    City = 1,
    Sea = 2,
    Mountain = 3
}

export enum FILE_TYPE {
    Greetings = 1,
    Holidays = 2,
    Defaults = 3,
    Settings = 4,
    Questions = 5
}

export enum QUESTION_TYPE {
    Budget = 1,
    NumberOfNights = 2,
    NumberOfPeople = 3
}
